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
| `print` | boolean | true | 是否允许打印行数据（1.14.1+） |
| `copy` | boolean | true | 是否允许一键复制行数据（2.0.0+） |
| `ai` | boolean | true | AI 工具是否可以检视和操作该模型（2.1.0+） |
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

    boolean print() default true; // 数据打印功能（1.14.1+）

    boolean copy() default true; // 一键复制行数据（2.0.0+）

    // AI 工具是否可以检视和操作该模型（2.1.0+）
    boolean ai() default true;

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

## print 打印权限 <Badge type="tip" text="v1.14.1+" />

`print` 控制表格行的**打印**入口是否可用，默认开启。若模型不需要打印能力，可显式关闭：

```java
@Erupt(name = "示例", power = @Power(print = false))
```

## ai AI 访问开关 <Badge type="tip" text="v2.1.0+" />

`ai` 控制 **AI 工具能否检视和操作该 erupt 模型**，默认 `true`。

:::warning 这是角色授权之上的一道硬闸
`ai` 是**模型级**开关，优先级高于任何角色/菜单授权：一旦在 `@Erupt` 上设置 `ai = false`，无论某个角色被授予了多少 AI Tool 权限、无论当前用户是否为超级管理员，AI 都无法通过工具读取或修改该模型的数据。
:::

它的生效点在 `erupt-ai-claw` 的 Erupt 模型工具集中：

- **模型列表**：`eruptModelList` 会直接跳过 `power().ai() == false` 的模型，AI 甚至「看不见」它的存在
- **单模型访问**：`eruptSchema` / `eruptDataQuery` / `findEruptDataByPk` / `insertEruptData` / `updateEruptData` / `deleteEruptData` 在执行前统一走同一个前置校验，命中 `ai = false` 时直接抛出 `AI access is disabled for this Erupt model: xxx`，且该判断发生在超级管理员放行分支**之前**

```java
// 敏感模型：允许人在后台操作，但禁止 AI 触碰
@Erupt(
    name = "用户账号",
    power = @Power(ai = false)
)
public class SensitiveModel extends BaseModel {

}
```

对于需要 AI 可访问的模型，除了保持 `ai = true`，仍需满足常规权限链路：当前用户拥有该模型的菜单权限，且 `@Power` 中对应的 `query` / `add` / `edit` / `delete` 已开启。

:::tip
`erupt-cloud` 远程节点上的 erupt 没有本地注解，`ai` 开关对其不生效，权限判定由所属节点自行完成。
:::

## 注意事项

用户访问时同时检查**菜单权限**与注解值，开启 power 后，如果不显示，需要检查菜单权限是否完整，如果缺少菜单权限需手动添加。
