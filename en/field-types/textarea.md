# Multi-line Text TEXTAREA

Multi-line text input, suitable for storing longer content.

![textarea](/field-types/textarea.png)

## Basic Usage

```java
@Column(length = 2000) // You can also use @Lob for larger content
@EruptField(
    views = @View(title = "Multi-line Text"),
    edit = @Edit(title = "Multi-line Text", type = EditType.TEXTAREA)
)
private String textarea;
```

## Configuration <Badge type="tip" text="v2.1.3+" />

Configured through the `textareaType` attribute of `@Edit`:

```java
public @interface TextareaType {

    int length() default Integer.MAX_VALUE; // Maximum input length

    int minRows() default 3;  // Minimum visible rows

    int maxRows() default 20; // Maximum visible rows before scrolling

    String[] mentionPrefix() default {};   // Mention trigger characters; empty disables mention

    String[] mentions() default {};        // Static mention suggestions

    String[] mentionFetchHandlerParams() default {}; // Params passed to mentionFetchHandler

    Class<? extends TagsFetchHandler>[] mentionFetchHandler() default {}; // Dynamic mention suggestions

}
```

**Limiting length and visible rows:**

```java
@EruptField(
    views = @View(title = "Remark"),
    edit = @Edit(
        title = "Remark", type = EditType.TEXTAREA,
        textareaType = @TextareaType(length = 500, minRows = 5, maxRows = 12)
    )
)
private String remark;
```

## Mentions <Badge type="tip" text="v2.1.2+" />

Typing a trigger character (such as `@`) inside the textarea opens a suggestion list, and picking an entry inserts it into the text. Useful for mentioning an assignee in a ticket note, referencing an order number with `#`, and similar cases.

**Key point: mentions are entirely disabled when `mentionPrefix` is empty**, which is the default.

### Static suggestions

When the list never changes, declare it inline with `mentions`:

```java
@EruptField(
    views = @View(title = "Comment"),
    edit = @Edit(
        title = "Comment", type = EditType.TEXTAREA,
        textareaType = @TextareaType(
            mentionPrefix = {"@"},
            mentions = {"Alice", "Bob", "Carol"}
        )
    )
)
private String comment;
```

`mentionPrefix` accepts multiple trigger characters, all sharing the same suggestion list:

```java
textareaType = @TextareaType(mentionPrefix = {"@", "#"}, mentions = {"P0", "P1", "P2"})
```

### Dynamic suggestions

When suggestions come from the database or an external service, implement `TagsFetchHandler`:

```java
public interface TagsFetchHandler<MODEL> {

    List<String> fetchTags(MODEL model, String[] params);

}
```

The implementation must be registered as a Spring bean:

```java
@Service
public class UserMentionHandler implements TagsFetchHandler<Object> {

    @Resource
    private EruptDao eruptDao;

    @Override
    public List<String> fetchTags(Object model, String[] params) {
        return eruptDao.lambdaQuery(EruptUser.class)
                .eq(EruptUser::getStatus, true)
                .list().stream()
                .map(EruptUser::getName)
                .collect(Collectors.toList());
    }

}
```

```java
@EruptField(
    views = @View(title = "Handling Note"),
    edit = @Edit(
        title = "Handling Note", type = EditType.TEXTAREA,
        textareaType = @TextareaType(
            mentionPrefix = {"@"},
            mentionFetchHandler = UserMentionHandler.class,
            mentionFetchHandlerParams = {"status:active"}
        )
    )
)
private String handleNote;
```

Values in `mentionFetchHandlerParams` are passed verbatim as the `params` argument of `fetchTags`, so one handler can serve several fields:

```java
@Override
public List<String> fetchTags(Object model, String[] params) {
    if (params.length > 0 && "status:active".equals(params[0])) {
        // return active users only
    }
    // ...
}
```

:::tip How suggestions reach the browser
`mentions` and `mentionFetchHandlerParams` are annotated `@Transient`, so they are **not** serialized into the field metadata sent to the frontend. The static list and the handler results are merged server-side by `EruptUtil.getMentionList`, and the frontend fetches them on demand via `POST /textarea-mention/{erupt}/{field}` — suggestions are always live, and the full roster never leaks into page metadata.

Both can be used together: the final list is `mentions` followed by each handler's return value, in declaration order.
:::
