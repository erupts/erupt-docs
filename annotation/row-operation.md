# 定义按钮 @RowOperation

`@RowOperation` 注解用于在 Erupt 表格的操作列中添加自定义功能按钮，以实现复杂业务逻辑。

<!-- TODO: 添加截图 -->

## 使用方法

```java
@Erupt(
       name = "Erupt",
       rowOperation = {
                @RowOperation(
                    title = "单行操作",
                    mode = RowOperation.Mode.SINGLE, 
                    operationHandler = OperationHandlerImpl.class),
                @RowOperation(
                    title = "多行操作",
                    operationHandler = OperationHandlerImpl.class),
                @RowOperation( 
                    title = "按钮操作",
                    operationHandler = OperationHandlerImpl.class,
                    mode = RowOperation.Mode.BUTTON, 
                    tip = "不依赖任何数据即可执行"),
        },
)
public class EruptTest extends BaseModel {
    
}
```

按钮事件实现类：

```java
/**
 * 泛型说明
 * <EruptTest>  为目标数据的类型
 * <Void>       可使用另一个erupt类作为表单输入框而存在，因为此演示代码并未涉及，所以使用Void来占位
 **/
public class OperationHandlerImpl implements OperationHandler<EruptTest, Void> {

    // 返回值由前端浏览器执行
    @Override
    public String exec(List<EruptTest> data, Void vo, String[] param) {
        // TODO your logic

        // return "alert(23333)"
        return null;

        // 自定义按钮返回结果用代码编辑器展示，参数 1 语言，参数 2 代码
        // return "codeModal('sql',`select * from xxx`)"

        // 使用自定义按钮执行下载操作
        // return "window.open('https://xxxxx')"

        // 消息提示框
        // return "window.msg.info('This is a normal message')"
    }

}
```

## 配置项注解定义

```java
public @interface RowOperation {

    String code() default ""; // 编码，按钮的唯一标识

    String title(); // 展示名称

    String tip() default ""; // 额外提示信息

    // 单行按钮是否折叠显示，适用于按钮过多的场景，1.12.17 及以上版本支持
    boolean fold() default false; 

    // 调用时的文本提示，空则不提示，1.12.11 及以上版本支持
    String callHint() default "erupt.operation.call_hint";

    // 动态控制按钮的显示与隐藏 1.5.4 及以上版本支持
    ExprBool show() default @ExprBool;

    // 按钮图标，请参考 font awesome
    String icon() default "fa fa-ravelry";

    Mode mode() default Mode.MULTI; // 按钮触发模式

    Type type() default Type.ERUPT; // 按钮类型

    // 如果操作按钮需要用户录入一些数据后触发，则可用此配置关联一个 erupt 类
    Class<?> eruptClass() default void.class;

    // 供 operationHandler 接收使用
    String[] operationParam() default {};

    // 操作按钮点击后，后台处理方法逻辑
    Class<? extends OperationHandler> operationHandler() default OperationHandler.class;
    
    // 需导入 erupt-tpl 模块才可支持
    Tpl tpl() default @Tpl(path = "");

    // 控制按钮可用与禁用（JS表达式）
    // 参考变量 → item，例如：item.status == 1
    String ifExpr() default "";
    
    // 控制 ifExpr 的结果是控制按钮的 显示与隐藏 还是 能否点击
    IfExprBehavior ifExprBehavior() default IfExprBehavior.DISABLE;

    enum Mode {
        SINGLE,     // 依赖一条数据来执行
        MULTI,      // 可以一次执行多条数据
        MULTI_ONLY, // 仅依赖多行数据，1.12.16 及以上版本支持
        BUTTON      // 可不依赖任何数据直接执行
    }

    enum Type {
        ERUPT, // 配合 operationHandler 与 eruptClass 使用
        TPL    // 配合 tpl 使用
    }
    
    enum IfExprBehavior {
        HIDE,    // IfExpr 处理按钮显示或隐藏
        DISABLE  // IfExpr 处理按钮可否点击
    }
    
}
```

## 表单弹出层（Form）

```java
@Erupt(
       name = "Erupt",
       rowOperation = @RowOperation(
            title = "表单按钮",
            mode = RowOperation.Mode.BUTTON,
            eruptClass = DialogForm.class,          // 点击按钮时弹出的表单定义
            operationHandler = DialogFormHandler.class // 按钮处理类
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
            edit = @Edit(title = "文本", notNull = true)
    )
    private String text;

    @EruptField(
            edit = @Edit(title = "时间", notNull = true)
    )
    private Date date;

    @EruptField(
            edit = @Edit(title = "数值", notNull = true)
    )
    private Long number;

}
```

> **注意：弹窗类建议增加 authVerify 配置，可解决图片上传等场景的权限问题**

### 表单弹出层初始值（1.12.13 及以上版本）

```java
public class DialogFormHandler implements OperationHandler<EruptTest, SimpleDialog> {
    
    @Override
    public String exec(List<Complex> data, SimpleDialog simpleDialog, String[] param) {
        return "";
    }

    // eruptClass 表单值初始化方法（按需重写）1.12.13 及以上版本支持
    @Override
    public SimpleDialog eruptFormValue(List<EruptTest> data, SimpleDialog simpleDialog, String[] param) {
        simpleDialog.setText(data.get(0).getColor());
        return simpleDialog;
    }
}
```

## 按钮权限

```java
@Erupt(
        name = "使用菜单控制按钮权限",
        rowOperation = {
                @RowOperation(
                        code = "btn", 
                        title = "使用菜单控制按钮权限",
                        operationHandler = OperationHandlerImpl.class,
                        show = @ExprBool(
                             exprHandler = ViaMenuValueCtrl.class, // 根据菜单类型值控制是否显示
                             params = "testBtn"  // 权限标识，菜单类型为按钮，类型值为testBtn即可控制该按钮
                        )
                )
        }
)
public class TestErupt extends BaseModel {
    
}
```

添加菜单，将 `params` 的值填入菜单类型值位置，菜单类型选择"按钮"即可控制该按钮的显示与隐藏。
