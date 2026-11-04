# 虚拟字段（@Transient）

使用 JPA `@Transient` 注解的字段，启动时不会自动生成数据库列，它只是一种 UI 展现方式，可配合 [DataProxy](/zh/advanced/data-proxy) 填充或消费虚拟字段的值。

## 虚拟列

非数据库字段展示在表格中，通过 `DataProxy.afterFetch` 填充值：

```java
@Erupt(name = "虚拟列", dataProxy = VirtualDemo.class)
@Table(name = "virtual_demo")
@Entity
public class VirtualDemo extends BaseModel implements DataProxy<VirtualDemo> {

    // 文本输入
    @EruptField(
            views = @View(title = "文本"),
            edit = @Edit(title = "文本")
    )
    private String field;
    
    
    @Transient
    @EruptField(
        views = @View(title = "虚拟列（非数据库字段）")
    )
    private String virtualColumn;
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        for (Map<String, Object> map : list) {
            map.put("virtualColumn", "自定义虚拟列值");
        }
    }
    
}
```

## 虚拟表单

非数据库字段出现在表单中，提交后在 DataProxy 中消费其值：

```java
@Erupt(name = "虚拟表单", dataProxy = VirtualDemo.class)
@Table(name = "virtual_demo")
@Entity
@Setter
public class VirtualDemo extends BaseModel implements DataProxy<VirtualDemo> {

    @EruptField(
            views = @View(title = "文本"),
            edit = @Edit(title = "文本")
    )
    private String text;
    
    
    @Transient
    @EruptField(
        edit = @Edit(title = "虚拟表单")
    )
    private String virtualForm;

    
    @Override
    public void afterAdd(VirtualDemo virtualDemo) {
        // 新增时填充到其他表单
        this.text = this.text + this.virtualForm;
    }
    
}
```
