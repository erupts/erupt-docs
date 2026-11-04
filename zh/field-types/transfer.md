# 多对多穿梭框 TRANSFER <Badge type="tip" text="v2.3.0+" />

以可搜索的双列穿梭框展示可选项，左侧为待选、右侧为已选，用户勾选后建立多对多关系，对应 JPA `@ManyToMany`。适合选项数量较多、复选框放不下的场景。

`TRANSFER` 与 [CHECKBOX](/zh/field-types/checkbox) 使用相同的选项结构与 `/checkbox/{field}` 接口，仅切换了前端控件，因此把已有 `CHECKBOX` 字段改为 `TRANSFER` 只需替换 `type` 与配置注解，不影响存储与权限逻辑。

## 基础用法

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "关联选项", type = EditType.TRANSFER)
)
private Set<RefEntity> options;
```

> `RefEntity` 需是一个已被 `@Erupt` 注解修饰的实体类，Erupt 会自动读取其数据作为穿梭框选项。

## 配置项

通过 `@Edit` 的 `transferType` 指定选项从关联实体的哪些列取值：

```java
public @interface TransferType {

    String id() default "id";      // 关联实体中用于存储的字段（主键）

    String label() default "name"; // 关联实体中用于展示的字段

    String remark() default "";    // 关联实体中作为选项描述的字段，以 tooltip 形式显示在每一项上

}
```

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "关联选项", type = EditType.TRANSFER,
        transferType = @TransferType(id = "id", label = "title", remark = "intro"))
)
private Set<RefEntity> options;
```

:::tip
值列表（非实体关联）的多选同样可以使用穿梭框：`MULTI_CHOICE` 配合 `@MultiChoiceType(type = MultiChoiceType.Type.TRANSFER)` 即可，详见 [MULTI_CHOICE](/zh/field-types/multi-choice)。
:::

## 示例

角色分配权限，权限数量多、需要按名称检索：

```java
@ManyToMany
@JoinTable(name = "rel_role_permission",
    joinColumns = @JoinColumn(name = "role_id"),
    inverseJoinColumns = @JoinColumn(name = "permission_id"))
@EruptField(
    views = @View(title = "权限", type = ViewType.TAB_VIEW),
    edit = @Edit(title = "权限", type = EditType.TRANSFER,
        transferType = @TransferType(label = "name", remark = "description"))
)
private Set<Permission> permissions;
```
