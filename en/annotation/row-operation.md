# Custom Buttons @RowOperation

The `@RowOperation` annotation adds custom action buttons to the operation column of an Erupt table, enabling complex business logic to be triggered from the UI.

![RowOperation custom action buttons](/annotation/row-operation.png)

## Usage

```java
@Erupt(
       name = "Erupt",
       rowOperation = {
                @RowOperation(
                    title = "Single Row Action",
                    mode = RowOperation.Mode.SINGLE, 
                    operationHandler = OperationHandlerImpl.class),
                @RowOperation(
                    title = "Multi-Row Action",
                    operationHandler = OperationHandlerImpl.class),
                @RowOperation( 
                    title = "Standalone Button",
                    operationHandler = OperationHandlerImpl.class,
                    mode = RowOperation.Mode.BUTTON, 
                    tip = "Executes without depending on any row data"),
        },
)
public class EruptTest extends BaseModel {
    
}
```

Button handler implementation:

```java
/**
 * Generic type parameters:
 * <EruptTest>  — the type of the target data
 * <Void>       — can be replaced with another Erupt class to render a form as input;
 *                Void is used here as a placeholder since no form input is needed
 **/
public class OperationHandlerImpl implements OperationHandler<EruptTest, Void> {

    // The return value is executed by the browser as JavaScript
    @Override
    public String exec(List<EruptTest> data, Void vo, String[] param) {
        // TODO your logic

        // return "alert(23333)"
        return null;

        // Display the result in a code editor modal (arg 1: language, arg 2: code)
        // return "codeModal('sql',`select * from xxx`)"

        // Trigger a download
        // return "window.open('https://xxxxx')"

        // Show an info message
        // return "window.msg.info('This is a normal message')"
    }

}
```

## Annotation Definition

```java
public @interface RowOperation {

    String code() default ""; // unique identifier for this button

    String title(); // display name

    String tip() default ""; // additional tooltip text

    // whether to collapse single-row buttons (useful when there are many buttons, supported in 1.12.17+)
    boolean fold() default false; 

    // confirmation prompt shown before execution; empty means no prompt (supported in 1.12.11+)
    String callHint() default "erupt.operation.call_hint";

    // dynamically control button visibility (supported in 1.5.4+)
    ExprBool show() default @ExprBool;

    // button icon; refer to Font Awesome
    String icon() default "fa fa-dot-circle-o";

    Mode mode() default Mode.MULTI; // button trigger mode

    Type type() default Type.ERUPT; // button type

    // associate an Erupt class to render a form when the button is clicked
    Class<?> eruptClass() default void.class;

    // parameters passed to operationHandler
    String[] operationParam() default {};

    // backend handler executed when the button is clicked
    Class<? extends OperationHandler> operationHandler() default OperationHandler.class;
    
    // requires the erupt-tpl module
    Tpl tpl() default @Tpl(path = "");

    // controls whether the button is enabled or disabled (JS expression)
    // available variable: item — e.g. item.status == 1
    String ifExpr() default "";
    
    // controls whether ifExpr affects button visibility or clickability
    IfExprBehavior ifExprBehavior() default IfExprBehavior.DISABLE;

    enum Mode {
        SINGLE,     // requires exactly one selected row
        MULTI,      // can operate on multiple rows at once
        MULTI_ONLY, // requires multiple rows selected (supported in 1.12.16+)
        BUTTON      // standalone button, no row selection required
    }

    enum Type {
        ERUPT, // used with operationHandler and eruptClass
        TPL    // used with tpl
    }
    
    enum IfExprBehavior {
        HIDE,    // ifExpr controls button visibility (show/hide)
        DISABLE  // ifExpr controls button clickability (enabled/disabled)
    }
    
}
```

## Form Dialog (Form)

```java
@Erupt(
       name = "Erupt",
       rowOperation = @RowOperation(
            title = "Form Button",
            mode = RowOperation.Mode.BUTTON,
            eruptClass = DialogForm.class,           // form definition shown when the button is clicked
            operationHandler = DialogFormHandler.class // button handler class
       ),
)
public class EruptTest extends BaseModel {
    
}
```

```java
@Erupt(name = "Form Dialog", authVerify = false)
@Getter
@Setter
public class SimpleDialog extends BaseModel {

    @EruptField(
            edit = @Edit(title = "Text", notNull = true)
    )
    private String text;

    @EruptField(
            edit = @Edit(title = "Time", notNull = true)
    )
    private Date date;

    @EruptField(
            edit = @Edit(title = "Number", notNull = true)
    )
    private Long number;

}
```

> **Note: It is recommended to add `authVerify = false` to dialog form classes to avoid permission issues with file uploads and similar operations.**

### Pre-populating Form Values (1.12.13+)

```java
public class DialogFormHandler implements OperationHandler<EruptTest, SimpleDialog> {
    
    @Override
    public String exec(List<Complex> data, SimpleDialog simpleDialog, String[] param) {
        return "";
    }

    // Pre-populate form values when the dialog opens (override as needed, supported in 1.12.13+)
    @Override
    public SimpleDialog eruptFormValue(List<EruptTest> data, SimpleDialog simpleDialog, String[] param) {
        simpleDialog.setText(data.get(0).getColor());
        return simpleDialog;
    }
}
```

## TPL Template Dialog

Set `type` to `RowOperation.Type.TPL` to open a custom template page in a dialog when the button is clicked. This is ideal for complex display or interaction scenarios.

:::tip
Make sure the [erupt-tpl](/en/modules/erupt-tpl) module is imported before using this feature.
:::

```java
@Erupt(
    name = "Button Opens Template",
    rowOperation = @RowOperation(
        code = "tpl", title = "Template Button", type = RowOperation.Type.TPL,
        tpl = @Tpl(
            path = "/tpl/operator.ftl",           // template file path
            tplHandler = TestErupt.class,          // data binding handler (optional)
            engine = Tpl.Engine.FreeMarker          // default value
        )
    )
)
@Entity
@Getter
public class TestErupt extends BaseModel implements Tpl.TplHandler {

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name")
    )
    private String name;

    @EruptField(
        views = @View(title = "Number"),
        edit = @Edit(title = "Number")
    )
    private Integer number;

    @Override
    public void bindTplData(Map<String, Object> binding, String[] params) {
        binding.put("title", "Selected Data");
    }
}
```

Template file example (`resources/tpl/operator.ftl`):

```html
<div>
    <#-- title is bound via bindTplData -->
    <h1 align="center">${title}</h1>
    <table border="1" cellpadding="0" style="width: 100%">
        <#list rows as row>
        <tr>
            <td>${row.id}</td>
            <td style="background: #09f;color: #fff">${row.name}</td>
            <td>${row.number}</td>
        </tr>
        </#list>
    </table>
</div>
```

### Pre-injected Template Variables

| Variable | Description |
|----------|-------------|
| `request` | HttpServletRequest object |
| `response` | HttpServletResponse object (1.6.12+) |
| `rows` | Selected row data (array); not available when engine is native |

### Closing the Dialog

Call the following JS code from within the template page to close the dialog:

```javascript
window.parent.postMessage({ type: 'close' }, '*');
```

### Closing the Dialog and Refreshing Data

```javascript
window.parent.postMessage({ type: 'close-and-query' }, '*');
```

### Dialog Width and Height

- **Height**: Auto-adapts to the custom page height
- **Width**: Configure via `RowOperation → tplWidth`, must include a unit, e.g. `500px`, `80%` (1.10.13+)

## Button Permissions

```java
@Erupt(
        name = "Menu-Controlled Button Permissions",
        rowOperation = {
                @RowOperation(
                        code = "btn", 
                        title = "Menu-Controlled Button Permissions",
                        operationHandler = OperationHandlerImpl.class,
                        show = @ExprBool(
                             exprHandler = ViaMenuValueCtrl.class, // controls visibility based on menu type value
                             params = "testBtn"  // permission identifier; add a menu with type "Button" and type value "testBtn" to control this button
                        )
                )
        }
)
public class TestErupt extends BaseModel {
    
}
```

Add a menu entry, fill the `params` value into the menu type value field, and set the menu type to "Button" to control the show/hide of that button.
