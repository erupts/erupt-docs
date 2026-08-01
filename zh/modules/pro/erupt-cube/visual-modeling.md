# 可视化建模

:::tip
使用非注解的方式实现数据建模。

此方式可实现轻量级的建模，复杂且工程化的建模建议使用[注解方式](/zh/modules/pro/erupt-cube/semantic-model)。
:::

## 1. 添加依赖

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-design</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

## 2. 增加菜单

菜单类型值填：`CubeDesignModel`

<img src="/cube/design-menu.png" width="900">

## 3. 配置模型

根据可视化页面配置 SQL、维度、指标即可：

- **Datasource**：不配置则使用默认数据源
- **维度**：大多数场景不用配置，会自动将 SQL 的 Alias 转换为维度，如果转换后的细节需要调整可以通过此功能进行调整
- **指标**：配置聚合函数即可

<img src="/cube/design-model.png" width="900">

## 指标管理

<img src="/cube/metric-manage.png" width="700">
