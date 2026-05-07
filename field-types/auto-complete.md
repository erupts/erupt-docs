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

实现 `AutoCompleteHandler` 提供候选项：

```java
@Component
public class MyAutoCompleteHandler implements AutoCompleteHandler {

    @Override
    public List<String> fetch(String val, String[] params) {
        // val 为用户当前输入值，根据输入返回匹配的候选列表
        return List.of("选项一", "选项二");
    }

}
```

## 配置项

```java
public @interface AutoCompleteType {

    Class<? extends AutoCompleteHandler> handler(); // 候选项处理器（必填）

    String[] param() default {}; // 传递给 handler 的参数

    int triggerLength() default 1; // 触发联想的最小输入长度

}
```
