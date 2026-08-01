# Function Management

Functions are written in JS (ECMAScript 5.1 by default, powered by Nashorn). Call them inside report SQL via `${xxx}` to mix SQL and JS — a key building block for dynamic SQL. Functions such as `and`, `like`, `In`, and `range` are provided by default, and you can freely add your own for real business needs.

Saved functions take effect immediately (the internal cache refreshes about every 1.5 seconds).

![](/chart/function-list.png)

![](/chart/function-edit.png)

## Default Functions

```javascript
/**
 * Result preview: and field = :code
 * @param field  field name
 * @param code   dimension code
 * @returns {string}
 */
function and(field, code) {
    return eval(code) && ' and ' + field + '=:' + code
}

/**
 * Result preview: and field like '%xxx%'
 * @param field  field name
 * @param code   dimension code
 * @returns {string}
 */
function like(field, code) {
    return eval(code) && ' and ' + field + " like '%" + eval(code) + "%'"
}

/**
 * Result preview: and field in (:code)
 * @param field  field name
 * @param code   dimension code
 * @returns {string}
 */
function In(field, code) {
    var val = eval(code);
    return val && val.length > 0 && ' and ' + field + ' in (:' + code + ')' || null;
}

/**
 * Range query; open-ended bounds are supported
 * Result preview: and field between 'a' and 'b'
 * @param field  field name
 * @param code   dimension code
 * @returns {string}
 */
function range(field, code) {
    var val = eval(code);
    if (val && val.length) {
        if (!val[0] && val[0] !== 0) {
            return " and " + field + " <= '" + val[1] + "'"
        } else if (!val[1] && val[1] !== 0) {
            return " and " + field + " >= '" + val[0] + "'"
        }
        return " and " + field + " between '" + val[0] + "' and " + "'" + val[1] + "'"
    }
}
```

## Usage Example

```sql
select * from xxx where 1=1 ${and('field_name','dimension_code')}

select '${1+1}'
```

Expressions inside `${}` are evaluated by the JS engine and the results are substituted back into the SQL. Query dimension values are also bound to JDBC as named parameters (`:dimension_code`), which prevents SQL injection.
