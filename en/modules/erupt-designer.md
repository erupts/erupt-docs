# erupt-designer — Visual Form Designer

Visually design Erupt entity models at runtime through a drag-and-drop interface. Published models are immediately registered as admin menu pages — no restart required. Designs can be exported to Java annotation source code for a smooth transition to hand-written development.

> **Supported in 2.0.0+**

## Dependency

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-designer</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

## Workflow

```
Create model entry → Open designer → Drag-drop fields → Preview → Publish → Menu live
```

1. Open the **Form Designer** menu and create a new model record — fill in the Class Name and display Name.
2. Click the **Design** row button to open the visual designer.
3. Drag and drop fields; configure type, title, required, search, and other properties for each field.
4. Click **Preview** to see a live form preview.
5. Click **Publish**, configure the target menu, and publish with one click.
6. No restart needed — the menu is active immediately.

## Database Tables

erupt-designer uses two built-in tables:

| Table | Purpose |
|-------|---------|
| `e_designer` | Stores each model's design configuration as JSON |
| `e_designer_data` | Stores business data rows for each designer model in schema-free JSON format |

If you manage schema manually (`spring.jpa.hibernate.ddl-auto=none`), run:

```sql
CREATE TABLE e_designer (
    id           BIGINT       NOT NULL PRIMARY KEY,
    class_name   VARCHAR(64)  NOT NULL UNIQUE,
    name         VARCHAR(255),
    remark       TEXT,
    config       TEXT,
    publish_time DATETIME,
    update_time  DATETIME,
    create_by    VARCHAR(255),
    create_time  DATETIME,
    update_by    VARCHAR(255)
);

CREATE TABLE e_designer_data (
    id    BIGINT      NOT NULL PRIMARY KEY,
    model VARCHAR(64) NOT NULL,
    data  TEXT
);
CREATE INDEX idx_designer_data_model ON e_designer_data (model);
```

## Exporting Java Code

Click **Export Code** in the designer to generate standard Java annotation code:

```java
@Erupt(name = "My Model")
public class MyModel extends BaseModel {

    @EruptField(
        views = @View(title = "Name"),
        edit  = @Edit(title = "Name", notNull = true)
    )
    private String name;

    // ...
}
```

Drop the generated code into your project source, replacing the designer-managed runtime model — a clean path from drag-and-drop prototyping to production-ready code.

## Publish Mechanics

- On publish, the design config is saved to `e_designer.config` and registered as a runtime `EruptModel` in memory.
- On every application startup, all published designer models are automatically re-registered — no manual action needed.
- If a real `@Erupt` class with the same class name already exists, the designer cannot overwrite it, preventing conflicts.

## Notes

- Designer model data is stored in `e_designer_data` — auto-table creation depends on your `ddl-auto` setting.
- Supported field types include: `INPUT`, `TEXTAREA`, `NUMBER`, `DATE`, `BOOLEAN`, `CHOICE`, `MULTI_CHOICE`, `SLIDER`, `RATE`, `COLOR`, `REFERENCE_TREE`, `REFERENCE_TABLE`, and other common types.
- Reference fields (`REFERENCE_*`) must link to an already-registered Erupt model.
