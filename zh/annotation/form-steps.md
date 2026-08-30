# 分步表单 formSteps

**版本支持**：`2.1.1` 及以上版本

当表单字段较多时，一次性展示所有输入项会让用户无从下手。开启 `@Layout` 的 `formSteps` 后，表单将渲染为**分步向导（Step Wizard）**模式：字段按步骤分组，逐步填写，顶部步骤条实时展示进度。

![form-steps](/annotation/form-steps.png)

## 开启方式

```java
@Erupt(
    name = "分步表单示例",
    layout = @Layout(formSteps = true)
)
```

## 分步规则

分步以 `DIVIDE` 分割线字段为边界：

- 每个 `DIVIDE` 字段开启一个新步骤
- `DIVIDE` 的 `title` 作为该步骤的**标题**，`desc` 作为该步骤的**描述**
- 位于两个 `DIVIDE` 之间的字段归属前一个步骤

## 完整示例

```java
@Erupt(
    name = "入职登记",
    layout = @Layout(formSteps = true)
)
@Entity
@Table(name = "t_employee_entry")
public class EmployeeEntry extends BaseModel {

    @Transient
    @EruptField(edit = @Edit(title = "基本信息", desc = "填写个人基础资料", type = EditType.DIVIDE))
    private String step1;

    @EruptField(views = @View(title = "姓名"), edit = @Edit(title = "姓名", notNull = true))
    private String name;

    @EruptField(views = @View(title = "出生日期"), edit = @Edit(title = "出生日期"))
    private LocalDate birthday;

    @Transient
    @EruptField(edit = @Edit(title = "联系方式", desc = "填写联系信息", type = EditType.DIVIDE))
    private String step2;

    @EruptField(views = @View(title = "电话"), edit = @Edit(title = "电话", notNull = true))
    private String phone;

    @EruptField(views = @View(title = "邮箱"), edit = @Edit(title = "邮箱"))
    private String email;

    @Transient
    @EruptField(edit = @Edit(title = "岗位信息", desc = "填写入职岗位", type = EditType.DIVIDE))
    private String step3;

    @EruptField(views = @View(title = "部门"), edit = @Edit(title = "部门"))
    private String dept;

    @EruptField(views = @View(title = "职位"), edit = @Edit(title = "职位"))
    private String post;

}
```

上例将渲染为三个步骤：**基本信息 → 联系方式 → 岗位信息**。

:::tip
- `DIVIDE` 字段仅作为分步边界，不参与数据存储，建议加 `@Transient` 注解避免生成数据库字段
- 点击「下一步」时触发**当前步骤**的必填校验，校验不通过无法进入下一步
- 步骤条支持点击跳转：回退自由，向前跳转会依次校验途经的每个步骤
:::

## 相关文档

- [@Layout 布局定义](/zh/annotation/layout)
- [DIVIDE 分割线](/zh/field-types/divide)
