# 多对多复选框 CHECKBOX

以复选框形式展示可选项，用户勾选后建立多对多关系，对应 JPA `@ManyToMany`。适合选项数量较少的场景。

![checkbox](/field-types/checkbox.png)

## 基础用法

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "关联选项", type = EditType.CHECKBOX)
)
private Set<RefEntity> options;
```

> `RefEntity` 需是一个已被 `@Erupt` 注解修饰的实体类，Erupt 会自动读取其数据作为复选框选项。

## 配置项

通过 `@Edit` 的 `checkboxType` 指定选项从关联实体的哪些列取值：

```java
public @interface CheckboxType {

    String id() default "id";      // 关联实体中用于存储的字段（主键）

    String label() default "name"; // 关联实体中用于展示的字段

    String remark() default "";    // 关联实体中作为选项描述的字段

}
```

```java
@ManyToMany
@JoinTable(name = "rel_main_ref",
    joinColumns = @JoinColumn(name = "main_id"),
    inverseJoinColumns = @JoinColumn(name = "ref_id"))
@EruptField(
    edit = @Edit(title = "关联选项", type = EditType.CHECKBOX,
        checkboxType = @CheckboxType(id = "id", label = "title", remark = "intro"))
)
private Set<RefEntity> options;
```
