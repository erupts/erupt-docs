# 动态列、虚拟列与数据联动

## 动态列

> 注：1.11.1 及以上版本支持

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

## 虚拟列

> 如果希望非数据库字段展示在页面上，虚拟列则会派上用场。使用 `@Transient` 注解的字段，启动时不会自动生成数据库列，他只是一个 UI 展现方式，可用 DataProxy 填充虚拟列的值

```java
@Erupt(name = "虚拟列", dataProxy = VirtualDemo.class)
@Table(name = "virtual_demo")
@Entity
public class VirtualDemo extends BaseModel implements DataProxy<VirtualDemo> {

    // 文本输入
    @EruptField(
            views = @View(title = "文本"),
            edit = @Edit(title = "文本")
    )
    private String field;
    
    
    @Transient
    @EruptField(
        views = @View(title = "虚拟列（非数据库字段）")
    )
    private String virtualColumn;
    
    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        for (Map<String, Object> map : list) {
            map.put("virtualColumn", "自定义虚拟列值");
        }
    }
    
}
```

## 虚拟表单

> 使用 `@Transient` 注解的字段，启动时不会自动生成数据库列，他只是一个表单展现方式，可用 DataProxy 填充虚拟表单的值

```java
@Erupt(name = "虚拟表单", dataProxy = VirtualDemo.class)
@Table(name = "virtual_demo")
@Entity
@Setter
public class VirtualDemo extends BaseModel implements DataProxy<VirtualDemo> {

    @EruptField(
            views = @View(title = "文本"),
            edit = @Edit(title = "文本")
    )
    private String text;
    
    
    @Transient
    @EruptField(
        edit = @Edit(title = "虚拟表单")
    )
    private String virtualForm;

    
    @Override
    public void afterAdd(VirtualDemo virtualDemo) {
        // 新增时填充到其他表单
        this.text = this.text + this.virtualForm;
    }
    
}
```

## 行过滤

详见：[数据过滤 @Filter](/annotation/filter)

## 自定义行（合计行）

### 绑定 DataProxy 接口

```java
@Erupt(name = "Erupt", dataProxy = ExtraRowHandler.class)
public class EruptTest extends BaseModel{
    
    @EruptField(
            views = @View(title = "名称"),
            edit = @Edit(title = "名称")
    )
    private String name;
    
}
```

### 自定义行代码实现

```java
@Component
public class ExtraRowHandler implements DataProxy<EruptTest> {

    @Override
    public List<Row> extraRow(List<Condition> conditions) {
        // 行对象
        List<Row> rows = new ArrayList<>();
        // 列对象
        List<Column> columns = new ArrayList<>();

        columns.add(Column.builder().value("自定义行").colspan(2).build());
        columns.add(Column.builder().value(100 + "").colspan(6).className("text-red").build());

        rows.add(Row.builder().columns(columns).build());
        return rows;
    }	

}
```

### 行列对象结构

```java
public class Row {

    private List<Column> columns;

    private String className; // 样式类名，可在 app.css 中定义

}

public class Column {

    private String value;        // 表格展示值

    private int colspan = 1;     // 跨列数量

    private String className;    // 样式类名，可在 app.css 中定义

}
```

## OnChange 数据变更联动

> 根据用户输入实现配置变更与数据联动能力。
>
> 注：1.13.2 及以上版本支持

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

    // 通过表单 A 的变化，动态修改表单 B 的值
    @Override
    public Map<String, Object> populateForm(Demo demo, String[] params) {
        Map<String, Object> map = new HashedMap<>();
        map.put(LambdaSee.field(Demo::getInput2), demo.getInput());
        return map;
    }

    // 通过表单 A 的变化，动态修改表单 B 的注解配置
    @Override
    public Map<String, String> buildEditExpr(Demo demo, String[] params) {
        return Map.of(LambdaSee.field(Demo::getInput2),
                "edit.title = '" + demo.getInput() + "';" +
                    "edit.desc = '" + demo.getInput() + "';");
    }
}
```

### OnChange 接口定义

```java
public interface OnChange<MODEL> {

    // 根据用户输入联动其他表单，Key 表单字段名
    Map<String, Object> populateForm(MODEL model, String[] params);

    // 根据用户输入动态调整不同的字段的 @Edit 注解配置，可用变量：edit，语法 JS
    Map<String, String> buildEditExpr(MODEL model, String[] params);

}
```
