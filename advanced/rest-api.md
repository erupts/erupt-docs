# 接口开发与操作日志

## 1.12.x 及以上版本

由于 `@EruptRouter` 注解使用难度较高，1.12.x 版本定义了全新的权限注解 API。

### 接口示例

```java
@RestController
@RequestMapping("/test")
public class TestController {

    // 登录可访问
    @GetMapping("/api-a")
    @EruptLoginAuth
    public void api() {
        // TODO
    }

    // 拥有对应权限可访问
    @GetMapping("/api-b")
    @EruptMenuAuth("xxx") // 匹配菜单类型值
    @EruptRecordOperate("拥有菜单权限可调用") // 记录操作日志，可不定义
    public void api2() {
        // TODO
    }

    @GetMapping("/api-x") // 普通接口，不鉴权
    public void api3(String param) {
        // TODO
    }
}
```

> 记录操作日志能力仅支持根路径为 `/erupt-api` 的接口可记录。

### 接口请求

前端请求 `@EruptLoginAuth`、`@EruptMenuAuth` 注解修饰的接口时，必须传递 token，且放到请求头中。

#### 获取 token 方法

```javascript
// 方法1：如果使用 tpl 模块则需要通过如下 js 脚本获取，注意只有登录成功才能获取到 token
parent.getAppToken().token

// 方法2：通过 url 参数动态获取
var token = new URLSearchParams(location.search).get("_token")
```

#### 请求示例

请导入 tpl 模块后在模板文件中调用网络请求，token 禁止外部跨域获取，必须在应用内部获取。

```javascript
axios.get("http://127.0.0.1/erupt-api/test/api-b", {
    headers: {
        token: parent.getAppToken().token
    }
}).then((res) => {
    console.log(res)
})
```

```javascript
$.ajax({
    type: "GET",
    url: "http://127.0.0.1/erupt-api/test/api-a",
    headers: {
        token: parent.getAppToken().token
    },
    success: function(result) {
        console.log(result);
    }
});
```

### 前后端分离

如果采用前后端分离的方式调用需开启 redisSession：

```yaml
erupt:
  redisSession: true
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

> **注意：** 如果使用 postman 进行测试且未开启 redis-session，请在传递 token 的同时传递 cookie。

## 1.11.x 及以下版本

1.11.x 及以下版本使用 `@EruptRouter` 注解，详见历史文档。
