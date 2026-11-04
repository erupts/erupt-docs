# Role Management

A role bundles a set of menus into a job duty. A user may hold several roles and the permissions are merged as a union. A role may be assigned to any number of users.

## Fields

| Field | Description |
| --- | --- |
| Code | Unique key, fixed after creation, handy for referencing in code |
| Name | Display name |
| Status | Disabling a role revokes its menus for every holder at once, with no unbinding |
| Menu Permission | Tree selection. Under a table menu you can keep ticking its add / edit / delete / export **function buttons** for button-level control |
| Contain User | Reverse view of who holds the role |

## Button-Level Permissions

Under every Erupt class menu, Menu Management generates function button child menus. If a role ticks "Orders" but not its "Delete" child, the user sees no delete button and a direct API call is rejected with 403. Frontend and backend check the same menu values, so there is no gap where a button is hidden but the API still works.

## Strict Role-Menu Policy

[`erupt.upms.strict-role-menu-legal`](/en/guide/configuration) is on by default. When a non-admin assigns menus here, the candidate tree holds **only menus that user already has** (the union of their enabled roles). Nobody can grant a permission they lack, which closes the "create a role to promote myself" path. Super admins are unrestricted.

:::warning
Menus a role holds beyond the operator's reach are not rendered in the tree and are removed when that operator saves. Keep cross-scope roles with a super admin, or disable the policy.
:::

## Recommendations

- Build roles around **duties**, not people: "Order Review", "Finance Read-only", not "for Alice".
- A read-only role ticks table menus and no function buttons.
- The Role Management menu is itself a permission. Do not give it to ordinary roles.

erupt-ai reuses these roles for tool authorization, see [Authorize Tools by Role](/en/modules/erupt-ai/tool-auth).
