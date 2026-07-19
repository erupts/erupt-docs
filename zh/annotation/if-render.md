# ifRender 动态渲染 <Badge type="tip" text="1.11.1+" />

`@View` 与 `@Edit` 均支持 `ifRender` 属性，通过 `@ExprBool` 表达式在运行时动态决定列或表单组件是否渲染，如：根据当前登录用户的角色控制字段可见性。

## 动态列

在 `@View` 中配置 `ifRender`，动态控制表格列是否展示：

```java
@Erupt(name = "动态列")
@Table(name = "t_test")
@Entity
public class Simple extends BaseModel {

    @EruptField(
        views = @View(
            title = "动态列",
            ifRender = @ExprBool(exprHandler = DynamicView.class)
        )
    )
    private String dynamic;

}
```

```java
import xyz.erupt.annotation.expr.ExprBool;

@Component
public class DynamicView implements ExprBool.ExprHandler {

    @Override
    public boolean handler(boolean expr, String[] params) {
        // TODO 动态控制逻辑，如：根据当前登录用户判断是否展示
        return false;
    }
    
}
```

## 动态表单

在 `@Edit` 中配置 `ifRender`，动态控制表单组件是否渲染：

```java
@Erupt(name = "动态表单")
@Table(name = "t_test")
@Entity
public class Simple extends BaseModel {

    @EruptField(
            edit = @Edit(
                    title = "动态表单",
                    ifRender = @ExprBool(exprHandler = DynamicEdit.class)
            )
    )
    private String dynamic;

}
```

```java
import xyz.erupt.annotation.expr.ExprBool;

@Component
public class DynamicEdit implements ExprBool.ExprHandler {

    @Override
    public boolean handler(boolean expr, String[] params) {
        // TODO 动态控制逻辑，如：根据当前登录用户判断是否展示
        return false;
    }
    
}
```

## 相关能力

- 根据其他字段值动态控制组件状态见 [@Dynamic 动态控制](/zh/annotation/dynamic)
- 值变更实时联动其他字段见 [OnChange 字段联动](/zh/annotation/on-change)
