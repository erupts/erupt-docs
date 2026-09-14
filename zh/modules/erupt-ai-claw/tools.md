# 工具清单与角色授权

## 🔐 角色级动态 Tool 授权 <Badge type="tip" text="v1.14.3+" />

:::tip
Claw 的能力边界由角色决定。管理员天然持有全量工具，其余角色仅能调用被显式授权的 Tool——高危操作对无权角色完全不可见、不可调用，使 Claw 具备在生产环境安全部署的能力，同时实现 AI 能力千人千面。
:::

在 erupt-ai 的角色管理界面中为每个角色勾选可用 Tool，并配置专属系统提示词，保存即时生效，无需重启。详见 [按角色授权 Tool](/zh/modules/erupt-ai/tool-auth)。

## @Tools 说明表

以下为 Erupt AI Claw 内置的全部 `@Tool`，可在角色配置界面中按需勾选授权。

### 系统工具

| Tool | 说明 |
|---|---|
| `getCurrentDateTime` | 获取当前日期与时间 |
| `execShell` | 执行 Shell 命令（⚠️ 高危，建议仅授权管理员，且需 `enable-exec-shell: true` 显式开启） |

防护机制详见 [Shell 执行防护](/zh/modules/erupt-ai-claw/os#shell-执行防护)。

### 文件管理

文件读写均限定在当前用户的沙箱目录（`~/.erupt/{account}`）内：

| Tool | 说明 |
|---|---|
| `listFiles` | 列出沙箱内的文件与目录（名称、类型、大小） |
| `readFile` | 读取沙箱内的文本文件内容 |
| `writeFile` | 在沙箱内写入文本文件（自动创建父目录，存在则覆盖） |
| `appendFile` | 向沙箱内文件追加文本（不存在则创建） |
| `deleteFile` | 删除沙箱内的文件或空目录 |
| `moveFile` | 在沙箱内移动或重命名文件 |

### Spring Boot

| Tool | 说明 |
|---|---|
| `getActiveProfiles` | 获取当前激活的 Spring Profile |
| `getProperty` | 读取指定 Spring 配置属性值 |
| `getScheduledTasks` | 获取 Spring 调度任务列表 |

### JVM 监控

| Tool | 说明 |
|---|---|
| `getJvmMemory` | 获取 JVM 堆内存使用情况 |
| `getJvmUptime` | 获取 JVM 已运行时长 |
| `getThreadInfo` | 获取 JVM 线程详情 |
| `getGcStats` | 获取垃圾回收统计信息 |

### Erupt 数据

| Tool | 说明 |
|---|---|
| `eruptModelList` | 获取所有 Erupt 模型列表 |
| `eruptSchema` | 获取指定 Erupt 模型的字段 Schema |
| `eruptDataQuery` | 查询 Erupt 模型数据列表 |
| `findEruptDataByPk` | 按主键查询单条 Erupt 数据 |
| `insertEruptData` | 向 Erupt 模型新增一条数据 |
| `updateEruptData` | 更新 Erupt 模型中的数据 |
| `deleteEruptData` | 删除 Erupt 模型中的数据 |
| `getEruptModules` | 获取已加载的 Erupt 模块列表 |
| `geneEruptCode` | 生成 Erupt 模型代码 |

### Erupt 用户

| Tool | 说明 |
|---|---|
| `eruptUserInfo` | 获取当前登录用户信息 |
| `eruptUserPermissions` | 获取当前用户的权限信息 |

### Skill 管理

| Tool | 说明 |
|---|---|
| `listSkills` | 列出所有可用 Skill |
| `getSkillDetail` | 获取指定 Skill 的详情（含 scripts/、references/ 文件清单） |
| `readSkillFile` | 读取 Skill 目录下指定文件内容（渐进式加载） |
| `saveSkill` | 创建或更新 Skill（遵循 Agent Skills 开放标准） |
| `patchSkill` | 对 SKILL.md 做精确查找替换式修补——发现指令有误可即时修正，比整篇重写更安全 |
| `writeSkillFile` | 向 Skill 目录写入文件（如 scripts/run.sh、references/api_docs.md） |
| `deleteSkill` | 删除指定 Skill |

### 记忆管理

| Tool | 说明 |
|---|---|
| `listMemories` | 列出所有记忆条目 |
| `getMemory` | 获取指定记忆内容 |
| `saveMemory` | 保存一条记忆 |
| `deleteMemory` | 删除指定记忆 |
