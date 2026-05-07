# 选择类组件

## 单选 CHOICE

<!-- TODO: 添加截图 -->

### 静态下拉列表

```java
@EruptField(
    edit = @Edit(
         title = "选择器", 
         type = EditType.CHOICE,
         choiceType = @ChoiceType(
            vl = {
                @VL(label = "字母A", value = "A", color = "#0f0"),
                @VL(label = "字母B", value = "B", disable = true),
                @VL(label = "字母C", value = "C"),
                @VL(label = "字母D", value = "D"),
             }
         )
    )
)
private String choice;
```

### 动态获取下拉列表

实现 `fetchHandler` 即可，可将任意来源的数据渲染到下拉列表中：

```java
@EruptField(
    edit = @Edit(title = "选择器", type = EditType.CHOICE,
                 choiceType = @ChoiceType(
                    fetchHandler = FetchHandlerImpl.class,
                    fetchHandlerParams = {"α", "β", "γ"}, // 该值可被 FetchHandlerImpl → fetch 方法 params 参数获取到
                 )
           )
)
private String choice;
```

```java
@Component
public class FetchHandlerImpl implements ChoiceFetchHandler {
    
    @Override
    public List<VLModel> fetch(String[] params) {
        List<VLModel> list = new ArrayList<>();
        for (String param : params) {
            list.add(new VLModel(param, param));
        }
        list.add(new VLModel("a", "A"));
        list.add(new VLModel("b", "B"));
        return list;
    }

}
```

## 多选 MULTI_CHOICE

多选框，存储多个选择值。

```java
@EruptField(
    edit = @Edit(
         title = "多选",
         type = EditType.MULTI_CHOICE,
         choiceType = @ChoiceType(
            vl = {
                @VL(label = "选项A", value = "A"),
                @VL(label = "选项B", value = "B"),
            }
         )
    )
)
private String multiChoice;
```

## 标签选择 TAGS

```java
@EruptField(
    views = @View(title = "标签"),
    edit = @Edit(title = "标签", type = EditType.TAGS,
                 tagsType = @TagsType(
                     fetchHandler = TagsFetchHandler.class
                 ))
)
private String tags;
```

## 自动完成 AUTO_COMPLETE

```java
@EruptField(
    edit = @Edit(title = "自动完成", type = EditType.AUTO_COMPLETE,
                 autoCompleteType = @AutoCompleteType(
                     fetchHandler = AutoCompleteFetchHandler.class
                 ))
)
private String autoComplete;
```
