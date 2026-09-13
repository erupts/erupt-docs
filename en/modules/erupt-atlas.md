# Erupt Atlas

erupt-atlas draws every `@Erupt` model in the live registry and the relations between them: what references what, how tightly modules are coupled, and what a change to one model would reach.

> Minimum version: **2.2.0**

Nothing is configured and nothing is persisted — every call rebuilds from `EruptCoreService`, so models registered at runtime (erupt-designer publications, erupt-flow forms) show up without a restart.

## Setup

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-atlas</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

The module depends on `erupt-upms`, `erupt-tpl` and `erupt-data-jpa` (all `provided`, already present in a normal project). Auto configuration adds a **Model Atlas** root menu (icon `fa fa-diagram-project`) with two entries: **Model Graph** and **Erupt Class Registry**.

## Screenshots

**Overview** — every model laid out by module, with "models · cubes · relations · modules" counted along the top. Select a model and the bottom panel lists what references it and what it references under `RELATIONS` / `FIELDS` / `CONFIG`.

![Model Atlas overview](/erupt-atlas/model-atlas-overview.jpg)

**Layers** — a dependency-depth report: which foundation models the whole system stands on, and which chains the depth actually comes from.

![Model Atlas layers](/erupt-atlas/model-atlas-layers.jpg)

## Seven views

| View | What it shows |
| --- | --- |
| Lineage | Pick a model and walk 1–5 hops in and out: what references it, and what it references |
| Layers | A dependency-depth report: levels deep, models levelled, foundation models, longest chain. L0…Ln expand level by level, the foundation list is ranked by how many models stand on each one, and clicking any model jumps to its lineage |
| Overview | Every model grouped by module, the whole structure at a glance |
| Matrix | Module-to-module coupling heat map; the diagonal is intra-module coupling, the rest cross-module |
| Power | `@Power` declarations reconciled against the function buttons the menu tree actually carries — see below |
| Impact | The models a change to the selected one would reach, listed by distance |
| Audit | What the graph knows but a picture does not say out loud — see below |

### Domain focus

A domain (module) bar across the top scopes the view: narrow it to a single module or keep `All` for the whole system. Models with no structural relation at all are called out separately and left out of the levelling. On a system with many models across many modules, this is the switch that makes the board readable again.

### Power reconciliation

The `Power` view puts each model's **declared** permissions next to the **function buttons on its menu**, which is how you catch "the annotation allows it but no button was configured" and the reverse:

| Column | Meaning |
| --- | --- |
| Model / Module | The model name and the module it belongs to |
| Menu type | Its type in the menu tree (empty when it has no menu) |
| Powers on | The `@Power` flags that are true: add, edit, delete, query, detail, export, import, print, copy, cellEdit, ai |
| Menu buttons | The function-permission buttons that actually exist in the menu tree |
| powerHandler | The class name of a dynamic permission handler, when one is configured |

:::info The button side needs erupt-data-jpa
Buttons are read from the menu table. Without `erupt-data-jpa` there is no menu table to read, so that column comes back empty while the declaration side still renders.
:::

## Structural audit

The `Audit` view collects four kinds of structural finding:

| Check | Meaning |
| --- | --- |
| Cycles | Reference loops between models — usually a sign that a dependency should be split or inverted |
| Shared tables | Several `@Erupt` models mapped onto the same physical table |
| Orphans | Models nothing references, and that reference nothing |
| Unpublished | Registered models that are not attached to any menu |

## What the graph contains

| Node kind | Source |
| --- | --- |
| `erupt` | A model annotated with `@Erupt` |
| `cube` | An `@EruptCube` semantic model (requires [erupt-cube](/en/modules/pro/erupt-cube/)) |
| `remote` | A model served by an [erupt-cloud](/en/modules/erupt-cloud) node |

Edge kinds cover `reference` (reference field), `tab` (sub-table), `embed`, `drill`, `operation` (row operation), `cubeOf`, `join` and `table` (shared table).

## Class registry <Badge type="tip" text="v2.2.0, moved from erupt-monitor" />

The graph is for relations, the registry for lookup: **Erupt Class Registry** is a table view over the same live registry, listing every `@Erupt` model loaded in the current process. Rows come straight from `EruptCoreService`, nothing is persisted, and runtime models published by erupt-designer or served by erupt-cloud nodes are listed too.

<img src="/monitor/erupt-register.png" width="900">

**Columns**:

| Column | Description |
| --- | --- |
| Source | The module / jar the model belongs to, filterable |
| Class Name / Display Name | The model class name and its `@Erupt(name)`, with fuzzy search |
| Multi-language | Whether the model is annotated with `@EruptI18n` |
| Field Count | Number of `@EruptField` fields in the model |
| Data Processor | The data-source processor used (JPA, MongoDB, JDBC, etc.) |
| Runtime Registered | Whether the model was registered dynamically at runtime |
| Published | Whether the model has been published as a menu |

**Row actions**:

- **Open in Atlas**: jumps to the model graph with this model selected; every row of the field drill carries the same action
- **Fields (drill)**: every `@EruptField` of the model — name, title, type, edit component, required / searchable
- **Publish to Menu**: publish an unpublished model as a TABLE menu, generating the full set of function-permission buttons and refreshing the menu cache
- **Model JSON**: the detail view shows the complete JSON resolved from the class-level annotations

:::tip Upgrading from 2.1.x
The registry used to sit under erupt-monitor's **System Monitoring** menu. Existing menu rows are not moved automatically — see the [upgrade guide](/en/guide/upgrade#_4-the-erupt-class-registry-moves-from-erupt-monitor-to-erupt-atlas).
:::

## APIs and permission

| Endpoint | Purpose |
| --- | --- |
| `GET /erupt-api/erupt-atlas/view` | The graph snapshot: nodes, edges and audit findings |
| `GET /erupt-api/erupt-atlas/power` | The power reconciliation rows |
| `GET /erupt-api/erupt-atlas/detail/{erupt}` | Field detail for one model, fetched when it is opened |

All of them are guarded by `@EruptMenuAuth("erupt-atlas.html")`; grant the **Model Graph** menu to a role to control who may open it. The class registry is an ordinary `@Erupt` table menu and is granted like any other.

The graph page accepts `?erupt=<model name>` to open on a given model; the registry's **Open in Atlas** action uses exactly that.

Model names and page text follow the console's current language: models annotated with `@EruptI18n` go through `I18nTranslate`, the rest keep their annotation text as written.

:::tip
Field lists load on demand rather than riding along with the graph — for the whole registry they would dwarf it.
:::
