# 密码输入框 PASSWORD

专为密码字段设计的输入组件。与 `INPUT(type = "password")` 的区别在于：字段在列表页不展示值，提交时仅在有输入时才将字段值写入请求体，编辑已有记录时留空则不覆盖原密码。

> **2.0.0 新增**

![password](/field-types/password.png)

## 基础用法

```java
@EruptField(
    views = @View(title = "密码"),
    edit  = @Edit(title = "密码", type = EditType.PASSWORD, notNull = true)
)
private String password;
```

## 行为说明

| 场景 | 行为 |
|------|------|
| 新增 | 必填校验正常生效；提交时将明文密码发送到后端 |
| 编辑 | 留空则该字段不写入请求体，后端值保持不变 |
| 编辑回显 | 仅返回掩码占位符（`••••••`），密码原值不下发到客户端（2.0.4+） |
| 列表展示 | 不渲染字段值，避免密码泄露 |
| 搜索 | 不支持 |

## 编辑回显掩码 <Badge type="tip" text="2.0.4+" />

编辑已有记录时，`PASSWORD` 字段以掩码占位符回显，密码原值**永远不会**下发到客户端（包括 `COMBINE` 嵌套表单中的密码字段）：

- 占位符原样提交 → 后端识别为"未修改"，保留数据库原值
- 输入新值或清空 → 正常覆盖

## 配置

`PASSWORD` 类型使用 `@InputType` 的 `length` 属性控制最大长度：

```java
@Edit(
    title    = "密码",
    type     = EditType.PASSWORD,
    notNull  = true,
    inputType = @InputType(length = 32)
)
```

## 后端处理建议

后端收到明文密码后，应在 `DataProxy.beforeAdd` / `beforeUpdate` 中完成加密：

```java
@Override
public void beforeAdd(User model) {
    model.setPassword(DigestUtils.sha512Hex(model.getPassword() + model.getSalt()));
}

@Override
public void beforeUpdate(User model) {
    // password 字段留空时不会传到后端，model.getPassword() 为 null
    if (model.getPassword() != null) {
        model.setPassword(DigestUtils.sha512Hex(model.getPassword() + model.getSalt()));
    }
}
```

## 注意事项

- `PASSWORD` 字段不显示在列表视图（`@View`）中，即使配置了 `views = @View(...)` 也不会渲染。
- 该类型不参与搜索，无法在搜索栏中过滤。
- 与 `INPUT(type = "password")` 相比，`PASSWORD` 类型在编辑场景下的留空行为更安全。
