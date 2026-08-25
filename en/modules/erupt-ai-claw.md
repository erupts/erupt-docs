# Erupt AI Claw

<a href="https://www.erupt.xyz/#!/ai-claw" target="_blank">
  <img src="/ai-claw/banner.png" width="1747">
</a>

:::info
Erupt AI Claw lets you drive the server directly through natural language — operating annotation-driven data and business, executing shell commands, reading and writing files, and extending custom Skills, as simply as chatting with a colleague.

A self-evolving agent that works and learns simultaneously, supports dozens of models interchangeably, auto-expands its skill library, and intelligently searches conversation memory. The agent learns while working and can run on an ordinary computer.
:::

[Erupt Engine](https://www.erupt.xyz/#!/ai-claw)

## Usage

```xml
<!-- Supported from version 1.14.1 and above -->
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-claw</artifactId>
    <version>${LATEST}</version>
</dependency>
```

```yaml
erupt:
  ai:
    claw:
      # Whether to enable Claw
      enabled: true
      # Whether to allow executing shell commands (default false; must be enabled explicitly)
      enable-exec-shell: false
      # Allowlist of directories outside the sandbox where shell commands may run (absolute paths)
      shell-allowed-paths: []
      # Daily background archiving of stale skills (moved to .archive, never deleted)
      skill-curator-enabled: true
      # A skill unused for this many days is considered stale
      skill-stale-days: 30
```

:::warning
Claw has full tool permissions by default. **In production environments, restrict the available Tool scope via role configuration** (supported from v1.14.3+, see [Role-Level Tool Authorization](/en/modules/erupt-ai#role-level-tool-authorization)). Security first!
:::

## Token Preparation

The effectiveness of Claw varies by model. Mainstream public models are recommended.

## Claw and SKILLS

:::info
Supports interaction with 700,000+ Skills, and can also dynamically create Skills via prompts. Erupt Claw will automatically match and execute the corresponding Skill based on the prompt.

Skill marketplace: [https://skills.sh](https://skills.sh/)
:::

```shell
# You can also manually place skill files in the following directory
~/.erupt/skills/
```

**Creating a SKILL**

<img src="/ai-claw/skill-create-1.png" width="792">

<img src="/ai-claw/skill-create-2.png" width="1252">

**Executing a SKILL**

<img src="/ai-claw/skill-run-1.png" width="897">

<img src="/ai-claw/skill-run-2.png" width="763">

<img src="/ai-claw/skill-run-3.png" width="817">

<img src="/ai-claw/skill-run-4.png" width="752">

## Claw and Erupt Model Interaction

Creating an organizational structure via conversation (data insertion):

<img src="/ai-claw/erupt-create.png" width="1362">

**Data Update**

<img src="/ai-claw/erupt-update.png" width="1169">

**Data Creation and Content Generation**

<img src="/ai-claw/erupt-content.png" width="1756">

**Querying Model Data**

<img src="/ai-claw/erupt-query.png" width="902">

## Claw and Operating System Interaction

<img src="/ai-claw/os-1.png" width="803">

<img src="/ai-claw/os-2.png" width="739">

<img src="/ai-claw/os-3.png" width="632">

## Claw and Browser Interaction

This can be achieved indirectly via the MCP feature. Add the following configuration in the MCP menu:

```json
{
  "args": [
    "-y",
    "chrome-devtools-mcp@latest"
  ],
  "command": "npx"
}
```

<img src="/ai-claw/browser-1.png" width="1680">

<img src="/ai-claw/browser-2.png" width="1861">

## Claw and Long-Term Memory

erupt-ai-claw supports cross-session long-term memory persistence via the Memory tool.

During a conversation, the AI automatically judges and saves important information (technical decisions, user preferences, project context, etc.) as memory entries. At the start of the next session, relevant memories are automatically retrieved — no need to re-explain the background.

Memories are persisted in the database (`AiMemory` table), isolated per user — each user can only read and write their own memories.

<img src="/ai-claw/memory-1.png" width="783">

<img src="/ai-claw/memory-2.png" width="748">

<img src="/ai-claw/memory-3.png" width="769">

<img src="/ai-claw/memory-4.png" width="730">

## Claw and Spring Boot

Supports obtaining real-time service status and configuration information through conversation.

**Retrieve Thread Information**

<img src="/ai-claw/spring-threads.png" width="759">

**Retrieve Configuration Information**

<img src="/ai-claw/spring-config.png" width="759">

**Retrieve GC Information**

<img src="/ai-claw/spring-gc.png" width="757">

**Retrieve Scheduler Information**

<img src="/ai-claw/spring-scheduler.png" width="756">

## Role-Level Dynamic Tool Authorization <Badge type="tip" text="v1.14.3+" />

:::tip
Claw's capability boundaries are determined by role. Administrators naturally have all tools; other roles can only call explicitly authorized Tools — high-risk operations are completely invisible and uncallable for unauthorized roles. This enables Claw to be safely deployed in production environments while providing a personalized AI experience for every user.
:::

In the erupt-ai role management interface, check the available Tools for each role and configure a dedicated system prompt. Changes take effect immediately without a restart. See [Role-Level Tool Authorization](/en/modules/erupt-ai#role-level-tool-authorization).

## @Tools Reference Table

The following lists all built-in `@Tool` entries in Erupt AI Claw. They can be selectively authorized in the role configuration interface.

### System Tools

| Tool | Description |
|---|---|
| `getCurrentDateTime` | Get the current date and time |
| `execShell` | Execute a shell command (high-risk; recommend granting to admins only, and requires `enable-exec-shell: true`) |

`execShell` has multiple built-in guardrails, in evaluation order:

1. **Hardline deny list**: catastrophic commands like `rm -rf /`, fork bombs, `mkfs`, shutdown/reboot, and raw device writes are always blocked and cannot be configured away;
2. **Directory sandbox**: commands are anchored to the current user's sandbox `~/.erupt/{account}`; other directories must be allowlisted via `erupt.ai.claw.shell-allowed-paths`;
3. **Sensitive env stripping**: environment variables whose names contain KEY / TOKEN / SECRET / PASSWORD etc. are not inherited by the child process;
4. **Output truncation**: output is capped at 64KB per command, with a 600-second max timeout (default 30 seconds).

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
