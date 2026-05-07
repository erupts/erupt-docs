# 权限管理 (UPMS)

erupt-upms 提供完整的用户权限管理系统，所有功能均由 `@Erupt` 注解实现。

## 功能目录

| 菜单名称 | 描述 | 对应实体类 |
| :---: | :---: | :---: |
| 菜单管理 | 菜单配置 | EruptMenu.java |
| 组织管理 | 用户组织维护 | EruptOrg.java |
| 岗位管理 | 用户岗位管理 | EruptPost.java |
| 角色管理 | 角色菜单权限 | EruptRole.java |
| 用户管理 | 系统用户管理 | EruptUser.java |
| 字典管理 | 数据字典 | EruptDict.java |
| 登录日志 | 登录历史日志 | EruptLoginLog.java |
| 操作日志 | 增删改相关的操作日志 | EruptOperateLog.java |
| Open API | 开放 API 接口管理 | EruptOpenApi |

## 菜单维护

用于管理系统中菜单列表与接口权限。

菜单类型与类型值说明：

| 菜单类型 | 类型值 | 说明 |
| --- | --- | --- |
| 树 | erupt 类名，不区分大小写 | 树视图展示 |
| 表格 | erupt 类名，不区分大小写 | 表格视图展示 |
| 链接 | 互联网地址 | 在菜单右侧视图容器中打开 |
| 新页签 | 互联网地址 | 在新 TAB 页中打开 |
| 页面路由 | 路由地址 | 路由 hash 值 |
| 按钮 | 按钮权限字符串 | 详见：通过菜单控制按钮的显示与隐藏 |
| 接口名称 | 接口名 | 接口权限字符串 |
| 报表 | 报表编码 | 需导入 erupt-bi 模块 |
| 模板 | 模板文件名称（需在 tpl 目录下） | 需导入 erupt-tpl 模块 |
| 充满屏幕 | 需要全屏展示的路由地址 | 页面将全屏幕显示 |

图标参考：[https://www.thinkcmf.com/font/search/index.html](https://www.thinkcmf.com/font/search/index.html)

## 组织维护

通过树形结构管理组织信息。

## 角色维护

用来分配菜单权限，支持细粒度权限控制。

## 用户维护

左侧窗口为组织树，右侧为系统用户信息，可以通过分配的用户名与密码登录 erupt 后台。

配置项目说明：

- **首页地址**：用户登录后将会跳转到首页地址
- **账户状态**：激活可正常登录，锁定禁止登录
- **md5加密**：更安全的存储密码数据
- **所属角色**：用户可使用角色内所配置菜单
- **IP 白名单**：登录时需验证 IP 是否允许登录，为空表示不进行校验

## 字典维护

通常用于管理结构简单（key-value）的平台数据，例如：民族、国家、HTTP 请求类型、协议类型等。

字典编码为字典表查询标识，应该唯一，规定通过字典编码查找相对应的数据。

## 引入方式

`erupt-upms` 已包含在 `erupt-admin` 中，无需额外引入：

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-admin</artifactId>
  <version>${erupt.version}</version>
</dependency>
```
