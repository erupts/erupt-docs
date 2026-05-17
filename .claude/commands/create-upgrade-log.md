根据 Git 提交记录，为 Erupt 框架生成格式规范的升级日志。

## 升级日志位置

`/guide/changelog.md`

## 涉及仓库

| 仓库 | 分支 | 用途 |
| --- | --- | --- |
| `erupt`（后端） | `develop` | 核心功能、API 变更 |
| `erupt-web`（前端） | `develop` | UI 交互、前端修复 |
| `erupt-site`（官网） | `master` | 功能描述参考、新模块确认 |

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

6. **生成日志条目**：在 `/guide/changelog.md` 顶部插入新版本块，格式示例：
   ```markdown
   ## 1.x.x（YYYY-MM-DD） <Badge type="tip" text="Spring Boot x.x.x" />

   🌟 新增 [erupt-xxx](/modules/erupt-xxx) 模块，一句话说明用途

   🐞 修复 `@SomeAnnotation` 在特定场景下的问题描述
   ```
   - 每条独占一行，条目间空一行
   - 语言：**中文**，一行内说完，聚焦用户可感知的变化
   - 版本号不确定时，先询问用户

7. **同步侧边栏**：若 `.vitepress/config.mts` 的 `/guide/` sidebar 中缺少 changelog 条目，补充进去。

## Emoji 约定

| Emoji | 含义 |
| --- | --- |
| 🌟 | 新功能、性能大幅提升、重要新能力 |
| 🐞 | Bug 修复 |
| 🧩 | 模块增强、配置新增、体验优化 |
| 🦞 | 新模块/插件开源发布 |

## 注意事项

- 跳过纯内部重构、typo 修复、CI 配置、依赖小版本 bump 等用户无感知的提交。
- 依赖大版本升级（如 Spring Boot、langchain4j）值得记录。
- 贡献者 PR 合并后，格式参考：`感谢 [用户名](https://github.com/用户名) 贡献的代码`。
- 破坏性变更（API 改动、配置重命名、数据库表变更）单独列为升级指南章节。
