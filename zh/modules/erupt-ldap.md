# Erupt LDAP 目录数据源

erupt-data-ldap 模块提供 LDAP 目录数据源支持。将 `@Erupt` 模型绑定到 Active Directory、OpenLDAP、FreeIPA、ApacheDS 或任意符合 RFC 4511 的目录服务器条目，Erupt 便可像管理数据库表一样管理这些条目。

使用 JDK 内置的 JNDI Provider，除 `erupt-core` 外无额外运行时依赖。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-ldap</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## @EruptLdap 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `url` | — | LDAP 服务器地址，如 `ldap://ldap.example.com:389` 或 `ldaps://...` |
| `baseDn` | — | 搜索基准 DN，如 `ou=people,dc=example,dc=com` |
| `rdn` | `"cn"` | 用于构建条目 DN 的 RDN 属性，如 `uid`、`cn` |
| `filter` | `"(objectClass=*)"` | 基础 LDAP 过滤器 |
| `objectClasses` | `{}` | 新建条目时赋予的对象类，**为空则禁用写操作** |
| `bindDn` | `""` | 认证绑定 DN，为空则匿名绑定 |
| `bindCredential` | `""` | 绑定凭证（密码） |
| `attributes` | `{}` | 从目录获取的属性，为空返回全部属性 |
| `sizeLimit` | `500` | 单次搜索最大返回条目数 |
| `timeout` | `10` | 搜索超时秒数，0 为不限 |

模型字段名 = LDAP 属性名（不区分大小写）。主键列提供 RDN 值，条目 DN = `{rdn}={id},{baseDn}`。

## 使用示例

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

## 操作支持

完整 CRUD：

- **列表**：按 `filter` 搜索，等值 / LIKE / 判空条件会下推进 LDAP 过滤器（RFC 4515 转义）；基础引擎会再次求值全部条件以保证语义准确
- **详情**：按 DN 直接查询 `getAttributes(dn)`
- **新增**：`createSubcontext`，写入声明的 `objectClasses` 与所有非空字段
- **修改**：`modifyAttributes`（跳过 RDN 属性）
- **删除**：`destroySubcontext(dn)`

`objectClasses` 留空即可将模型设为只读。

:::warning 注意
- 二进制属性（`jpegPhoto`、`userCertificate;binary`）会按 UTF-8 解码为字符串——请声明为 `String` 或通过 `attributes` 排除。
- 多值属性（如 `memberOf`）返回列表，字段请声明为 `List<String>`。
- 主键值会原样作为 RDN 值使用；修改主键需要 `rename` 操作，本模块不支持。
:::
