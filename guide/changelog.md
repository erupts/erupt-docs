# 更新日志

## 1.13.2（2026-01-05）

Spring Boot 版本：3.5.9

- 修复 erupt-ai 在实现 EruptPromptHandler 后项目无法启动的问题
- 修复 erupt-mongodb 排序参数不生效的 bug
- 修复一对多组件使用 Date 类型时，表格日期比表单少一天的误差
- 修复 erupt-magic-api 路径 bug
- `@Readonly` 注解默认放开前端传值，可通过 `@Readonly(allowChange = false)` 关闭信任
- 增加排序按钮，可灵活配置多字段排序
- MCP 能力增加鉴权控制及默认实现，支持 Cursor 等工具交互访问 erupt 实体数据
- Erupt-AI 增加了新的大模型支持：Grok/Fireworks/MinMax/Mistral/OpenRouter/Together
- LambdaQuery 新增 Page 分页 API，链式调用更顺滑
- 开源 erupt-notice 公告、站内信、邮件、短信一键发送
- `@Edit` 支持 onchange 配置，值变更即可动态驱动注解配置，实现任意表单联动
- 可视化能力全面升级，支持：甘特图、卡片视图、自定义视图、表格视图
- 在 IDEA 中配置 erupt 注解时值将会高亮显示
- 继承 MetaModel / HyperModel 时，无用户上下文也能自动写入创建、更新字段
- 升级 spring boot 版本至 3.5.9
- 升级前端版本至 Angular 20，使用 Vite 构建，编译速度提升 3 倍

## 1.13.1（2025-11-08）

Spring Boot 版本：3.5.6

- 修复 erupt-magic-api 前置网关使用 https 协议反向代理服务的错误
- 移除令人诟病的 `@OneToMany` 的负数 id 处理逻辑，由前端处理相关数据
- HyperModel 衍生类不会生成外键，允许关联用户被删除
- 修改查询接口 sort 参数的传参方式，防止 SQL 注入
- 解决 TAB 组件不按照声明顺序渲染的问题
- 左树右表支持选择父节点能看到下面所有子级数据的能力
- 增加 `EruptTag` 注解
- 新增 DataProxy 全局拦截器，全局拦截任何 erupt 类的行为
- dataProxy 增加 validate 方法用于自定义检验 erupt 数据是否符合规则
- ShowBy 注解更名为 Dynamic，且支持动态的必填、只读、显示等动态能力
- 支持 OAuth2 授权，可轻松对接飞书、Google 等平台的用户体系
- EruptUser 表增加头像字段，支持通过 API 写入的用户头像且展示
- 新增签名组件，用于审批签字等场景
- erupt-ai 支持 MCP
- 全面支持 Spring Boot 3.0，JDK 最低版本要求 17

> 1.12.x 升级 1.13.x 请务必参考：[升级指南](/guide/upgrade)

## 更早版本

更早版本的更新日志请访问：[https://www.yuque.com/erupts/erupt/wdic2w](https://www.yuque.com/erupts/erupt/wdic2w)
