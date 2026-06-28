# @EruptScan

标注在 Spring Boot **入口类**上，触发 Erupt 框架的包扫描与初始化。每个 Erupt 项目必须声明此注解，缺少时框架不会启动。

## 基础用法

不传任何参数时，扫描**入口类所在的包及其所有子包**：

```java
@SpringBootApplication
@EruptScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

## 指定扫描包

Erupt 实体类分散在多个包时，通过 `value` 显式声明：

```java
@SpringBootApplication
@EruptScan({"com.example.model", "com.example.system"})
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

## 属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `value` | `String[]` | `{}` | 要扫描的包名列表。为空时扫描入口类所在的包 |

## 注意事项

:::warning spring-boot-devtools 不兼容
`spring-boot-devtools` 与 Erupt 存在类加载器冲突，会导致启动异常。项目中请勿添加此依赖。
:::

现有项目集成时，通常还需要配合 `@EntityScan` 指定 JPA 实体扫描路径：

```java
@SpringBootApplication
@EntityScan("com.example.model")
@EruptScan("com.example.model")
public class DemoApplication { ... }
```
