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

## 服务端强制校验声明的限制 <Badge type="tip" text="v2.4.0+" />

2.4.0 起，编辑表单在注解里声明的限制**在服务端同样生效**（`EruptValueValidator`），不再只依赖页面控件：直接调用接口、单元格编辑、批量编辑、Excel 导入提交的值，都按同一套规则检查，不通过时提示字段名与非法值。

| 组件 | 校验内容 |
|---|---|
| `INPUT` | 长度不超过 `@InputType(length)` |
| `NUMBER` | `@NumberType(min / max)`，只在显式声明时才限制 |
| `SLIDER` | `@SliderType(min / max)` |
| `RATE` | `0 ~ count`，只有 `allowHalf = true` 才允许半星 |
| `TAGS` | 数量不超过 `maxTagCount`；`allowExtension = false` 时每个标签必须来自 `tags` 或 `fetchHandler` |
| `DATE` | `pickerMode` 为 `FUTURE` / `HISTORY` 的方向限制，以及 `min` / `max` 区间 |
| `CHOICE` / `MULTI_CHOICE` | 值必须在选项内，见 [服务端选项校验](/zh/field-types/choice#服务端选项校验) |
| `TAB_TABLE_ADD` | 每一行按子模型自身的规则检查：必填、正则、XSS、子模型的 `DataProxy.validate`，再套用上表 |

- 只检查**本次提交中出现**的字段，因此单元格编辑只检查那一个字段
- 修改时，与库中已存值相同的值直接通过：规则收紧（选项下线、上限调低）之前存的老数据不会阻塞该记录其他字段的修改
- 这层校验在 `DataProxy.validate` 之前执行，业务规则仍写在 `validate` 中

```java
@EruptField(
    edit = @Edit(title = "折扣", type = EditType.NUMBER,
                 numberType = @NumberType(min = 0, max = 100))
)
private Integer discount; // 接口提交 120 同样被拒绝
```
