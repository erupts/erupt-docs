# 菜单管理

菜单是 Erupt 权限体系的最小单位。它不只是左侧导航：一个 Erupt 类、一个外部链接、一个自定义页面、一个按钮、一个接口，都以「菜单」的形式登记，然后在[角色管理](/zh/modules/erupt-upms/role)中勾选授权。

## 自动生成

引入模块时，各模块通过 `initMenus()` 声明自己的菜单，首次启动自动写入数据库（受 `erupt.init-method-enum` 控制，见[参数配置](/zh/guide/configuration)）。对于类型为表格 / 树的菜单，Erupt 会根据 `@Erupt(power)` 自动生成下级**功能按钮**菜单：新增、修改、删除、查看详情、导出、导入。角色勾选了哪些按钮，用户界面上就只出现哪些按钮，后端接口同样按此校验。

自己的业务模型也可以在代码里声明菜单，而不必手工录入，见 [插件开发 EruptModule](/zh/advanced/plugin)。

## 菜单类型

| 菜单类型 | 类型值 | 说明 |
| --- | --- | --- |
| 表格 | Erupt 类名（不区分大小写） | 表格视图展示 |
| 树 | Erupt 类名（不区分大小写） | 树视图展示 |
| 表单 | Erupt 类名（不区分大小写） | 直接以表单视图打开 |
| 链接 | 互联网地址 | 在菜单容器（iframe）中打开 |
| 微前端链接 | 互联网地址 | 在微前端容器中打开（2.2.0+），适用于目标站点用 `X-Frame-Options` / `frame-ancestors` 拒绝被 iframe 嵌入、但允许跨域读取的场景 |
| 新页签 | 互联网地址 | 在新 Tab 页中打开 |
| 当前窗口 | 互联网地址 | 在当前窗口整页跳转 |
| 页面路由 | 路由地址 | 前端路由 hash 值 |
| 充满屏幕 | 路由地址 | 隐藏导航与侧栏，全屏展示页面 |
| 按钮 | 权限字符串 | 控制按钮的显示与隐藏，不出现在导航中 |
| 接口名称 | 接口名 | 接口权限字符串，配合 `@EruptMenuAuth` 使用 |
| 报表 | 报表编码 | 需引入 erupt-report 模块 |
| 模板 | 模板文件名（在 tpl 目录下） | 需引入 erupt-tpl 模块 |

## 字段说明

| 字段 | 说明 |
| --- | --- |
| 名称 | 导航中显示的文字，支持 i18n |
| 状态 | 打开 / 隐藏 / 禁用。**隐藏**的菜单不出现在导航中，但权限仍然有效，适合只通过链接进入的页面 |
| 上级菜单 | 支持任意层级，导航默认展开一级 |
| 排序 | 数值越小越靠前 |
| 图标 | 使用 Font Awesome 图标类名，如 `fa fa-users`，图标参考：[https://www.thinkcmf.com/font/search/index.html](https://www.thinkcmf.com/font/search/index.html) |
| 编码 | 唯一标识，自动生成后只读，模块初始化依据此值判断菜单是否已存在 |
| 自定义参数 | 传给页面的附加参数，TPL 页面与前端可读取 |

## 按菜单控制界面元素

菜单值也可以作为业务代码中的开关。`ViaMenuValueCtrl` 实现了 `ExprBool.ExprHandler`，用于按「当前用户是否拥有某菜单」控制字段、按钮是否显示：

```java
@RowOperation(
    title = "审核",
    show = @ExprBool(exprHandler = ViaMenuValueCtrl.class, params = "audit_btn"),
    operationHandler = AuditHandler.class
)
```

`params` 即菜单的类型值。只需再建一个类型为「按钮」、值为 `audit_btn` 的菜单，授予哪些角色，哪些人就能看到这个按钮。

菜单权限在登录时加载并缓存，修改菜单或角色后用户需重新登录或点击导航栏刷新按钮生效。
