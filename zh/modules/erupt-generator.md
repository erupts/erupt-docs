# Erupt Generator 代码生成

erupt-generator 读取应用中任意已注册数据源的表结构，把一张表直接转成带 `@Erupt` / `@EruptField` 注解的实体类。已有数据库要接入 Erupt 时，这是最快的一条路：导入 → 校对 → 下载 → 放进工程。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-generator</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

引入成功后重启应用，即可在菜单中看到**代码生成**入口。

## 菜单入口

<img src="/generator/menu.png" width="300">

## 从数据库导入 <Badge type="tip" text="v2.3.0+" />

列表页顶部的**从数据库导入**按钮打开导入对话框，前三项是级联的：选好上一项，下一项才会加载。

![从数据库导入对话框](/generator/db-import.png)

| 配置项 | 说明 |
| --- | --- |
| 数据源 | 应用上下文中注册的所有数据源都可选，不限于主数据源 |
| 数据库 | 所选数据源下的数据库（schema） |
| 数据表 | 穿梭框多选，一次可导入多张表 |
| 包名 | 写入每个生成类的 `package` 语句，默认按当前应用模型所在的包猜测 |
| 忽略列 | 不生成到实体里的列。下拉列表读取已选表的列，多表共有的列排在前面；也可手工输入 `tenant_*` 这类通配模式 |
| 父类 | 决定哪些列由父类继承而不再声明：`BaseModel` 只继承 `id`；`MetaModel` / `HyperModel` 家族继承创建人、创建时间等审计列，`Vo` 变体会把审计列展示到界面上；`None` 表示不继承任何列 |
| 覆盖已有 | 同一张表之前导入过时，是否替换旧定义 |

导入后每张表成为列表中的一条记录，字段落在**字段管理**页签里，可以在下载前逐项修正。

## 元数据映射

导入按下面的规则把 JDBC 元数据翻译成注解：

| 来源 | 生成结果 |
| --- | --- |
| 表名 | 实体类名，erupt 约定的 `e_` 前缀会被去掉（`e_order` → `Order`） |
| 表 / 列注释 | `@Erupt(name)`、`@View(title)`、`@Edit(title)` |
| JDBC 类型 + 长度 | `EditType` 与 Java 类型（`bigint` → `Long`，`decimal(12,2)` → `BigDecimal`） |
| 列名 | 名字表明用途时选用 `PASSWORD`、`IMAGE`、`ATTACHMENT`、`ICON`、`COLOR` 组件 |
| 编码列的注释 | 注释中形如 `0-禁用 1-启用` 的枚举说明生成 `EditType.CHOICE` 及对应 `@VL` |
| `not null` | `@Edit(notNull = true)` |
| 单列唯一索引 | `@Column(unique = true)` |
| 外键 | `@ManyToOne` + `REFERENCE_TABLE`，标签列取被引用表中真实存在的列 |
| 主键 | 名为 `id` 时由父类继承；否则生成 `@Id` 并设置 `primaryKeyCol` |

:::warning MySQL / MariaDB 的注释
注释默认从 JDBC 的 `REMARKS` 读取。MySQL / MariaDB 的注释只存在于 `information_schema`，连接串需带上 `useInformationSchema=true`，否则导入结果没有标题，只能事后手工补。
:::

## 预览与下载

- **预览**（单行操作）：在后台自带的代码编辑器抽屉中打开生成的类，支持复制、下载与全屏。
- **下载**（多选操作）：选中一条记录时下载单个 `.java` 文件；选中多条时打包为 zip，压缩包内条目带包路径，解压到源码目录即可直接落位。

把文件放进工程对应的包下、重启应用，再到菜单管理中把该类配置为菜单即可使用。

:::tip
生成的代码基于标准 Erupt 注解，可直接在其上继续编写复杂业务逻辑；2.3.0 起生成器不再依赖 freemarker 与 erupt-tpl。
:::

## 手工建模

导入并不是唯一入口，列表中的记录仍然可以手工修改，用来修正导入的猜测：

- 类级别：名称、实体类、表名、父类、包名、简介。
- 字段级别：字段名、列名（与字段名相同时留空）、显示名称、显示顺序、编辑类型、Java 类型（覆盖由编辑类型推断的类型，如 `Long` / `BigDecimal`）、长度、关联实体类、主键 / 自增（仅在没有父类时使用）、查询项、字段排序、是否必填、是否显示。
- **组件配置**：填写后替换编辑类型默认生成的组件配置，例如 `choiceType = @ChoiceType(...)`。

:::info 与旧版本的差异
2.3.0 重写了生成器：字段上的「唯一」开关与列表的打印按钮已移除，唯一约束改由导入时的单列唯一索引推断。
:::

## 限制

- 一张表必须且只能有一个主键列，复合主键或没有主键的表会被拒绝导入。
- 从注释推断的枚举只识别 `0-禁用 1-启用` 这种写法，其它形式保持为普通数字。
- 类名与已注册的 Erupt 模型重名时，只会在生成代码里加一行 `//FIXME` 注释提醒，导入本身不会被阻止。

## EZDML 辅助建模

2.3.0 之前的版本没有数据库导入能力，从表结构生成代码通常借助 EZDML 建模工具完成。现在**从数据库导入**已覆盖这类场景；如果你的团队仍以 EZDML 维护模型，可参考 [EZDML 代码生成](/zh/modules/third-party/ezdml)。
