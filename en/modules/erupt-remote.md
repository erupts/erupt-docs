# Erupt Remote

erupt-remote bridges remote machines into the browser: VNC desktops rendered with noVNC, SSH shells with xterm.js, both over one WebSocket channel — no client-side tooling required.

> Minimum version: **2.2.0**

:::warning Security note
Remote access hands control of a machine to a browser tab. **Grant it to trusted administrators only**, and always run it over HTTPS/WSS in production.
:::

## Setup

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-remote</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

Auto configuration adds a **Remote Host** (`RemoteHost`) table menu.

## How it works

1. Add a record in the **Remote Host** table with the address, port and protocol.
2. Click the **Connect** row button to open the desktop or terminal page at the in-app route `/remote/{id}`.
3. The server bridges a binary WebSocket (`/erupt-remote`) to the host's port.

**VNC desktop (Windows)**

![VNC desktop on Windows](/erupt-remote/vnc-windows.png)

**VNC desktop (macOS)**

![VNC desktop on macOS](/erupt-remote/vnc-macos.png)

**SSH terminal**

![SSH terminal](/erupt-remote/ssh-terminal.png)

## Session Toolbar

The desktop and terminal pages share a toolbar along the top; a dot on the left shows the session state (connecting / connected / disconnected).

**VNC desktop**

| Button | What it does |
| --- | --- |
| Keys | Sends combinations the browser cannot pass through: `Ctrl + Alt + Del`, `Alt + Tab`, `Tab`, `Esc`, `Print Screen` |
| Paste | Sends the local clipboard to the remote desktop |
| Shot | Captures the current frame and downloads it |
| Quality | Bandwidth presets: Low bandwidth, Balanced, Best quality |
| Power | Remote power actions: Reboot, Reset, Shut down |
| View only | Watch without sending any input |
| Fit | Scale the frame to fit the window |
| Fullscreen | Go fullscreen |
| Disconnect | End the session; the button becomes Reconnect |

**SSH terminal**

| Button | What it does |
| --- | --- |
| Ctrl+C | Sends an interrupt to the remote process |
| Paste | Pastes the local clipboard |
| Clear | Clears the screen |
| Fullscreen | Go fullscreen |
| Disconnect | End the session; the button becomes Reconnect |

SSH hosts with file transfer enabled also get a **Files** button that opens an SFTP panel next to the terminal — see [SFTP File Transfer](#sftp-file-transfer) below.

## SFTP File Transfer <Badge type="tip" text="v2.3.0+" />

The **Files** button on the SSH terminal page opens a side panel that works on the remote file system over the SFTP subsystem — nothing extra to install on the target host:

- **Browse**: starts in the login user's home directory and descends into any directory; directories first, sorted by name, and symlinks are shown as what they point at so linked directories can be entered.
- **Upload**: pick files with the button or drag-and-drop them onto the panel; shows progress, and an existing file of the same name is replaced.
- **Download**: saves a remote file to the local machine as an attachment.
- **New folder**: creates a subdirectory in the current directory.
- **Delete**: removes one file, or one **empty** directory.
- **Insert path**: types an entry's quoted path into the shell, ready for the next command.

The panel is shown only when the host has **file transfer enabled**. VNC hosts have no file channel (the RFB protocol has none) — configure the same machine as an SSH host when files need to move.

### Per-host toggle

The **File Transfer** switch on the **Remote Host** record (`RemoteHost.fileTransfer`, column `e_remote_host.file_transfer`, `BIT(1)`) defaults to on and is shown only when the protocol is SSH. Turning it off:

- removes the **Files** button from the terminal page;
- makes every SFTP endpoint refuse with "File transfer is not enabled for this host";
- leaves the shell itself untouched.

Use it for hosts whose users should type commands but not carry files in or out.

### Security notes

| Concern | How it is handled |
| --- | --- |
| Connections | Every call opens its own **short-lived** SSH session and closes it when done; it is never tied to the terminal WebSocket, so a dropped terminal does not kill a running download |
| Credentials and host keys | **Shared** with the terminal: the record's username / password / private key, the TOFU host-key policy (`.erupt/remote_known_hosts`) and `connect-timeout-seconds`. Remote permissions are those of the SSH login user |
| Authorization | Re-checked on every call: erupt-upms token + the `RemoteHost` menu permission + host **Enabled** + **Authorized Users** + the **File Transfer** toggle. A host that was disabled, lost this user or had file transfer switched off after the page opened is refused on the next click |
| Path rules | Enforced by `SftpPaths`: paths must be absolute, `.` / `..` are resolved lexically on the server, and any NUL character is rejected; names for new folders and uploads must be bare file names — no `/` or `\`, not `.` or `..` |
| Deletion | **Never recursive**: only a single file or an empty directory, and `/` is refused. Clearing a tree is a shell job, where the user sees what they are typing |
| Uploads | The raw request body is **streamed straight into SFTP** — no temp file, no multipart, hence no multipart size ceiling; size a reverse proxy's `client_max_body_size` accordingly |

### Endpoints

All routes live under `/erupt-api/remote/sftp/{id}` (`{id}` is the host record id), require the `RemoteHost` menu permission, and take absolute paths on the remote host:

| Method | Path | Params | What it does |
| --- | --- | --- | --- |
| GET | `/{id}/home` | — | Absolute path of the login user's home directory |
| GET | `/{id}/ls` | `path` | Lists a directory; returns `name` / `directory` / `size` / `mtime` / `mode` |
| GET | `/{id}/download` | `path` | Streams a file as an attachment, `_token` in the URL; refuses directories |
| POST | `/{id}/upload` | `path` (directory), `name` | Request body is the file content, written to `path/name`, replacing an existing file |
| POST | `/{id}/mkdir` | `path` (directory), `name` | Creates directory `name` under `path` |
| DELETE | `/{id}` | `path` | Removes one file or one empty directory |

## Host fields

| Field | Meaning |
| --- | --- |
| Host Name | Display name in the list |
| Protocol | `VNC` (desktop) or `SSH` (terminal) |
| Host | IP address or hostname reachable from the erupt server |
| Port | 5900 for VNC, 22 for SSH |
| Username | SSH login user, shown when the protocol is SSH |
| Password | VNC: the server password (first 8 characters are used). SSH: the login password, or the passphrase when a private key is set |
| Private Key | PEM private key for SSH public-key authentication; takes precedence over the password |
| File Transfer <Badge type="tip" text="v2.3.0+" /> | Whether to show the SFTP file panel (browse, upload, download) next to the SSH terminal. On by default, shown only when the protocol is SSH; when off, the Files button and the SFTP endpoints are disabled while the shell is untouched |
| Enabled | Disabled hosts cannot be connected |

Credentials are stored **AES-GCM encrypted**. The key comes from `erupt.remote.secret-key`, or is generated once into `.erupt/remote.key` when that is empty.

## Security model

| Concern | How it is handled |
| --- | --- |
| Target address | Resolved server-side from the record id; the browser can never choose where the connection goes |
| Authorization | erupt-upms token + the `RemoteHost` menu permission (checked on the ticket API and again on the WebSocket) + a one-time ticket |
| VNC password | When a password is stored the server answers the RFB authentication itself, so the credential never reaches the browser. Without one (or against servers offering only other security types, e.g. macOS Apple Remote Desktop authentication) the handshake is relayed and noVNC prompts the user |
| SSH host keys | Trust on first use, recorded in `.erupt/remote_known_hosts`; a changed key is refused |
| Sessions | Global concurrency cap plus idle reaping |

## Configuration

```yaml
erupt:
  remote:
    # Credential encryption key; inject it from the environment.
    # Multi-node deployments must share one value across every node
    secret-key: ${ERUPT_REMOTE_SECRET_KEY}
    # Global concurrent session limit
    max-sessions: 20
    # Sessions without browser input for this long are closed (minutes)
    idle-timeout-minutes: 30
    # TCP connect timeout towards the remote host (seconds)
    connect-timeout-seconds: 5
```

## Nginx

As with erupt-terminal, forward the WebSocket upgrade for `/erupt-remote`:

```nginx
location /erupt-remote {
    proxy_pass http://backend;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 3600s;
}
```

## Preparing the Target Host

erupt-remote is a VNC **client**: the target host must already run a VNC server (SSH just uses the system's own sshd, nothing to install). Any RFB 3.3 / 3.7 / 3.8 server works.

### Windows: install a VNC server yourself

Windows ships **no VNC server** — its built-in Remote Desktop speaks RDP, which is a different protocol — so one has to be installed:

| Software | Download | Notes |
| --- | --- | --- |
| TightVNC | [tightvnc.com/download.php](https://www.tightvnc.com/download.php) | Free and small, server included in the installer — the easiest start |
| UltraVNC | [uvnc.com/downloads/ultravnc.html](https://uvnc.com/downloads/ultravnc.html) | Free, more features (file transfer, multi-monitor) |
| TigerVNC | [github.com/TigerVNC/tigervnc/releases](https://github.com/TigerVNC/tigervnc/releases) | Open source, cross-platform |
| RealVNC Server | [realvnc.com/download/vnc](https://www.realvnc.com/en/connect/download/vnc/) | Commercial, with a free tier for personal use |

With TightVNC:

1. Download the MSI for your architecture (`tightvnc-x.x.x-gpl-setup-64bit.msi` on 64-bit Windows).
2. Choose **Typical** during setup and keep the **TightVNC Server** component selected.
3. The installer asks for a password — what you enter under **Password for Remote Access** is the password to put in the erupt host record.
4. The server then runs as a Windows service on port **5900**; right-click the tray icon → **Configuration** to change the password or port later.
5. Allow inbound connections on port 5900 in Windows Defender Firewall (the installer usually offers to add the rule).

:::tip Only the first 8 characters of a VNC password count
That is a limit of the RFB protocol itself, not of erupt. Keep the password to 8 characters to avoid the "I set a long password and it won't connect" puzzle.
:::

### macOS: turn on the built-in Screen Sharing

macOS has a VNC server built in; it only needs to be enabled for password access:

1. Open **System Settings → General → Sharing** (older releases: System Preferences → Sharing).
2. Turn on **Screen Sharing**.
3. Click the **ⓘ** button next to it → **Computer Settings…**.
4. Tick **"VNC viewers may control screen with password"** and set a password (again, only the first 8 characters count).
5. Make sure the **Allow access for** list includes the account you intend to use.

Then fill the host record with the Mac's IP, port `5900`, and that VNC password.

:::info Without a VNC password
Skip step 4 and macOS offers only Apple Remote Desktop authentication. The server cannot answer that on your behalf, so erupt **relays the handshake** and noVNC prompts in the browser for the macOS username and password — the connection still works, the credentials are simply not held server-side.
:::

### Linux: x11vnc or TigerVNC

- **Share the existing physical desktop**: `x11vnc`, e.g. `sudo apt install x11vnc`, then `x11vnc -display :0 -rfbauth ~/.vnc/passwd -forever` (`x11vnc -storepasswd` writes the password file).
- **Start a separate virtual desktop**: `tigervnc-standalone-server` — set a password with `vncpasswd`, run `vncserver :1`, and the port is `5901` (5900 + display number).

For pure command-line work, use the **SSH** protocol instead — no VNC server needed at all.

:::tip How this differs from erupt-terminal
[erupt-terminal](/en/modules/erupt-terminal) opens a shell on **the host running erupt itself**; erupt-remote connects to **other managed machines**, kept as records, authorized through a menu, and able to show a graphical desktop. Full comparison: [erupt-terminal → How This Differs from erupt-remote](/en/modules/erupt-terminal#how-this-differs-from-erupt-remote).
:::
