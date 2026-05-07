# 权限控制 @Power

`@Power` 注解用于精细化控制 Erupt 界面的增、删、改、查、导入、导出等功能的启用状态。

> 控制 erupt 类能力，包括：新增、修改、删除、导入、导出等

## 使用方法

```java
@Erupt(
       name = "Erupt",
       power = @Power(add = true, delete = true, 
                      edit = true, query = true, 
                      importable = false, export = false)
)
public class EruptTest extends BaseModel {
    
}
```

## 注解属性说明

| 属性名 | 类型 | 默认值 | 描述 |
|--------|------|--------|------|
| `add` | boolean | true | 是否允许新增数据 |
| `delete` | boolean | true | 是否允许删除数据 |
| `edit` | boolean | true | 是否允许编辑数据 |
| `query` | boolean | true | 输入查询功能 |
| `viewDetails` | boolean | true | 是否允许查看详情 |
| `export` | boolean | false | 是否允许导出数据 |
| `importable` | boolean | false | 是否允许导入数据 |
| `powerHandler` | Class | - | 实现此接口动态控制权限 |

## 配置项注解定义

```java
public @interface Power {
    boolean add() default true; // 数据新增功能

    boolean delete() default true; // 数据删除功能

    boolean edit() default true; // 数据修改功能

    boolean query() default true; // 输入查询功能

    boolean viewDetails() default true; // 数据查看功能

    boolean export() default false; // 数据导出功能

    boolean importable() default false; // 数据导入功能

    // 实现此接口动态控制权限
    Class<? extends PowerHandler> powerHandler() default PowerHandler.class;
}
```

```java
public interface PowerHandler {

    /**
     * 动态控制各功能使用权限
     * @param power 增删改查等功能的简单 pojo 对象
     */
    void handler(PowerObject power);

}
```

<!-- TODO: 添加截图 -->

## 注意事项

用户访问时同时检查**菜单权限**与注解值，开启 power 后，如果不显示，需要检查菜单权限是否完整，如果缺少菜单权限需手动添加。
