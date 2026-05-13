# Open API 开放接口

Erupt 支持外部系统通过 **appid + secret** 的方式获取 token，用于调用 erupt 接口，无需用户登录。

:::info
APPID 与 Secret 在 **UPMS → Open API** 菜单中管理，对应实体类为 `EruptOpenApi`。
查看 [Open API 管理入口 →](/modules/erupt-upms#open-api)
:::

:::warning
同一时间每个 APPID 只能存在一个有效 token，重复调用生成接口后旧 token 将立即失效。为保证安全，建议在后端服务调用该接口，避免 secret 暴露到前端。
:::

## 1. 开启分布式 Session

Open API 生成的 token 依赖 Redis Session，需在配置文件中开启：

```yaml
erupt:
  redis-session: true

spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

## 2. 获取 Token

```http
GET {{host}}/erupt-api/open-api/create-token?appid=xxx&secret=xxx
```

**响应示例：**

```json
{
  "token": "xxxxxxx",
  "expireTime": "20xx-01-01"
}
```

| 字段 | 说明 |
| --- | --- |
| `token` | 访问令牌，用于后续接口调用 |
| `expireTime` | Token 过期时间 |

## 3. 调用 Erupt 接口

获取到 token 后，在请求头中携带 token 即可调用受保护的接口：

```http
GET {{host}}/erupt-api/your-api
token: xxxxxxx
```

接口权限注解的使用方式参考 [接口开发与操作日志](/advanced/rest-api)。
