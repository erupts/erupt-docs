# Erupt Generator Code Generation

erupt-generator reads the schema of any datasource the application has registered and turns a table into an entity annotated with `@Erupt` / `@EruptField`. When an existing database has to be brought under Erupt this is the fast path: import → correct → download → drop into the project.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-generator</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

After a successful import, restart the application to see the **Code Generation** menu entries.

## Menu Entry

<img src="/generator/menu.png" width="300">

## Import from Database <Badge type="tip" text="v2.3.0+" />

The **Import from Database** button above the list opens the import dialog. Its first three fields are chained: each one reloads the next once a value is picked.

![Import from Database dialog](/generator/db-import.png)

| Option | Description |
| --- | --- |
| Datasource | Every datasource registered in the application context, not only the primary one |
| Database | The database (schema) inside the chosen datasource |
| Tables | Transfer multi-select; several tables can be imported at once |
| Package | Written as the `package` statement of every generated class; guessed from where the application's models already live |
| Ignore Columns | Columns the entity should not carry. The dropdown reads the columns of the tables picked so far, the ones several tables share leading the way; a pattern such as `tenant_*` can also be typed by hand |
| Parent Class | Decides which columns are inherited instead of declared: `BaseModel` inherits only `id`; the `MetaModel` / `HyperModel` families inherit the audit columns (creator, create time, ...), and their `Vo` variants also show them in the UI; `None` inherits nothing |
| Overwrite Existing | Whether a definition previously imported from the same table is replaced |

Every imported table becomes a row in the list, with its fields under the **Field Management** tab, so the guesses can be corrected before the code is downloaded.

## Metadata Mapping

The import translates JDBC metadata into annotations as follows:

| Source | Becomes |
| --- | --- |
| table name | entity class name, the erupt `e_` prefix dropped (`e_order` → `Order`) |
| table / column comment | `@Erupt(name)`, `@View(title)`, `@Edit(title)` |
| jdbc type + size | `EditType` and java type (`bigint` → `Long`, `decimal(12,2)` → `BigDecimal`) |
| column name | `PASSWORD`, `IMAGE`, `ATTACHMENT`, `ICON`, `COLOR` when the name says so |
| comment of a code column | `EditType.CHOICE` with the `@VL` pairs the comment documents (`0-disabled 1-enabled`) |
| `not null` | `@Edit(notNull = true)` |
| single column unique index | `@Column(unique = true)` |
| foreign key | `@ManyToOne` + `REFERENCE_TABLE`, labelled by a column the referenced table really has |
| primary key | inherited from the parent model when it is named `id`, otherwise `@Id` + `primaryKeyCol` |

:::warning Comments on MySQL / MariaDB
Comments are read from the JDBC `REMARKS` column. On MySQL / MariaDB they only live in `information_schema`, so add `useInformationSchema=true` to the connection URL; otherwise the imported entities have no titles and must be filled in by hand.
:::

## Preview and Download

- **Preview** (single-row operation): opens the generated class in the admin's own code editor drawer, with copy, download and fullscreen.
- **Download** (multi-select operation): one selected row downloads a single `.java` file; several rows are packed into a zip whose entries carry their package path, so the archive unzips straight over a source tree.

Place the files under the matching package in your project, restart, and add the class as a menu entry in Menu Management.

:::tip
The generated code uses standard Erupt annotations, so complex business logic can be added on top of it. Since 2.3.0 the generator no longer depends on freemarker or erupt-tpl.
:::

## Manual Modeling

Import is not the only entry point. Every row in the list can still be edited by hand, which is how imported guesses get corrected:

- Class level: name, entity class, table name, parent class, package, intro.
- Field level: field name, column name (leave empty when it matches the field name), display name, display order, edit type, Java type (overrides the type inferred from the edit type, e.g. `Long` / `BigDecimal`), length, related entity, primary key / auto increment (only used when the entity has no parent class), query item, field sort, required, visible.
- **Component Config**: when filled in, replaces the component configuration the edit type would generate, e.g. `choiceType = @ChoiceType(...)`.

:::info Changes from earlier versions
2.3.0 rewrote the generator: the per-field "unique" switch and the list's print button were removed. Unique constraints are now inferred from single-column unique indexes during import.
:::

## Limitations

- A table needs exactly one primary key column; a composite or missing key is rejected.
- Enum values guessed from a comment follow the `0-disabled 1-enabled` shape; anything more exotic stays a plain number.
- A class name already taken by a registered erupt model is only flagged as a `//FIXME` comment in the generated code, nothing stops the import.

## EZDML Assisted Modeling

Before 2.3.0 the generator could not read a database, so generating code from a schema usually went through the EZDML modeling tool. **Import from Database** now covers that case; if your team still maintains models in EZDML, see [EZDML Code Generation](/en/modules/third-party/ezdml).
