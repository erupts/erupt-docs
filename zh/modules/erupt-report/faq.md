# 常见问题

## 函数管理使用 ES6 语法

所有 JDK 版本下 Nashorn 默认均为 ECMAScript 5.1，使用 ES6 语法需添加如下 JVM 参数（模块内置独立版 nashorn-core，ES6 支持比 JDK 1.8 内置版更完整）：

```bash
-Dnashorn.args=--language=es6
```

开启后支持：`let`、`const` 与块级作用域；迭代器与 `for..of` 循环；`Map`、`Set`、`WeakMap`、`WeakSet` 数据类型；Symbol；二进制与八进制字面量

## 时间区间设置默认值

查询维度的默认值为 JS 表达式，可直接调用 Java API：

```java
java.util.Arrays.asList('2021-01-01','2021-11-01')
```

![](/report/faq-date-range.png)
