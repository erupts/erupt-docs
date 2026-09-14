# Online Users

Lists every user holding a live session right now, with one-click forced logout.

## Where the Data Comes From

The list is not a separate table. It is **the intersection of the login log and the session store**: a login record appears only while its token still exists in the session. Sessions live in local memory or Redis (`erupt.redis-session`, see [Configuration](/en/guide/configuration)) and both modes work. A user disappears after logging out, after session expiry, or after being forced out.

## Columns

| Column | Description |
| --- | --- |
| Account / Login Time | Fuzzy search and time range filter |
| IP Address / IP Source | Resolved to "Country \| Province \| City \| ISP" from an offline database, no network needed |
| OS / Browser / Device Type | Parsed from the User-Agent |

The list is read-only and exportable.

## Force Logout

The **Force Logout** row operation deletes every session key for that token. The user's next request is treated as unauthenticated and redirected to the login page. Typical uses:

- A login from an unexpected region or device: kick it first, then deal with the account.
- You changed someone's roles and need it to apply right now.
- You locked an account and want its existing sessions gone. One account may be signed in on several devices, each with its own row, so they can be handled separately.
