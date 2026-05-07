# 选择类组件

## 单选 CHOICE

下拉单选，支持静态枚举值和动态从后端获取选项。

### 基础用法

静态选项：

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
            }
        )
    )
)
private String choice;
```

### 示例

动态获取选项（实现 `ChoiceFetchHandler`）：

```java
@EruptField(
    edit = @Edit(title = "选择器", type = EditType.CHOICE,
                 choiceType = @ChoiceType(
                     fetchHandler = FetchHandlerImpl.class,
                     fetchHandlerParams = {"α", "β", "γ"}
                 ))
)
private String choice;
```

```java
@Component
public class FetchHandlerImpl implements ChoiceFetchHandler {

    @Override
    public List<VLModel> fetch(String[] params) {
        List<VLModel> list = new ArrayList<>();
        list.add(new VLModel("a", "A"));
        list.add(new VLModel("b", "B"));
        return list;
    }

}
```

---

## 多选 MULTI_CHOICE

下拉多选或复选框组，选中值以字符串形式存储。

### 基础用法

```java
@EruptField(
    edit = @Edit(
        title = "多选",
        type = EditType.MULTI_CHOICE,
        multiChoiceType = @MultiChoiceType(
            vl = {
                @VL(label = "选项A", value = "A"),
                @VL(label = "选项B", value = "B"),
            }
        )
    )
)
private String multiChoice;
```

---

## 标签选择 TAGS

标签形式的多选，选项通过 `TagsFetchHandler` 动态获取。

### 基础用法

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

---

## 自动完成 AUTO_COMPLETE

带输入联想的文本框，选项通过 `AutoCompleteFetchHandler` 动态获取。

### 基础用法

```java
@EruptField(
    edit = @Edit(title = "自动完成", type = EditType.AUTO_COMPLETE,
                 autoCompleteType = @AutoCompleteType(
                     fetchHandler = AutoCompleteFetchHandler.class
                 ))
)
private String autoComplete;
```
