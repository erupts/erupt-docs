# 表单校验（validate） <Badge type="tip" text="1.13.1+" />

`validate` 在新增、修改保存前触发，专用于数据校验：校验不通过时抛出 `EruptException`（或其子类 `EruptApiErrorTip`），操作将被拒绝，错误信息提示给用户。

## 代码示例

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest> {

    @Override
    public void validate(EruptTest model) throws EruptException {
        if ("张三".equals(model.getName())) {
            throw new EruptApiErrorTip("名称禁止为张三！");
        }
        if (model.getEndDate().before(model.getStartDate())) {
            throw new EruptApiErrorTip("结束时间不能早于开始时间");
        }
    }

}
```

## validate() 与 before* 的区别

| | `validate()` | `beforeAdd()` / `beforeUpdate()` |
|---|---|---|
| 用途 | 数据校验，不通过则拒绝操作 | 在保存前修改数据或执行业务逻辑 |
| 适用版本 | 1.13.1+ | 全版本 |
| 推荐场景 | 格式校验、业务规则校验 | 自动填充字段、调用外部服务 |

```java
@Override
public void validate(EruptTest model) throws EruptException {
    // 推荐：用于纯校验逻辑，不修改数据
    if (model.getEndDate().before(model.getStartDate())) {
        throw new EruptApiErrorTip("结束时间不能早于开始时间");
    }
}

@Override
public void beforeAdd(EruptTest model) {
    // 推荐：用于修改/补充数据
    model.setCreateBy(getCurrentUser());
}
```
