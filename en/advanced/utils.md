# Utility Classes

A collection of commonly used utility classes in Erupt development.

## Getting the Logged-In User Context

> Available in `dataProxy` and similar contexts. Custom endpoints require the token to be passed explicitly.

```java
@Component
public class Test {

    @Autowired
    private EruptUserService eruptUserService;

    @Autowired
    private EruptContextService eruptContextService;

    public void test() {
        // Get the current logged-in user's ID
        Long uid = eruptUserService.getCurrentUid();

        // Get the current logged-in user object (EruptUser)
        EruptUser eruptUser = eruptUserService.getCurrentEruptUser();

        // Get basic user info without querying the database
        MetaUserinfo metaUserinfo = eruptUserService.getSimpleUserInfo();

        // Get the current request token
        String token = eruptContextService.getCurrentToken();

        // Get the current menu being accessed (with custom menu parameters, etc.)
        EruptMenu eruptMenu = eruptContextService.getCurrentEruptMenu();

        // Get the Erupt context class (the class annotated with @Erupt)
        Class<?> clazz = eruptContextService.getContextEruptClass();
    }
}
```

## Extending Base Entity Classes

```java
@Erupt(name = "Show only the current user's data")
public class EruptClass extends LookerSelf {
    // TODO: field definitions
}

@Erupt(name = "Auto-manage creator, create time, updater, and update time fields")
public class EruptClass extends HyperModel {
    // TODO: field definitions
}
```

### Base Model

| Class name | Description |
| --- | --- |
| `BaseModel` | Manages the database primary key with universal configuration, compatible with all mainstream databases |

### Data Audit (Foreign Key Association)

| Class name | Description |
| --- | --- |
| `HyperModel` | Auto-manages creator, create time, updater, and update time fields |
| `HyperModelVo` | Auto-manages audit fields and displays them on the page |
| `HyperModelCreatorVo` | Auto-manages audit fields and displays creator and create time |
| `HyperModelUpdateVo` | Auto-manages audit fields and displays updater and update time |

### Data Audit (No Foreign Key Association)

When using `eruptDao.persist` or `eruptDao.merge` in non-page operations, audit fields are automatically populated if the token is correctly passed (supported since 1.12.23+).

| Class name | Description |
| --- | --- |
| `MetaModel` | Auto-manages creator, create time, updater, and update time fields (no user table FK) |
| `MetaModelVo` | Auto-manages audit fields and displays them on the page (no user table FK) |
| `MetaModelCreateVo` | Auto-manages audit fields and displays creator and create time (no user table FK) |
| `MetaModelUpdateVo` | Auto-manages audit fields and displays updater and update time (no user table FK) |
| `MetaModelCreateOnlyVo` | Auto-manages creator and create time, and displays updater and update time (no user table FK) |

### Permission Filtering

> Multi-level nesting is not supported. If the class hierarchy is deeply nested, it is recommended to create a custom permission filter class modeled after the `LookerXXX` pattern.

| Class name | Description |
| --- | --- |
| `LookerSelf` | Shows only data created by the current user (admins see all data) |
| `LookerOrg` | Shows only data belonging to the current user's organization (admins see all data) |
| `LookerPostLevel` | Shows data from users in the same organization whose position weight is lower than the logged-in user's (admins see all data) |

For other custom requirements, you can freely define your own logic via [@PreDataProxy](/en/advanced/data-proxy).

## Error Messages & Dialog Notifications

> Throw these exceptions in any method to produce the corresponding effect.

```java
public void fun() {
    // Display error in a dialog
    throw new EruptApiErrorTip("Error message");

    // Display error as a toast message
    throw new EruptApiErrorTip("Error message", EruptApiModel.PromptWay.MESSAGE);

    // Display error as a notification
    throw new EruptApiErrorTip("Error message", EruptApiModel.PromptWay.NOTIFY);
}
```

## JDBC Operations with Erupt Classes

See: [EruptDao (JDBC)](/en/advanced/erupt-dao)
