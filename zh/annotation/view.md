# @View

配置字段在列表表格中的列展示行为，包括列名、宽度、展示类型、排序等。

## 属性说明

| 属性名 | 描述 |
|--------|------|
| `title` | 表格列名称 |
| `desc` | 列描述 |
| `type` | 数据展示类型，默认 `AUTO`，详见下方类型表 |
| `show` | 是否显示，默认 `true` |
| `sortable` | 是否支持点击列头排序，默认 `false` |
| `export` | 是否包含在 Excel 导出中，默认 `true` |
| `width` | 列宽度，需带单位，如 `200px`、`20%` |
| `column` | 字段为对象类型时，指定要展示的属性名（`@ManyToOne` 场景常用） |
| `className` | 表格列的 CSS 类名 |
| `tpl` | 弹出自定义模板，模板中可用 `row` 变量获取当前行数据 |
| `ifRender` | 动态控制列是否渲染（`ExprBool`） |
| `template` | 列值格式化模板（前端 `eval` 执行的 JS 表达式），可用变量：`value`（当前值）、`item`（整行数据）、`item.xxx`（某列值） |

## 展示类型（ViewType）

| 类型 | 描述 |
|------|------|
| `AUTO` | 根据 `@Edit` 类型或字段类型自动识别 |
| `TEXT` | 普通文本 |
| `SAFE_TEXT` | 文本中含脚本/标签时不渲染，防 XSS（1.12.11+） |
| `IMAGE` | 图片 |
| `IMAGE_BASE64` | Base64 编码图片 |
| `SWF` | Flash 动画 |
| `HTML` | 渲染 HTML 片段 |
| `MOBILE_HTML` | 以手机屏幕尺寸渲染 HTML |
| `QR_CODE` | 二维码 |
| `LINK` | 新窗口打开链接 |
| `LINK_DIALOG` | 对话框打开链接 |
| `DOWNLOAD` | 直接下载 |
| `ATTACHMENT` | 新窗口打开附件 |
| `ATTACHMENT_DIALOG` | 对话框打开附件 |
| `DATE` | 日期格式化展示 |
| `DATE_TIME` | 日期时间格式化展示 |
| `BOOLEAN` | 布尔值展示 |
| `NUMBER` | 数值展示 |
| `MAP` | 地图展示 |
| `CODE` | 代码高亮展示 |
| `MARKDOWN` | Markdown 渲染展示 |
| `TAB_VIEW` | 一对多/多对多子表格展示 |
