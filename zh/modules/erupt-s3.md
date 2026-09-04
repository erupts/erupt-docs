# Erupt S3 对象存储数据源

erupt-data-s3 模块提供 S3 协议兼容的对象存储数据源支持，基于 AWS SDK v2 构建。将 `@Erupt` 模型绑定到一个 Bucket（AWS S3、MinIO、阿里云 OSS、腾讯云 COS、Cloudflare R2 等），即可在 Erupt 后台获得带权限控制、可检索、可审计的对象管理视图，删除流程开箱即用。

**仅支持读取与删除。** 通过管理后台表单上传原始对象内容并不合适——上传请直接使用 S3 SDK 或应用自身的上传流程。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-s3</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

模块内置 `software.amazon.awssdk:s3` 依赖，无需额外引入。

## @EruptS3 注解

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `bucket` | — | 要列举的 Bucket |
| `prefix` | `""` | Key 前缀过滤，为空列举整个 Bucket |
| `region` | `"us-east-1"` | 区域名——AWS 必填；非 AWS 服务商配合 `endpoint` 填任意非空值即可 |
| `endpoint` | `""` | Endpoint 地址，为空使用 `region` 对应的 AWS 默认地址；MinIO / OSS / COS / R2 需设置 |
| `accessKey` | `""` | Access Key，为空回退到默认凭证链（环境变量 / `~/.aws/credentials` / 实例角色） |
| `secretKey` | `""` | Secret Key，仅在 `accessKey` 设置时读取 |
| `pathStyle` | `false` | 强制路径式寻址（`https://endpoint/bucket/key`）——MinIO 及旧版 OSS 网关需要 |
| `pageSize` | `1000` | 单次列举请求返回的最大对象数 |
| `maxObjects` | `5000` | 所有分页累计返回对象数的硬上限，防止超大 Bucket 拖垮内存 |

## 可用模型字段

| 字段 | 类型 | 填充时机 |
| --- | --- | --- |
| `key` | `String` | 列表 + 详情 |
| `size` | `Long` | 列表 + 详情 |
| `lastModified` | `Date` | 列表 + 详情 |
| `etag` | `String` | 列表 + 详情 |
| `storageClass` | `String` | 列表 + 详情 |
| `contentType` | `String` | 仅详情（HEAD） |
| `metadata` | `Map<String, String>` | 仅详情（`x-amz-meta-*` 头） |

## 使用示例

### AWS S3

```java
@Getter
@Setter
@Erupt(name = "S3 对象", primaryKeyCol = "key")
@EruptS3(bucket = "prod-uploads", prefix = "reports/", region = "us-east-1")
@EruptDataProcessor(EruptS3DataService.DATA_PROCESSOR)
public class S3ProductionUpload {

    @EruptField(views = @View(title = "Key"))
    private String key;

    @EruptField(views = @View(title = "大小（字节）"))
    private Long size;

    @EruptField(views = @View(title = "最后修改时间"))
    private Date lastModified;

    @EruptField(views = @View(title = "ETag"))
    private String etag;

    @EruptField(views = @View(title = "存储类型"))
    private String storageClass;
}
```

### MinIO / 自建服务

```java
@EruptS3(
    bucket = "erupt-uploads",
    endpoint = "http://minio.internal:9000",
    region = "us-east-1",
    accessKey = "AKIAxxx",
    secretKey = "xxx",
    pathStyle = true
)
```

### 其他服务商

| 服务商 | `endpoint` | `pathStyle` |
| --- | --- | --- |
| 阿里云 OSS | `https://oss-cn-hangzhou.aliyuncs.com` | `false` |
| 腾讯云 COS | `https://cos.ap-guangzhou.myqcloud.com` | `false` |
| Cloudflare R2 | `https://<account>.r2.cloudflarestorage.com` | `true` |
| Backblaze B2（S3 API） | `https://s3.<region>.backblazeb2.com` | `true` |

## 操作支持

- **列表**：`ListObjectsV2` 按 continuation token 分页，累计上限为 `maxObjects`。
- **详情**：`HeadObject`——额外填充 `contentType` 与 `metadata` 字段。
- **删除**：按 Key 执行 `DeleteObject`。
- **新增 / 修改**：不支持，调用会抛出友好错误。

`S3Client` 按（endpoint、region、凭证、寻址方式）四元组缓存复用，应用关闭时自动释放。

:::tip 凭证建议
`accessKey` / `secretKey` 留空时走 AWS 默认凭证链（环境变量 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`、`~/.aws/credentials`、EC2 / ECS 实例角色），生产环境推荐这种方式，避免密钥出现在源码中。
:::

:::warning 注意
- `key` 字段即 S3 对象 Key 原值，且为主键——请勿改名。
- 超大 Bucket（前缀下超过 5000 个对象）结果会被截断；可通过 `prefix` 收窄范围或显式调大 `maxObjects`。
- `metadata` 仅在详情（HEAD）中填充，列表视图中该列将显示为空。
:::

:::warning 只读是「提交时报错」，不是按钮消失
`addData` / `editData` 直接抛出异常，但服务**没有覆写 `power()`**（整个 erupt-data 目录中没有任何数据源覆写它）。因此后台列表上的「新增」「修改」按钮照常渲染，用户填完表单点提交才会看到报错。

请在模型上显式关闭这两项权限：

```java
@Erupt(
    name = "S3 对象",
    primaryKeyCol = "key",
    power = @Power(add = false, edit = false)
)
```

删除是支持的；如果连删除也要禁掉，再加上 `delete = false`。
:::

:::warning 筛选与排序全在内存中完成
S3 的 `ListObjectsV2` 只支持 `prefix` 过滤，因此除 `prefix` 外的所有条件、排序、分页都由基础引擎在**已拉取的对象列表**上完成——也就是最多 `maxObjects` 条的那一批。这意味着：

- 对超出 `maxObjects` 的对象做筛选，结果必然不完整，且没有任何提示；
- 每次列表刷新都会重新发起 `ListObjectsV2` 分页请求（无缓存），大 Bucket 上响应会明显变慢。

请优先用 `prefix` 把范围收到一个可控的量级，而不是靠调大 `maxObjects`。
:::
