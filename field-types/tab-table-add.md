# 一对多新增 TAB_TABLE_ADD

在主表编辑界面直接新增、管理子表数据的一对多（`@OneToMany`）组件，支持 JSON 字段存储。

<!-- TODO: 添加截图 -->

## 使用方法

```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true) // 一对多，且开启级联
@JoinColumn(name = "this_id") // this表示当前的表名，子表会自动创建该列来标识与主表的关系
@OrderBy // 排序
@EruptField(
    edit = @Edit(title = "添加多条表格数据", type = EditType.TAB_TABLE_ADD)
)
private Set<Table> tables;
```

> **注意：不要使用 Lombok 的 `@Data` 注解，这会导致 Set 集合去重失效**

子表对象定义：

```java
@Entity
@Table(name = "TABLE")
@Erupt(name = "表格")
public class Table extends BaseModel {
    
    @EruptField(
            views = @View(title = "顺序"),
            edit = @Edit(title = "顺序")
    )
    private Integer sort;

    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

## 一对多内容存储到 JSON 字段

> 示例为 Spring Boot 3 版本，Spring Boot 2 使用可参考 hibernate-types-52 库

1. 添加依赖：

```xml
<dependency>
    <groupId>com.vladmihalcea</groupId>
    <artifactId>hibernate-types-60</artifactId>
    <version>2.21.1</version>
</dependency>
```

2. 增加字段注解 `@JdbcTypeCode`：

```java
@Entity
@Table(name = "many_json")
@Erupt(name = "一对多内容存储到 JSON 字段")
public class ManyJson extends BaseModel {
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "json")
    @EruptField(
            edit = @Edit(
                    title = "json",
                    type = EditType.TAB_TABLE_ADD
            )
    )
    private Set<Table> tables;
}
```
