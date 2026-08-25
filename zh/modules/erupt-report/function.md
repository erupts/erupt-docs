# 函数管理

语法为 JS（默认 ECMAScript 5.1 标准，引擎为 Nashorn），可以在报表 SQL 中通过 `${xxx}` 的方式调用 JS 函数，实现 SQL 与 JS 混编的能力，是动态 SQL 的重要组成部分。默认提供 `and`、`like`、`In`、`range` 等函数，也可以根据实际业务自由添加函数。

函数保存后即刻生效（内部缓存约 1.5 秒自动刷新）。

![](/report/function-list.png)

![](/report/function-edit.png)

## 默认函数

```javascript
/**
 * 结果预览：and field = :code
 * @param field  字段名
 * @param code   维度编码
 * @returns {string}
 */
function and(field, code) {
    return eval(code) && ' and ' + field + '=:' + code
}

/**
 * 结果预览：and field like '%xxx%'
 * @param field  字段名
 * @param code   维度编码
 * @returns {string}
 */
function like(field, code) {
    return eval(code) && ' and ' + field + " like '%" + eval(code) + "%'"
}

/**
 * 结果预览：and field in (:code)
 * @param field  字段名
 * @param code   维度编码
 * @returns {string}
 */
function In(field, code) {
    var val = eval(code);
    return val && val.length > 0 && ' and ' + field + ' in (:' + code + ')' || null;
}

/**
 * 区间查询，支持只填写单边区间
 * 结果预览：and field between 'a' and 'b'
 * @param field  字段名
 * @param code   维度编码
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

## 使用示例

```sql
select * from xxx where 1=1 ${and('字段名','维度编码')}

select '${1+1}'
```

`${}` 内的表达式由 JS 引擎求值，求值结果替换回 SQL；查询维度的值同时以命名参数（`:维度编码`）的方式安全绑定到 JDBC，避免 SQL 注入。
