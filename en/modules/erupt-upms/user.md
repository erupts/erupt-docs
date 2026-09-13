# User Management

Manages every account that can log in. The left panel is the organization tree, the right panel the user list. Select an organization to filter.

## Fields

The form is split into Account Info, Organization, Password and Security sections:

| Option | Description |
| --- | --- |
| Account | Login name, fixed after creation |
| Full Name / Phone / Email | Profile data; email is format-checked |
| Account Status | Active allows login; Locked rejects it with a message |
| Admin User | A super admin bypasses all menu permissions and data scopes. **Only a super admin can make someone an admin** |
| Home Menu | Menu opened after login; the system home is used when empty |
| Org / Post | Drive [data visibility](/en/modules/erupt-upms/org-post#data-visibility); an org must be set before a post |
| Responsible Org / Supervising Org | Multi-select, used by erupt-flow to find approvers |
| Password / Confirm Password | Required on add; leave empty on edit to keep the current one |
| Encrypt | Stores the password as a **salted SHA-512 hash**, irreversible. On by default, not recommended to disable |
| Account Expiry | Login is refused after this date, good for contractors and temporary accounts |
| Role | Multi-select, menu permissions merge as a union |
| IP Whitelist | One IP per line, checked at login; empty means no check |

## Login Checks

A login request passes through these checks in order, and stops at the first failure with its reason:

```mermaid
flowchart LR
    A[Account exists?] --> B[Active?] --> C[Not expired?] --> D[IP whitelisted?] --> E[Password correct?] --> F[Captcha needed?] --> G((Logged in))
```

- After `erupt-app.verify-code-count` consecutive failures (default 2) for the same account + IP, the login page shows a captcha.
- Passwords are encrypted in transit by default (`erupt-app.pwd-transfer-encrypt`) and stored as salted SHA-512.
- A successful login is written to the [login log](/en/modules/erupt-upms/log#login-log). Session length is `erupt.upms.expire-time-by-login`.
- All of these are described in [Configuration](/en/guide/configuration). To plug in LDAP / SSO / SMS, implement `LoginProxy` and take over any step, see [Login & Authentication](/en/advanced/auth).

## Password Reset

The **Reset Password** row operation lets an admin set a new password directly. Users change their own password from the avatar menu in the top right; disable it with `erupt-app.reset-pwd`. With `erupt-app.reset-pwd-prompt` on, users still on the initial password are reminded at every login.

## Recommendations

- Change the default `erupt / erupt` password right after the first production start, or set `erupt.upms.default-account` / `default-password` up front.
- Give ops and integration accounts an IP whitelist and an expiry date.
- Keep admin accounts to a minimum and do daily work with ordinary roles so the [operation log](/en/modules/erupt-upms/log) stays attributable.
