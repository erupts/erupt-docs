# erupt-pf4j 动态加载

基于 [PF4J](https://pf4j.org/) 实现 Erupt 体系的动态插件加载能力，支持在不重启应用的情况下热加载 Erupt 模块。

- 仓库地址：[https://github.com/snice/erupt-pf4j-demo](https://github.com/snice/erupt-pf4j-demo)
- 作者：码农朱哲

## 特性

- 开发过程中修改 Erupt 后，无需重启整个应用，在管理端重启插件即可
- 生产环境通过 jar 或 zip 动态加载 Erupt 模块，无需重新部署

## 使用方法

在已引入 erupt 依赖的前提下，添加 erupt-pf4j：

```xml
<!-- 仓库配置 -->
<repository>
  <id>jitpack.io</id>
  <url>https://jitpack.io</url>
</repository>

<!-- 依赖 -->
<dependency>
  <groupId>com.github.snice</groupId>
  <artifactId>erupt-pf4j</artifactId>
  <version>0.0.1</version>
</dependency>
```
