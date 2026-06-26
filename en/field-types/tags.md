# Tag Selection TAGS

A tag-style multi-select component, suitable for labeling, categorization, and similar scenarios. Supports both static tag lists and dynamic fetching.

## Basic Usage

```java
@EruptField(
    edit = @Edit(title = "Tech Stack", type = EditType.TAGS,
                 tagsType = @TagsType(tags = {"Java", "Python", "Go"}, allowExtension = false))
)
private String techStack;
```

## Dynamic List

Field declaration:

```java
@EruptField(
    views = @View(title = "Tags"),
    edit = @Edit(title = "Tags", type = EditType.TAGS,
                 tagsType = @TagsType(
                     fetchHandler = MyTagsFetchHandler.class
                 ))
)
private String tags;
```

Implement `TagsFetchHandler<T>` to provide options. The generic `T` is the current Erupt entity class (conventionally named `MyModel`) — read `model` to access other form fields for linked filtering <Badge type="tip" text="MyModel 2.0.0+" />:

```java
@Component
public class MyTagsFetchHandler implements TagsFetchHandler<MyModel> {

    @Override
    public List<String> fetchTags(MyModel model, String[] params) {
        // model is the full form object — read other fields for linked filtering
        String type = model.getType();
        return tagService.findByType(type);
    }

}
```

## Configuration

```java
public @interface TagsType {

    String joinSeparator() default "[]"; // Storage format: default "[]" = JSON array (e.g. ["A","B"]); set to "," for comma-separated storage

    boolean allowExtension() default true; // Whether users can enter custom tags

    int maxTagCount() default 9999; // Maximum number of tags that can be selected

    String[] tags() default {}; // Static tag list

    String[] fetchHandlerParams() default {}; // Parameters passed to fetchHandler

    Class<? extends TagsFetchHandler>[] fetchHandler() default {}; // Dynamic tag source

}
```

> **2.0.0+**: A refresh button is displayed next to TAGS fields in the edit form, allowing the dynamic tag list to be re-fetched on demand.

