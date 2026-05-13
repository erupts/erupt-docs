# Erupt Upms 权限管理

erupt-upms 提供完整的用户权限管理系统（UPMS），包含用户、角色、菜单、组织等核心功能，所有管理界面均由 `@Erupt` 注解自动生成。

## 引入方式

`erupt-upms` 已包含在 `erupt-admin` 中，无需单独引入：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-admin</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## 功能目录

| 菜单名称 | 描述 | 对应实体类 |
| --- | --- | --- |
| 菜单管理 | 菜单配置与接口权限 | EruptMenu.java |
| 组织管理 | 用户组织树形维护 | EruptOrg.java |
| 岗位管理 | 用户岗位管理 | EruptPost.java |
| 角色管理 | 角色菜单权限分配 | EruptRole.java |
| 用户管理 | 系统用户管理 | EruptUser.java |
| 字典管理 | 数据字典（key-value） | EruptDict.java |
| 登录日志 | 登录历史记录 | EruptLoginLog.java |
| 操作日志 | 增删改操作记录 | EruptOperateLog.java |
| Open API | 开放 API 接口管理 | EruptOpenApi |

## 菜单管理

用于管理系统菜单列表与接口权限。菜单类型与类型值说明：

| 菜单类型 | 类型值 | 说明 |
| --- | --- | --- |
| 表格 | Erupt 类名（不区分大小写） | 表格视图展示 |
| 树 | Erupt 类名（不区分大小写） | 树视图展示 |
| 链接 | 互联网地址 | 在菜单容器中打开 |
| 新页签 | 互联网地址 | 在新 Tab 页中打开 |
| 页面路由 | 路由地址 | 路由 hash 值 |
| 按钮 | 权限字符串 | 控制按钮的显示与隐藏 |
| 接口名称 | 接口名 | 接口权限字符串 |
| 报表 | 报表编码 | 需引入 erupt-chart 模块 |
| 模板 | 模板文件名（在 tpl 目录下） | 需引入 erupt-tpl 模块 |
| 充满屏幕 | 路由地址 | 全屏展示页面 |

图标参考：[https://www.thinkcmf.com/font/search/index.html](https://www.thinkcmf.com/font/search/index.html)

## 组织管理

通过树形结构维护组织信息，支持多层级组织架构。

## 角色管理

用于分配菜单权限，支持细粒度权限控制。一个用户可拥有多个角色，权限取并集。

## 用户管理

左侧为组织树，右侧为用户列表。用户配置项说明：

| 配置项 | 说明 |
| --- | --- |
| 首页地址 | 登录后跳转的首页路径 |
| 账户状态 | 激活可正常登录，锁定则禁止登录 |
| MD5 加密 | 密码使用 MD5 加密存储 |
| 所属角色 | 用户可使用角色内配置的菜单 |
| IP 白名单 | 登录时校验来源 IP，为空则不校验 |

## 字典管理

用于管理结构简单（key-value）的平台数据，例如民族、国家、HTTP 请求类型、协议类型等。字典编码为唯一标识，通过字典编码查询对应数据。

## Open API

用于管理外部系统接入凭证（APPID + Secret），支持外部系统通过 appid + secret 方式获取 erupt token，进而调用受保护的 erupt 接口。

详细使用方法请参考 [Open API 开放接口 →](/advanced/open-api)
