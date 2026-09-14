# Shell & File Operations

<img src="/ai-claw/os-1.png" width="803">

<img src="/ai-claw/os-2.png" width="739">

<img src="/ai-claw/os-3.png" width="632">


## Shell Execution Guardrails

`execShell` is off by default and must be enabled explicitly with `erupt.ai.claw.enable-exec-shell: true`; granting it to the admin role only is recommended. Even when enabled, several guardrails apply in order:

1. **Hardline deny list**: catastrophic commands like `rm -rf /`, fork bombs, `mkfs`, shutdown/reboot, and raw device writes are always blocked and cannot be configured away;
2. **Directory sandbox**: commands are anchored to the current user's sandbox `~/.erupt/{account}`; other directories must be allowlisted via `erupt.ai.claw.shell-allowed-paths`;
3. **Sensitive env stripping**: environment variables whose names contain KEY / TOKEN / SECRET / PASSWORD etc. are not inherited by the child process;
4. **Output truncation**: output is capped at 64KB per command, with a 600-second max timeout (default 30 seconds).

The file tools (`readFile` / `writeFile` and friends) are confined to the same sandbox directory; see the full [@Tools Reference Table](/en/modules/erupt-ai-claw/tools).
