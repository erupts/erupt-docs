# 快速开始

## 模块组成

erupt-cube 由多个可按需引入的子模块组成：

| 模块 | 说明 |
| --- | --- |
| `erupt-cube-semantic` | 核心语义模型解析：注解扫描、SQL 生成、多数据源执行 |
| `erupt-cube-puzzle` | 可视化能力：拖拽仪表盘、图表、过滤器 |
| `erupt-cube-design` | 可视化建模：非注解方式定义语义模型 |
| `erupt-cube-metric` | 指标管理 |
| `erupt-cube-sql` | SQL 查询端口：以 PostgreSQL 协议对外暴露语义模型，详见 [SQL 查询端口](/zh/modules/pro/erupt-cube/sql) |

## 编译源代码，发布到本地仓库

拉取源代码，切换 tag 到对应版本，在项目根目录下执行如下 maven 打包命令，发布到本地中央仓库或私服即可：

```bash
mvn -D skipTests=true install
```

## 导入依赖

在 erupt 项目中添加如下依赖，重新启动即可（1.13.4 及以上版本支持）：

```xml
<!-- 可视化相关能力 -->
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-puzzle</artifactId>
    <version>${LATEST-VERSION}</version>
</dependency>
<!-- 核心语义模型解析 -->
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-cube-semantic</artifactId>
    <version>${LATEST-VERSION}</version>
</dependency>
```

重新登录后可发现如下菜单：

<img src="/cube/menu.png" width="398">

## 下一步

1. [配置数据源](/zh/modules/pro/erupt-cube/datasource) — 接入 OLAP 数仓或业务数据库
2. [语义建模](/zh/modules/pro/erupt-cube/semantic-model) — 用注解定义维度与指标
3. [可视化分析](/zh/modules/pro/erupt-cube/visual-analysis) — 拖拽构建仪表盘
