# Erupt Comment

erupt-comment gives every record of any `@Erupt` model a comment stream: discuss, reply, pin and resolve right inside the record form panel, and @mention a colleague to send them an internal notice. Comments live in a table of their own on the server, so no business table and no model needs a new field.

> Minimum version: **2.3.0**

## Setup

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-comment</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` already includes this module, so projects on starter-all need not add it. The module depends on `erupt-upms` and `erupt-data-jpa`; **@mention notices** need [erupt-notice](/en/modules/erupt-notice) — without it mentions are still stored and highlighted, nobody is just notified.

Auto configuration announces the module to the frontend through `registerProp("erupt-comment")`: a **Comments** entry appears in the title bar of the record form panel, and a **Record Comment** menu appears under **System Management**.

## Features

![Record comment drawer](/comment/drawer.png)

### Comment stream

Open a record's form panel from the table and click the comment icon in the title bar to expand the record's comment stream. Comments are listed oldest first with the author's avatar, name and time. Whoever may open the model may read and write its comments — the permission is the model's own menu permission, nothing extra to grant.

- A comment is at most 4000 characters; empty content is rejected
- Only the author (or a super admin) may delete a comment; deleting a top-level comment takes all of its replies along
- Reference pickers (the tables popped up by REFERENCE_TABLE / REFERENCE_TREE) never show the comment entry

### One level of replies

The stream is **one level** deep: replying to any comment attaches the new one under the top-level comment of that thread, never nesting further. A record's discussion therefore always reads as "a few threads, each with its replies", and never loses focus.

### Pinned and resolved

A thread (top-level comment) carries two flags that anyone with access to the model may toggle:

| Flag | Effect |
| --- | --- |
| Pinned | The thread leads the stream — for conclusions and things to watch out for |
| Resolved | The thread is shown collapsed, marking the discussion as closed |

Replies cannot be pinned or resolved; only thread heads can.

### Comment counts in the table

The comment icon on every table row carries a badge with that record's comment count, so the rows with a discussion stand out at a glance. Counts are fetched once per page for the record ids on it (`POST /erupt-api/comment/{erupt}/counts`), not row by row.

### @mention notices

Type `@` and search enabled users by name (up to 20 candidates), pick one and it is written into the comment. On submit:

- The mentioned users' ids and a snapshot of their names are stored in the comment's `mentions` field, used to highlight them in the text
- With [erupt-notice](/en/modules/erupt-notice) present, every mentioned user receives an internal notice titled "**{author} mentioned you in a comment on {model}**" whose body is the first 200 characters of the comment; the notice scene `comment_mention` (Comment Mention) is created on first use
- The notice's link is the table route under the fill layout with `?id=<pk>`, so opening it lands on that record with its panel open

A failed notice never fails the comment itself.

## Turning comments off for a model

`@Power` gains a `comment` attribute, `true` by default. Opt a model out explicitly when its records should not carry a comment stream:

```java
@Erupt(
    name = "Login Log",
    power = @Power(comment = false)
)
public class LoginLog extends BaseModel {

}
```

The frontend then hides the entry, and the add endpoint refuses writes as well. See [@Power → comment](/en/annotation/power#comment-comment-switch).

## Managing comment records

**System Management → Record Comment** is the administrative view of every comment, for auditing and cleanup:

| Column | Description |
| --- | --- |
| Model | The data model the comment belongs to; the filter lists only models that actually carry comments, labelled by display name |
| Record ID | Primary key of the commented record (as a string, so any key type fits) |
| Content | Comment text, fuzzy searchable |
| Resolved / Pinned | The two thread-head flags |
| Created by / Created at | Author and time |

The menu allows neither add nor edit (comments are written inside records), but does allow delete and export.

## erupt-cloud node support

Models served by an [erupt-cloud](/en/modules/erupt-cloud) node can be commented on too. Comments, their authors and the mentioned users all belong to the server's user system, and a node has neither this module nor a user table, so the comment API **always stays on erupt-cloud-server** and is never forwarded to the node. Rows are then keyed by `nodeName.eruptName`, which is also how the Record Comment menu labels them.

This relies on `@EruptRouter(cloudProxy = false)`, new in core 2.3.0: the default `true` forwards to the node as before, `false` marks an endpoint as server-owned. Module authors with the same need can reuse it.

## Endpoints

All endpoints live under `/erupt-api/comment`; the second path segment is the model name and authorisation matches opening that model's table (`@EruptRouter(authIndex = 1, verifyType = ERUPT)`):

| Endpoint | Description |
| --- | --- |
| `GET /erupt-api/comment/{erupt}/{id}` | All comments of one record |
| `POST /erupt-api/comment/{erupt}/counts` | Body is a list of record ids; returns the comment count per record |
| `GET /erupt-api/comment/{erupt}/mention-users?keyword=` | Candidates for an @mention, matched on name |
| `POST /erupt-api/comment/{erupt}/{id}` | Add a comment, body `{ content, parentId, mentions }`; a null `parentId` starts a new thread, `mentions` is a list of user ids |
| `PUT /erupt-api/comment/{erupt}/{id}/{commentId}/resolved?value=` | Set / clear resolved (thread heads only) |
| `PUT /erupt-api/comment/{erupt}/{id}/{commentId}/pinned?value=` | Pin / unpin (thread heads only) |
| `DELETE /erupt-api/comment/{erupt}/{id}/{commentId}` | Delete one's own comment |

## Database table

The module has a single table, `e_record_comment`, extending `HyperModelCreatorOnlyVo` (which brings `id`, `create_by`, `create_time`) with an index on `(erupt, record_id)`:

| Column | Type | Description |
| --- | --- | --- |
| `erupt` | VARCHAR(100) | Model name; `nodeName.eruptName` for a cloud node model |
| `record_id` | VARCHAR(100) | The record's primary key as a string |
| `content` | VARCHAR(4000) | Comment text |
| `parent_id` | BIGINT | Id of the thread head this replies to; null for a thread head |
| `mentions` | VARCHAR(2000) | Mentioned users as JSON `[{id, name}]` |
| `resolved` | BIT(1) | Resolved flag |
| `pinned` | BIT(1) | Pinned flag |

Projects with JPA schema generation enabled get the table on upgrade; projects that maintain their schema by hand should create it from the table above.
