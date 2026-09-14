# 登录日志与操作日志

两类日志共同回答审计的三个问题：**谁登录了、谁改了什么、改坏了没有。** 两者均为只读列表，支持搜索与导出；删除按钮只对超级管理员开放。

## 登录日志

每次登录成功写入一条记录：

| 字段 | 说明 |
| --- | --- |
| 账号 / 登录时间 | |
| IP 地址 / IP 来源 | 来源解析为「国家 \| 省份 \| 城市 \| 运营商」 |
| 操作系统 / 浏览器 / 设备类型 | 由 User-Agent 解析 |

IP 归属地使用内置 ip2region 离线库，默认开启且无需联网；可通过 `erupt.upms.ip2region.path` 指向更新的 xdb 文件，或用 `enable: false` 关闭解析。

## 操作日志

记录用户对数据的每一次写操作，以及任何加了 `@EruptRecordOperate` 的接口调用：

| 字段 | 说明 |
| --- | --- |
| 操作人 / IP / IP 来源 | |
| 功能名称 | 形如 `UPDATE \| 订单管理`，前缀为操作类型，后缀为菜单名 |
| 修改前数据 | 修改 / 删除操作记录变更前的完整对象，JSON 格式化展示 |
| 请求参数 | 本次提交的请求体或 URL 参数 |
| 是否成功 / 错误信息 | 失败时保存异常堆栈（截断至 4000 字符） |
| 请求耗时 | 毫秒，可排序，用于发现慢操作 |
| URL / 请求方式 | |

默认记录的操作类型：

| 类型 | 触发场景 |
| --- | --- |
| `INSERT` | 新增数据 |
| `UPDATE` | 修改数据、行内编辑、批量修改 |
| `DELETE` | 删除数据 |
| `FORM-VIEW` | 表单视图提交 |
| 行操作 | `@RowOperation` 的自定义操作，名称为操作标题 |

### 记录自定义接口

自己写的 REST 接口加上 `@EruptRecordOperate` 即可进入操作日志：

```java
@PostMapping("/sync-order")
@EruptMenuAuth("order_sync")
@EruptRecordOperate("同步订单")
public R<Void> syncOrder(@RequestBody SyncBody body) { ... }
```

### 相关配置

```yaml
erupt:
  security:
    record-operate-log: true              # 关闭后不再记录
    record-operate-log-max-body-size: 1048576  # 请求体超过 1MB 不缓存记录
```

## 用作分析数据源

`EruptLoginLog` 与 `EruptOperateLog` 都带有 `@EruptCube` 注解，账号、IP 归属、功能名称、耗时等字段已声明为维度与度量。引入 [erupt-cube](/zh/modules/pro/erupt-cube) 后可直接拖拽分析：哪个功能报错最多、哪个时段登录最集中、哪类操作最慢。
