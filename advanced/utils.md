# 工具类

erupt 开发常用工具类整理。

## 获取登录用户上下文信息

> 可以在 `dataProxy` 等场景中获取，如果自定义接口需要传递 Token。

```java
@Component
public class Test {

    @Autowired
    private EruptUserService eruptUserService;

    @Autowired
    private EruptContextService eruptContextService;

    public void test() {
        // 获取当前登录用户 ID
        Long uid = eruptUserService.getCurrentUid();

        // 获取当前登录用户对象（eruptUser）
        EruptUser eruptUser = eruptUserService.getCurrentEruptUser();

        // 获取当前用户基础信息（不查数据库）
        MetaUserinfo metaUserinfo = eruptUserService.getSimpleUserInfo();

        // 获取当前请求 token
        String token = eruptContextService.getCurrentToken();

        // 获取当前访问菜单，拿到菜单自定义参数等信息
        EruptMenu eruptMenu = eruptContextService.getCurrentEruptMenu();

        // 获取 erupt 上下文类对象（有 @Erupt 注解的类）
        Class<?> clazz = eruptContextService.getContextEruptClass();
    }
}
```

## 继承实体类达到某些能力

```java
@Erupt(name = "只显示当前用户录入的数据")
public class EruptClass extends LookerSelf {
    // TODO 字段定义
}

@Erupt(name = "自动管理创建人，创建时间，更新人，更新时间字段")
public class EruptClass extends HyperModel {
    // TODO 字段定义
}
```

### 基础模型

| 可继承类名称 | 功能说明 |
| --- | --- |
| `BaseModel` | 管理数据库主键，通用性配置，支持所有主流数据库 |

### 数据审计（外键关联）

| 可继承类名称 | 功能说明 |
| --- | --- |
| `HyperModel` | 自动管理创建人、创建时间、更新人、更新时间字段 |
| `HyperModelVo` | 自动管理创建人、创建时间、更新人、更新时间字段，且在页面中展示这些数据 |
| `HyperModelCreatorVo` | 自动管理创建人、创建时间、更新人、更新时间字段，且展示创建人与创建时间 |
| `HyperModelUpdateVo` | 自动管理创建人、创建时间、更新人、更新时间字段，且展示更新人与更新时间 |

### 数据审计（非外键关联）

非页面操作使用 `eruptDao.persist` 与 `eruptDao.merge` 时如果正确传递 token 会自动填充审计字段的信息（1.12.23 及以上版本支持）。

| 可继承类名称 | 功能说明 |
| --- | --- |
| `MetaModel` | 自动管理创建人、创建时间、更新人、更新时间字段（不关联用户表） |
| `MetaModelVo` | 自动管理创建人、创建时间、更新人、更新时间字段，且在页面中展示这些数据（不关联用户表） |
| `MetaModelCreateVo` | 自动管理创建人、创建时间、更新人、更新时间字段，且展示创建人与创建时间（不关联用户表） |
| `MetaModelUpdateVo` | 自动管理创建人、创建时间、更新人、更新时间字段，且展示修改人与修改时间（不关联用户表） |
| `MetaModelCreateOnlyVo` | 自动管理创建人、创建时间，且展示修改人与修改时间（不关联用户表） |

### 权限过滤

> 不支持多层嵌套使用，如果类嵌套层级过深，建议模仿 `LookerXXX` 写法，自定义权限过滤类。

| 可继承类名称 | 功能说明 |
| --- | --- |
| `LookerSelf` | 只显示当前用户录入的数据（管理员登录可看所有数据） |
| `LookerOrg` | 只显示当前用户所属组织的数据（管理员登录可看所有数据） |
| `LookerPostLevel` | 显示当前组织内，职位权重低于登录用户的数据（管理员登录可看所有数据） |

如果有其他自定义需求，可以通过 [@PreDataProxy](/advanced/data-proxy) 自由定义。

## 错误消息提示 & 对话框通知

> 在任意方法中抛出该异常即可达到对应效果。

```java
public void fun() {
    // 对话框方式提示
    throw new EruptApiErrorTip("错误信息提示");

    // 消息方式提示
    throw new EruptApiErrorTip("错误信息提示", EruptApiModel.PromptWay.MESSAGE);

    // 通知方式提示
    throw new EruptApiErrorTip("错误信息提示", EruptApiModel.PromptWay.NOTIFY);
}
```

## 使用 Erupt 类完成 JDBC 操作

详见：[EruptDao（JDBC）](/advanced/erupt-dao)
