# 扩展 Erupt 注解配置

将 `@Erupt` 注解外的其他注解信息传递给前端，适用场景：

1. 对 erupt-web 前端源码有动态调整需求的系统
2. 独立对接 `/build/{erupt}` 接口需要获取结构后自助渲染的场景

## 使用注解动态扩展

```java
@Retention(RetentionPolicy.RUNTIME)
@Target({ElementType.TYPE})
@Documented
@EruptTag
public @interface EruptFlow {

}
```

```java
@EruptFlow
@Erupt(name = "学生管理")
@Table(name = "demo_student")
@Entity
@Getter
public class Student extends BaseModel {

    @EruptField(
        views = @View(title = "姓名"),
        edit = @Edit(title = "姓名", notNull = true)
    )
    private String name;
}
```

前端可通过 `tags` 配置接收。

## 使用注解手动扩展

```java
@Erupt(
    name = "学生管理",
    param = {
        @KV(key = "key", value = "value")
    },
    // 将 Table 注解的信息传递给前端
    extra = {
        Table.class
    }
)
@Table(name = "demo_student")
public class Student extends BaseModel {

}
```

请求 build 接口获取 erupt 类结构，可看到 `@Table(name = "demo_student")` 的信息已完整传递给前端。

## 使用 KV 方式扩展

无需自定义注解，使用 Param 方式传递 kv 结构：

```java
@Erupt(
    name = "学生管理",
    param = {
        @KV(key = "key", value = "value", desc = "")
    }
)
@Table(name = "demo_student")
public class Student extends BaseModel {

}
```
