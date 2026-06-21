# 逻辑删除

逻辑删除的本质是**修改操作**，所谓的逻辑删除其实并不是真正的删除，而是在表中将对应的是否删除标识（deleted）或者说是状态字段（status）做修改操作。

## 代码实现

```java
@Erupt(
        name = "逻辑删除",
        filter = @Filter("deleted = false"),
)
@SQLDelete(sql="update test set deleted = true, deleteTime = now() where id = ?")
@Table(name = "test")
@Entity
public class Test extends BaseModel {

    @EruptField(
            views = @View(title = "xxx"),
            edit = @Edit(title = "xxx")
    )
    private String name;
    
    private Date deleteTime;
    
    private Boolean deleted = false;
    
}
```

## 原理解析

1. 使用 `deleted` 属性做逻辑删除标识
2. 使用 `@SQLDelete` 注解覆盖原有删除逻辑
3. 使用 `filter` 做查询过滤
