---
title: "PropertySource × @Value × EruptConfigRefreshedEvent：配置中心不必是另一个服务"
description: "后台里的「系统参数」表通常是一张谁都得手写缓存的 key/value 表。本期拆 erupt-config：把后台里的配置项做成 Spring 的一层 PropertySource，让 @Value 和 @ConfigurationProperties 原样读到，保存即生效，以及它没有版本、灰度和审批的代价。"
outline: deep
---

# 第 24 期 · 配置中心不必是另一个服务

> 后台里的「系统参数」几乎都是一张 key/value 表加一个 `getConfig("xxx")` 工具方法——读的人要自己管缓存，改了要自己想办法通知，和 `application.yml` 里的同名配置还互不相识。`erupt-config` 反过来：不造一套新的读取 API，而是把后台里的配置项做成 Spring 环境里**最前面的那一层 `PropertySource`**，`@Value` 照常读，保存之后不重启就生效。
>
> _发布于 2026-10-21 · 阅读 ~9 min_

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

「邮件服务器地址放哪」「某个功能开关谁来改」「促销横幅的图片和颜色让运营自己换」——后台项目里这类需求每个季度都会出现。常见做法有三种：全塞进 `application.yml`（改一次发一次版）；上 Nacos / Apollo 这类配置中心（多部署一套服务，运营够不着它的界面）；或者自己建一张「系统参数」表，加一个 `ConfigUtil.get(key)`。

第三种最顺手，也最容易留下三个问题：

- **两套读法。** 文件里的配置用 `@Value`，表里的配置用 `ConfigUtil.get`，同一个 key 在哪一边生效要看代码怎么写。
- **缓存自己管。** 读一次查一次库太慢，加了缓存就要自己决定怎么失效，多节点时还要自己广播。
- **没有「环境」这个概念。** dev 和 prod 的参数要么混在一张表里靠前缀区分，要么每个环境一个库。

本文的反向命题是：

> **运行时配置不需要新的读取 API，也不需要新的服务。Spring 已经有「分层配置」这个抽象——`Environment` 里的 `PropertySource`。把数据库里的配置项放进去，别的都不用改。**

## 二、两种做法：另起一套 API vs 插进 Spring 已有的那层

| 维度 | 「系统参数表 + 工具方法」 | 作为 `PropertySource`（`erupt-config`） |
|---|---|---|
| 读取方式 | `ConfigUtil.get("k")`，只有自己的代码认识 | `@Value("${k}")`、`Environment#getProperty`、`@ConfigurationProperties` |
| 与文件的关系 | 互不相识 | 数据库在前、文件兜底，缺的 key 自动落回文件 |
| 环境分层 | 前缀或多库 | 沿用 `spring.profiles.active`，`default` 层之上叠加活动 profile |
| 改完怎么生效 | 自己写缓存失效 | 保存即刷新本节点，Redis 广播或轮询通知其他节点 |
| 配置界面 | 自己写一个 CRUD | 本身就是三个 `@Erupt` 模型 |

## 三、可数的事实：两张表、一个启动钩子、十七种类型

模块在 `erupt-plugin/erupt-config`，主代码 23 个文件、约 1500 行：

- **两张存储表加一个只读视图模型。** `xyz.erupt.config.model.ConfigProfile`（表 `e_config_profile`，一行一个 profile）、`ConfigItem`（表 `e_config_item`，`(profile, key)` 唯一）、`ConfigEffectiveValue`（「生效值」页，这个实例此刻读到的每一个属性及其来源 profile）。
- **一个启动钩子。** `xyz.erupt.config.boot.EruptConfigEnvironmentPostProcessor`，登记在 `META-INF/spring.factories`，在任何 Bean 创建之前执行。
- **十七种值类型。** `ConfigValues` 里的 `STRING / PASSWORD / TEXT / NUMBER / BOOLEAN / LIST / KEY_VALUE / JSON / YAML / DATE / DATETIME / TIME / COLOR / ICON / HTML / IMAGE / ATTACHMENT`；其中 `KEY_VALUE`、`JSON`、`YAML` 会被展平成 `key.path`、`key[i]` 形式的属性，和 Spring 读 yml 文件的结果一致，所以 `Map`、`List`、`@ConfigurationProperties` 对象都能直接绑定。
- **一个事件、一个读取服务。** `EruptConfigRefreshedEvent`（携带变化的 key 集合）和 `EruptConfig`（带类型和默认值的 `get`，key 也可以是枚举）。

## 四、「在任何 Bean 之前」：启动时怎么读到数据库

配置要能给 `@Value` 用，就得在 Spring 创建第一个 Bean 之前进入 `Environment`——这时候 JPA、`EruptDao` 都还不存在。`ConfigJdbcReader` 的做法是只用 JDBC：

```java
public static Map<String, Object> read(String url, String username, String password,
                                       List<String> profiles, boolean quoted) throws SQLException {
    try (Connection connection = DriverManager.getConnection(url, username, password)) {
        String q = quoted ? connection.getMetaData().getIdentifierQuoteString().trim() : "";
        UnaryOperator<String> id = name -> q + name + q;
        String sql = "select p." + id.apply(ConfigProfile.CODE_COLUMN) + ", i." + id.apply(ConfigItem.KEY_COLUMN)
                + ", i." + id.apply(ConfigItem.TYPE_COLUMN) + ", i." + id.apply(ConfigItem.VALUE_COLUMN)
                + ", i." + id.apply(ConfigItem.ENABLED_COLUMN) + " from " + id.apply(ConfigItem.TABLE) + " i join "
                + id.apply(ConfigProfile.TABLE) + " p on i." + id.apply(ConfigItem.PROFILE_COLUMN) + " = p." + id.apply("id")
                + " where p." + id.apply(ConfigProfile.CODE_COLUMN) + " in (" + String.join(",", Collections.nCopies(profiles.size(), "?")) + ")";
        // …按 profiles 的顺序分层，后一层覆盖前一层
    }
}
```

连接信息来自 `spring.datasource.*`；`EruptConfigEnvironmentPostProcessor` 把合并后的 Map 用 `addFirst` 放在**所有文件之前**。三处细节：

- **层序就是 Spring 的层序。** `ConfigProfile.layers(environment)` 返回 `default` 在前、再接 `spring.profiles.active`（没有活动 profile 时用默认 profile），后者覆盖前者——和 `application-{profile}.yml` 盖在 `application.yml` 上一模一样。
- **首次启动不报错。** 库里还没有这两张表时，`catch` 只打一行 `warn`，上下文照常用文件里的值启动；表由后面的 JPA 建出来。
- **布尔列在 Java 里比较，不在 SQL 里。** 注释写得直白：不同数据库对 boolean 的拼写不同，所以 `enabled` 在 `rows.getBoolean(5)` 里判断。

:::tip 反直觉的一点
这个模块**没有**自己的「读取入口」要你记住。README 里唯一的启用方式是引入依赖，`spring.profiles.active` 也是「nothing erupt-specific」。我们认为配置中心最大的成本不是存储，是**让所有已有代码改用新的读法**——所以干脆不要有新读法。
:::

## 五、「保存即生效」：刷新是三步，不是一个缓存

运行时的核心在 `xyz.erupt.config.service.EruptConfigService#reload`：

```java
private synchronized Set<String> reload() {
    List<ConfigItem> items = this.items();           // 只取 enabled，一层一次查询，保证覆盖顺序
    Map<String, Object> next = new LinkedHashMap<>();
    Map<String, Origin> from = new TreeMap<>();
    for (ConfigItem item : items) {
        Map<String, Object> flat = new LinkedHashMap<>();
        ConfigValues.flatten(item.getKey(), item.getType(), item.getValue(), flat);
        for (String key : flat.keySet()) from.put(key, new Origin(item.getKey(), item.getProfile().getCode(), item.getType(), Boolean.TRUE.equals(item.getSecret())));
        next.putAll(flat);
    }
    MutablePropertySources sources = environment.getPropertySources();
    Map<String, Object> previous = sources.contains(SOURCE) ? ((MapPropertySource) sources.get(SOURCE)).getSource() : Map.of();
    Set<String> changed = new TreeSet<>();
    for (String key : next.keySet()) if (!Objects.equals(previous.get(key), next.get(key))) changed.add(key);
    for (String key : previous.keySet()) if (!next.containsKey(key)) changed.add(key);
    // 整体替换 PropertySource，再让 @Value 字段重新取值，最后发事件
    ...
}
```

保存一个配置项时，`ConfigItemDataProxy` 的 `afterAdd / afterUpdate / afterDelete` 都只做一件事：`configService.refresh()`。它之后发生三件事：

1. **替换 PropertySource。** 新的不可变 Map 整体换掉旧的，读到一半的线程看到的永远是完整的一版。
2. **重设 `@Value` 字段。** `ConfigValueRefresher` 是一个 `BeanPostProcessor`，Bean 创建时记下每个单例上含 `${...}` 的 `@Value` 字段；刷新时对每一个重新 `resolveRequiredPlaceholders`，值变了才 `setField`。含 `#{...}` 的 SpEL 不碰。
3. **发 `EruptConfigRefreshedEvent`。** 携带变化的 key 集合，需要「配置一变就重建连接池」的代码监听它就行。

多节点怎么办：

- 设了 `erupt.redis-session: true`，变更提交后通过 `RedisNotifier` 在 `erupt-config:refresh` 频道广播，消息体是发送方的实例 id，自己跳过自己。
- 没有 Redis 的集群设 `erupt.config.refresh-seconds`，后台线程定时调用 `refreshIfChanged`——比较的是「启用项的数量 + 最近更新时间」这一个聚合签名，**安静的一次轮询只有两条聚合查询，不读任何值**。默认 0，单实例不需要。

## 六、配置界面本身也是 `@Erupt`

`ConfigItem` 有十七种值类型，但库里只有一列 `config_value`。表单上每种类型一个编辑器，用 `@Dynamic` 按 `type` 切换：

```java
@Transient
@EruptField(edit = @Edit(title = "Value", type = EditType.CODE_EDITOR,
        codeEditType = @CodeEditorType(language = "yaml"),
        desc = "A yml fragment; flattened into key.path properties the way Spring reads a file",
        dynamic = @Dynamic(dependField = "type", condition = "value === 'YAML'")))
private String yamlValue;
```

保存时由 `ConfigItemDataProxy#store` 按类型把对应编辑器的值写进 `value`，打开编辑表单时 `editBehavior` 反向填回去。左侧的 profile 树是 `@LinkTree(field = "profile")`，「复制到 profile」是一个 `@RowOperation` + `ConfigItemHandler`，密文项在表格里显示 `••••••`、应用仍能读到。除了启动钩子和刷新器，**没有一行「配置专用的 UI 代码」**——这和第 22 期的 webhook 订阅表是同一个思路。

## 七、跟若依 / JeecgBoot / Nacos / Apollo 怎么比？

我们没有逐项实测这些产品。下表左列是**选型时值得问的问题**，不是对它们的结论；各产品能力以官方文档和实测为准。

| 维度 | 国内对位：选型时该问 | Erupt |
|---|---|---|
| 读取方式 | 若依的「参数设置」、JeecgBoot 的系统配置，业务代码是不是要通过专门的 Service 按 key 取，并自己管缓存？ | `@Value("${k}")` / `Environment` / `@ConfigurationProperties`，另有带类型的 `EruptConfig#get` |
| 环境分层 | 参数表里有没有 profile 这一层？dev / prod 是靠前缀、多库还是别的？ | `ConfigProfile`，沿用 `spring.profiles.active`，`default` 之上叠加 |
| 与文件的关系 | 库里没有的 key 会不会回落到 `application.yml`？ | 会：优先级是活动 profile > `default` > 文件 |
| 独立服务 | Nacos / Apollo 需要多部署一套服务和一个客户端 SDK | 不需要：和后台同进程，用 `spring.datasource.*` 读库 |
| 变更治理 | Nacos / Apollo 有历史版本、灰度、发布审批吗？ | **没有**，见下节 |
| 配置界面 | 运营能不能直接用，类型编辑器丰不丰富？ | 17 种类型的编辑器，密文遮罩、复制到 profile |

## 八、5 分钟上手

从空项目到能访问的 admin 页面，完整流程已经独立成一篇：

**→ [快速部署 / Quick Start](/guide/quick-start)**

`erupt-config` 是可选模块，额外引入 `xyz.erupt:erupt-config` 即可。要用的 profile 完全沿用 Spring 的 `spring.profiles.active`；多节点且没开 Redis 会话时，才需要补一行 `erupt.config.refresh-seconds`。启动后菜单里出现「Config」，新建一个 `app.mail.host`，再用 `@Value("${app.mail.host:localhost}")` 读它。

## 九、代价与下一期预告

这一期不替它遮掩，下面几条都能在源码里对上：

- **没有版本、灰度、审批。** 保存就是覆盖，`ConfigItem` 只有 `enabled` 开关，没有「上一版」，也没有「先发给一个节点」。需要这些治理能力，应该用专门的配置中心。
- **「安全」只做到遮罩。** 密文项在表格和表单里显示 `••••••`，库里仍是明文；`PASSWORD` 类型强制 `secret = true`，但不加密存储。
- **`@Value` 只覆盖字段注入的占位符。** `ConfigValueRefresher` 明确跳过 `#{...}`，构造器和 setter 注入只在启动时解析一次——要对变更做出反应请监听 `EruptConfigRefreshedEvent`。
- **启动依赖数据库可达。** 取不到库就退回文件的值，这是为首次启动设计的退路，不是高可用方案。
- **不是数据字典。** `EruptDict` 回答「这个字段能取哪些值」并驱动下拉框；这个模块回答「某个参数此刻是什么」，驱动代码。

下一期把「配置」换成「交付」：主仓新增 `erupt-ai-dev`，让 Claude Code、Codex 等编码 CLI 在服务器上按需求单改你的 git 仓库。我们最关心的不是它能不能写代码，而是**一个能执行命令的进程该持有什么凭证**——每次运行一枚只指向一张需求的 MCP 令牌，权限借创建者的 AI 角色。

---

:::info 参与讨论
本期涉及的源码：`erupt-plugin/erupt-config/.../boot/EruptConfigEnvironmentPostProcessor.java`、`boot/ConfigJdbcReader.java`、`boot/ConfigValues.java`、`service/EruptConfigService.java`、`service/ConfigValueRefresher.java`、`service/EruptConfig.java`、`model/ConfigItem.java`、`model/ConfigProfile.java`、`proxy/ConfigItemDataProxy.java`，以及 `erupt-test/.../config/ConfigTest.java`。

要不要给配置项加历史版本、要不要支持把变更先推给指定节点，欢迎到 [GitHub Discussions](https://github.com/erupts/erupt/discussions) 投一票。
:::
