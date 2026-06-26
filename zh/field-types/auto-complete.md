# 自动完成 AUTO_COMPLETE

带输入联想功能的文本框，用户输入时动态匹配候选项，选项通过实现 `AutoCompleteHandler` 提供。

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "自动完成", type = EditType.AUTO_COMPLETE,
                 autoCompleteType = @AutoCompleteType(
                     handler = MyAutoCompleteHandler.class
                 ))
)
private String autoComplete;
```

## 动态列表 <Badge type="tip" text="MyModel 2.0.0+" />

实现 `AutoCompleteHandler<T>` 提供候选项。泛型 `T` 为当前 Erupt 实体类（约定命名为 `MyModel`），可通过 `model` 读取同表单其他字段值实现联动：

```java
@Component
public class MyAutoCompleteHandler implements AutoCompleteHandler<MyModel> {

    @Override
    public List<Object> completeHandler(MyModel model, String val, String[] param) {
        // val：用户当前输入值
        // model：当前表单对象，可读取其他字段值进行联动过滤
        String category = model.getCategory();
        return productService.searchByCategory(category, val);
    }

}
```

> **2.0.0+**：编辑表单中 AUTO_COMPLETE 字段旁新增刷新按钮，可按需重新拉取候选项。

## 配置项

```java
public @interface AutoCompleteType {

    Class<? extends AutoCompleteHandler> handler(); // 候选项处理器（必填）

    String[] param() default {}; // 传递给 handler 的参数

    int triggerLength() default 1; // 触发联想的最小输入长度

}
```
