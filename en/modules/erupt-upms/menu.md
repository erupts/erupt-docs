# Menu Management

A menu is the smallest unit in Erupt's permission system. It is more than the left-hand navigation: an Erupt class, an external link, a custom page, a button and an API are all registered as "menus", then ticked per role in [Role Management](/en/modules/erupt-upms/role).

## Generated Automatically

Each module declares its menus through `initMenus()`, and they are written to the database on first start (controlled by `erupt.init-method-enum`, see [Configuration](/en/guide/configuration)). For table / tree menus Erupt also generates child **function button** menus from `@Erupt(power)`: add, edit, delete, view details, export, import. Whatever buttons a role ticks are the only ones that appear in the UI, and the backend checks the same values.

Your own business models can declare menus in code instead of entering them by hand, see [Plugin Development with EruptModule](/en/advanced/plugin).

## Menu Types

| Menu Type | Type Value | Description |
| --- | --- | --- |
| Table | Erupt class name (case-insensitive) | Table view |
| Tree | Erupt class name (case-insensitive) | Tree view |
| Form | Erupt class name (case-insensitive) | Opens straight into the form view |
| Link | A URL | Opens inside the menu container (iframe) |
| Micro-frontend Link | A URL | Opens in the micro-frontend container (2.2.0+). For targets that refuse framing via `X-Frame-Options` / `frame-ancestors` but allow cross-origin reads |
| New Tab | A URL | Opens in a new browser tab |
| Current Window | A URL | Full-page navigation in the current window |
| Page Route | Route path | Frontend router hash |
| Full Screen | Route path | Hides navigation and sidebar, fills the screen |
| Button | Permission string | Controls button visibility, not shown in navigation |
| Interface Name | API name | API permission string, used with `@EruptMenuAuth` |
| Report | Report code | Requires the erupt-report module |
| Template | Template filename (under the tpl directory) | Requires the erupt-tpl module |

## Fields

| Field | Description |
| --- | --- |
| Name | Text shown in navigation, i18n-aware |
| Status | Open / Hidden / Disabled. A **hidden** menu is not listed in navigation but its permission still applies, useful for pages reached only by link |
| Parent Menu | Any depth; navigation expands one level by default |
| Order | Lower values sort first |
| Icon | A Font Awesome class such as `fa fa-users`. Reference: [https://www.thinkcmf.com/font/search/index.html](https://www.thinkcmf.com/font/search/index.html) |
| Code | Unique key, read-only once generated. Module initialization uses it to decide whether a menu already exists |
| Custom Param | Extra parameter passed to the page, readable from TPL pages and the frontend |

## Gating UI Elements by Menu

A menu value can also act as a switch in business code. `ViaMenuValueCtrl` implements `ExprBool.ExprHandler` and shows a field or button only when the current user holds a given menu:

```java
@RowOperation(
    title = "Approve",
    show = @ExprBool(exprHandler = ViaMenuValueCtrl.class, params = "audit_btn"),
    operationHandler = AuditHandler.class
)
```

`params` is the menu's type value. Create a menu of type "Button" with value `audit_btn`, and whichever roles receive it can see the button.

Menu permissions are loaded and cached at login. After changing menus or roles, users must log in again or press the refresh button in the navigation bar.
