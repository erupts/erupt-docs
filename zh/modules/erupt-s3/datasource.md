# 对象浏览数据源

把一个 Bucket（或 Bucket 内某个前缀）挂成 `@Erupt` 模型，后台自动获得对象列表：按 Key 检索、查看详情、删除，并沿用 Erupt 的菜单权限与操作日志。

**数据源仅支持读取与删除。** 通过后台表单上传原始对象内容并不合适——上传请走[附件上传](./upload)或应用自身的上传流程。

## 定义模型

对象列表的列是固定的，因此模块把字段统一声明在 `S3ObjectModel` 中，模型只需继承它，再加上两个注解：

```java
@Getter
@Setter
@Erupt(name = "S3 对象", power = @Power(add = false, edit = false))
@EruptS3(bucket = "prod-uploads", prefix = "reports/", region = "us-east-1")
@EruptDataProcessor(EruptS3DataService.DATA_PROCESSOR)
public class S3ProductionUpload extends S3ObjectModel {
}
```

- `@EruptS3`：绑定 Bucket 与连接参数，留空的属性回退到 `erupt.s3.*`，见[配置参考](./config#erupts3-注解属性)。
- `@EruptDataProcessor(EruptS3DataService.DATA_PROCESSOR)`：指定由 S3 数据源处理该模型。
- `power = @Power(add = false, edit = false)`：隐藏「新增」「修改」按钮，原因见下方[只读说明](#只读是「提交时报错」-不是按钮消失)。

连接参数已在 `erupt.s3.*` 中配置时，模型可以只写前缀，浏览的就是附件 Bucket：

```java
@EruptS3(prefix = "erupt/")
```

需要看另一个 Bucket 或另一家服务商，只覆盖对应属性：

```java
@EruptS3(bucket = "archive", endpoint = "https://oss-cn-hangzhou.aliyuncs.com", region = "cn-hangzhou")
```

## S3ObjectModel 字段

| 字段 | 类型 | 填充时机 | 说明 |
| --- | --- | --- | --- |
| `id` | `String` | 列表 + 详情 | 对象 Key，即主键；支持 LIKE 检索 |
| `size` | `Long` | 列表 + 详情 | 字节数 |
| `lastModified` | `Date` | 列表 + 详情 | |
| `etag` | `String` | 列表 + 详情 | |
| `storageClass` | `String` | 列表 + 详情 | 存储类型，如 `STANDARD` |
| `contentType` | `String` | 仅详情 | 来自 `HeadObject` |
| `metadata` | `Map<String, String>` | 仅详情 | `x-amz-meta-*` 自定义元数据；不渲染，供 `DataProxy` 等代码使用 |

对象 Key 放在 `id` 字段，正是 Erupt 默认的主键列，所以不需要设置 `primaryKeyCol`。想改标题或隐藏某列，在子类中重新声明同名字段并覆盖 `@EruptField` 即可。

## 支持的操作

| 操作 | S3 调用 | 说明 |
| --- | --- | --- |
| 列表 | `ListObjectsV2` | 按 continuation token 分页，每页最多 `pageSize` 条，累计不超过 `maxObjects` |
| 详情 | `HeadObject` | 额外填充 `contentType` 与 `metadata` |
| 删除 | `DeleteObject` | 按 Key 删除 |
| 新增 / 修改 | — | 不支持，提交时抛出「对象内容不可编辑」 |

`S3Client` 按（endpoint、region、accessKey、寻址方式）四元组缓存复用，同一连接下的多个模型共享一个客户端，应用关闭时自动释放。

## 限制与注意事项

### 只读是「提交时报错」，不是按钮消失

`addData` / `editData` 直接抛出异常，但数据源没有覆写 `power()`，因此不加 `@Power` 时「新增」「修改」按钮照常渲染，用户填完表单点提交才会看到报错。请像上面的示例那样在模型上显式关闭这两项权限；如果连删除也要禁掉，再加上 `delete = false`。

### 筛选与排序全在内存中完成

S3 的 `ListObjectsV2` 只支持 `prefix` 过滤，因此除 `prefix` 外的所有条件、排序、分页都由基础引擎在**已拉取的对象列表**上完成——也就是最多 `maxObjects` 条的那一批。这意味着：

- 对超出 `maxObjects` 的对象做筛选，结果必然不完整，且没有任何提示；
- 每次列表刷新都会重新发起 `ListObjectsV2` 分页请求（无缓存），大 Bucket 上响应会明显变慢。

请优先用 `prefix` 把范围收到一个可控的量级，而不是靠调大 `maxObjects`。

### 其他

- 超大 Bucket（前缀下超过 5000 个对象）结果会被截断；可通过 `prefix` 收窄范围或显式调大 `maxObjects`。
- 模型类必须有 public 无参构造，否则启动后访问列表会报错。
- `metadata` 只在详情中填充，且没有 `@EruptField`，不会出现在表格或表单里。
