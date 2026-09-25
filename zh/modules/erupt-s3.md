# Erupt S3 对象存储数据源

erupt-data-s3 模块提供 S3 协议兼容的对象存储数据源支持，基于 AWS SDK v2 构建。将 `@Erupt` 模型绑定到一个 Bucket（AWS S3、MinIO、阿里云 OSS、腾讯云 COS、Cloudflare R2 等），即可在 Erupt 后台获得带权限控制、可检索、可审计的对象管理视图，删除流程开箱即用。

**数据源仅支持读取与删除。** 通过管理后台表单上传原始对象内容并不合适——上传请直接使用 S3 SDK 或应用自身的上传流程。

模块同时内置 `S3AttachmentProxy`——一个现成的 `AttachmentProxy` 实现，可把 Erupt 的所有附件上传（`@Edit(type = ATTACHMENT)`、富文本图片等）转存到 Bucket 而非本地磁盘，详见[附件上传](#附件上传-s3attachmentproxy)。

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

## 附件上传（S3AttachmentProxy） <Badge type="tip" text="v2.3.0+" />

除了作为数据源浏览对象，模块还提供 `S3AttachmentProxy`，两步即可把 Erupt 的附件存储切到 Bucket，无需自己实现 [AttachmentProxy](/zh/advanced/upload)。

**第一步**：在 Spring Boot 入口类上注册代理：

```java
@SpringBootApplication
@EruptScan
@EruptAttachmentUpload(S3AttachmentProxy.class)
public class DemoApplication { ... }
```

**第二步**：在配置文件中填写 `erupt.s3.*`：

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: ap-southeast-1
    endpoint: http://minio.internal:9000   # AWS 可省略
    path-style: true                       # MinIO / 自建服务
    prefix: erupt/                         # 可选的 Key 前缀
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://cdn.example.com        # 可选的公网访问地址（CDN），为空时由 endpoint + bucket 推导
    local-save: false                      # true 时同时在 erupt.upload-path 下保留一份
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.s3.bucket` | — | 接收上传文件的 Bucket，必填 |
| `erupt.s3.prefix` | `""` | Bucket 内的 Key 前缀，为空存放在根目录 |
| `erupt.s3.region` | `"us-east-1"` | 区域名；非 AWS 服务商配合 `endpoint` 填任意非空值即可 |
| `erupt.s3.endpoint` | `""` | Endpoint 地址，为空使用 AWS 默认地址；MinIO / OSS / COS / R2 需设置 |
| `erupt.s3.access-key` / `secret-key` | `""` | 静态凭证，为空回退到默认凭证链 |
| `erupt.s3.path-style` | `false` | 路径式寻址（`endpoint/bucket/key`），MinIO 及多数自建网关需要 |
| `erupt.s3.domain` | `""` | 浏览器加载附件的公网根地址；为空时推导为 `https://<bucket>.s3.<region>.amazonaws.com`、`<endpoint>/<bucket>`（路径式）或 `<scheme>://<bucket>.<endpoint-host>` |
| `erupt.s3.local-save` | `false` | 是否同时在本地服务器保留一份文件 |

### 存储路径与访问地址

Erupt 生成的上传路径（`/yyyy-MM-dd/xxxx.ext`）原样作为 `prefix` 之下的对象 Key，数据库中保存的值仍是这个路径——日后更换存储方案不需要改写已有数据。对象写入时会根据扩展名推断 `Content-Type`，图片可直接内联展示。附件的公网地址即 `fileDomain() + path`，其中 `fileDomain()` 为 `domain`（或推导出的 Bucket 地址）拼接 `prefix`。Bucket（或其前面的 CDN）需允许公开读取，或将 `domain` 指向一个可公开访问的地址。

### 前端无需改动

自 2.3.0 起，`/erupt-app` 接口会返回已注册 `AttachmentProxy` 的 `fileDomain()`，前端在 `eruptSiteConfig.fileDomain` 为空时自动采用，因此接入 S3 时不必再修改 `app.js`。`app.js` 中显式设置的 `fileDomain` 仍优先生效，可用于覆盖后端返回的地址。

:::tip 与数据源的区别
`@EruptS3` 注解上的连接参数只服务于对象浏览数据源，`erupt.s3.*` 只服务于附件上传代理，两者相互独立——可以只用其中一个，也可以指向不同的 Bucket。
:::
