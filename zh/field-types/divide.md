# 分割线 DIVIDE

在表单中插入一条横向分割线，用于字段的视觉分组，不存储任何数据。

![divide](/field-types/divide.png)

## 基础用法

```java
@Transient
@EruptField(
    edit = @Edit(title = "-- 基本信息 --", type = EditType.DIVIDE)
)
private String divide;
```

## 在 formSteps 模式下的语义变化 <Badge type="tip" text="v2.1.1+" />

当所属 erupt 类配置了 `@Erupt(layout = @Layout(formSteps = true))` 时，`DIVIDE` 不再渲染为分割线，而是**升级为分步向导的步骤边界**：

| | 默认模式 | `formSteps = true` |
|---|---|---|
| 渲染结果 | 一条横向分割线 | 不渲染分割线，改由顶部步骤条呈现 |
| `title` 的作用 | 分割线上的文字 | 该步骤的**标题** |
| `desc` 的作用 | 未使用 | 该步骤的**描述** |
| 字段归属 | 仅视觉分组 | 位于两个 `DIVIDE` 之间的字段归属前一个步骤 |

其余需要注意的点：

- 只有 `show = true` 且 `title` 非空的 `DIVIDE` 字段才会被识别为步骤；一个步骤都识别不到时，表单回退为普通模式
- 第一个 `DIVIDE` 之前的字段归属第一个步骤
- 每一步在点击「下一步」时**单独校验本步骤内的必填项**，未通过不允许进入下一步
- `TAB_TABLE_ADD` / `TAB_TABLE_REFER` / `TAB_TREE` 这类以标签页形式渲染的子表，不参与分步，统一显示在**最后一步**

```java
@Erupt(name = "分步表单示例", layout = @Layout(formSteps = true))
public class StepForm extends BaseModel {

    @Transient
    @EruptField(edit = @Edit(title = "基本信息", desc = "填写个人基础资料", type = EditType.DIVIDE))
    private String step1;

    @EruptField(views = @View(title = "姓名"), edit = @Edit(title = "姓名", notNull = true))
    private String name;

    @Transient
    @EruptField(edit = @Edit(title = "联系方式", desc = "填写联系信息", type = EditType.DIVIDE))
    private String step2;

    @EruptField(views = @View(title = "邮箱"), edit = @Edit(title = "邮箱", notNull = true))
    private String email;

}
```

:::tip
完整说明详见 [分步表单 formSteps](/zh/annotation/form-steps) 与 [@Layout 布局定义](/zh/annotation/layout)。
:::
