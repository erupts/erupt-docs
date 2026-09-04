# Erupt LDAP Directory Data Source

The erupt-data-ldap module provides an LDAP directory data source. Bind an `@Erupt` model to entries in Active Directory, OpenLDAP, FreeIPA, ApacheDS, or any RFC 4511-compliant directory server, and Erupt can manage those entries just like database tables.

It uses the JDK's built-in JNDI provider, so there are no runtime dependencies beyond `erupt-core`.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-ldap</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## The @EruptLdap Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `url` | — | LDAP server address, e.g. `ldap://ldap.example.com:389` or `ldaps://...` |
| `baseDn` | — | Search base DN, e.g. `ou=people,dc=example,dc=com` |
| `rdn` | `"cn"` | RDN attribute used to build entry DNs, e.g. `uid`, `cn` |
| `filter` | `"(objectClass=*)"` | Base LDAP filter |
| `objectClasses` | `{}` | Object classes assigned to newly created entries. When empty, **only "add" fails** — edit and delete are unaffected |
| `bindDn` | `""` | Bind DN for authentication; empty means anonymous bind |
| `bindCredential` | `""` | Bind credential (password) |
| `attributes` | `{}` | Attributes to fetch from the directory; empty returns all attributes |
| `sizeLimit` | `500` | Maximum entries returned per search |
| `timeout` | `10` | Search timeout in seconds; 0 means unlimited |

Model field name = LDAP attribute name (case-insensitive). The primary key column supplies the RDN value; entry DN = `{rdn}={id},{baseDn}`.

## Usage Example

```java
@Getter
@Setter
@Erupt(name = "Directory Users", primaryKeyCol = "uid")
@EruptLdap(
    url = "ldap://ldap.example.com:389",
    baseDn = "ou=people,dc=example,dc=com",
    rdn = "uid",
    filter = "(objectClass=inetOrgPerson)",
    objectClasses = { "inetOrgPerson", "top" },
    bindDn = "cn=admin,dc=example,dc=com",
    bindCredential = "secret"
)
@EruptDataProcessor(EruptLdapDataService.DATA_PROCESSOR)
public class DirectoryUser {

    @EruptField(views = @View(title = "UID"))
    private String uid;

    @EruptField(
        views = @View(title = "Common Name"),
        edit = @Edit(title = "Common Name", notNull = true, search = @Search(vague = true))
    )
    private String cn;

    @EruptField(edit = @Edit(title = "Surname", notNull = true))
    private String sn;

    @EruptField(edit = @Edit(title = "Email"))
    private String mail;

    @EruptField(edit = @Edit(title = "Phone"))
    private String telephoneNumber;
}
```

## Supported Operations

Full CRUD:

- **List**: searches by `filter`; equality / LIKE / null-check conditions are pushed down into the LDAP filter (RFC 4515 escaping); the base engine re-evaluates all conditions to guarantee accurate semantics
- **Detail**: direct lookup by DN via `getAttributes(dn)`
- **Add**: `createSubcontext`, writing the declared `objectClasses` and all non-empty fields
- **Edit**: `modifyAttributes` (the RDN attribute is skipped)
- **Delete**: `destroySubcontext(dn)`

:::warning Note
- Binary attributes (`jpegPhoto`, `userCertificate;binary`) are decoded to strings as UTF-8 — declare them as `String` or exclude them via `attributes`.
- Multi-valued attributes (e.g. `memberOf`) return a list; declare the field as `List<String>`.
- The primary key value is used verbatim as the RDN value; changing the primary key would require a `rename` operation, which this module does not support.
:::

## Limits and Boundaries

:::warning Leaving `objectClasses` empty does **not** make the model read-only
The error raised when `objectClasses` is empty comes from `beanAttributes()`, and that method is **only called by `addData`**. Concretely:

| Operation | With `objectClasses` empty |
| --- | --- |
| Add | throws, blocked |
| Edit | **still runs** — `modifyAttributes` writes to the directory as normal |
| Delete | **still runs** — `destroySubcontext` removes the entry as normal |

For genuine read-only behavior, declare the permissions explicitly on the model:

```java
@Erupt(
    name = "Directory Users",
    primaryKeyCol = "uid",
    power = @Power(add = false, edit = false, delete = false)
)
```
:::

:::warning A null field on edit deletes the existing attribute from the directory
`editData` walks every non-RDN field on the model and emits one `ModificationItem` each:

- field has a value → `REPLACE_ATTRIBUTE`;
- field is `null` (or an empty string / empty collection) → **`REMOVE_ATTRIBUTE`**, which drops that attribute from the directory entry entirely.

So a model exposing only a subset of attributes will, after a single save, wipe the attributes it doesn't list. Make sure the model's fields cover everything you need to keep, or constrain the scope via `attributes`, and take a backup before running this against a production directory.
:::

:::warning Search conditions are only partially pushed down
`EQ`, `LIKE`, `NULL` and `NOT_NULL` are folded into the LDAP filter (with RFC 4515 escaping) to narrow the result set; other expressions (`RANGE`, `IN`, comparisons) are not. Every condition is then re-evaluated in memory by the base engine, so filter results are accurate.

Be aware, though, that the search is still bounded by `sizeLimit` (500 by default), and that bound applies to the **pushed-down filter**. Conditions that aren't pushed down cannot reduce what the server returns, so on a large directory a range or `IN` filter only ever sees the batch the server sent back. Prefer search fields that map to pushable equality / fuzzy / presence conditions, and tune `sizeLimit` accordingly.
:::
