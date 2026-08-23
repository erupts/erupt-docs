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
| `objectClasses` | `{}` | Object classes assigned to newly created entries; **empty disables write operations** |
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
@Erupt(name = "目录用户", primaryKeyCol = "uid")
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
        views = @View(title = "姓名"),
        edit = @Edit(title = "姓名", notNull = true, search = @Search(vague = true))
    )
    private String cn;

    @EruptField(edit = @Edit(title = "姓", notNull = true))
    private String sn;

    @EruptField(edit = @Edit(title = "邮箱"))
    private String mail;

    @EruptField(edit = @Edit(title = "电话"))
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

Leave `objectClasses` empty to make the model read-only.

:::warning Note
- Binary attributes (`jpegPhoto`, `userCertificate;binary`) are decoded to strings as UTF-8 — declare them as `String` or exclude them via `attributes`.
- Multi-valued attributes (e.g. `memberOf`) return a list; declare the field as `List<String>`.
- The primary key value is used verbatim as the RDN value; changing the primary key would require a `rename` operation, which this module does not support.
:::
