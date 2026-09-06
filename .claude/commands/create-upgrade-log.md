根据 Git 提交记录，为 Erupt 框架生成格式规范的升级日志。

## 升级日志位置

`/guide/changelog.md`

## 涉及仓库

| 仓库               | 分支        | 用途                              |
|------------------|-----------|---------------------------------|
| `erupt`（后端）      | `develop` | 核心功能、API 变更                     |
| `erupt-web`（前端）  | `develop` | UI 交互、前端修复                      |
| `erupt-site`（官网） | `master`  | 功能描述参考、新模块确认                    |
| `erupt-cube`     | `master`  | 核心功能、API 变更、BUG 修复              |
| `erupt-flow`     | `master`  | 核心功能、API 变更、BUG 修               |
| `erupt-start`    | `master`  | 快速下载 erupt 项目，需要更新对应版本号与最新的项目结构 |

## 执行步骤

1. **确定起始时间**：读取 `/guide/changelog.md`，找到最新版本的发布日期，以该日期作为 `git log` 的 `--after` 参数。

2. **拉取提交记录**：在三个仓库中分别执行：
   ```bash
   git log --format="%h %ad %s" --date=short --after="<date>" <branch>
   ```
   过滤掉纯内部提交（Merge、typo、README、style 微调、版本号 bump）。

3. **参考 erupt-site 补充描述**：`erupt-site/master` 的 `i18n.csv` 和各页面往往包含新功能的官方中文描述，可直接引用或参考措辞。

4. **归类整理**：将提交按以下类别分组（沿用现有 emoji 风格）：
    - 🌟 新功能 / 重要改进
    - 🐞 Bug 修复
    - 🧩 模块增强 / 体验优化
    - 🦞 开源发布（新模块、新插件）

5. **文档链接处理**：
    - 每条值得链接的功能，附上文档链接：`[功能名](/path/to/doc#anchor)`
    - 检查对应文档页是否存在（`Glob` 或 `Read`）；**不存在则新建文档章节或文件**
    - 新功能文档优先追加到最相关的现有 `.md` 文件末尾，而非新建独立页面
    - 新建页面时，同步在 `.vitepress/config.mts` 的对应 sidebar 组中添加条目

6. **识别数据库字段调整**：扫描各仓库 JPA 实体类的变更，凡是会改变表结构的提交都要产出 SQL：
   ```bash
   git log --after="<date>" -p --format="== %h %s" <branch> -- '*/model/*.java' '*/entity/*.java' \
     | grep -E '^(==|[+-]\s+(private |@Column|@Lob|@Table|@JoinColumn|@JoinTable|@ManyToOne|@OneToOne|@ManyToMany|@Enumerated))'
   ```
    - 需要关注的变化：新增 / 删除字段、字段重命名、`@Column(length/nullable/unique)` 调整、`@Lob` 增减、关联字段（`@ManyToOne` 生成 `<字段>_id` 外键列，`@ManyToMany` 生成中间表）、`@Table(name)` 改名
    - 表名取 `@Table(name = "e_xxx")`，未标注时取类名的 snake_case；列名取 `@Column(name)`，未标注时取字段名的 snake_case（`encryptType` → `encrypt_type`）
    - 只涉及 `@EruptField` 展示配置、`transient` 字段、`@Transient` 字段的改动不产生 SQL
    - 统一使用 **MySQL 语法**，其他数据库由用户自行转换；有变更时在 changelog 版本块末尾追加 `### 数据库变更` 小节，同时同步到 `/guide/upgrade.md` 的对应版本章节（zh / en 双语）：

   ````markdown
   ### 数据库变更

   :::info
   表结构变更由 JPA / Hibernate 在启动时自动执行，仅当项目禁用了自动 DDL（`spring.jpa.hibernate.ddl-auto=none` 或 `validate`）时才需手动执行。
   :::

   #### `e_upms_user` 表新增字段

   ```sql
   ALTER TABLE e_upms_user ADD COLUMN salt         VARCHAR(64)  COMMENT '密码盐';
   ALTER TABLE e_upms_user ADD COLUMN encrypt_type VARCHAR(20)  COMMENT '加密方式';
   ```
   ````

    - MySQL 语句模板（一张表一个 `####` 小标题，列名与类型对齐）：

   | 变更类型 | MySQL 语法 |
   |---------|-----------|
   | 新增字段 | `ALTER TABLE t ADD COLUMN c TYPE [DEFAULT x] [COMMENT '说明'];` |
   | 修改类型 / 长度 | `ALTER TABLE t MODIFY COLUMN c TYPE;` |
   | 字段重命名 | `ALTER TABLE t CHANGE COLUMN old_c new_c TYPE;` |
   | 删除字段 | `ALTER TABLE t DROP COLUMN c;` |
   | 新增索引 / 唯一索引 | `ALTER TABLE t ADD [UNIQUE] INDEX idx_t_c (c);` |
   | 新增外键列 | `ALTER TABLE t ADD COLUMN xxx_id BIGINT;` + `ALTER TABLE t ADD CONSTRAINT fk_t_xxx FOREIGN KEY (xxx_id) REFERENCES e_xxx (id);` |
   | 表重命名 | `RENAME TABLE old_t TO new_t;` |
   | 新增中间表 | `CREATE TABLE a_b (a_id BIGINT NOT NULL, b_id BIGINT NOT NULL, PRIMARY KEY (a_id, b_id));` |

    - Java 类型 → MySQL 类型对照（Hibernate 6 在 MySQL 下的默认映射）：

   | Java 类型 | MySQL 类型 |
   |----------|-----------|
   | `String` | `VARCHAR(255)`，有 `@Column(length = n)` 时为 `VARCHAR(n)` |
   | `String` + `@Lob` | `LONGTEXT` |
   | `Integer` / `int` | `INT` |
   | `Long` / `long` | `BIGINT` |
   | `Boolean` / `boolean` | `BIT(1)` |
   | `Double` | `FLOAT(53)` |
   | `Float` | `FLOAT(24)` |
   | `BigDecimal` | `DECIMAL(38,2)` |
   | `Date` / `LocalDateTime` | `DATETIME(6)` |
   | `LocalDate` | `DATE` |
   | `LocalTime` | `TIME(6)` |
   | 枚举（默认 `ORDINAL`） | `TINYINT`，`@Enumerated(STRING)` 时为 `VARCHAR(255)` |
   | `@ManyToOne` / `@OneToOne` | `BIGINT`，列名 `<字段名>_id` |

    - 删除字段、重命名字段属于**破坏性变更**，除 SQL 外还需在升级指南中说明数据迁移方式（先 `ADD` 新列、`UPDATE` 迁移数据、再 `DROP` 旧列）

7. **生成日志条目**：在 `/guide/changelog.md` 顶部插入新版本块，格式示例：
   ```markdown
   ## 1.x.x（YYYY-MM-DD） <Badge type="tip" text="Spring Boot x.x.x" />

   🌟 新增 [erupt-xxx](/modules/erupt-xxx) 模块，一句话说明用途

   🐞 修复 `@SomeAnnotation` 在特定场景下的问题描述
   ```
    - 每条独占一行，条目间空一行
    - 语言：**中文**，一行内说完，聚焦用户可感知的变化
    - 版本号不确定时，先询问用户

8. **同步侧边栏**：若 `.vitepress/config.mts` 的 `/guide/` sidebar 中缺少 changelog 条目，补充进去。

## Emoji 约定

| Emoji | 含义               |
|-------|------------------|
| 🌟    | 新功能、性能大幅提升、重要新能力 |
| 🐞    | Bug 修复           |
| 🧩    | 模块增强、配置新增、体验优化   |
| 🦞    | 新模块/插件开源发布       |

## 注意事项

- 跳过纯内部重构、typo 修复、CI 配置、依赖小版本 bump 等用户无感知的提交。
- 依赖大版本升级（如 Spring Boot、langchain4j）值得记录。
- 贡献者 PR 合并后，格式参考：`感谢 [用户名](https://github.com/用户名) 贡献的代码`。
- 破坏性变更（API 改动、配置重命名、数据库表变更）单独列为升级指南章节。
- 数据库字段调整的 SQL 统一使用 MySQL 语法，参考步骤 6；无表结构变更的版本不写 `### 数据库变更` 小节。
