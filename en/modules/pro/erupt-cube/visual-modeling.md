# Visual Modeling

:::tip
Define semantic models without annotations.

This approach suits lightweight modeling; for complex, engineering-grade models we recommend the [annotation approach](/en/modules/pro/erupt-cube/semantic-model).
:::

## 1. Add the Dependency

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-design</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

## 2. Add a Menu Entry

Set the menu type value to: `CubeDesignModel`

<img src="/cube/design-menu.png" width="900">

## 3. Configure the Model

Configure the SQL, dimensions, and measures on the visual page:

- **Datasource**: uses the default data source when left empty
- **Dimensions**: usually no configuration needed — SQL aliases are converted to dimensions automatically; use this panel to fine-tune the result if needed
- **Measures**: just configure the aggregate function

<img src="/cube/design-model.png" width="900">

## Metric Management

<img src="/cube/metric-manage.png" width="700">
