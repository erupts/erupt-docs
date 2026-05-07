# @EruptField、@Edit、@View

## @EruptField 属性说明

| 属性名 | 描述 |
|--------|------|
| `views` | 表格项配置（允许不配置，则不展示在表格内，views 格式是数组，支持配置多个） |
| `edit` | 编辑项配置（允许不配置，则不展示组件，在此场景新增和编辑不信任任何前端值） |
| `sort` | 前端展示顺序，默认按照字段排列顺序进行排序，数字越小越靠前 |
| `params` | 自定义参数，会传递给前端 |

## @Edit 注解

### 注解示例

```java
@EruptField(
    sort = 10,
    edit = @Edit(title = "名称")
)
private String name;
```

### @Edit 注解配置

| 属性名 | 描述 |
|--------|------|
| `title` | 编辑框名称 |
| `desc` | 描述 |
| `notNull` | 是否为必填项 |
| `show` | 是否显示 |
| `readonly` | 是否只读 `@Readonly` |
| `dynamic` | 可根据其他组件的值动态控制当前组件只读、显示、必填等状态，详见 [@Dynamic](/annotation/dynamic) |
| `placeHolder` | 描述输入字段预期值的提示信息 |
| `search` | 是否支持搜索 `search = @Search(vague = true)`，vague 为 true 时各组件会有相应的高级查询策略 |
| `orderBy` | 排序规则，参照 HQL 语句 order by 语法（当字段类型为 @Erupt 修饰的复杂对象时可用） |
| `filter` | 过滤规则，参照 HQL 语句 where 语法（当字段类型为 @Erupt 修饰的复杂对象时可用） |
| `type` | 编辑类型，详见[字段类型](/field-types/) |
| `onchange` | 值变更联动（1.13.2+），详见 [OnChange](/advanced/dynamic-form) |

### 数据组件类型

#### 基础组件

| 类型 | 描述 | 搜索 | 高级搜索 |
|------|------|:---:|:---:|
| `AUTO` | 默认类型，可通过字段类型等特征推断组件类型 | | |
| `INPUT` | 文本输入框 | ✅ | ✅ |
| `NUMBER` | 数值输入框 | ✅ | ✅ |
| `SLIDER` | 滑动输入条 | ✅ | ✅ |
| `DATE` | 时间选择器 | ✅ | ✅ |
| `BOOLEAN` | 开关 | ✅ | ❌ |
| `CHOICE` | 单选框 | ✅ | ✅ |
| `TAGS` | 标签选择器 | ✅ | ❌ |
| `AUTO_COMPLETE` | 自动完成 | ✅ | ❌ |
| `TEXTAREA` | 多行文本输入框 | ✅ | ✅ |
| `HTML_EDITOR` | 富文本编辑器 | ✅ | ✅ |
| `CODE_EDITOR` | 代码编辑器 | ✅ | ✅ |
| `ATTACHMENT` | 附件，图片 | ❌ | ❌ |
| `MAP` | 地图 | ❌ | ❌ |
| `DIVIDE` | 分割线 | ❌ | ❌ |
| `TPL` | 自定义 HTML 模板 | ❌ | ❌ |
| `HIDDEN` | 隐藏 | ❌ | ❌ |
| `EMPTY` | 空（仍占据组件位置） | ❌ | ❌ |

#### 复杂关系组件

> 如下组件使用较为复杂，建议了解 JPA 后，懂一对一、一对多、多对多关系后使用

| 类型 | 描述 | 搜索 |
|------|------|:---:|
| `COMBINE` | 一对一引用【一对一】 | ❌ |
| `REFERENCE_TREE` | 树引用【多对一】 | ✅ |
| `REFERENCE_TABLE` | 表格引用【多对一】 | ✅ |
| `CHECKBOX` | 复选框【多对多】 | ❌ |
| `TAB_TREE` | 多选树【多对多】 | ❌ |
| `TAB_TABLE_REFER` | 多选表格【多对多】 | ❌ |
| `TAB_TABLE_ADD` | 一对多新增【一对多】 | ❌ |

## @View 注解

### 注解示例

```java
@EruptField(
    sort = 10,
    views = {
        @View(title = "名称")
    }
)
private String name;
```

### @View 注解配置

| 属性名 | 描述 |
|--------|------|
| `title` | 表格列名称 |
| `desc` | 表格列描述 |
| `type` | 数据展示形式，详见 type 参照 |
| `show` | 是否显示 |
| `sortable` | 是否支持排序（前端通过表格列进行排序操作） |
| `export` | 是否支持 Excel 导出 |
| `className` | 表格样式类名（可在 app.css 中定义类样式） |
| `width` | 列宽度（1.6.8 及以上版本支持） |
| `column` | 如果修饰字段为对象类型，需要使用此属性指定要展示哪一个字段（在 @ManyToOne 时使用此配置） |
| `tpl` | 弹出自定义模板，可在模板中使用 row 变量，获取当前行的数据 |
| `template` | 字符串转换模板，该参数在前端使用 eval 方法解析，支持变量：item（整行数据）、item.xxx（数据中的某一列）、value（当前数据） |

### @View → type 参照

| 属性名 | 描述 |
|--------|------|
| `AUTO` | 根据 @Edit → EditType 或字段类型自动识别 |
| `TEXT` | 普通文本 |
| `SAFE_TEXT` | 文本中带有脚本或标签信息不会被前端渲染，1.12.11 及以上版本支持 |
| `IMAGE` | 图片 |
| `IMAGE_BASE64` | base64 格式图片 |
| `SWF` | flash 动画 |
| `HTML` | 渲染 HTML 代码段 |
| `MOBILE_HTML` | 手机屏幕尺寸渲染 HTML 代码段 |
| `QR_CODE` | 二维码 |
| `LINK` | 新窗口方式打开链接 |
| `LINK_DIALOG` | 对话框方式打开链接 |
| `DOWNLOAD` | 直接下载 |
| `ATTACHMENT` | 新窗口方式打开附件 |
| `ATTACHMENT_DIALOG` | 对话框方式打开附件 |
| `DATE` | 日期 |
| `BOOLEAN` | 布尔 |
| `NUMBER` | 数值 |
| `MAP` | 地图 |
| `CODE` | 代码 |

## 注意事项

1. `views` 注解：如果去掉，则在表格中不展示
2. `edit` 注解：如果去掉，则在表格中值不可编辑
