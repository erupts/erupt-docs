# Search @Search

The `@Search` annotation configures whether a field appears in the search bar at the top of the list page, and how the search is matched.

## Usage

```java
@EruptField(
    views = @View(title = "Name"),
    edit = @Edit(title = "Name", search = @Search(vague = true))
)
private String name;
```

## Configuration

```java
public @interface Search {

    boolean value() default true; // whether search is enabled

    boolean vague() default false; // advanced search (each component has its own advanced query strategy, e.g. range, fuzzy match)

    boolean notNull() default false; // whether this is a required search field

}
```
