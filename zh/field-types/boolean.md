# 布尔开关 BOOLEAN

是/否切换开关，字段类型为 `Boolean` 时可自动推测，无需显式指定 `type`。

![boolean](/field-types/boolean.png)

## 基础用法

```java
@EruptField(
    edit = @Edit(title = "是否启用", boolType = @BoolType)
)
private Boolean enabled;
```

## 配置项

```java
public @interface BoolType {

    String trueText() default "Y";  // 选中时文本

    String falseText() default "N"; // 未选中时文本

    Type type() default Type.AUTO;  // 表单控件（2.3.0+）

    enum Type {
        AUTO,   // 字段 notNull 时渲染为开关，否则为单选按钮；服务端解析后下发具体控件
        RADIO,  // 单选按钮，保留「未选择」状态
        SWITCH, // 开关，未选择时按 false 提交
    }

}
```

## 控件类型 <Badge type="tip" text="v2.3.0+" />

| 类型 | 说明 |
| --- | --- |
| `AUTO` | 默认值。`@Edit(notNull = true)` 时渲染为开关，否则为单选按钮；由服务端解析后下发具体控件，前端不做猜测 |
| `RADIO` | 单选按钮，两个选项分别显示 `trueText` / `falseText`，允许保持「未选择」 |
| `SWITCH` | 开关，`trueText` / `falseText` 显示在滑块内；新建记录以及历史数据中的 `null` 值均按 `false` 填充 |

```java
@EruptField(
    edit = @Edit(title = "状态",
                 boolType = @BoolType(type = BoolType.Type.SWITCH, trueText = "启用", falseText = "停用"))
)
private Boolean status;
```

erupt-designer 的 BOOLEAN 字段面板提供同样的控件类型选择。

## 示例

自定义文本 + 设置默认值：

```java
@EruptField(
    edit = @Edit(title = "性别",
                 boolType = @BoolType(trueText = "男", falseText = "女"))
)
private Boolean sex = true;
```
