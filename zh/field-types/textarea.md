# 多行文本框 TEXTAREA

多行文本输入，适合存储较长内容。

![textarea](/field-types/textarea.png)

## 基础用法

```java
@Column(length = 2000) // 也可用 @Lob 支持更大内容
@EruptField(
    views = @View(title = "多行文本"),
    edit = @Edit(title = "多行文本", type = EditType.TEXTAREA)
)
private String textarea;
```

## 配置项 <Badge type="tip" text="v2.1.3+" />

通过 `@Edit` 的 `textareaType` 属性配置：

```java
public @interface TextareaType {

    int length() default Integer.MAX_VALUE; // 最大输入长度

    int minRows() default 3;  // 最小可见行数

    int maxRows() default 20; // 超过后出现滚动条的最大行数

    String[] mentionPrefix() default {};   // 提及触发字符，为空时不启用提及

    String[] mentions() default {};        // 静态提及候选项

    String[] mentionFetchHandlerParams() default {}; // 传给 mentionFetchHandler 的参数

    Class<? extends TagsFetchHandler>[] mentionFetchHandler() default {}; // 动态提及候选项

}
```

**限制输入长度与显示行数：**

```java
@EruptField(
    views = @View(title = "备注"),
    edit = @Edit(
        title = "备注", type = EditType.TEXTAREA,
        textareaType = @TextareaType(length = 500, minRows = 5, maxRows = 12)
    )
)
private String remark;
```

## @ 提及

在多行文本中输入触发字符（如 `@`）时弹出候选列表，选中后把候选项插入文本。适合工单备注 @ 处理人、评论 # 关联单号等场景。

**关键点：`mentionPrefix` 为空时提及功能完全关闭**，这是默认值。

### 静态候选项

候选项固定不变时，直接用 `mentions` 写死：

```java
@EruptField(
    views = @View(title = "评论"),
    edit = @Edit(
        title = "评论", type = EditType.TEXTAREA,
        textareaType = @TextareaType(
            mentionPrefix = {"@"},
            mentions = {"张三", "李四", "王五"}
        )
    )
)
private String comment;
```

`mentionPrefix` 可以配多个触发字符，各自共用同一份候选项：

```java
textareaType = @TextareaType(mentionPrefix = {"@", "#"}, mentions = {"P0", "P1", "P2"})
```

### 动态候选项

候选项来自数据库或外部服务时，实现 `TagsFetchHandler` 接口：

```java
public interface TagsFetchHandler<MODEL> {

    List<String> fetchTags(MODEL model, String[] params);

}
```

实现类需注册为 Spring Bean：

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
    views = @View(title = "处理说明"),
    edit = @Edit(
        title = "处理说明", type = EditType.TEXTAREA,
        textareaType = @TextareaType(
            mentionPrefix = {"@"},
            mentionFetchHandler = UserMentionHandler.class,
            mentionFetchHandlerParams = {"status:active"}
        )
    )
)
private String handleNote;
```

`mentionFetchHandlerParams` 中的值会原样传给 `fetchTags` 的 `params` 参数，可用同一个 Handler 服务多个字段：

```java
@Override
public List<String> fetchTags(Object model, String[] params) {
    if (params.length > 0 && "status:active".equals(params[0])) {
        // 只返回启用状态的用户
    }
    // ...
}
```

:::tip 候选项是怎么下发的
`mentions` 与 `mentionFetchHandlerParams` 标注了 `@Transient`，**不会**随注解元数据下发到前端。静态候选项与 Handler 返回值由服务端的 `EruptUtil.getMentionList` 合并，前端通过 `POST /textarea-mention/{erupt}/{field}` 按需拉取——所以候选项永远是实时的，且不会在页面元数据里泄露全量名单。

两者可以同时配置：最终候选项 = `mentions` + 各 Handler 返回值，按声明顺序拼接。
:::
