# 字段分组面板 GROUP

将多个字段收纳到一个可折叠面板中，减少表单视觉复杂度，适合将非核心字段归组隐藏。`GROUP` 字段本身不存储数据，仅作为分组容器。

> **2.0.0 新增**

## 基础用法

```java
@EruptField(
    edit = @Edit(
        title = "更多信息",
        type  = EditType.GROUP,
        groupType = @GroupType(
            fields    = {"remark", "tag", "extra"},
            collapsed = true
        )
    )
)
@Transient
private String groupInfo; // 字段名任意，不存储数据

@EruptField(
    views = @View(title = "备注"),
    edit  = @Edit(title = "备注")
)
private String remark;

@EruptField(
    views = @View(title = "标签"),
    edit  = @Edit(title = "标签")
)
private String tag;

@EruptField(
    views = @View(title = "扩展信息"),
    edit  = @Edit(title = "扩展信息")
)
private String extra;
```

## @GroupType 配置项

```java
public @interface GroupType {

    String[] fields();                 // 面板内的字段名列表（必填）

    boolean collapsed() default false; // 面板默认是否折叠

}
```

| 属性 | 类型 | 描述 |
|------|------|------|
| `fields` | `String[]` | 收纳到此面板的字段名数组，顺序即面板内渲染顺序 |
| `collapsed` | `boolean` | `true` 表示默认折叠，`false` 表示默认展开（默认值） |

## 效果说明

- 面板标题取自 `@Edit(title = "...")` 的值。
- 面板右侧有展开/折叠切换箭头，用户可手动控制。
- `fields` 中列出的字段会从主表单流中移除，仅在面板内渲染。
- `GROUP` 字段本身（如上例中的 `groupInfo`）需添加 `@Transient` 注解，不渲染任何输入框，字段值始终为空，不参与提交。

## 多组嵌套示例

```java
// 第一组：联系方式
@EruptField(
    edit = @Edit(title = "联系方式", type = EditType.GROUP,
                 groupType = @GroupType(fields = {"phone", "email", "address"}))
)
private String contactGroup;

// 第二组：系统信息（默认折叠）
@EruptField(
    edit = @Edit(title = "系统信息", type = EditType.GROUP,
                 groupType = @GroupType(fields = {"createBy", "createTime"}, collapsed = true))
)
private String sysGroup;
```

## 注意事项

- `fields` 中的字段必须是当前 Erupt 类中已定义的字段名，否则分组渲染时会忽略未找到的字段。
- 分组字段不影响列表视图（`@View`），列表中各字段独立展示。
- 被收纳进 `GROUP` 的字段仍然参与表单校验（`notNull` 等）。
- 不支持嵌套（`GROUP` 的 `fields` 中不能再包含另一个 `GROUP` 字段）。
