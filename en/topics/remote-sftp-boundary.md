---
title: "Security Boundaries for Remote Hosts"
description: "Open an SSH terminal in the browser and the industry gives you two roads — a bastion host (a second account system) or a server panel (installed as root). Erupt bets on a third: a remote host is just an ordinary @Erupt model, going through the same menu permissions and the same DataProxy. The price is that every boundary has to be drawn by hand. This issue lists those lines one by one."
outline: deep
---

# Issue 12 · Security Boundaries for Remote Hosts

> Last issue closed by saying this one would cover the new SFTP file panel in `erupt-remote`. But "you can transfer files now" isn't worth an article on its own — you call `ChannelSftp.put()` through jsch and you're done.
> What is worth writing about is something else: **the moment an admin framework decides to let users touch a production host from the browser, it owes them a list of boundaries.** This issue lays out erupt-remote's list item by item — where we wrote a refusal, and where we deliberately chose not to build something.
>
> _Published 2026-09-18 · ~11 min read_

<div class="topic-mp-qr">
  <img src="/contact/mp-weixin.jpg" alt="Erupt WeChat Official Account" />
  <div class="topic-mp-qr__body">
    <div class="topic-mp-qr__tag">WeChat · Official Account</div>
    <div class="topic-mp-qr__title">Scan to follow the Erupt official account</div>
    <p class="topic-mp-qr__desc">Each issue debuts here, along with release notes, source-code deep dives, and community case studies.</p>
  </div>
</div>

[[toc]]

## 1. Why We Wrote This

"The ops engineer needs to glance at a server log, but he has no jump-host account" — that was the original requirement behind erupt-remote.

In China, there are two mature roads for this, and they are sharply divided:

- **JumpServer** (open-source bastion host): remote access becomes a standalone system. Its own asset inventory, its own user and authorization model, its own session auditing and recording, its own proxy process. The security boundary is crisp, because the whole thing exists precisely to draw that boundary. The cost is one more system to operate, and one more account table that never quite lines up with your business system.
- **1Panel** / **BT Panel (aaPanel)**: remote access becomes a feature. Install the panel, and the panel process itself runs as root on the machine; the terminal is just a tab it throws in. The boundary barely exists — **being able to log into the panel ≈ being able to do anything**.
- **JeecgBoot** / **RuoYi** / **JNPF** and other admin frameworks: they skip this layer entirely. Need to reach a server? Open Xshell.

erupt-remote bets on a third road, and its wager is a sentence that sounds a little dull:

> **A remote host does not deserve its own permission system. It is an ordinary `@Erupt` model, going through the framework's existing menu permissions, `DataProxy`, and row-level filtering.**

The upside is obvious: no second account table, no second org chart to keep in sync. Disable the ops engineer in UPMS and his path to the host is cut in the same second.

The cost is equally obvious: **the framework will not draw the security boundary for you — every line has to be written out in your own business code.** This issue is those lines.

## 2. Three Approaches: Build a Second System / Draw No Boundary / Reuse What Exists

| Dimension | Bastion host (JumpServer) | Panel (1Panel / BT Panel) | Model-as-host (erupt-remote) |
|---|---|---|---|
| Account system | A separate one, synced with the business system | The panel's own, often a single shared admin | **Nothing new** — it's `EruptUser` |
| After a user is disabled | Wait for the next sync | Panel account is separate | **Revoked the same second**, same user table |
| Who can reach which host | Asset authorization matrix | Panel login = every machine | `authUsers` on the host row |
| Credentials at rest | Separate Vault | Panel config file | AES-GCM, see Section 5 |
| Extra processes | Agent deployment required | Panel runs as root permanently | **0**, rides the app's own WebSocket |
| Session recording / audit | Yes | Essentially none | **None** — a deliberate trade-off, see Section 6 |
| File transfer switch | Configured in asset policy | On by default, everywhere | `fileTransfer` boolean on the host row |

Three columns, three cost structures. Whoever picks the third column is buying "no extra system to maintain" and selling "audit depth." That trade pays off for a twenty-person engineering team; it does not pay off for a financial institution that has to pass MLPS Level 3. We're writing that sentence here, not burying it in the FAQ.

## 3. 20 Classes, 6 Routes, 4 Checks

Start with the countable facts. The whole module lives in `erupt-plugin/erupt-remote/`:

- **20 Java classes** (`src/main/java`), 5 of them security-related: `RemoteHostAccess`, `RemoteTicketService`, `RemoteCrypto`, `TofuHostKeyRepository`, `SftpPaths`
- **1 main table** `e_remote_host` + **1 join table** `e_remote_host_user`
- **6 SFTP routes**, all mounted under `/erupt-api/remote/sftp/**`
- **4 checks on every route** — fail one and you get an error back
- **4 config properties**, prefixed `erupt.remote`

The six routes (`RemoteSftpController`):

| Method | Path | Purpose |
|---|---|---|
| GET | `/{id}/home` | Absolute path of the login user's home directory |
| GET | `/{id}/ls?path=` | List a directory |
| GET | `/{id}/download?path=` | Stream a single file down |
| POST | `/{id}/upload?path=&name=` | Request body is the file bytes |
| POST | `/{id}/mkdir?path=&name=` | Create a directory |
| DELETE | `/{id}?path=` | Remove one file, or one **empty** directory |

That last row is the first boundary: **`delete` is never recursive**.

```java
/**
 * Removes one file or one <em>empty</em> directory. Never recursive: clearing a tree is a shell job, where
 * the user sees what they are typing.
 */
public void delete(RemoteHost host, String path) {
    String target = normalize(path);
    if ("/".equals(target)) throw new EruptWebApiRuntimeException(I18nTranslate.$translate("remote.sftp_bad_path"));
    run(host, sftp -> {
        if (sftp.stat(target).isDir()) {
            sftp.rmdir(target);
        } else {
            sftp.rm(target);
        }
        return null;
    });
}
```

Recursive directory deletion is of course buildable. The reason we didn't: a slipped click in a file panel and typing out `rm -rf` in a terminal demand attention on completely different orders of magnitude. **If you want to wipe a tree, go to the terminal, where you can see what you're typing.** The left and right halves of the same page were given different danger levels.

## 4. SFTP Did Not Open a New Authorization Path

The easiest place for a new feature to go wrong is when it casually opens a new road around the old rules.

The SFTP panel and the SSH terminal sit on the same page: the terminal goes over WebSocket, the file panel over REST. Two protocols, two entry points — exactly where "the file panel can read something the terminal can't" is most likely to happen.

`RemoteSftpController` handles it by pulling the checks into one private method, called on the first line of all six routes.

```java
private RemoteHost host(Long id) {
    RemoteHost host = eruptDao.find(RemoteHost.class, id);
    Erupts.requireNonNull(host, I18nTranslate.$translate("remote.host_not_found"));
    Erupts.requireTrue(Boolean.TRUE.equals(host.getEnabled()), I18nTranslate.$translate("remote.host_disabled"));
    Erupts.requireTrue(remoteHostAccess.canOpen(host.getId()), I18nTranslate.$translate("remote.not_authorized"));
    Erupts.requireTrue(RemoteHost.PROTOCOL_SSH.equals(host.getProtocol()) && Boolean.TRUE.equals(host.getFileTransfer()),
            I18nTranslate.$translate("remote.sftp_disabled"));
    return host;
}
```

Four checks: the host exists, it isn't disabled, the current user is authorized, and the protocol is SSH with file transfer switched on for this host. Layer on the method-level `@EruptMenuAuth(RemoteHost.MENU_VALUE)` — menu permission and row-level authorization are two different things, and both are required.

The key point is that **it runs again on every call**, not once when the panel opens. While the page is open, if an admin disables the host, turns off file transfer, or removes this person from `authUsers`, the user's next click is rejected.

The path parameter is handed to a pure function that never touches the network:

```java
public static String normalize(String path) {
    if (path == null || path.isEmpty()) return "/";
    if (path.indexOf('\0') >= 0 || !path.startsWith("/")) throw new IllegalArgumentException("path");
    Deque<String> parts = new ArrayDeque<>();
    for (String seg : path.split("/")) {
        if (seg.isEmpty() || ".".equals(seg)) continue;
        if ("..".equals(seg)) {
            parts.pollLast();
        } else {
            parts.addLast(seg);
        }
    }
    return parts.isEmpty() ? "/" : "/" + String.join("/", parts);
}
```

The entire `SftpPaths` class is 44 lines with zero dependencies, which is why `SftpPathsTest` can unit-test it directly. Upload filenames go through a second function, `fileName()`: no `/`, no `\`, no `\0`, not `.` and not `..` — **a bare filename that always lands in the directory the user is currently in**.

As for permissions on the remote side, we don't touch a single byte: the connection is made as the SSH login user configured on this host, and whatever it can read in a shell, it can read in the file panel. **No second layer of authorization — and therefore no second set of answers that disagrees with the shell.**

## 5. `authUsers`: A Filtered List Is Not Authorization

This is the one part of the module I most want to talk about.

`RemoteHost` carries an utterly ordinary many-to-many field:

```java
@ManyToMany
@JoinTable(name = "e_remote_host_user",
        joinColumns = @JoinColumn(name = "host_id", referencedColumnName = "id"),
        inverseJoinColumns = @JoinColumn(name = "user_id", referencedColumnName = "id"))
@EruptField(
        edit = @Edit(title = "Authorized Users", type = EditType.TAB_TABLE_REFER,
                desc = "Users allowed to see and open this host. Nobody else sees it, whatever their role grants")
)
private Set<EruptUserByRoleView> authUsers;
```

The semantics: **menu permission decides whether a person can touch remote hosts at all; `authUsers` decides which ones. Anyone not named doesn't see the host, whatever their role grants. A host that names nobody can only be opened by the super admin.**

The naive implementation adds a filter to the list query and calls it a day. `erupt-remote` didn't do that:

```java
// List: a query fragment; null for the super admin means no filtering
public String rowFilter(String alias) {
    MetaUserinfo user = eruptUserService.getSimpleUserInfo();
    if (null == user) return alias + ".id is null";
    if (user.isSuperAdmin()) return null;
    Long uid = user.getId();
    return alias + ".id in (select ah.id from RemoteHost ah join ah.authUsers au where au.id = "
            + (null == uid ? -1L : uid) + ")";
}

// Open a connection: skip the list, ask the join table directly
public boolean canOpen(Long hostId) {
    MetaUserinfo user = eruptUserService.getSimpleUserInfo();
    if (null == user) return false;
    if (user.isSuperAdmin()) return true;
    List<Long> authorized = eruptDao.getEntityManager()
            .createQuery("select u.id from RemoteHost h join h.authUsers u where h.id = :id", Long.class)
            .setParameter("id", hostId).getResultList();
    return authorized.contains(user.getId());
}
```

`rowFilter` is wired into the list query by `RemoteHostDataProxy.beforeFetch`; `canOpen` is called separately by the ticket endpoint and by every SFTP route.

:::tip A conclusion worth pinning to the wall
**Filtering a resource out of a list does not protect it — it only moves it one guessed id away.**
The class comment on `RemoteHostAccess` bakes this into the source: _"Both the table and the ticket endpoint ask here: filtering the list alone would leave the host one guessed id away."_ List filtering is UX; endpoint checks are authorization. Both places ask the same method, so the answers can't diverge.
:::

Note that when `null == user`, the return is `alias + ".id is null"` rather than `null`. The difference between the two is "see nothing" versus "see everything" — **in a security-relevant branch, failure must fall toward the closed door.**

Credentials are handled the same way — "never hand them to the browser": `RemoteHostDataProxy` encrypts passwords and private keys with AES-GCM in `beforeAdd` / `beforeUpdate` before persisting (`RemoteCrypto`, 12-byte IV, 128-bit auth tag, ciphertext prefixed with `enc:` to tell it apart from legacy plaintext); in `editBehavior` / `formViewBehavior` it swaps the private key for a masked placeholder before sending it down. If the placeholder comes back unchanged on update, the old value is pulled from `OldEntityTL` — **editing a host's description does not require re-pasting the private key.**

Host public keys use TOFU (trust on first use): `TofuHostKeyRepository` records the host key on first connection and lets it through; if the key changes afterwards, it **refuses the connection** and writes a warn log. That is the default behavior of the `ssh` command line — we invented nothing new.

## 6. How Does It Compare to JumpServer / 1Panel / BT Panel?

| Dimension | JumpServer | 1Panel / BT Panel | erupt-remote |
|---|---|---|---|
| Deployment cost | Standalone system + agent components | Agent/panel installed on the target | **One Maven dependency** |
| What the target machine needs | Usually something | Must install | **Nothing**, standard SSH / VNC |
| Authorization granularity | Asset / account / command level | Essentially none | Host × user (`authUsers`) |
| File transfer switch | Asset policy | On by default | One boolean per host |
| Session recording | ✅ Full | ❌ | ❌ **Not built** |
| Command allow/deny lists | ✅ | ❌ | ❌ **Not built** |
| Credential encryption | Separate Vault | Mostly plaintext config | AES-GCM + key file / config property |
| WebSocket session authorization | Internal ticket | Session | One-time ticket, 60-second TTL |

The two "not built" entries need spelling out, because they decide who this module is for:

**No session recording.** Recording means persisting the terminal byte stream, managing storage quotas and retention, building a replay player — that's an entire product, not a plugin. If you need recording and command auditing, use a bastion host; erupt-remote has no intention of competing with JumpServer for that seat.

**No command allow/deny lists.** Because they create a false sense of security: `rm -rf /` gets blocked, `python -c` doesn't. We'd rather say it plainly — **anyone who can open the terminal has the full capability of that SSH user on that machine**, so treat every name you add to `authUsers` as handing over a key.

As for the WebSocket road, it uses a one-time ticket: `RemoteTicketService` issues a 32-byte `SecureRandom` string, bound to the login token that requested it, with a 60-second TTL, and `consume()` calls `remove` first regardless of whether validation passes. The reason is practical — WebSocket handshakes can't easily carry custom request headers, so the credential ends up in the URL; fine, then whatever lands in the URL **lives for one minute, works exactly once, and is useless in anyone else's hands**.

## 7. Up and Running in 5 Minutes

From an empty Spring Boot project to a reachable admin page, the full flow is its own page:

**→ [Quick Start](/en/guide/quick-start)**

Once that runs, add this one dependency:

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-remote</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

A single-node deployment needs no configuration at all — `RemoteCrypto` generates a random key at `.erupt/remote.key` and sets it to `rw-------`. **Multi-node deployments must explicitly share the same key**, otherwise credentials stored by node A can't be decrypted by node B:

```yaml
erupt:
  remote:
    secret-key: ${ERUPT_REMOTE_KEY}   # Must match across nodes; use an environment variable
    max-sessions: 20                  # Application-wide cap on concurrent desktop sessions
    idle-timeout-minutes: 30          # Disconnect after this long without input
    connect-timeout-seconds: 5        # TCP connect timeout
```

After a restart, **Remote Hosts** appears in the menu. Add an SSH host, name people under **Authorized Users**, switch on **File Transfer**, and the **Connect** row action opens a terminal with a file panel attached. The full module reference is in the [erupt-remote module docs](/en/modules/erupt-remote).

---

:::info Join the discussion
The core source for this issue lives in [`erupt-plugin/erupt-remote`](https://github.com/erupts/erupt/tree/master/erupt-plugin/erupt-remote); the authorization logic is concentrated in [`xyz.erupt.remote.service.RemoteHostAccess`](https://github.com/erupts/erupt/blob/master/erupt-plugin/erupt-remote/src/main/java/xyz/erupt/remote/service/RemoteHostAccess.java), and the path rules in [`xyz.erupt.remote.util.SftpPaths`](https://github.com/erupts/erupt/blob/master/erupt-plugin/erupt-remote/src/main/java/xyz/erupt/remote/util/SftpPaths.java). Come post on [GitHub Discussions](https://github.com/erupts/erupt/discussions).
:::
