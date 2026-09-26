---
title: "从数据库反向生成模型"
description: "第 05 期我们说 Erupt 没有'生成'这个动词。现在 erupt-generator 能反读一个已有数据库，倒推出 @Erupt 源码。这一期讲清楚两者为什么不矛盾：它每张表只生成一个文件，生成一次，然后退场。"
outline: deep
---

# 第 14 期 · 从数据库反向生成模型

> 国内后台框架的代码生成器，产出的是一套分层：一张表进去，出来 Controller、Service、Mapper、XML、Vue 页面和一段菜单 SQL，此后这组文件和生成器之间要一直手工对齐。erupt-generator 这周换了做法：读 JDBC 元数据，每张表只产出一个 `@Erupt` 类，不写你的源码目录，也不在运行时留任何痕迹。我们的判断是：**生成器越早退场越好，最好的那种只用一次。**
>
> 发布于 2026-09-23 · 阅读 ~10 min

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt 微信公众号" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · 公众号</div>
    <div class="topic-mp-qr__title">扫码关注 Erupt 公众号</div>
    <p class="topic-mp-qr__desc">每期专题首发于此，另有版本动态、源码解读、社区精选案例。</p>
  </div>
</div>

[[toc]]

## 一、为什么写这篇

第 05 期的标题是《没有"生成"这个动词》。那一期的论点是：Erupt 不向你的源码目录写任何文件，真理只在 Git 里的 `.java` 上。

9 月 17 日，主仓合进了 `erupt-generator: build erupt models by reading a database`。它做的事，字面上正好是"生成"：选一个数据源、一个库、几张表，吐出带 `@Erupt` / `@EruptField` 的实体源码。

所以这一期得先交代清楚：我们是不是自己打了自己的脸？

我们的回答是没有，但要把"生成"拆成两种来看：

- **持续生成**：生成器是真理的来源。表结构或者画布配置一改，就要重新生成、覆盖、合并。生成出来的文件是"派生物"，你改了它，下次生成就和你打架。
- **一次性生成**：生成器只是一次录入。它把数据库已经知道的东西（表名、列名、注释、类型、外键）抄成一个类，交给你之后就再也不管了。从那一刻起，真理是你 Git 里的那个 `.java`。

第 05 期反对的是前一种。erupt-generator 只做后一种，而且在源码里把"只做后一种"写成了硬约束（§五）。

真实场景也说明了为什么需要它：接手一个存量系统的时候，库里常常已经有两三百张表，每张表的注释里写着 `状态 0-待支付 1-已支付 2-已取消`。把这些一个字段一个字段地手敲成 `@EruptField`，是整个接入里最没有技术含量、也最容易抄错的一步。数据库早就知道这些信息，没理由让人再打一遍。

## 二、两种生成：生成一套分层，还是生成一个文件

| | 持续生成（分层模板派） | 一次性生成（Erupt） |
| --- | --- | --- |
| 一张表产出 | 后端多层 + 前端页面 + 菜单脚本，典型是 8–10 个文件 | **1 个 `.java`** |
| 生成物的性质 | 模板渲染出的"派生代码"，改了就和模板分叉 | 普通源码，和手写的实体没有区别 |
| 生成器在运行时 | 生成配置表常驻，是后续再生成的依据 | 生成定义只是一张后台表，删掉不影响任何业务 |
| 表结构变了 | 回生成器同步，再覆盖或手工合并 | 在 IDE 里加一个字段 |
| 生成器写哪里 | 常见做法是直接写到工程路径或打包下载 | **只预览与下载**，不碰源码目录 |

差别在于那一个文件里装了什么。分层派需要生成 8 个文件，因为 Controller、Service、Mapper、页面都要有人写；Erupt 的界面、查询、权限都由注解驱动，一个实体类就是全部。**生成器能做成一次性的，前提是框架本身不需要生成代码。**这不是生成器的功劳，是注解派本来就有的性质。

## 三、数一数：它从元数据里能读出多少

`erupt-generator` 这次重写后的几个数字，都能在源码里对上：

| 项 | 数量 | 出处 |
| --- | --- | --- |
| 生成器可表达的字段类型 | 39 | `xyz.erupt.generator.base.GeneratorType` 枚举 |
| 其中能从元数据自动推断的 | 15 | `GeneratorType.of` / `ofString` + 注释字典 + 外键 |
| 可选父类（决定哪些列被继承而跳过） | 12 + 不继承 | `xyz.erupt.generator.base.SuperModel` |
| 外键显示列的候选名 | 9（`name`、`title`、`label`、`code`…） | `DbIntrospectService.LABEL_CANDIDATES` |
| 模块依赖 | 1（`erupt-data-jpa`） | `erupt-plugin/erupt-generator/pom.xml` |
| 模板引擎 | 0（原来的 freemarker 与 erupt-tpl 依赖已删除） | `xyz.erupt.generator.service.CodeRender` |
| 写入你源码目录的文件 | 0 | 只有 Preview 与 Download 两个出口 |

39 减 15，剩下 24 种类型（富文本、多对多、穿梭框、树引用……）元数据推不出来，只能在导入后手工改。这个比例我们不打算追高：**`varchar(255)` 不会告诉你它装的是富文本还是一个 URL**，猜错比不猜更糟。

## 四、注释就是字典

存量库最有价值的信息往往不在类型里，而在注释里。国内的老系统很少为每个状态码单建字典表，更常见的是把字典直接写进列注释。`xyz.erupt.generator.base.ChoiceComment` 就是专门读这一类注释的：

```java
// value on the left of a separator, label on the right, both kept short
private static final Pattern PAIR = Pattern.compile("([0-9A-Za-z_]{1,12})\\s*[-=:：]\\s*([^\\s,;、)，；）]{1,20})");

// one pair is a sentence, several are a convention
private static final int MIN_PAIRS = 2;

public static Choice parse(String comment) {
    if (null == comment) return null;
    Matcher matcher = PAIR.matcher(comment);
    Map<String, String> vl = new LinkedHashMap<>();
    boolean worded = false;
    int head = comment.length();
    while (matcher.find()) {
        // a label made only of digits comes from a date or a range, not from a dictionary
        if (!matcher.group(2).matches("[0-9]+")) worded = true;
        if (vl.isEmpty()) head = matcher.start();
        vl.putIfAbsent(matcher.group(1), matcher.group(2));
    }
    if (!worded || vl.size() < MIN_PAIRS) return null;
    // ...
}
```

三条规则值得单独说一下：

1. **至少两对才算字典**。`版本 v2-beta` 只有一对，是一句话，不是约定。
2. **标签全是数字的不算**。`有效期 1-30` 是范围，`2024-06` 是日期，都不是枚举。
3. **字典前面的部分是标题**。`状态 0-待支付 1-已支付` 里，`状态` 成为 `@Edit(title)`，后面三对成为 `@ChoiceType(vl = {...})`。

外键也是同样的思路。`DbIntrospectService.link()` 不假设被引用的表一定有 `name` 列，而是真的去读那张表的列，按 `name → title → label → code → …` 的顺序挑一个存在的列当显示列；一个都没有，就用主键之外的第一列。这样生成出来的 `@ReferenceTableType(id = "id", label = "...")` 引用的是真实存在的列。

:::info 边界
外键只认**约束**，不按 `xxx_id` 这样的命名去猜。很多 MySQL 老库压根没建外键约束，这种情况下 `customer_id` 就是一个 `Long`。按命名猜十次能对七次，剩下三次会在运行时报错；我们选择让它显式地退化成数字。
:::

MySQL / MariaDB 还有一个坑：连接不带 `useInformationSchema` 时，JDBC 的 `REMARKS` 是空的。`DbIntrospectService.comments()` 会检测数据库产品，改从 `information_schema` 里读注释，用的是参数化的 `PreparedStatement`。其他数据库走标准的 `REMARKS`。

## 五、生成完就退场

以一张 MySQL 表为例：

```sql
create table customer (id bigint primary key, name varchar(64));
create table shop_order (
  id          bigint auto_increment primary key,
  order_no    varchar(32) not null comment '订单号',
  status      int not null comment '状态 0-待支付 1-已支付 2-已取消',
  customer_id bigint comment '客户',
  amount      decimal(12,2) comment '金额',
  foreign key (customer_id) references customer (id)
) comment '订单';
```

父类选 `BaseModel`，按 `CodeRender.render()` 的规则，产出的就是这一个文件：

```java
package com.example.model;

import jakarta.persistence.*;
import java.math.BigDecimal;
import lombok.Getter;
import lombok.Setter;
import xyz.erupt.annotation.*;
import xyz.erupt.annotation.sub_erupt.*;
import xyz.erupt.annotation.sub_field.*;
import xyz.erupt.annotation.sub_field.sub_edit.*;
import xyz.erupt.jpa.model.BaseModel;

/**
 * 订单
 */
@Erupt(name = "订单")
@Table(name = "shop_order")
@Entity
@Getter
@Setter
public class ShopOrder extends BaseModel {

    @EruptField(
            views = @View(title = "订单号"),
            edit = @Edit(title = "订单号", type = EditType.INPUT, search = @Search, notNull = true,
                    inputType = @InputType)
    )
    @Column(length = 32)
    private String orderNo;

    @EruptField(
            views = @View(title = "状态"),
            edit = @Edit(title = "状态", type = EditType.CHOICE, search = @Search, notNull = true,
                    choiceType = @ChoiceType(vl = {@VL(value = "0", label = "待支付"), @VL(value = "1", label = "已支付"), @VL(value = "2", label = "已取消")}))
    )
    private Integer status;

    @EruptField(
            views = @View(title = "客户"),
            edit = @Edit(title = "客户", type = EditType.REFERENCE_TABLE, search = @Search,
                    referenceTableType = @ReferenceTableType(id = "id", label = "name"))
    )
    @ManyToOne
    @JoinColumn(name = "customer_id")
    private Customer customer;

    @EruptField(
            views = @View(title = "金额"),
            edit = @Edit(title = "金额", type = EditType.NUMBER, search = @Search,
                    numberType = @NumberType)
    )
    private BigDecimal amount;

}
```

`id` 因为父类已经声明而被跳过；`customer_id` 去掉 `_id` 后缀变成字段 `customer`，同时保留 `@JoinColumn(name = "customer_id")`；`@Column` 只在带有 JPA 推不出来的信息（列名不一致、非默认长度）时才出现。

"退场"这件事，落在源码里是这几处：

- **不能手工新建**。`GeneratorClass` 上是 `@Power(add = false, print = false)`，定义只能从数据库导入。手工录入一个类名、一张表、每个字段，本来就是数据库已经知道的内容；导入之后剩下的表单只用来修正猜错的地方。
- **只有两个出口**。`CodePreviewHandler` 在后台的代码编辑器里预览，`CodeDownloadHandler` 单个下载 `.java`，多个下载成 zip，zip 条目带包路径，解压到 `src/main/java` 就能直接覆盖到位。生成器没有任何一行代码写你的工程目录。
- **不认领生成物**。生成之后框架不再追踪这个文件。唯一的"回看"是 `CodeRender` 里的一次检查：类名如果已经被一个注册过的 Erupt 模型占用，就在代码顶部加一行 `//FIXME`，提醒你粘进去就会冲突。
- **重新导入只覆盖生成器自己的那一行**。`DbImportHandler.exec()` 勾选 overwrite 时，删掉的是 `e_generator_class` 里的旧定义，碰不到你 Git 里已经改过的实体。

生成器本身也是一个 `@Erupt` 模型：定义存在一张普通的后台表里，列表、编辑、行按钮都是框架自己渲染的。它用来生成注解的，也是同一套注解。

:::tip 一个反直觉的小结
衡量一个代码生成器，不该只看它第一次生成了多少行，还要看生成之后你还需要它多久。erupt-generator 的目标是零：导入、修正、下载，然后你就可以把这个依赖从 pom 里删掉了。
:::

## 六、跟 若依 / JeecgBoot / JNPF 怎么比？

| 维度 | 若依 RuoYi 代码生成 | JeecgBoot Online 表单 + 代码生成 | JNPF 可视化开发 | **Erupt generator** |
| --- | --- | --- | --- | --- |
| 一张表产出 | 后端 domain / mapper / service / controller + 前端页面 + 菜单 SQL | 前后端一整套代码，或留在 Online 配置里运行时解释 | 前后端代码 | **1 个 `@Erupt` 类** |
| 生成物之后的真相 | 生成代码 + 生成配置表，两边需要对齐 | Online 配置与生成代码并存 | 设计器配置与生成代码并存 | **只有你 Git 里的 `.java`** |
| 状态字典从哪来 | 每列手工选一个字典类型 | 在表单配置里选字典编码 | 在设计器里配置 | **从列注释 `0-xx 1-yy` 自动读出** |
| 外键 | 主子表需手工配置 | 在 Online 表单里配置关联 | 在设计器里配置 | **读外键约束，按真实列挑显示字段** |
| 表结构后来变了 | 回生成器同步，再生成、合并 | 同步数据库，再生成 | 回设计器改 | **在 IDE 里加一个 `@EruptField`** |
| 生成器留在运行时 | 生成配置表常驻 | Online 引擎常驻 | 设计器常驻 | **不需要，可以从 pom 移除** |

这张表说的不是谁的生成器更强。若依的生成器覆盖面比我们广，因为它要生成的东西本来就多。差别在前一步：**一个框架需要生成多少代码，决定了它的生成器能不能只用一次。**

同样要说清楚我们不做的部分：

- 复合主键或没有主键的表，直接拒绝导入，因为 Erupt 靠单一主键寻址一行数据（`DbIntrospectService.primaryKey()` 只接受恰好一列）；
- 注释字典只认 `0-禁用 1-启用` 这类"值 + 分隔符 + 标签"的形状，更复杂的写法保留成普通数字；
- 单列唯一索引原本会生成 `@Column(unique = true)`，9 月 19 日的 #382 把这一项连同字段一起删掉了，现在导入不再读唯一索引。

## 七、5 分钟从一张旧表到后台页面

在已经跑起来的 Erupt 工程里加一个依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-generator</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

重启后进入"代码生成"菜单，点列表上方的 **Import from Database**：数据源、库、表三级联动；`Package` 默认取你现有模型最集中的包；`Ignore Columns` 支持 `tenant_*` 这样的通配。导入后逐行 Preview，觉得没问题就勾选多行 Download，把 zip 解压到 `src/main/java`。

如果你还没有一个能跑的 Erupt 工程，从这里开始：

**→ [快速部署 / Quick Start](/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 @Erupt 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，把生成的类当作你自己手写的类来对待：§四 里猜错的字典、§五 里没推出来的富文本，直接在 IDE 里改。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-generator/`（`DbIntrospectService`、`ChoiceComment`、`CodeRender`、`GeneratorType`、`SuperModel`、`DbImportHandler`），测试在 `erupt-test/src/test/java/xyz/erupt/test/generator/DbIntrospectTest.java`。

如果你的存量库注释写法特别（`1启用 2停用`、`启用(Y)/停用(N)`……），欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 贴几条样本，`ChoiceComment` 的正则会照着真实数据来收紧或放宽。
:::
