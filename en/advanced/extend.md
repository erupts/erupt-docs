# Extending Erupt Annotations

Pass annotation information beyond `@Erupt` itself to the frontend. This is useful in scenarios such as:

1. Systems that need to dynamically adjust the `erupt-web` frontend source code
2. Scenarios where the `/build/{erupt}` endpoint is called independently to retrieve the structure for custom rendering

## Dynamic Extension via Annotation

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
@Erupt(name = "Student Management")
@Table(name = "demo_student")
@Entity
@Getter
public class Student extends BaseModel {

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name", notNull = true)
    )
    private String name;
}
```

The frontend can receive this via the `tags` configuration.

## Manual Extension via Annotation

```java
@Erupt(
    name = "Student Management",
    param = {
        @KV(key = "key", value = "value")
    },
    // Pass the @Table annotation info to the frontend
    extra = {
        Table.class
    }
)
@Table(name = "demo_student")
public class Student extends BaseModel {

}
```

When you call the build endpoint to retrieve the Erupt class structure, you will see that the `@Table(name = "demo_student")` information has been fully passed to the frontend.

## Extension via KV Parameters

No custom annotation needed — use the `param` attribute to pass key-value pairs:

```java
@Erupt(
    name = "Student Management",
    param = {
        @KV(key = "key", value = "value", desc = "")
    }
)
@Table(name = "demo_student")
public class Student extends BaseModel {

}
```
