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
