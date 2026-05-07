# 数据钻取 @Drill

通过一条数据获取其他表与之关联的数据，可做**无限级**表关联使用。无需外键，低耦合一对多。

## 使用方法

### 主表配置

```java
@Erupt(
       name = "TestDrill",
       drills = {
                @Drill(code = "drill", 
                       title = "数据钻取",
                       // 最终生成的表达式为：EruptTest.id = DrillErupt.eruptTestId
                       link = @Link(column = "id",                 // 当前表关联列
                                    linkErupt = DrillErupt.class,  // 目标关联表
                                    joinColumn = "eruptTestId"))   // 目标表关联列
       }
)
@Entity
@Table
public class EruptTest extends BaseModel {
    
}
```

### 关联表配置

```java
@Erupt(name = "下钻类")
@Entity
@Table
public class DrillErupt extends BaseModel {
    
    // EruptTest 表的主键
    private Long eruptTestId;
    
    @EruptField(
            views = @View(title = "文本"),
            edit = @Edit(title = "文本", notNull = true)
    )
    private String input;
    
}
```

> **注意：DrillErupt 需要增加菜单权限否则会报 403 错误**

## 下钻菜单权限配置（下钻提示 403）

如：字典可下钻到字典项。

需将字典项的类名称添加到菜单，类型：表格视图，状态：隐藏

<!-- TODO: 添加截图 -->

## 注解配置项说明

```java
public @interface Drill {

    // 编码，下钻的唯一标识
    String code();

    // 名称
    String title();

    // 是否折叠显示 1.12.19 及以上版本支持
    boolean fold() default false;
    
    // 图标，请参考 font awesome
    String icon() default "fa fa-sitemap";
    
    // 动态控制按钮显示
    ExprBool show() default @ExprBool;

    Link link();
    
}
```

```java
public @interface Link {
    
    // 关联的 erupt 类
    Class<?> linkErupt();

    // 关联的 erupt 类中的关联字段
    String joinColumn();
    
    // 原始类中的关联字段
    String column() default "id";

    // 关联时额外条件
    String linkCondition() default "";

    // 结果预览：this.column = linkErupt.joinColumn [ and {linkCondition}]

}
```
