# @Dynamic 表单动态控制

## @Dynamic 注解

可根据其他组件的值动态控制当前组件：只读、显示、必填等状态。

> 1.13.1 及以上版本支持，建议用 onchange 配置替代此能力，后续版本会破坏性调整或移除此能力

### 使用场景举例

- 如果填写表单 A 后就必须要填写表单 B
- 表单 A 的值为 XXX 时，表单 B 隐藏
- 表单 A 选择某个下拉项时，表单 B 只读

### 代码示例

```java
@Enumerated(EnumType.STRING)
@EruptField(
        views = @View(title = "编辑类型"),
        edit = @Edit(title = "编辑类型",
                notNull = true, type = EditType.CHOICE,
                choiceType = @ChoiceType(type = ChoiceType.Type.RADIO, fetchHandler = GeneratorField.class))
)
private GeneratorType type = GeneratorType.INPUT;

// 根据 type 的值动态调整组件为必填（框架层也会校验必填状态是否正常传值）
@EruptField(
        edit = @Edit(title = "关联实体类", 
                     dynamic = @Dynamic(
                        dependField = "type",
                        noMatch = Dynamic.Ctrl.HIDE,
                        match = Dynamic.Ctrl.NOTNULL,
                        condition = "value.indexOf('REFERENCE') != -1"
                     )
        )
)
private String linkClass;
```

### @Dynamic 注解配置

| 属性名 | 描述 |
|--------|------|
| `dependField` | 依赖的字段名，即根据哪个字段的值来动态控制当前组件 |
| `match` | 当条件满足时对当前组件的控制行为 |
| `noMatch` | 当条件不满足时对当前组件的控制行为 |
| `condition` | 条件表达式，使用 JavaScript 语法，其中 `value` 表示依赖字段的值 |

### 控制行为（Ctrl）枚举

- `SHOW`：显示组件
- `HIDE`：隐藏组件
- `NOTNULL`：设置为必填
- `READONLY`：设置为只读

## @Readonly 只读动态控制

```java
@EruptField(
            views = @View(title = "数据新增修改权限"),
            edit = @Edit(title = "数据新增修改权限",
                // 添加@Readonly注解，实现 Readonly.ReadonlyHandle 接口
                readonly = @Readonly(add = false, edit = false, exprHandler = DemoRead.class)
            )
    )
private String demo;
```

```java
@Service
public class DemoRead implements Readonly.ReadonlyHandler {
    
    @Resource
    private EruptUserService eruptUserService;
    
    @Override
    public boolean add(boolean add, String[] params) {
        // 例如只有超级管理员可以新增的字段
        return !eruptUserService.getCurrentEruptUser().getIsAdmin();
    }

    @Override
    public boolean edit(boolean edit, String[] params) {
        return true;
    }
}
```

### @Readonly 注解定义

```java
public @interface Readonly {
    boolean add() default true;

    boolean edit() default true;

    boolean allowChange() default true; // 是否允许通过 API 修改（即便前端只读）

    String[] params() default {};

    Class<? extends Readonly.ReadonlyHandler> exprHandler() default Readonly.ReadonlyHandler.class;

    public interface ReadonlyHandler {
        
        boolean add(boolean add, String[] params);

        boolean edit(boolean edit, String[] params);
    }
}
```

## 条件表达式说明

条件表达式使用 JavaScript 语法，可以通过 `value` 变量获取依赖字段的值。例如：

- `value == '1'`：当依赖字段的值等于字符串 '1' 时
- `value > 10`：当依赖字段的值大于 10 时
- `value.indexOf('REFERENCE') != -1`：当依赖字段的值包含 'REFERENCE' 字符串时
