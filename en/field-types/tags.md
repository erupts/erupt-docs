# Tag Selection TAGS

A tag-style multi-select component, suitable for labeling, categorization, and similar scenarios. Supports both static tag lists and dynamic fetching.

## Basic Usage

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

Implement `TagsFetchHandler` to provide options:

```java
@Component
public class MyTagsFetchHandler implements TagsFetchHandler {

    @Override
    public List<String> fetch(String[] params) {
        return List.of("Java", "Python", "Go");
    }

}
```

## Configuration

```java
public @interface TagsType {

    String joinSeparator() default "|"; // Separator used when storing multiple tags

    boolean allowExtension() default true; // Whether users can enter custom tags

    int maxTagCount() default 9999; // Maximum number of tags that can be selected

    String[] tags() default {}; // Static tag list

    String[] fetchHandlerParams() default {}; // Parameters passed to fetchHandler

    Class<? extends TagsFetchHandler>[] fetchHandler() default {}; // Dynamic tag source

}
```

## Examples

Static tag list:

```java
@EruptField(
    edit = @Edit(title = "Tech Stack", type = EditType.TAGS,
                 tagsType = @TagsType(tags = {"Java", "Python", "Go"}, allowExtension = false))
)
private String techStack;
```
