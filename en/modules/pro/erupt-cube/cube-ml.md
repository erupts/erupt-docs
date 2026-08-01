# Cube ML Syntax

Cube ML is the template expression language built into EruptCube, based on **Velocity** syntax. It dynamically generates query logic inside any SQL annotation, applicable to:

`dimension.sql()` · `measure.sql()` · `EruptCube.sql()` · `explore.where()` etc.

## Available Variables

| Keyword | Description | Example |
| --- | --- | --- |
| `query` | Request context: requested dimensions, model name, parameters, etc. | `${query.limit}`<br/>`${query.dimensions}` |
| `filter` | Current filter values | `${filter["userName"]}` |
| `parameter` | Dynamic model parameters | `${parameter["xxx"]}` |
| `this` | Reference to the current class; reads other annotations on the same class for derivation and reuse | `${this.ip.sql()}` |
| `user` | Context of the currently logged-in user.<br/>Structure:<br/>`{`<br/>`uid:"[user id]",`<br/>`account:"[login name]",`<br/>`name:"[display name]"`<br/>`}` | `${user.name}` |
| `tenantId` | Current tenant ID in multi-tenant setups | `${tenantId}` |
| UDF | Extend the template with registered global functions, see [UDF](#udf-user-defined-functions) below | `${cube.add(1, 1)}` |

## Conditionals

```velocity
#if(${query.parameter["role"]} == "admin")
    -- admin: query everything
    1 = 1
#elseif(${query.parameter["role"]} == "manager")
    -- manager: filter by department
    dept_id = ${filter["deptId"]}
#else
    -- regular user: filter by self
    user_id = '${query.parameter["userId"]}'
#end
```

Syntax: `#if` / `#elseif` / `#else` / `#end`; conditions support `==`, `!=`, `&&`, `||`.

## Loops

```velocity
#foreach($item in ${query.parameter["ids"]})
    #if($foreach.index > 0) OR #end
    id = '${item}'
#end
```

Generated output (ids = ["001", "002", "003"]):

```sql
id = '001' OR id = '002' OR id = '003'
```

Built-in loop variables:

| Variable | Description |
| --- | --- |
| `$foreach.index` | Current index, starts at `0` |
| `$foreach.count` | Current count, starts at `1` |
| `$foreach.hasNext` | Whether there is a next element |
| `$foreach.last` | Whether this is the last element |

## Combined Example

Dynamically build an `IN` clause while restricting data scope by role:

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

## UDF (User-Defined Functions)

Register global functions with `@CubeFunction` to extend the semantic model and make SQL more dynamic.

```java
@Component
@CubeFunction(space = "cube")
public class CubeDefaultFunction {

    public int add(int a, int b) {
        return a + b;
    }

}
```

Usage:

```java
// once defined, the function can be called from dimensions, measures, or any SQL
@Measure(title = "Max", sql = "concat(max(ip) ,' - ', ${cube.add(100,200)})")
private String max;

// ---> 127.0.0.0 - 300
```

## Data Proxy (CubeProxy)

Implement the `CubeProxy` interface to inject custom logic before and after each query (row-level security, tenant isolation, result post-processing, ...).

```java
public class MyAnalysisCubeProxy implements CubeProxy {

    /**
     * Before query: rewrite the query expression dynamically
     * @param expr    current query expression
     * @param context request context (includes user info)
     */
    @Override
    public String beforeQuery(String expr, Map<String, Object> context) {
        // e.g. append data-permission filters based on the current user
        return expr;
    }

    /**
     * After query: post-process the result set
     * @param result  result rows
     * @param context request context
     */
    @Override
    public void afterQuery(List<CubeResultRow> result, Map<String, Object> context) {
        // e.g. compute period-over-period metrics, add derived fields
    }
}
```

Register the proxy:

```java
@EruptCube(
    name      = "Sales Analysis",
    sql       = "sales_order",
    sqlType   = SqlType.TABLE_NAME,
    dataProxy = { MyAnalysisCubeProxy.class }
)
public class SalesCube { ... }
```
