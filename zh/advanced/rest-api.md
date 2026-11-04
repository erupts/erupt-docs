# 接口鉴权与操作日志

> 适用于 **1.12.x 及以上版本**

## 接口示例

```java
@RestController
@RequestMapping(EruptRestPath.ERUPT_API + "/test") // 即 /erupt-api/test
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

## 接口请求

前端请求 `@EruptLoginAuth`、`@EruptMenuAuth` 注解修饰的接口时，必须传递 token，且放到请求头中。

### 获取 token 方法

```javascript
// 方法1：如果使用 tpl 模块则需要通过如下 js 脚本获取，注意只有登录成功才能获取到 token
parent.getAppToken().token

// 方法2：通过 url 参数动态获取
var token = new URLSearchParams(location.search).get("_token")
```

### 请求示例

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

## 前后端分离

如果采用前后端分离的方式调用需开启 redisSession：

```yaml
erupt:
  redisSession: true
spring:
  data:
    redis:
      database: 0
      timeout: 10000
      host: 127.0.0.1
```

> Spring Boot 3 已移除 `spring.redis.*` 前缀，必须使用 `spring.data.redis.*`。

> **注意：** 如果使用 postman 进行测试且未开启 redis-session，请在传递 token 的同时传递 cookie。

## OpenAPI 规范 <Badge type="tip" text="v2.4.0+" />

仓库内的 [`openapi/erupt.json`](https://github.com/erupts/erupt/blob/develop/openapi/erupt.json) 是一份 **OpenAPI 3.1** 规范，覆盖 core、upms、tpl、excel 四个模块下所有 `/erupt-api` 接口——也就是管理界面调用的每一个接口，任何客户端都可以照此调用。把它导入 Swagger UI、Postman、Apifox 或代码生成器即可。

- **鉴权**：两个 `apiKey` 安全方案——`token` 请求头，以及供浏览器直接打开的页面（模板页、编辑器上传）使用的 `_token` 查询参数；token 来自 `POST /erupt-api/login`，服务端对服务端调用用 `GET /erupt-api/open-api/create-token`
- **`erupt` 请求头**：数据、构建、组件、文件与导出接口都作用于一个 `@Erupt` 类，请求头 `erupt` 携带其简单类名，必须与路径中的 `{erupt}` 一致；路径指向嵌套 erupt（Tab、子表单、引用）时则填父 erupt
- **错误**：业务错误以 HTTP 500 返回 `R` 结构，`success` 为 false，`message` 是提示文案，`promptWay` 告诉 UI 如何展示
- **分组**：接口按标签归为 Account（会话与用户、MFA、Open API token、权限与应用配置）、Data（页面构建、数据查询、数据修改、Tab 行、表单视图、页面作用域）、Widgets and files（表单组件、文件、导入导出）、Views（看板、日历、甘特）、Platform（模板页、开发工具、框架）五组

规范由各控制器的 Javadoc 经 [smart-doc](https://github.com/TongchengOpenSource/smart-doc) 生成，不是手写的。修改控制器后在仓库根目录重新生成：

```bash
mvn -pl erupt-test -Popenapi process-classes
```

### 对 API 调用方有用的新接口

| 接口 | 说明 |
| --- | --- |
| `POST /erupt-api/data/aggregate/{erupt}` | 列统计：对 `@View(statistic)` 声明了统计的列做汇总，请求体与表格查询相同，统计范围是查询命中的全部行而非当前页，v2.4.0+ |
| `POST /erupt-api/data/modify/{erupt}/update-cells` | 批量编辑：把多行的同一字段设为同一个值，请求体 `{"ids": [...], "field": "status", "value": ...}`；每行都走完整编辑链路，任一行失败整批回滚，需 `@Power(batchEdit)`，v2.4.0+ |
| `GET /erupt-api/excel/formats` | 当前可用的导出格式列表（`format` 与显示名），内置 `xlsx`、`csv`、`json`、`jsonl`、`md`，v2.4.0+ |
| `POST /erupt-api/excel/export/{erupt}?format=csv` | 导出时用 `format` 查询参数选择格式，不传仍为 Excel；`ids` 参数可只导出指定主键的行 |

单元格编辑接口 `POST /erupt-api/data/modify/{erupt}/update-cell` 的说明见 [@Power cellEdit](/zh/annotation/power#celledit-单元格编辑)，页头作用域接口 `GET/POST /erupt-api/scope` 见 [@EruptScope](/zh/annotation/erupt-scope#接口)。
