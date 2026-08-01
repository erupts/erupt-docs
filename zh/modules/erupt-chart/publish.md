# 发布报表

前往报表配置，点击发布按钮

![](/chart/publish-1.png)

填写菜单名称，与发布的菜单位置点击确定即可（菜单位置不选则发布到根目录）

![](/chart/publish-2.png)

**刷新页面**即可看到发布的报表了~

![](/chart/publish-3.png)

## 发布规则

- 菜单编码即报表编码，同一报表不可重复发布
- 发布成功后会自动创建 `bi-view-role` 角色（编码 `bi_view_role@auto`）并挂载该菜单，方便统一给报表查看用户授权
- 配置 `erupt.bi.super-admin-publish: true` 后，仅超级管理员可执行发布操作
