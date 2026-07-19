# 表单行为（addBehavior / editBehavior）

- **`addBehavior`**：打开新增表单时触发，框架会先实例化一个空对象再调用此方法，可用于设置默认值。
- **`editBehavior`**：打开编辑表单时触发，框架从数据库加载完数据后调用，可在渲染前对字段进行预处理或动态替换。

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void addBehavior(EruptTest model) {
        // 新增表单打开时预填默认值
        model.setStatus("DRAFT");
        model.setCreator(getCurrentUser());
    }

    @Override
    public void editBehavior(EruptTest model) {
        // 编辑表单打开时对字段进行预处理（不会持久化，仅影响表单展示）
        if (model.getContent() != null) {
            model.setContent(decrypt(model.getContent()));
        }
    }
}
```

## 相关能力

- 独立全页表单（`formViewBehavior` / `formSave`）见[表单视图 FormView](/zh/advanced/form-view)
