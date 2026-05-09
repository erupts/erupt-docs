# Erupt Generator 辅助代码生成

erupt-generator 提供可视化代码生成能力，通过界面快速生成 Erupt 实体类代码，生成后直接复制到项目中即可使用，大幅提升开发效率。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-generator</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

导入成功后重启即可看到**代码生成**相关菜单。

## 菜单入口

<img src="/generator/menu.png" width="300">

## 代码生成界面

通过可视化界面配置字段信息，自动生成完整的 Erupt 实体类代码：

<img src="/generator/ui.png" width="900">

## 使用流程

1. 进入**代码生成**菜单，点击**新增**
2. 填写类名、包名等基本信息
3. 添加字段，配置字段类型、展示名称、编辑组件等
4. 点击**生成代码**，复制或下载生成的 Java 文件
5. 将文件放入项目对应包路径，重启项目
6. 在菜单管理中将该类添加为菜单即可使用

:::tip
生成的代码基于标准 Erupt 注解，可在此基础上继续修改添加复杂业务逻辑。
:::

## EZDML 辅助建模

从数据库快速生成代码可使用 EZDML 数据建模工具辅助完成，详见[EZDML 代码生成](/modules/third-party/ezdml)。
