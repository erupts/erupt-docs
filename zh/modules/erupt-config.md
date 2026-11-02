# Erupt Config 运行时配置

erupt-config 把应用的运行参数搬进后台：按 Spring profile 维护一组键值配置项，像 `application-{profile}.yml` 叠在 `application.yml` 上那样分层。这些配置项会作为一个 Spring 属性源注入环境，`@Value("${key}")`、`Environment#getProperty` 和 `@ConfigurationProperties` 读取它们和读配置文件没有区别；在页面上保存一次修改，运行中的 Bean 立刻拿到新值，不用重启。

> 最低版本要求：**2.4.0**

:::tip 与数据字典的区别
[字典](/zh/modules/erupt-upms/dict)（`EruptDict`）回答的是「某个字段可以取哪些值」，服务于下拉选项；本模块回答的是「某个参数现在是多少」，服务于代码。邮件服务器地址、限流阈值、功能开关、一段公告 HTML——这些该放在这里，而不是字典里。
:::

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-config</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` 已包含本模块，使用 starter-all 的项目无需再单独引入。模块依赖 `erupt-data-jpa` 与 `erupt-toolkit`，不需要额外的 yml 配置：实例读取哪些 profile 完全由 `spring.profiles.active` 决定，和配置文件一致。

引入后自动装配生效，后台出现 **配置中心** 根菜单，下含 **配置项** 与 **生效值** 两个页面。

## 配置页面

**配置中心 → 配置项** 左侧是 profile 树，右侧是选中 profile 的全部键。

![配置项列表](/config/config-items.png)

### Profile 分层

- `default` 是每个实例都读取的基础层；`spring.profiles.active` 里列出的 profile 叠在它上面，所以一个 profile 只需要放与 `default` 不同的键
- 实例启动时会自动创建自己读取的 profile（`default` 以及当前激活的 profile），空库也能直接打开页面
- profile 在左侧树上新增、重命名、删除；`default` 不能删，仍有配置项的 profile 也不能删
- profile 的 code 就是 Spring 的 profile 名（`dev`、`prod`），匹配 `^[A-Za-z0-9][A-Za-z0-9_.\-]*$`

### 配置项

在树上选中一个 profile 后新增的配置项即归属该 profile，一个 profile 内键唯一。

| 字段 | 说明 |
| --- | --- |
| 键 | `@Value` 读取时使用的名字，如 `app.mail.host`、`feature.beta`，匹配 `^[A-Za-z][A-Za-z0-9._\-\[\]]*$` |
| 类型 | 决定值的编辑器以及它如何变成属性，见[配置项类型](#配置项类型) |
| 值 | 表格按类型渲染：颜色显示色块、图标显示图标本身、图片直接显示、附件是链接、列表显示为标签、长文本放在可滚动的框里 |
| 启用 | 关闭后配置项仍留在表里，但应用不再读取它，配置文件里的值重新生效 |
| 保密 | 开启后表格和生效值页面都显示为 `••••••`，编辑表单里也只看到掩码；应用照常读到真实值。密码类型强制保密 |
| 备注 | 说明文字 |

保密项的编辑表单把掩码原样提交回来，即表示保持原值不变。

表格上方有两个操作：

- **复制到 profile**：勾选若干键后复制到另一个 profile，目标 profile 里已有同名键的值会被覆盖
- **立即刷新**：从数据库重新加载运行值。页面上的保存本身已经会刷新，这个按钮用于通过 SQL 或其他工具直接改库之后

### 生效值

**配置中心 → 生效值** 是只读视图，展示当前实例此刻真正读到的合并结果：每个属性一行，带上它来自哪个 profile（**来源** 列）以及类型。值是 `Environment` 解析后的结果，因此值里引用的占位符也会显示为解析后的样子。保密项在这里同样显示为掩码。页面同样带 **立即刷新** 按钮。

## 配置项类型

![编辑配置项并选择类型](/config/config-edit.png)

共 17 种类型。除了三种结构化类型，每种类型都只产生一个属性 `key`：

| 类型 | 存储的值 | 说明 |
| --- | --- | --- |
| 字符串 String | 原文 | 默认类型 |
| 密码 Password | 原文 | 始终保密：表格、表单都只显示掩码 |
| 多行文本 Text | 原文 | 最长 4000 字符的文本域 |
| 数字 Number | `8080`、`0.5` | 整数不带小数部分；Spring 按目标类型转换 |
| 布尔 Boolean | `true` / `false` | |
| 列表 List | `a.com,b.com` | 标签编辑，逗号分隔存储；绑定到 `List` 或数组 |
| 键值对 Key / value | `{"team":"data"}` | 每个条目展开为 `key.entry` 属性，`Map` 属性可直接绑定 |
| JSON | 原文 | 展开为 `key.path` 与 `key[i]` 属性，原文仍保留在 `key` 下 |
| YAML | 原文 | 一段 yml 片段，按 Spring 读文件的方式展开为 `key.path` 属性，原文仍保留在 `key` 下 |
| 日期 Date | `2026-10-20` | ISO 日期，绑定到 `LocalDate` |
| 日期时间 Datetime | `2026-10-20T09:30:00` | ISO 日期时间，绑定到 `LocalDateTime` |
| 时间 Time | `09:30:00` | ISO 时间，绑定到 `LocalTime` |
| 颜色 Color | `#1890ff` | 取色器 |
| 图标 Icon | `fa fa-bell` | 图标选择器，应用读到的是 class 字符串 |
| HTML | 原文 | 富文本编辑器 |
| 图片 Image | `/config/banner.png` | 上传图片；属性值是文件在 `erupt.upload-path` 下的路径 |
| 附件 Attachment | `/config/logo.pdf` | 上传文件；属性值是文件在 `erupt.upload-path` 下的路径 |

键值对、JSON、YAML 保存时会校验格式，格式错误直接拒绝。以 JSON 为例，键 `demo.rules` 的值：

```json
{"maxRetries": 3, "backoff": [1, 2, 4], "nested": {"on": true}}
```

展开后得到的属性与一份 yml 文件完全一致，`@ConfigurationProperties(prefix = "demo.rules")` 的 Bean 可以直接绑定：

| 属性 | 值 |
| --- | --- |
| `demo.rules` | 原始 JSON 文本 |
| `demo.rules.maxRetries` | `3` |
| `demo.rules.backoff[0]` … `demo.rules.backoff[2]` | `1`、`2`、`4` |
| `demo.rules.nested.on` | `true` |

## 读取配置

### 值如何进入应用

1. **容器启动之前**：`EruptConfigEnvironmentPostProcessor` 在配置文件加载完、激活 profile 已知之后，用 `spring.datasource.*` 的连接信息通过纯 JDBC 读出分层后的配置项，作为名为 `erupt-config` 的属性源放在所有配置文件之前。于是第一次注入时 `@Value` 看到的就已经是数据库里的值。首次启动表还不存在、或数据库暂时连不上时跳过这一步，只打一条 warn 日志，应用按配置文件的值启动。
2. **应用就绪后**（`ApplicationReadyEvent`）：模块补齐本实例读取的 profile 行，再从数据库重载一次运行值。
3. **运行中**：在页面上新增、修改、删除、启停配置项，或复制到本实例读取的 profile，都会立即刷新本实例——替换属性源、把每个单例 Bean 上 `@Value("${...}")` 字段重新赋值、并以变化的键集合发布 `EruptConfigRefreshedEvent`。没有任何键发生变化时不会发事件。

### 优先级

**激活的 profile > `default` > 配置文件。** `spring.profiles.active` 列出多个 profile 时，后者覆盖前者，与 Spring 读取 `application-{profile}.yml` 的顺序一致。数据库里没有的键照旧落到配置文件；一个 profile 没覆盖的键来自 `default`。

### @Value

```java
@Service
public class MailService {

    @Value("${app.mail.host:localhost}")   // 页面上保存后自动更新
    private String mailHost;

}
```

字段注入的 `${...}` 占位符会在刷新时重新赋值，类型按字段类型转换；AOP 代理的 Bean 也能更新到真实对象。有两种写法只在启动时解析一次，之后不再跟随变化：

- SpEL 表达式 `#{...}`
- 构造器注入与 setter 注入的 `@Value`

需要跟随变化又不想用字段注入的，改为注入 `EruptConfig` 按需读取。

### EruptConfig

`EruptConfig` 是对 `Environment` 的薄封装，每次调用都读取当前值：

```java
@Resource
private EruptConfig config;

String host = config.get("app.mail.host");
int port = config.get("app.mail.port", Integer.class, 25);
List<String> origins = config.get("app.cors.origins", List.class);
boolean has = config.has("feature.beta");
```

键也可以是枚举常量，以 `toString()` 作为键，避免到处散落字符串：

```java
public enum Keys {
    MAIL_HOST("app.mail.host"),
    MAIL_PORT("app.mail.port");

    private final String key;

    Keys(String key) {
        this.key = key;
    }

    @Override
    public String toString() {
        return key;
    }
}

config.get(Keys.MAIL_HOST);
config.get(Keys.MAIL_PORT, Integer.class, 25);
```

### 监听变化

需要在配置变化后做点事情（重建连接池、清缓存、重新调度）的，监听 `EruptConfigRefreshedEvent`，`getKeys()` 是本次变化的键集合：

```java
@Component
public class MailRefresher {

    @EventListener
    public void on(EruptConfigRefreshedEvent event) {
        if (event.getKeys().stream().anyMatch(key -> key.startsWith("app.mail."))) {
            // 重新连接邮件服务器
        }
    }

}
```

## 多实例刷新

页面上的修改只直接刷新处理这次请求的实例。其他实例有两种方式得知变化：

| 方式 | 条件 | 行为 |
| --- | --- | --- |
| Redis 广播 | `erupt.redis-session: true` | 修改所在的事务提交后，通过 Redis 频道 `erupt-config:refresh` 通知其他实例立即重载；回滚的修改不会被广播 |
| 定时轮询 | `erupt.config.refresh-seconds` > 0 | 每隔 n 秒比对一次数据库（启用项的数量与最后更新时间），有变化才真正读取值，安静的一轮只是一次 count 查询 |

单实例部署两者都不需要。开启了 Redis 会话的集群自动走广播，无需额外配置；没有 Redis 会话的集群把 `refresh-seconds` 设为合适的秒数即可。广播基于 `erupt-toolkit` 的 `RedisNotifier`，与 [erupt-job](/zh/modules/erupt-job) 的集群通知走同一条路。

:::info
任一页面上的 **立即刷新** 按钮也会广播：绕过页面直接改库后，在任一实例上点一次即可让全集群重载。
:::

## 配置参数

```yaml
spring:
  profiles:
    active: prod          # 本实例读取的 profile，叠在 default 之上；不是本模块的专属配置
erupt:
  config:
    refresh-seconds: 0    # 轮询其他实例修改的间隔秒数，0（默认）不轮询
```

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.config.refresh-seconds` | `0` | 轮询间隔（秒）；仅没有 Redis 会话的多实例部署需要 |
| `erupt.redis-session` | `false` | 开启后配置变化通过 Redis 广播到全部实例，见[多实例刷新](#多实例刷新) |
| `spring.jpa.properties.hibernate.globally_quoted_identifiers` | `false` | 启动前的 JDBC 读取会尊重该设置，与 Hibernate 建表时的标识符引号保持一致 |

## 数据表

模块有两张表，均继承 `MetaModel`（自带 `id`、`create_by`、`create_time`、`update_by`、`update_time`）：

**`e_config_profile`**，`code` 唯一：

| 列 | 说明 |
| --- | --- |
| `code` | profile 名，`default` 为保留值 |
| `remark` | 备注 |

**`e_config_item`**，`(profile_id, config_key)` 唯一：

| 列 | 说明 |
| --- | --- |
| `profile_id` | 所属 profile |
| `config_key` | 键 |
| `config_type` | 类型代码：`STRING`、`PASSWORD`、`TEXT`、`NUMBER`、`BOOLEAN`、`LIST`、`KEY_VALUE`、`JSON`、`YAML`、`DATE`、`DATETIME`、`TIME`、`COLOR`、`ICON`、`HTML`、`IMAGE`、`ATTACHMENT` |
| `config_value` | 存储的值，大文本列 |
| `enabled` | 启用 |
| `secret` | 保密 |
| `remark` | 备注 |

类型列刻意用字符串而非枚举，这样新增类型不会受数据库 check 约束的限制。开启 JPA 自动建表的项目升级后自动创建；手工维护表结构的项目请按上表建表。
