# OnChange Field Linkage <Badge type="tip" text="1.13.2+" />

Reacts to user input in the form in real time: you can **update the values of other fields**, or **dynamically adjust the `@Edit` annotation configuration** of other fields (such as title, description, required, etc.).

## Basic Usage

Bind a handler class via the `onchange` attribute of the field's `@Edit` annotation:

```java
@Erupt(name = "DEMO")
@Table(name = "t_demo")
@Entity
@Getter
@Setter
public class Demo extends BaseModel {

    @EruptField(
        views = @View(title = "Text"),
        edit = @Edit(title = "Text", onchange = DemoInputChange.class)
    )
    private String input;

    @EruptField(
        views = @View(title = "Text 2"),
        edit = @Edit(title = "Text 2", readonly = @Readonly)
    )
    private String input2;

}
```

```java
public class DemoInputChange implements OnChange<Demo> {

    // Dynamically update the value of form field B when form field A changes
    @Override
    public Map<String, Object> populateForm(Demo demo, String[] params) {
        Map<String, Object> map = new HashedMap<>();
        map.put(LambdaSee.field(Demo::getInput2), demo.getInput());
        return map;
    }

    // Dynamically update the annotation configuration of form field B when form field A changes
    @Override
    public Map<String, String> buildEditExpr(Demo demo, String[] params) {
        return Map.of(LambdaSee.field(Demo::getInput2),
                "edit.title = '" + demo.getInput() + "';" +
                    "edit.desc = '" + demo.getInput() + "';");
    }
}
```

## OnChange Interface Definition

```java
public interface OnChange<MODEL> {

    // Populate other form fields based on user input. Key is the field name.
    Map<String, Object> populateForm(MODEL model, String[] params);

    // Dynamically adjust the @Edit annotation config of other fields based on user input.
    // Available variable: edit. Syntax: JavaScript.
    Map<String, String> buildEditExpr(MODEL model, String[] params);

}
```

:::tip Related capabilities
- For cascading dropdown option filtering, see `ChoiceFetchHandler.fetchFilter` and `dependField` in [CHOICE](/en/field-types/choice)
- For conditional show/hide and disabling of form fields, see [@Dynamic](/en/annotation/dynamic)
:::
