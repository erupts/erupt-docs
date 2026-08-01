# Cube 语法（ML）

Cube ML 是 EruptCube 内置的模板表达式语言，基于 **Velocity** 语法，可在任意 SQL 注解中动态生成查询逻辑，适用于：

`dimension.sql()` · `measure.sql()` · `EruptCube.sql()` · `explore.where()` 等

## 可用变量

| 关键字 | 说明 | 示例 |
| --- | --- | --- |
| `query` | 请求上下文，可获取请求维度、模型名称、parameter 等字段 | `${query.limit}`<br/>`${query.dimensions}` |
| `filter` | 获取当前过滤器数据 | `${filter["userName"]}` |
| `parameter` | 获取模型动态参数 | `${parameter["xxx"]}` |
| `this` | 当前对象引用，用于获取同类中其他注解的配置，实现派生与复用 | `${this.ip.sql()}` |
| `user` | 当前登录的用户上下文信息。<br/>结构示例：<br/>`{`<br/>`uid:"[用户id]",`<br/>`account:"[登录用户名]",`<br/>`name:"[用户姓名]"`<br/>`}` | `${user.name}` |
| `tenantId` | 多租户场景中使用，为当前租户 ID | `${tenantId}` |
| UDF | 通过注册全局函数扩展模板能力，见下方 [UDF](#udf-自定义函数) | `${cube.add(1, 1)}` |

## 条件分支

```velocity
#if(${query.parameter["role"]} == "admin")
    -- 管理员：查全量数据
    1 = 1
#elseif(${query.parameter["role"]} == "manager")
    -- 管理员：按部门过滤
    dept_id = ${filter["deptId"]}
#else
    -- 普通用户：按本人过滤
    user_id = '${query.parameter["userId"]}'
#end
```

语法说明：`#if` / `#elseif` / `#else` / `#end`，条件表达式支持 `==`、`!=`、`&&`、`||`。

## 循环

```velocity
#foreach($item in ${query.parameter["ids"]})
    #if($foreach.index > 0) OR #end
    id = '${item}'
#end
```

生成结果示例（ids = ["001", "002", "003"]）：

```sql
id = '001' OR id = '002' OR id = '003'
```

常用内置变量：

| 变量 | 说明 |
| --- | --- |
| `$foreach.index` | 当前索引，从 `0` 开始 |
| `$foreach.count` | 当前计数，从 `1` 开始 |
| `$foreach.hasNext` | 是否还有下一个元素 |
| `$foreach.last` | 是否为最后一个元素 |

## 组合示例

动态拼接 `IN` 子句，同时根据角色决定是否限定数据范围：

```velocity
#if(${query.parameter["role"]} != "admin")
    AND user_id = '${query.parameter["userId"]}'
#end
#if(${query.parameter["ids"]} && !${query.parameter["ids"]}.isEmpty())
    AND order_id IN (
        #foreach($id in ${query.parameter["ids"]})
            '${id}'#if($foreach.hasNext),#end
        #end
    )
#end
```

## UDF（自定义函数）

通过 `@CubeFunction` 注册全局函数，扩展语义模型的能力，增强 SQL 动态化。

```java
@Component
@CubeFunction(space = "cube")
public class CubeDefaultFunction {

    public int add(int a, int b) {
        return a + b;
    }

}
```

调用：

```java
// 定义完成后，可以在维度和指标或 SQL 中调用此函数
@Measure(title = "Max", sql = "concat(max(ip) ,' - ', ${cube.add(100,200)})")
private String max;

// ---> 127.0.0.0 - 300
```

## 数据代理（CubeProxy）

通过实现 `CubeProxy` 接口，可在查询前后插入自定义逻辑（行级权限、租户隔离、结果加工等）。

```java
public class MyAnalysisCubeProxy implements CubeProxy {

    /**
     * 查询前：动态修改查询表达式
     * @param expr    当前查询表达式
     * @param context 请求上下文（包含用户信息等）
     */
    @Override
    public String beforeQuery(String expr, Map<String, Object> context) {
        // 例：根据当前用户自动追加数据权限过滤
        return expr;
    }

    /**
     * 查询后：对结果集进行后处理
     * @param result  查询结果行列表
     * @param context 请求上下文
     */
    @Override
    public void afterQuery(List<CubeResultRow> result, Map<String, Object> context) {
        // 例：计算环比/同比、补充衍生字段
    }
}
```

注册代理：

```java
@EruptCube(
    name      = "销售分析",
    sql       = "sales_order",
    sqlType   = SqlType.TABLE_NAME,
    dataProxy = { MyAnalysisCubeProxy.class }
)
public class SalesCube { ... }
```
