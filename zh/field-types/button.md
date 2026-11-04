# 按钮 BUTTON <Badge type="tip" text="2.0.4+" />

在表单中渲染一个按钮，点击后携带**当前表单全部数据**调用后端处理器，可执行任意业务逻辑（如连通性测试、配置校验），并支持回填表单值、动态调整其他字段的注解配置。字段不采集不入库，建议配合 `@Transient` 使用。

![button](/field-types/button.png)

## 基础用法

```java
@Transient
@EruptField(
    edit = @Edit(title = "测试模型", type = EditType.BUTTON,
                 buttonType = @ButtonType(icon = "fa fa-bolt", handler = LlmTestButtonHandler.class))
)
private String testModel;
```

```java
@Component
public class LlmTestButtonHandler implements EruptButtonHandler<Llm> {

    @Override
    public String click(Llm llm, String[] params) {
        // llm 为当前表单的完整数据，可直接用于业务校验
        llmService.testConnection(llm);
        // 返回值为前端执行的 JS 表达式，null 表示无需执行
        return "msg.success('模型连接成功')";
    }

}
```

## 配置项

```java
public @interface ButtonType {

    String style() default "default"; // 按钮样式：default、primary、dashed、link、text

    boolean danger() default false;   // 危险按钮样式（红色）

    String icon() default "";         // 按钮图标，支持 fontawesome，如 fa fa-check

    String confirm() default "";      // 点击前确认提示语，空则不确认

    boolean fullSpan() default false; // 是否跨整行显示

    Class<? extends EruptButtonHandler> handler() default EruptButtonHandler.class; // 点击处理器

    String[] handlerParams() default {}; // 传递给处理器的参数

}
```

## EruptButtonHandler 接口定义

```java
public interface EruptButtonHandler<Erupt> {

    // 按钮点击时触发，erupt 为当前表单全部数据
    // 返回值：事件成功后前端执行的 JS 表达式，无需执行返回 null
    default String click(Erupt erupt, String[] params) {
        return null;
    }

    // 根据当前表单数据回填表单，Key 为字段名
    default Map<String, Object> populateForm(Erupt erupt, String[] params) {
        return null;
    }

    // 根据当前表单数据动态调整其他字段的 @Edit 注解配置
    // 示例：return Map.of("name", "edit.desc='xxxxx'");
    default Map<String, String> buildEditExpr(Erupt erupt, String[] params) {
        return null;
    }

}
```

:::tip
框架内置模块已大量使用该组件：AI 模型连接测试、MCP Server 校验、智能体测试、定时任务 Cron 表达式预览等。
:::
