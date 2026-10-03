# 模板开发

纯 HTML 页面放进 `tpl` 目录就能用。需要把后端数据渲染进页面时，给模板配一个 `@TplAction` 方法返回 `Map`，再选一种模板引擎。

## 模板引擎

erupt-tpl 内置六种引擎的适配，由 `Tpl.Engine` 枚举选择：

| 引擎 | 枚举值 | 需要自行引入的依赖 |
|---|---|---|
| 原生 HTML | `Native` | 无，默认 |
| FreeMarker | `FreeMarker` | `org.freemarker:freemarker` |
| Thymeleaf | `Thymeleaf` | `org.thymeleaf:thymeleaf` |
| Velocity | `Velocity` | `org.apache.velocity:velocity-engine-core` |
| Beetl | `Beetl` | `com.ibeetl:beetl` |
| JFinal Enjoy | `Enjoy` | `com.jfinal:enjoy` |

五个模板引擎在 erupt-tpl 里都是 `optional` 依赖，**不会随模块传递进来**。用哪个就在自己项目的 `pom.xml` 里加哪个，版本交给 Spring Boot 管理即可：

```xml
<dependency>
  <groupId>org.freemarker</groupId>
  <artifactId>freemarker</artifactId>
</dependency>
```

没有引入对应 jar 时，启动不会报错（适配器静默跳过），但渲染该引擎的模板会抛出 `FreeMarker jar not found` 一类的断言异常。

`Native` 引擎只做一件事：把文件原样读出来，并把 `${base}` 替换为应用 contextPath。它不解析任何其他表达式，也不支持 `tplHandler` 数据绑定。

## 数据绑定：@EruptTpl 与 @TplAction

菜单类型值指向的文件如果同时有一个 `@TplAction` 方法与之同名，渲染时会先调用该方法，把返回的 `Map` 作为模板上下文：

```java
@EruptTpl(engine = Tpl.Engine.FreeMarker)   // 类上声明引擎，默认 FreeMarker
@Service                                    // 必须是 Spring Bean
public class DashboardTpl {

    @TplAction("dashboard.ftl")             // 与菜单类型值一致
    public Map<String, Object> dashboard() {
        Map<String, Object> map = new HashMap<>();
        map.put("title", "运营看板");
        map.put("items", Arrays.asList("订单", "用户", "商品"));
        return map;
    }
}
```

```html
<!-- resources/tpl/dashboard.ftl -->
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>${title}</title></head>
<body>
<h1>${title}</h1>
<ul>
<#list items as it><li>${it}</li></#list>
</ul>
</body>
</html>
```

<img src="/tpl/freemarker.png" width="700">

要点：

- `@EruptTpl` 标在类上，`engine` 决定该类下所有 `@TplAction` 使用的引擎；类必须被 Spring 管理，且位于 Erupt 的扫描包内。
- `@TplAction.value` 是 **`tpl` 目录下的文件名**，与菜单类型值一一对应，大小写不敏感。
- 方法返回 `Map<String, Object>`；`Native` 引擎下返回值会被忽略，方法可以是 `void`。
- 没有匹配的 `@TplAction` 时，文件按 `Native` 引擎原样输出。所以同一目录下可以混放纯 HTML 与模板文件。

## 路径与参数

### 模板文件与菜单值解耦

默认模板路径就是 `/tpl/<value>`。当多个菜单共用一个模板，或者文件名不方便当权限标识时，用 `path` 指定真实文件：

```java
@TplAction(value = "sales-report", path = "/tpl/report.ftl")
public Map<String, Object> sales() { ... }
```

此时菜单类型值填 `sales-report`，渲染的是 `/tpl/report.ftl`。`path` 从 classpath 根目录开始解析。

### 固定参数

`path` 后面可以带查询串，键值对会被解析后直接放进模板上下文：

```java
@TplAction(value = "report-month", path = "/tpl/report.ftl?type=month")
public Map<String, Object> month() { ... }

@TplAction(value = "report-year", path = "/tpl/report.ftl?type=year")
public Map<String, Object> year() { ... }
```

模板里直接用 `${type}` 区分。这是让一个模板服务多个菜单的最简单方式。

### 多级路径与通配

菜单类型值允许带 `/`，例如 `report/sales`，前端路由最多支持五级。`@TplAction.value` 支持 Ant 风格通配符，一个方法可以接住一组路径：

```java
@TplAction(value = "report/*", path = "/tpl/report.ftl")
public Map<String, Object> report() {
    // 从 request 读取实际访问的路径，自行解析最后一段
    ...
}
```

注意权限校验仍按菜单类型值精确匹配：`report/sales` 和 `report/stock` 要各建一条菜单，通配只省掉了后端代码，省不掉菜单。

### 运行时参数

浏览器侧随请求带来的查询参数不会自动进上下文，通过预注入的 `request` 读取：

```html
<p>${request.getParameter("id")!""}</p>
```

## 预注入变量

无论哪种引擎，渲染时上下文里总有这三个变量：

| 变量 | 说明 |
|---|---|
| `request` | `HttpServletRequest`，可读 header、参数、contextPath、当前 URI |
| `response` | `HttpServletResponse` |
| `base` | 应用 contextPath，拼静态资源路径用，等价于 `${request.contextPath}` |

`@TplAction` 返回的 `Map` 与上面三个变量合并，同名时以框架注入的为准。`@View.tpl` 场景额外注入 `row`，`@RowOperation.tpl` 场景额外注入 `rows`，详见 [@Tpl 模板预注入变量](/zh/annotation/tpl#模板预注入变量)。

:::tip 当前用户
模板上下文里没有现成的 `user` 变量。需要展示登录用户信息时，在 `@TplAction` 方法里注入 `EruptUserService` 取出当前用户再放进 `Map`。
:::

## 模板的其他使用位置

同一套引擎还服务于四个注解场景，模板文件同样放在 `tpl` 目录，但入口不是菜单：

| 场景 | 注解 | 说明 |
|---|---|---|
| 表单字段 | `@Edit(type = TPL, tplType = @Tpl(...))` | 表单里嵌一块自定义区域，见 [TPL 字段类型](/zh/field-types/tpl) |
| 行按钮弹出层 | `@RowOperation(tpl = @Tpl(...))` | 选中行数据注入 `rows`，见 [TPL 模板弹出层](/zh/annotation/row-operation#tpl-模板弹出层) |
| 列弹窗 | `@View(tpl = @Tpl(...))` | 当前行注入 `row`，见 [@View](/zh/annotation/view) |
| 多视图 | `@Vis(tplView = @Tpl(...))` | 列表页切换到自定义视图，见 [@Vis](/zh/annotation/vis) |

这些场景用 `@Tpl.tplHandler` 绑定数据，而不是 `@TplAction`。两者的属性对照见 [@Tpl 自定义模板](/zh/annotation/tpl)。
