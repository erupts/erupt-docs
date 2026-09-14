# Organizations & Posts

Organizations and posts do not decide which menus a user can open. They decide **whose data a user can see inside those menus**. They are the foundation of Erupt's data permissions.

## Organization Management

Maintains a tree of companies / departments / teams at any depth. Navigation expands five levels by default.

| Field | Description |
| --- | --- |
| Org Code | Unique key |
| Org Name | Display name |
| Parent Org | Empty means top level |
| Display Order | Sort among siblings |

The left panel of [User Management](/en/modules/erupt-upms/user) is this tree. Selecting a node filters its users.

## Post Management

A post describes a user's rank inside the organization.

| Field | Description |
| --- | --- |
| Post Code | Unique key |
| Post Name | Display name |
| Post Weight | Higher means more senior. Used for "seniors see juniors' data" comparisons |

A user must have an organization before a post can be set.

## Data Visibility

Extend one of these base classes and Erupt appends a filter to every query, and fills in creator, create time, updater and update time on add / edit. Super admins are never filtered.

| Base class | Non-admins see |
| --- | --- |
| `LookerSelf` | Rows they created |
| `LookerOrg` | Rows whose creator is in the **same organization** |
| `LookerPostLevel` | Rows they created, or rows from the same organization whose creator has a **lower post weight** |

```java
@Erupt(name = "Customer")
@Entity
@Table(name = "biz_customer")
public class Customer extends LookerOrg {
    // only business fields here; creator / org / timestamps come from the base class
}
```

- `LookerOrg` requires the current user to have an organization, `LookerPostLevel` requires both organization and post. Otherwise the query fails with a clear message.
- The filter is injected through `@PreDataProxy` and stacks with your own `DataProxy`, see [PreDataProxy](/en/advanced/pre-data-proxy).
- The creator appears in the table automatically as name / org / post columns with no extra declaration.

## Responsible and Supervising Orgs

Users also carry two multi-select fields, **Responsible Org** and **Supervising Org**. They do not take part in the query filters above. They serve approval scenarios: when [erupt-flow](/en/modules/pro/erupt-flow/) resolves a "department head" or "supervising leader" node, it walks up the initiator's org tree and picks the users responsible for, or supervising, that organization.
