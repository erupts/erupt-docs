# Erupt Print 打印模块

erupt-print 提供基于 HTML 模板的打印能力，支持配置模板变量，将业务数据动态填充后生成可打印的单据或报告。

> **2.0.0 新增**：erupt-print 现已直接支持 Erupt 实体，可为任意 Erupt 表格数据定义打印模板、配置变量并一键打印，不再仅限于 erupt-flow 流程单据。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-print</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 核心概念

| 概念 | 说明 |
|------|------|
| 打印模板 | HTML 格式的模板文件，可在管理界面可视化编辑 |
| 模板变量 | 在模板中定义占位符，运行时由 Erupt 实体字段值动态替换 |
| 打印触发 | 在 Erupt 表格行操作中一键触发，将当前行数据填充到模板后打印 |

## 使用流程

1. **定义模板**：在系统菜单"打印模板"中新建模板，编写 HTML 布局
2. **配置变量**：在模板中插入变量占位符，绑定 Erupt 实体的字段名
3. **关联 Erupt**：将模板与目标 Erupt 实体关联
4. **触发打印**：在对应表格行点击打印按钮，系统自动填充变量并调起打印预览

## 模板变量配置

在打印模板中定义变量，变量值从 Erupt 实体字段或流程业务数据中动态填充：

<img src="/print/var.png" width="900">

## 打印效果

<img src="/print/result.png" width="700">
