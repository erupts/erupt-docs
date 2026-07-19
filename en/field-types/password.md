# Password Input PASSWORD

A dedicated input component for password fields. Unlike `INPUT(type = "password")`, this type hides the field value in the table view, and on edit — if left blank — omits the field from the request body entirely so the existing password is never overwritten.

> **Added in 2.0.0**

![password](/field-types/password.png)

## Basic Usage

```java
@EruptField(
    views = @View(title = "Password"),
    edit  = @Edit(title = "Password", type = EditType.PASSWORD, notNull = true)
)
private String password;
```

## Behaviour

| Scenario | Behaviour |
|----------|-----------|
| Add | Required validation works normally; plaintext password is sent to the backend |
| Edit | Leaving the field blank omits it from the request body — the existing stored value is preserved |
| Table view | Field value is never rendered, preventing password exposure |
| Search | Not supported |

## Configuration

`PASSWORD` uses `@InputType`'s `length` attribute to cap the maximum input length:

```java
@Edit(
    title     = "Password",
    type      = EditType.PASSWORD,
    notNull   = true,
    inputType = @InputType(length = 32)
)
```

## Backend Handling

Encrypt the received plaintext password inside `DataProxy.beforeAdd` / `beforeUpdate`:

```java
@Override
public void beforeAdd(User model) {
    model.setPassword(DigestUtils.sha512Hex(model.getPassword() + model.getSalt()));
}

@Override
public void beforeUpdate(User model) {
    // blank on edit means the field is absent from the request — model.getPassword() is null
    if (model.getPassword() != null) {
        model.setPassword(DigestUtils.sha512Hex(model.getPassword() + model.getSalt()));
    }
}
```

## Notes

- The `PASSWORD` field is never shown in the list view, even if `views = @View(...)` is configured.
- The type is excluded from search — it cannot be used as a filter in the search bar.
- Compared to `INPUT(type = "password")`, the `PASSWORD` type is safer on edit: a blank field does not erase the stored password.
