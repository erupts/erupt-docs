# 现有项目接入

## 项目内嵌入

1. 前往菜单管理，**菜单类型**选择：**框架内打开链接**，**类型值**填写：待接入项目地址，保存此配置。

2. 嵌入页面可以获取当前登录用户的 token，URL 中会使用 `_token` 参数体现：

   例：`https://www.erupt.xyz?_token=gK4Ot4rs0h3xzJi0`

   使用 token 换取当前登录用户基本信息与菜单权限等能力，前端请求接口时携带该 token 即可。

3. 如果使用共享 Session，需开启 Redis Session：

```yaml
erupt:
  redisSession: true

spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

4. 根据 token 获取 erupt 用户数据：

```http
GET {{host}}/erupt-api/userinfo
token: {{token}}
```

返回示例：

```json
{
  "nickname": "xxx",
  "indexMenuType": "xxx",
  "indexMenuValue": "xxx",
  "resetPwd": false,
  "org": "org code",
  "post": "post code",
  "roles": ["code1", "code2", "code3"]
}
```

查询菜单权限：

```http
GET {{host}}/erupt-api/erupt-permission/{{菜单类型值}}
token: {{token}}
返回: true | false
```

## 项目外接入

可使用 Open API 的形式接入，详见权限管理模块中的 Open API 部分。

## 前后端分离部署

在 `app.js` 中指定后端接口地址：

```javascript
window.eruptSiteConfig = {
    domain: "http://your-backend-api.com",
};
```

详见：[前后端分离部署](/guide/separation)
