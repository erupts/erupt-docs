---
title: "@Power × SHA512+Salt × PowerHandler：低代码的'安全'不该是上线前才补的那一栏"
description: 国内后台框架的安全清单——RBAC 菜单权限、按钮权限、密码加密——几乎都是"上线前补齐"的待办项。Erupt 押的是反向：安全是注解的默认值，是框架替你做掉的那部分。这一期从 @Power 的九个开关、PowerHandler 的运行时收口，到密码 MD5→SHA512+Salt 的平滑迁移，讲清楚"默认安全"在工程上意味着什么。
outline: deep
---

# 第 06 期 · 默认安全

> 几乎每个后端都背过同一份"上线前安全清单"：权限配了吗？导出关了吗？密码加密了吗？越权查了吗？这份清单的存在本身就说明一件事——**在大多数框架里，安全是事后补的**。Erupt 押的是反向那条路：安全不是清单上的待办项，是注解的默认值。一个 `@Power` 默认就把导出、导入关掉；改一次密码，MD5 账号会被悄悄迁移成 SHA-512 加盐——**没有"安全配置"这一步，因为它已经在默认值里了**。
>
> _发布于 2026-06-10 · 阅读 ~10 min_

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

翻一遍国内后台框架的"快速开始"，安全这一块的叙事高度一致：先把功能跑通，再回头配权限。若依 RuoYi 的菜单权限、按钮权限要在角色管理里一项项勾；JeecgBoot 的数据权限规则要在"数据规则"表里手动建；JNPF 的功能权限挂在可视化权限树上。它们都做得很完整——**问题不在于做没做，而在于这些都是"默认关着，等你打开"的，或者更糟，"默认开着，等你关掉"。**

后者才是真正出事的地方。一个新建的实体管理页，导出按钮默认在不在？数据导入默认能不能用？复制一条记录默认允不允许？只要默认值是"开"，那么"忘记关"就是一次数据泄露。安全清单之所以叫清单，就是因为它假设你会漏。

这一期讲 Erupt 的另一种做法：**把安全做成注解的默认值，把"忘记关"这件事从可能性里删掉**。论据集中在两处真实源码——`@Power` 注解（操作级权限的静态默认 + 运行时收口）和最近一次密码算法升级（MD5 → SHA-512 + Salt 的平滑迁移）。

::: tip 一个反直觉的小结
"功能完整"和"默认安全"是两件不同的事。若依、JeecgBoot、JNPF 在"功能完整"上都很强——权限模型该有的都有。但它们的默认姿态是"全开，等你配"。Erupt 的默认姿态是"敏感操作默认关，等你显式打开"。**前者的失败模式是泄露，后者的失败模式是报错**——后者便宜得多。
:::

## 二、两种安全姿态

把后台框架的安全模型摊开，本质区别只有一个：**默认值站在哪一边。**

先说清楚一件事，免得被误读：**Erupt 并不是"没有角色管理"**。erupt-upms 里有完整的 RBAC——`EruptRole`、`EruptMenu`（菜单/按钮权限存数据库，运行时在界面里勾选），和若依、JeecgBoot 那一套是同构的。这一期讲的差异不在"有没有角色表"，而在**操作能力的默认值落在哪一层**：

| 安全姿态 | "配齐再上线"派 | "默认安全"派（Erupt） |
| --- | --- | --- |
| 新页面导出/导入 | 默认可用，靠角色权限再收 | `export`/`importable` **注解层默认 false** |
| 操作能力的默认基线 | 由角色/权限表决定，注解层无默认 | `@Power` 给保守默认，角色表再叠加 |
| 行级/动态权限 | 写 SQL 数据规则或拦截器 | 实现 `PowerHandler` 接口，运行时收口 |
| 密码存储 | 由你选算法，配错就是 MD5 | 框架内置 SHA-512 + 随机盐 |
| 旧密码迁移 | 通常要写脚本批量 rehash | 下次登录/改密时**自动升级** |
| 失败模式 | 忘了配 → 数据泄露 | 忘了开 → 功能报错 |

最后一行是整篇的题眼。两种姿态都不可能"零失误"，区别在于**失误的代价**：忘记关导出，泄露的是真实数据；忘记开某个功能，最坏只是用户点不动一个按钮、给你提个 issue。Erupt 选的是后者。

## 三、一个注解，九个开关

`@Power` 是 Erupt 的操作级权限注解，挂在 `@Erupt` 模型上。它不是"权限系统的配置入口"，它**本身就是权限声明**——九个布尔开关 + 一个动态扩展点，全部带默认值：

```java
package xyz.erupt.annotation.sub_erupt;

public @interface Power {

    boolean add() default true;

    boolean edit() default true;

    boolean delete() default true;

    boolean query() default true;

    boolean viewDetails() default true;

    boolean export() default false;       // 注意：默认关

    boolean importable() default false;   // 注意：默认关

    boolean print() default true;

    boolean copy() default true;

    Class<? extends PowerHandler> powerHandler() default PowerHandler.class;
}
```

看默认值的分布：增删改查、查看详情、打印、复制默认是开的——这些是日常操作，关掉反而别扭。但 **`export` 和 `importable` 默认是 `false`**。这两个恰恰是最容易出数据事故的操作：批量导出能把整张表拖走，批量导入能绕过表单校验写脏数据。Erupt 的判断是：**默认值要站在"出事代价最大"的那一侧**，所以这两个默认关，要用的人显式写 `export = true`。

`copy()` 是这一版新加的开关（`Power` 注解里第九个布尔位）。它的存在说明一件事：每当框架新增一类操作能力，权限模型是**同步扩展**的，而不是"先上功能，权限下个版本补"。新能力进来的同一刻，它的开关也进来了。

::: info @Power 和角色管理是两层，不是二选一
`@Power` 不替代 RBAC。Erupt 的权限是分层的：`@Power` 是**编译期的默认基线**——决定一个操作"是否存在、默认是否开放"；erupt-upms 的 `EruptRole` / `EruptMenu` 是**运行时的角色叠加**——决定"哪个角色实际能用哪个菜单/按钮"，存在数据库里、在界面上勾。`PowerHandler`（见 §四）则是夹在中间、按当前登录用户做的动态收口。三层都偏保守，业务从下往上逐层放开。这一期聚焦最底层那一层，因为竞品恰恰是在这一层没有默认值。
:::

## 四、PowerHandler：把静态默认收口成运行时判断

`@Power` 的九个开关是静态的、编译期定死的。但真实业务里权限往往是动态的——"普通客服只能看不能导出，主管能导出"。这时不需要去改注解，而是实现 `PowerHandler` 接口，挂到 `powerHandler()` 上：

```java
package xyz.erupt.annotation.fun;

public interface PowerHandler {

    // 运行时按当前登录用户动态决定每个功能的开关
    void handler(PowerObject power);
}
```

`PowerObject` 携带了和 `@Power` 一一对应的运行时开关，`handler` 在每次请求构建权限时被调用。也就是说：**静态注解给的是默认基线，`PowerHandler` 给的是运行时收口**——两层都偏保守，业务再按需放开。

这里要澄清一个常见误解：Erupt 的动态行为**不走 SpEL 表达式**。所有"按用户/按角色动态决定"的逻辑，都走 `xyz.erupt.annotation.fun.*` 下的 Handler 接口——`PowerHandler`、`FilterHandler`（行级过滤）、`OperationHandler`（自定义操作）。它们是普通 Spring Bean，能注入 service、能打 breakpoint、能写单测。权限逻辑因此是**可调试、可 review、可进 Git diff** 的 Java，而不是配置表里的一行字符串。

## 五、密码：MD5 → SHA-512 + Salt 的平滑迁移

操作级权限是"谁能做什么"，密码是"凭证怎么存"。Erupt 最近把密码算法从 MD5 升级到了 **SHA-512 + 随机盐**。但真正值得讲的不是算法本身——SHA-512 加盐是常识——而是**迁移方式**：整个过程没有停机、没有批量 rehash 脚本、没有"请所有用户重置密码"的公告。

做法上就两条：校验时同时认两套算法——老的 MD5 账号照常登录，新账号走 SHA-512 加盐；而每当用户**自然地改一次密码**，框架顺手把这条记录升级成 SHA-512 + 盐。新建用户直接走新算法，存量用户在日常改密里被增量迁移完。相关实现集中在 `xyz.erupt.core.util.MD5Util` 与 `xyz.erupt.upms.service.EruptUserService`，接入方无需关心细节。

::: info 为什么这是"默认安全"的一部分
你作为接入方，**没有在任何地方选过加密算法**。你写 `@Erupt` 实体、配 upms，密码就是 SHA-512 加盐存的；升级框架版本，存量账号自动平滑迁移。安全在这里不是一个你要做的决定，是框架默认替你做掉的事——这正是这一期想说的"默认安全"。
:::

## 六、跟若依 / JeecgBoot / JNPF 怎么比？

| 维度 | 若依 RuoYi / JeecgBoot / JNPF | Erupt |
| --- | --- | --- |
| 角色/菜单 RBAC | 有，角色表 + 菜单/按钮权限 | 有，`EruptRole` / `EruptMenu`（同构） |
| 操作能力的默认基线 | 由角色/权限表决定，无注解层默认 | `@Power` 注解层默认值 + 角色表叠加 |
| 导出/导入默认 | 多为默认开放，靠角色权限再收 | `export`/`importable` **注解层默认 false** |
| 动态权限 | 数据规则 SQL / 自定义拦截器 | `PowerHandler` —— 普通 Spring Bean，可调试可单测 |
| 密码默认算法 | 取决于版本，历史上有 MD5/明文 | 内置 SHA-512 + 随机盐 |
| 旧密码迁移 | 通常需手写批量脚本 | 改密时自动升级，无停机 |
| 权限逻辑可 review | 角色配置存数据库，难进 diff | 默认基线 + Handler 是 `.java`，`git diff` 看得见 |

这张表不是说若依/JeecgBoot/JNPF "不安全"，也不是说它们"没有 RBAC"——它们的角色/菜单权限模型很完整，社区也成熟，Erupt 在这一层和它们同构。差异只在**多出来的那一层注解默认值**：当操作能力的下限完全交给"配置的人有没有漏"时，失败模式是泄露；当框架在注解层先压一道保守默认时，失败模式退化成报错。对一人公司、小团队、外包交付这类"没有专职安全同学盯清单"的场景，多这一层兜底的容错空间大得多。

## 七、5 分钟从注解到带权限的页面

从空 Spring Boot 项目到一个能登录、带操作权限的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/zh/guide/quick-start)**

那一页覆盖 Maven 依赖、application.yml、第一个 `@Erupt` 实体、默认登录账号，以及 Docker / K8S 部署。

跑通之后，给你的实体加一行权限声明就能挂上本文 §三、§四 的能力：

```java
@Erupt(
    name = "订单",
    power = @Power(
        export = true,                  // 显式打开导出
        importable = false,             // 保持导入关闭
        powerHandler = OrderPowerHandler.class  // 运行时按角色收口
    )
)
@Entity
public class Order { /* ... */ }
```

`OrderPowerHandler` 实现 `PowerHandler`，注入你的 service，按当前登录用户决定 `power.setExport(...)`。密码部分则**不需要你做任何事**——接 erupt-upms 即默认 SHA-512 加盐。

## 八、下一期预告

这一期讲的是"敏感操作的默认值站在哪一侧"。但权限还有更细的一层——**字段级**：同一张表，A 角色看得到手机号，B 角色只看到脱敏后的尾号。Erupt 的字段可见性、脱敏、行级过滤（`FilterHandler`）是怎么和 `@EruptField` 一起声明的？下一期 **#07** 把权限从"操作级"下钻到"字段级与行级"，继续这条"默认安全"的线。

---
:::info 参与讨论
本期专题对应的核心源码：`xyz.erupt.annotation.sub_erupt.Power`、`xyz.erupt.annotation.fun.PowerHandler`、`xyz.erupt.core.util.MD5Util`、`xyz.erupt.upms.service.EruptUserService`。欢迎在 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 留贴讨论你的权限设计踩坑。
:::
