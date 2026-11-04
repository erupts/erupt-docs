# @EruptScan

Placed on the Spring Boot **application entry class** to trigger Erupt's package scanning and initialization. Every Erupt project must declare this annotation — without it, the framework will not start.

## Basic Usage

With no arguments, Erupt scans the **package of the annotated class and all its sub-packages**:

```java
@SpringBootApplication
@EruptScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

## Specifying Packages

When Erupt entity classes are spread across multiple packages, declare them explicitly via `value`:

```java
@SpringBootApplication
@EruptScan({"com.example.model", "com.example.system"})
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

## Attributes

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | `String[]` | `{}` | Package names to scan. When empty, the entry class's own package is used |

## Notes

:::warning spring-boot-devtools incompatibility
`spring-boot-devtools` conflicts with Erupt's class loader and will cause startup errors. Do not add this dependency to your project.
:::

When integrating into an existing project, pair `@EruptScan` with `@EntityScan` to ensure JPA entity classes are also discovered:

```java
@SpringBootApplication
@EntityScan("com.example.model")
@EruptScan("com.example.model")
public class DemoApplication { ... }
```
