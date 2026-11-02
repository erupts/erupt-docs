# Erupt Webhook 数据事件推送

erupt-webhook 把 erupt 数据管道上的变更推送到外部系统：管理员在后台订阅一个 URL，选择要关注的数据模型与事件（新增 / 修改 / 删除），之后每一条**已提交**的变更都会以 JSON 载荷 POST 到该地址，可选 HMAC-SHA256 签名、自定义请求头，失败自动重试，每次推送留有一条日志。不需要写任何代码，也不需要为业务模型增加字段。

> 最低版本要求：**2.4.0**

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-webhook</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` 已包含本模块，使用 starter-all 的项目无需再单独引入。模块依赖 `erupt-upms`（即 `erupt-data-jpa`），订阅与日志存放在服务端自己的两张表里。

引入后自动装配生效，**系统管理** 菜单下出现 **Webhook** 菜单；推送日志通过 Webhook 行上的「投递记录」钻取查看，其菜单为隐藏状态，只用于授权。

:::info
推送由 erupt 数据管道的事件（`EruptAddEvent` / `EruptEditEvent` / `EruptDeleteEvent`）触发，与 [事件监听](/zh/advanced/event-listener) 是同一套事件源。经后台界面、REST API、`EruptModifyService` 写入的数据都会触发；绕过 erupt 直接用 JPA 或 SQL 写表不会。
:::

## 配置订阅

![新增 Webhook 订阅](/webhook/webhook-edit.png)

**系统管理 → Webhook → 新增**，一条记录就是一个订阅：

| 字段 | 说明 |
| --- | --- |
| 名称 | 订阅的名字，也会写入每条推送日志 |
| URL | 接收地址，必须以 `http://` 或 `https://` 开头 |
| 签名密钥 | 可选。填写后每次推送附带 `X-Erupt-Signature` 签名头；密码类型字段，保存后不再回显 |
| 事件 | 多选，`新增` / `修改` / `删除`，新建时默认全部勾选 |
| 启用 | 关闭后订阅保留但不再推送 |
| 请求头 | 键值对，原样附加到每次请求，例如接收方要求的 `Authorization` |
| 发送测试 | 表单按钮，按当前填写的值发一条 `PING`，保存前即可验证地址是否可达 |
| 全部模型 | 打开后订阅全部已注册模型，无需逐个挑选 |
| 数据模型 | 关闭「全部模型」时出现，可搜索的穿梭框，此时至少要选一个 |
| 备注 | 自由文本 |

保存时校验 URL 协议，以及「全部模型」关闭时是否选了模型；本模块自己的两张表（Webhook、Webhook 日志）永远不会触发推送，即使订阅了全部模型。[erupt-cloud](/zh/modules/erupt-cloud) 节点上的远程模型不在可选范围内。

表格里每行用标签列展示订阅的**数据模型**与**事件**，并带两个入口：

- **发送测试**：行操作，对已保存的订阅发一条 `PING`，成功时提示「测试发送成功：HTTP 200，耗时 N ms」，失败时提示状态码与响应内容
- **投递记录**：钻取到该订阅的推送日志

:::tip
通过菜单新增、修改、删除订阅后立即生效，不需要重启；服务端缓存的是启用状态的订阅列表，每次变更后重新加载。
:::

## 推送载荷

事务提交后，变更被组装成一个 JSON 对象，以 `POST` 发送，`Content-Type: application/json; charset=utf-8`：

```json
{
  "id": "6f1c2e4a-8d3b-4f0e-9a7c-2b5d8e1f3a90",
  "event": "UPDATE",
  "erupt": "Goods",
  "model": "商品",
  "recordId": "1024",
  "operator": "admin",
  "timestamp": "2026-11-01T08:30:12.345Z",
  "before": { "id": 1024, "name": "键盘", "price": 199, "status": "ON_SALE" },
  "after":  { "id": 1024, "name": "键盘", "price": 159, "status": "ON_SALE" }
}
```

| 字段 | 说明 |
| --- | --- |
| `id` | 本次推送的 UUID，重试时不变，接收方可用它去重 |
| `event` | `ADD` / `UPDATE` / `DELETE`，测试推送为 `PING` |
| `erupt` | 模型类名，即 `@Erupt` 类的 `simpleName` |
| `model` | `@Erupt(name)` 的原文，未经 i18n 翻译 |
| `recordId` | 记录主键的字符串形式 |
| `operator` | 操作人的账号；无登录上下文时为 `null` |
| `timestamp` | UTC 时间，ISO-8601，末尾带 `Z` |
| `before` | 变更前的记录，`ADD` 时为 `null` |
| `after` | 变更后的记录，`DELETE` 时为 `null` |

`before` / `after` 的序列化规则与 erupt 对外 API 一致：`PASSWORD` 类型字段会被替换为掩码 `••••••`，组合字段（COMBINE）递归处理，密码不会离开服务端。

`PING` 载荷没有 `erupt` 与 `model`，`recordId` 为 `null`，并多一个 `"message": "erupt webhook test"`。

每次请求还带有固定请求头：

| 请求头 | 值 |
| --- | --- |
| `User-Agent` | `erupt-webhook` |
| `X-Erupt-Delivery` | 每次 HTTP 请求的 UUID，重试时会变化 |
| `X-Erupt-Signature` | 配置了签名密钥时才有，见下文 |

订阅里配置的「请求头」在此基础上追加。

## 签名校验

配置签名密钥后，服务端对**请求体原文**（UTF-8 字节）计算 HMAC-SHA256，密钥为签名密钥的 UTF-8 字节，结果以小写十六进制写入请求头：

```
X-Erupt-Signature: sha256=<hex(HMAC-SHA256(secret, body))>
```

接收方用同样的密钥对收到的原始请求体重新计算一次，与请求头比对即可确认请求来自 erupt 且未被篡改。注意要对**原始字节**计算，不要先解析再序列化。一个 Spring 接收端的例子：

```java
@RestController
public class WebhookReceiver {

    private static final String SECRET = "your-secret";

    @PostMapping("/erupt/hook")
    public void receive(@RequestBody byte[] body,
                        @RequestHeader("X-Erupt-Signature") String signature) throws Exception {
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(new SecretKeySpec(SECRET.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
        String expected = "sha256=" + HexFormat.of().formatHex(mac.doFinal(body));
        if (!MessageDigest.isEqual(expected.getBytes(), signature.getBytes())) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED);
        }
        // 校验通过，再解析 body
    }

}
```

未配置密钥时请求不带 `X-Erupt-Signature`，接收方应只在内网或配合「请求头」里的凭证使用。

:::warning
签名密钥保存后不再回显。编辑表单里点「发送测试」时，密钥留空或保持占位符即沿用已保存的密钥；填入新值则按新值签名。
:::

## 重试与推送日志

推送在事务提交后交给一个 2 线程的后台线程池（`erupt-webhook`），请求线程不等待接收方；推送失败、接收方宕机都不会影响数据变更本身。

| 项目 | 规则 |
| --- | --- |
| 成功判定 | HTTP 2xx |
| 尝试次数 | 最多 3 次，间隔 1 秒、5 秒 |
| 超时 | 连接 10 秒，请求 15 秒 |
| 协议 | HTTP/1.1，跟随重定向 |
| 响应记录 | 响应体最多保留 2000 字符 |

同一订阅在同一次变更上无论重试几次，只记**一条**日志；状态码为 `0` 表示没有拿到响应（连接失败、超时等），此时响应列为异常信息。

### 推送日志

在 Webhook 行上点「投递记录」，或按权限直接进入 Webhook 日志菜单：

| 列 | 说明 |
| --- | --- |
| Webhook | 所属订阅名称 |
| 数据模型 / 事件 / 记录 ID | 触发推送的变更 |
| URL | 实际发送地址 |
| 结果 | 已送达 / 失败 |
| 状态码 | 最后一次响应的 HTTP 状态码 |
| 尝试次数 / 耗时 (ms) | 含重试的总次数与总耗时 |
| 响应 | 接收方响应体（详情中查看） |
| 载荷 | 发出的 JSON 原文（详情中以代码编辑器展示） |
| 时间 | 日志写入时间 |

日志只读，不允许新增和编辑，允许删除与导出。

### 重新发送

日志表的 **重新发送** 行操作把该条日志里保存的载荷**原样**再 POST 一次（`id`、`timestamp` 都不变），作为一次新的推送排队到后台线程，并产生一条新的日志；操作返回「已重新发送 N 条，刷新日志查看结果」。若日志所属的 Webhook 已被删除，重新发送会被拒绝。

## 数据表

### e_webhook

继承 `HyperModelUpdateVo`（自带 `id`、`create_time`、`create_user_id`、`update_user_id`、`update_time`）：

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `name` | VARCHAR(100) | 名称 |
| `url` | VARCHAR(1024) | 接收地址 |
| `secret` | VARCHAR(255) | 签名密钥 |
| `events` | JSON | 订阅的事件，如 `["ADD","UPDATE"]` |
| `enabled` | BIT(1) | 启用 |
| `headers` | VARCHAR(2000) | 自定义请求头，JSON 对象 |
| `all_models` | BIT(1) | 全部模型 |
| `erupts` | JSON | 订阅的模型类名，如 `["Goods","Order"]` |
| `remark` | VARCHAR(2000) | 备注 |

两个集合列通过 `@JdbcTypeCode(SqlTypes.JSON)` 存为 JSON，没有中间表。

### e_webhook_log

继承 `BaseModel`（自带 `id`），在 `create_time` 与 `webhook_id` 上建有索引：

| 列 | 类型 | 说明 |
| --- | --- | --- |
| `webhook_id` | BIGINT | 所属订阅 ID，钻取的关联列 |
| `webhook` | VARCHAR(100) | 订阅名称快照 |
| `erupt` | VARCHAR(100) | 模型类名 |
| `event` | VARCHAR(64) | 事件名，按枚举名存储（`@Enumerated(STRING)`） |
| `record_id` | VARCHAR(100) | 记录主键的字符串形式 |
| `url` | VARCHAR(1024) | 发送地址 |
| `success` | BIT(1) | 是否送达 |
| `status` | INT | HTTP 状态码，无响应为 0 |
| `attempts` | INT | 尝试次数 |
| `duration` | BIGINT | 总耗时（毫秒） |
| `response` | VARCHAR(2000) | 响应体 |
| `payload` | LONGTEXT | 发出的 JSON 载荷 |
| `create_time` | DATETIME | 写入时间 |

开启 JPA 自动建表的项目升级后自动创建；手工维护表结构的项目请按上表建表。
