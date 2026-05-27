# Erupt TPL Custom Pages

The erupt-tpl module provides custom page capabilities, allowing you to embed custom HTML template pages inside menu entries. It supports template engines such as Freemarker for rendering, and offers multiple UI component library integrations.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Menu Configuration

In Menu Management, add a new menu entry, set the type to "Template", and fill in the template filename (without the path prefix) as the type value:

<img src="/tpl/menu.png" width="700">

## Rendered Result

Custom template pages can fully use Erupt's theme styles, seamlessly integrating into the admin interface:

<img src="/tpl/result.png" width="900">

## Hot Reload

Template files are updated live — no application restart is required. Just refresh the page to see the latest changes:

<img src="/tpl/hot-reload.png" width="700">

## Freemarker Templates

Create `.ftl` files inside the `resources/tpl` directory. You can use pre-injected context variables such as the current user's information:

```html
<!-- resources/tpl/demo.ftl -->
<!DOCTYPE html>
<html>
<head><title>Custom Page</title></head>
<body>
    <h1>Hello, ${user.name}!</h1>
    <p>Current User ID: ${user.id}</p>
</body>
</html>
```

<img src="/tpl/freemarker.png" width="700">

## Row Button Embedding

Using the `@RowOperation` annotation, you can open a custom template page from a row action button in a list view:

<img src="/tpl/row-op1.png" width="700">

<img src="/tpl/row-op2.png" width="700">

## Micro-Frontend Integration

erupt-tpl supports micro-frontend architectures, allowing pages from any frontend framework to be embedded into the Erupt admin interface:

<img src="/tpl/micro-frontend.png" width="900">

## Erupt TPL UI Component Library

erupt-tpl-ui provides integration solutions for multiple mainstream UI frameworks, so you can use components consistent with Erupt's style directly in your custom pages.

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-tpl-ui</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### Ant Design

<img src="/tpl/antd.png" width="900">

### Element UI / Element Plus

<img src="/tpl/element.png" width="900">

### Amis Low-Code

Integration with Baidu's Amis low-code framework, enabling complex page generation via JSON configuration:

<img src="/tpl/amis.png" width="900">
