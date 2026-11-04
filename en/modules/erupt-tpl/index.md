# Erupt TPL Custom Pages

erupt-tpl adds a page to the admin from a single HTML file: drop the file into `resources/tpl/`, create a **Custom Page** menu entry pointing at its filename, and the page shows up in the sidebar with the admin's theme, permissions and login state. When the page needs backend data, bind a `Map` to the template with `@EruptTpl` + `@TplAction` and render it with FreeMarker, Thymeleaf or another engine.

| Capability | What it does | Go to |
| --- | --- | --- |
| **Menu pages** | Mount HTML under the `tpl` directory as a menu, embedded via iframe or micro frontend | [Menu Pages](./menu) |
| **Template engines & data binding** | Five template engines enabled on demand, `@TplAction` injects data, path and parameter conventions | [Template Development](./template) |
| **Micro-frontend integration** | Render the sub-app straight into the host document without an iframe; boundaries, limits and how to choose | [Micro-Frontend Integration](./micro-frontend) |
| **UI component kits** | Static asset packages for Ant Design Vue, Element UI and Element Plus, referenced directly from templates | [UI Component Kits](./ui) |

The module is also the runtime behind the `@Tpl` annotation: `EditType.TPL` fields, `@RowOperation` dialogs, `@View` column popups and `@Vis` views all render through the engines here. For the annotation-level attributes see [@Tpl Custom Template](/en/annotation/tpl).

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

Once added, **Custom Page (Iframe)** and **Custom Page (Micro Frontend)** appear under Menu Type in menu management. Plain HTML pages work out of the box. To use FreeMarker or another template engine you add that engine's dependency yourself, see [Template Development](./template#template-engines).

## Rendered Result

Custom pages fully reuse Erupt's theme styles and sit next to the rest of the admin without any visual seam:

<img src="/tpl/result.png" width="900">

## Pages

- [Menu Pages](./menu) — menu configuration, the `tpl` and `mtpl` embedding modes, directory conventions, hot reload
- [Template Development](./template) — template engines, `@EruptTpl` / `@TplAction` data binding, injected variables, paths and parameters
- [Micro-Frontend Integration](./micro-frontend) — complete-HTML requirement, iframe sandbox, what it supports, container behaviour
- [UI Component Kits](./ui) — the three erupt-tpl-ui coordinates and how to reference them
