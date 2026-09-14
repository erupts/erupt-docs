# Tool Reference & Role Authorization

## Role-Level Dynamic Tool Authorization <Badge type="tip" text="v1.14.3+" />

:::tip
Claw's capability boundaries are determined by role. Administrators naturally have all tools; other roles can only call explicitly authorized Tools — high-risk operations are completely invisible and uncallable for unauthorized roles. This enables Claw to be safely deployed in production environments while providing a personalized AI experience for every user.
:::

In the erupt-ai role management interface, check the available Tools for each role and configure a dedicated system prompt. Changes take effect immediately without a restart. See [Authorize Tools by Role](/en/modules/erupt-ai/tool-auth).

## @Tools Reference Table

The following lists all built-in `@Tool` entries in Erupt AI Claw. They can be selectively authorized in the role configuration interface.

### System Tools

| Tool | Description |
|---|---|
| `getCurrentDateTime` | Get the current date and time |
| `execShell` | Execute a shell command (high-risk; recommend granting to admins only, and requires `enable-exec-shell: true`) |

See [Shell Execution Guardrails](/en/modules/erupt-ai-claw/os#shell-execution-guardrails) for the protection details.

### File Management

All file operations are confined to the current user's sandbox directory (`~/.erupt/{account}`):

| Tool | Description |
|---|---|
| `listFiles` | List files and directories inside the sandbox (name, type, size) |
| `readFile` | Read the content of a text file inside the sandbox |
| `writeFile` | Write a text file inside the sandbox (creates parent directories, overwrites if present) |
| `appendFile` | Append text to a file inside the sandbox (creates it if absent) |
| `deleteFile` | Delete a file or empty directory inside the sandbox |
| `moveFile` | Move or rename a file within the sandbox |

### Spring Boot

| Tool | Description |
|---|---|
| `getActiveProfiles` | Get the currently active Spring profiles |
| `getProperty` | Read the value of a specified Spring configuration property |
| `getScheduledTasks` | Get the list of Spring scheduled tasks |

### JVM Monitoring

| Tool | Description |
|---|---|
| `getJvmMemory` | Get JVM heap memory usage |
| `getJvmUptime` | Get JVM uptime |
| `getThreadInfo` | Get JVM thread details |
| `getGcStats` | Get garbage collection statistics |

### Erupt Data

| Tool | Description |
|---|---|
| `eruptModelList` | Get the list of all Erupt models |
| `eruptSchema` | Get the field schema of a specified Erupt model |
| `eruptDataQuery` | Query the data list of an Erupt model |
| `findEruptDataByPk` | Query a single Erupt data record by primary key |
| `insertEruptData` | Insert a new record into an Erupt model |
| `updateEruptData` | Update a record in an Erupt model |
| `deleteEruptData` | Delete a record from an Erupt model |
| `getEruptModules` | Get the list of loaded Erupt modules |
| `geneEruptCode` | Generate Erupt model code |

### Erupt User

| Tool | Description |
|---|---|
| `eruptUserInfo` | Get the current logged-in user's information |
| `eruptUserPermissions` | Get the current user's permission information |

### Skill Management

| Tool | Description |
|---|---|
| `listSkills` | List all available Skills |
| `getSkillDetail` | Get details of a specified Skill (including the file list under scripts/ and references/) |
| `readSkillFile` | Read a specific file inside a Skill directory (progressive disclosure) |
| `saveSkill` | Create or update a Skill (follows the Agent Skills open standard) |
| `patchSkill` | Patch SKILL.md with an exact find-and-replace — fix a wrong instruction the moment it's discovered, safer than rewriting the whole file |
| `writeSkillFile` | Write a file inside a Skill directory (e.g. scripts/run.sh, references/api_docs.md) |
| `deleteSkill` | Delete a specified Skill |

### Memory Management

| Tool | Description |
|---|---|
| `listMemories` | List all memory entries |
| `getMemory` | Get the content of a specified memory |
| `saveMemory` | Save a memory entry |
| `deleteMemory` | Delete a specified memory |
