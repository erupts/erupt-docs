# FAQ

## Using ES6 syntax in Function Management

Nashorn defaults to ECMAScript 5.1 on every JDK version. To use ES6 syntax, add the following JVM flag (the module bundles the standalone nashorn-core, whose ES6 support is more complete than the JDK 1.8 built-in):

```bash
-Dnashorn.args=--language=es6
```

This enables: `let`, `const`, and block scope; iterators and `for..of` loops; `Map`, `Set`, `WeakMap`, and `WeakSet` data types; symbols; and binary and octal literals.

## Default value for a date range

Query dimension default values are JS expressions and can call Java APIs directly:

```java
java.util.Arrays.asList('2021-01-01','2021-11-01')
```

![](/chart/faq-date-range.png)
