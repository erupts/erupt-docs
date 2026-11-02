# @EruptScope Global Context <Badge type="tip" text="v2.4.0+" />

`@EruptScope` places a model inside a **scope**: a global context the user picks once in the page header (a cluster, a project, a company...) that every model declaring it then follows. Lists show only the data inside that scope, and new records land in it.

The scope itself is a plain `@Erupt` form class. Each of its fields is one condition, so options, cascades, defaults and validation all come from the ordinary form annotations; there is no new DSL to learn.

## When to Use It

- **Multi-cluster / multi-environment operations**: pick a cluster in the header and the Pod, Deployment and Service models show only that cluster's resources
- **Multi-project collaboration**: pick a project and tasks, requirements, documents and members all live under it
- **Group companies**: pick a company and orders, customers and invoices are kept apart per company
- Any flow of "choose a context first, then work inside it"

Compared with [@Filter](/en/annotation/filter): `@Filter` is a condition fixed on the model that the user neither sees nor changes; `@EruptScope` is a context the user **chooses**, and it applies to queries, details, edits, deletes, row operations and adds alike.

## Declaring a Scope

A scope is just a form class. Here is a "Project" scope with one required choice and one free-text field:

```java
@Getter
@Setter
// A form, not a table: its first field doubles as the key @Erupt requires
@Erupt(name = "Project", primaryKeyCol = "project")
public class ProjectScope {

    @EruptField(edit = @Edit(title = "Project", type = EditType.CHOICE, notNull = true,
            choiceType = @ChoiceType(vl = {@VL(value = "alpha", label = "Alpha"), @VL(value = "beta", label = "Beta")})))
    private String project;

    // free text: no options to check, taken as typed
    @EruptField(edit = @Edit(title = "Tag"))
    private String tag;

}
```

Rules for a scope class:

- It must be an `@Erupt` class with a no-arg constructor; `primaryKeyCol` may point at any field, nothing is ever persisted
- Every field with an `edit.title` takes part; `CHOICE` / `MULTI_CHOICE` values are checked one by one against the options the user is offered, any other type is taken as typed
- Options may come from `@VL`, a `fetchHandler`, a `@ChoiceType(dependField)` cascade or anything else the form supports; `notNull`, `@Dynamic` and `onchange` work as usual
- Defaults come from `DataProxy.addBehavior`: until the user picks, the header holds that value; a required field with no default is never guessed, the user is asked instead

In practice the options are usually filtered per user, which makes the scope a boundary as well. This real example from the erupt-ai-dev module offers the projects the current user is a member of and defaults to the first one:

```java
@Erupt(name = "Current Project", primaryKeyCol = "project", dataProxy = ProjectScopeProxy.class)
@Getter
@Setter
public class DevProjectScope {

    @EruptField(edit = @Edit(title = "Project", notNull = true, type = EditType.CHOICE,
            choiceType = @ChoiceType(fetchHandler = MemberProjectFetch.class)))
    private Long project;

}

@Component
public class ProjectScopeProxy implements DataProxy<DevProjectScope> {

    @Resource
    private DevAccessService devAccessService;

    // Until the user picks, the header holds their first project
    @Override
    public void addBehavior(DevProjectScope scope) {
        List<DevProject> projects = devAccessService.visibleProjects();
        if (!projects.isEmpty()) scope.setProject(projects.get(0).getId());
    }

}
```

### Annotation Attributes

```java
@EruptScope(ProjectScope.class)
@Erupt(name = "Task")
public class Task extends BaseModel { ... }
```

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `value` | Class | - | The scope form class; must be an `@Erupt` class |
| `bind` | boolean | true | Bind by field name: the model's fields that share a name with a scope field are filtered by the picked value in lists, and forced to it on add and edit. Turn off when the data source reads the scope itself through `EruptScopes.get()` |

## Binding Models

Declare `@EruptScope` on a model and every field **sharing a name with a scope field** is bound:

```java
@Getter
@Setter
@Entity
@EruptScope(ProjectScope.class)
@Erupt(name = "Task")
public class ScopedTask extends BaseModel {

    @EruptField(views = @View(title = "Name"), edit = @Edit(title = "Name", notNull = true))
    private String name;

    // same name as ProjectScope.project: bound to the scope
    @EruptField(views = @View(title = "Project"), edit = @Edit(title = "Project", notNull = true, search = @Search))
    private String project;

    // same name as ProjectScope.tag: bound too; left empty in the scope, it does not filter
    @EruptField(views = @View(title = "Tag"), edit = @Edit(title = "Tag"))
    private String tag;

}
```

With `beta` picked in the header:

| Action | Effect |
| --- | --- |
| Table / tree query | `project = 'beta'` is appended; a multi pick becomes `IN` |
| Detail, edit, delete, row operation | Checked by id: a record outside the scope counts as missing, and one id outside the scope fails the whole batch |
| Add, edit | The submitted `project` is overwritten with `beta`, whatever the client sent; under a multi pick the submitted value must be one of the picked ones |
| Add form | `project` is prefilled with `beta`, so the user sees where the record will land |
| Cell edit | A bound field refuses cell editing, so a row can never be moved out of the scope |

### Reference Fields Bind by Id

Bound fields are not limited to simple types. The scope holds an id, the model's `REFERENCE_TABLE` / `REFERENCE_TREE` field holds the referenced row, and when they share a name they bind by id:

```java
// Scope: the options are rows of RefTargetModel, the value is their id
@Erupt(name = "Target", primaryKeyCol = "target")
public class TargetScope {

    @EruptField(edit = @Edit(title = "Target", type = EditType.CHOICE,
            choiceType = @ChoiceType(fetchHandler = TargetScope.Options.class)))
    private Long target;

}

// Model: a reference field with the same name
@EruptScope(TargetScope.class)
@Erupt(name = "Task")
public class TargetScopedTask extends BaseModel {

    @ManyToOne
    @EruptField(views = @View(title = "Target", column = "name"), edit = @Edit(title = "Target", notNull = true,
            type = EditType.REFERENCE_TABLE, referenceTableType = @ReferenceTableType(label = "name")))
    private RefTargetModel target;

}
```

The query condition becomes `target.id = ?`, and on add `target` is filled with `{id: picked value, name: option label}`, so the form shows the referenced object's name right away.

### Reading the Scope in Code

When you handle the scope yourself (a non-JPA data source, or `bind = false`), the verified values of the current request can be read anywhere:

```java
ProjectScope scope = EruptScopes.get(ProjectScope.class);
String project = scope.getProject();
```

A request without a pick gets the defaults; a required field still empty throws instead of letting an unscoped query through.

:::warning Only the scope the requested model declares is read
`EruptScopes.get()` has a value only when the model of the current request declares that scope. Reading it from a model without the scope is the same as the user having picked nothing.
:::

## Page Behaviour

- The **header picker** shows only on the pages (table, tree, form) of models that declare the scope, never elsewhere; a model declaring several scopes gets one picker each
- Clicking the picker opens the scope's form, rendered from the scope class itself; after **Switch**, every open tab of the current window is rebuilt and lists show the new range at once
- While a required scope has no pick, the model page does not open and sends no request: the user is taken to a dedicated page, `/build/scope/:scope`, and returned to the original page after the pick. The address bar keeps the page's URL, so a refresh asks again
- Tables **hide** the search fields the scope binds (the header already decides them) and the columns a single scope value pins (every row would repeat it); columns of a multi pick stay visible
- The last pick is remembered per account in the browser, restored on the next login and checked again; a stale pick whose option is gone is dropped and the defaults apply
- Each browser window holds its own pick, so windows never interfere and a page always agrees with the requests it sends
- Pages opened by URL, such as `@Tpl`, cannot set headers: the scope rides as the `_scope` URL parameter with the same value as the header, so a template can read the current scope from it

## Validation and Security

The client sends the picked values on every request in the `erupt-scope` header, as URL-encoded JSON:

```
erupt-scope: %7B%22ProjectScope%22%3A%7B%22project%22%3A%22beta%22%7D%7D
```

Decoded, that is `{"ProjectScope":{"project":"beta"}}`. On the server:

1. Only the scope declared by **the model of the current request** is read; any other key in the header is ignored
2. `CHOICE` / `MULTI_CHOICE` values are checked on **every request** against the options the current user is offered, the same check an add goes through; other fields have no options and are taken as typed
3. A failed check or malformed JSON counts as no pick, and the defaults apply. A required field left empty this way refuses the request with `erupt.scope.required` ("is not picked: pick it in the page header first")
4. An optional field left empty means "all": no condition is added

The framework caches no options itself: a `fetchHandler` that is costly to ask should cache its own options, since only it knows how long they stay valid.

:::danger A scope is not a permission
A scope only narrows what the model's menu **already shows**; it does not replace permissions. To keep users truly apart (say, a project they are not a member of), filter the scope's options per user, since the check guarantees a user can only pick an option they are offered, or use [@Filter](/en/annotation/filter) / data permissions.
:::

Messages involved:

| i18n key | Meaning |
| --- | --- |
| `erupt.scope.required` | A required scope has no pick |
| `erupt.scope.option_invalid` | The picked value is not one of the options |
| `erupt.scope.out_of_scope` | Under a multi pick, the submitted value is not among the picked ones |
| `erupt.scope.not_found` | The scope does not exist or is not accessible to the current user |

## API

Both endpoints only need a login and are provided by erupt-upms.

**`GET /erupt-api/scope`**: the scopes visible to the current user. A scope is visible when at least one model declaring it is on the user's menus:

```json
[
  {
    "name": "ProjectScope",
    "title": "Project",
    "parent": "ScopedTask",
    "models": ["ScopedTask"],
    "fields": ["project", "tag"],
    "defaults": {
      "values": {"project": "alpha"},
      "labels": {"project": "Alpha"}
    }
  }
]
```

| Field | Description |
| --- | --- |
| `name` | Simple class name of the scope, also the key in the header JSON |
| `title` | Header label, the scope class's `@Erupt(name)` |
| `parent` | A model that declares the scope; pass it as `eruptParent` when loading the scope form (`GET /erupt-api/build/{scope}`) |
| `models` | Models on the user's menus that declare the scope; the header shows the picker on their pages only |
| `fields` | The scope's condition fields, in form order |
| `defaults` | The defaults and their labels; `null` when a required field has no default, and the page then asks the user |

**`POST /erupt-api/scope/{scope}`**: checks one pick and returns the values kept with their labels. The check is the same as for an add, plus the option check:

```http
POST /erupt-api/scope/ProjectScope
Content-Type: application/json
token: <login token>

{"project": "beta", "tag": "urgent"}
```

```json
{
  "values": {"project": "beta", "tag": "urgent"},
  "labels": {"project": "Beta", "tag": "urgent"}
}
```

A client of your own serialises `values` as `{"<scope>": values}`, URL-encodes it and sends it in the `erupt-scope` header; every following `/erupt-api` request then runs inside that scope. The endpoint definitions are in the [OpenAPI specification](/en/advanced/rest-api#openapi-specification).
