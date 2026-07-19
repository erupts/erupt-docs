# Button BUTTON <Badge type="tip" text="2.0.4+" />

Renders a button in the form. When clicked, it calls a backend handler with **all current form values**, allowing arbitrary business logic (e.g. connectivity tests, configuration validation). It can also populate form values and dynamically adjust the annotation configuration of other fields. The field collects no data and is not persisted — use it with `@Transient`.

## Basic Usage

```java
@Transient
@EruptField(
    edit = @Edit(title = "Test Model", type = EditType.BUTTON,
                 buttonType = @ButtonType(icon = "fa fa-bolt", handler = LlmTestButtonHandler.class))
)
private String testModel;
```

```java
@Component
public class LlmTestButtonHandler implements EruptButtonHandler<Llm> {

    @Override
    public String click(Llm llm, String[] params) {
        // llm contains the complete current form data
        llmService.testConnection(llm);
        // Return a JS expression to be executed by the frontend, or null
        return "msg.success('Model connected successfully')";
    }

}
```

## Configuration

```java
public @interface ButtonType {

    String style() default "default"; // Button style: default, primary, dashed, link, text

    boolean danger() default false;   // Danger (red) button style

    String icon() default "";         // Button icon, supports fontawesome, e.g. fa fa-check

    String confirm() default "";      // Confirmation hint before executing; empty means no confirmation

    boolean fullSpan() default false; // Display across the whole line

    Class<? extends EruptButtonHandler> handler() default EruptButtonHandler.class; // Click handler

    String[] handlerParams() default {}; // Parameters passed to the handler

}
```

## EruptButtonHandler Interface Definition

```java
public interface EruptButtonHandler<Erupt> {

    // Triggered when the button is clicked; erupt contains all current form values
    // Return value: JS expression executed by the frontend after success, or null
    default String click(Erupt erupt, String[] params) {
        return null;
    }

    // Populate form fields based on current form values. Key is the field name.
    default Map<String, Object> populateForm(Erupt erupt, String[] params) {
        return null;
    }

    // Dynamically adjust the @Edit annotation config of other fields
    // Example: return Map.of("name", "edit.desc='xxxxx'");
    default Map<String, String> buildEditExpr(Erupt erupt, String[] params) {
        return null;
    }

}
```

:::tip
Built-in modules already make extensive use of this component: AI model connection tests, MCP Server validation, agent testing, cron expression preview for scheduled jobs, and more.
:::
