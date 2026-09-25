# Erupt S3 Object Storage Data Source

The erupt-data-s3 module provides an S3-compatible object storage data source, built on AWS SDK v2. Bind an `@Erupt` model to a bucket (AWS S3, MinIO, Aliyun OSS, Tencent COS, Cloudflare R2, etc.) and get a permissioned, searchable, auditable admin view of objects in the Erupt console — with the standard delete flow wired up.

**The data source is read + delete only.** Uploading raw object content through an admin form is not a good fit — use the S3 SDK or your app's own upload flow directly.

The module also ships `S3AttachmentProxy`, a ready-made `AttachmentProxy` that sends every Erupt attachment upload (`@Edit(type = ATTACHMENT)`, rich-text images, etc.) to a bucket instead of the local disk — see [Attachment Upload](#attachment-upload-s3attachmentproxy).

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-s3</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

The module ships `software.amazon.awssdk:s3` as a built-in dependency — nothing extra to add.

## The @EruptS3 Annotation

| Attribute | Default | Description |
| --- | --- | --- |
| `bucket` | — | Bucket to list |
| `prefix` | `""` | Key prefix filter; empty lists the whole bucket |
| `region` | `"us-east-1"` | Region name — required by AWS; for non-AWS providers, any non-empty value paired with `endpoint` |
| `endpoint` | `""` | Endpoint URL; empty uses the AWS default endpoint for `region`. Set for MinIO / OSS / COS / R2 |
| `accessKey` | `""` | Access key; empty falls back to the default provider chain (env vars / `~/.aws/credentials` / instance profile) |
| `secretKey` | `""` | Secret key; only read when `accessKey` is set |
| `pathStyle` | `false` | Force path-style addressing (`https://endpoint/bucket/key`) — required by MinIO and older OSS gateways |
| `pageSize` | `1000` | Maximum objects returned by a single list call |
| `maxObjects` | `5000` | Hard cap on objects returned across all pages, to avoid runaway listings on huge buckets |

## Available Model Fields

| Field | Type | Populated in |
| --- | --- | --- |
| `key` | `String` | list + find |
| `size` | `Long` | list + find |
| `lastModified` | `Date` | list + find |
| `etag` | `String` | list + find |
| `storageClass` | `String` | list + find |
| `contentType` | `String` | find only (HEAD) |
| `metadata` | `Map<String, String>` | find only (`x-amz-meta-*` headers) |

## Usage Example

### AWS S3

```java
@Getter
@Setter
@Erupt(name = "S3 Objects", primaryKeyCol = "key")
@EruptS3(bucket = "prod-uploads", prefix = "reports/", region = "us-east-1")
@EruptDataProcessor(EruptS3DataService.DATA_PROCESSOR)
public class S3ProductionUpload {

    @EruptField(views = @View(title = "Key"))
    private String key;

    @EruptField(views = @View(title = "Size (bytes)"))
    private Long size;

    @EruptField(views = @View(title = "Last Modified"))
    private Date lastModified;

    @EruptField(views = @View(title = "ETag"))
    private String etag;

    @EruptField(views = @View(title = "Storage Class"))
    private String storageClass;
}
```

### MinIO / Self-Hosted

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

### Other Providers

| Provider | `endpoint` | `pathStyle` |
| --- | --- | --- |
| Aliyun OSS | `https://oss-cn-hangzhou.aliyuncs.com` | `false` |
| Tencent COS | `https://cos.ap-guangzhou.myqcloud.com` | `false` |
| Cloudflare R2 | `https://<account>.r2.cloudflarestorage.com` | `true` |
| Backblaze B2 (S3 API) | `https://s3.<region>.backblazeb2.com` | `true` |

## Supported Operations

- **List**: `ListObjectsV2` with continuation-token paging, bounded by `maxObjects`.
- **Find by id**: `HeadObject` — additionally populates the `contentType` and `metadata` fields.
- **Delete**: `DeleteObject` on the key.
- **Add / edit**: not supported; calls raise a friendly error.

The `S3Client` is cached and reused per (endpoint, region, credential, addressing style) tuple, and released automatically on application shutdown.

:::tip Credentials
When `accessKey` / `secretKey` are left empty, the AWS default credential chain is used (env vars `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`, `~/.aws/credentials`, EC2 / ECS instance profiles). This is the recommended approach in production — it keeps secrets out of source code.
:::

:::warning Note
- The `key` field is the S3 object key verbatim and is the primary key — do not rename the field.
- On huge buckets (>5000 objects under the prefix) results are truncated; narrow with `prefix` or raise `maxObjects` explicitly.
- `metadata` is only populated on find (HEAD), not in the list view — showing it in a list column will render empty.
:::

:::warning Read-only means "errors on submit", not "buttons hidden"
`addData` / `editData` throw outright, but the service does **not** override `power()` — no data source under erupt-data does. So the Add and Edit buttons still render in the admin list, and the user only sees the error after filling in the form and hitting submit.

Turn those two permissions off explicitly on the model:

```java
@Erupt(
    name = "S3 Objects",
    primaryKeyCol = "key",
    power = @Power(add = false, edit = false)
)
```

Delete is supported; add `delete = false` as well if you want to block it too.
:::

:::warning Filtering and sorting happen entirely in memory
S3's `ListObjectsV2` only supports `prefix` filtering, so every condition other than `prefix` — plus sorting and paging — is evaluated by the base engine over the **already-fetched** object list, i.e. at most `maxObjects` entries. That means:

- filtering across a bucket larger than `maxObjects` gives incomplete results, with no warning;
- every list refresh re-issues the paginated `ListObjectsV2` calls (nothing is cached), so large buckets feel noticeably slow.

Narrow the scope with `prefix` down to a manageable size rather than raising `maxObjects`.
:::

## Attachment Upload (S3AttachmentProxy) <Badge type="tip" text="v2.3.0+" />

Beyond browsing objects as a data source, the module ships `S3AttachmentProxy`, which points Erupt's attachment storage at a bucket in two steps — no need to write your own [AttachmentProxy](/en/advanced/upload).

**Step 1**: register the proxy on the Spring Boot entry class:

```java
@SpringBootApplication
@EruptScan
@EruptAttachmentUpload(S3AttachmentProxy.class)
public class DemoApplication { ... }
```

**Step 2**: configure `erupt.s3.*`:

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: ap-southeast-1
    endpoint: http://minio.internal:9000   # omit for AWS
    path-style: true                       # MinIO / self-hosted
    prefix: erupt/                         # optional key prefix
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://cdn.example.com        # optional public base URL (CDN); derived from endpoint + bucket when empty
    local-save: false                      # true keeps a copy under erupt.upload-path as well
```

| Property | Default | Description |
| --- | --- | --- |
| `erupt.s3.bucket` | — | Bucket that receives uploads; required |
| `erupt.s3.prefix` | `""` | Key prefix inside the bucket; empty stores at the bucket root |
| `erupt.s3.region` | `"us-east-1"` | Region name; for non-AWS providers, any non-empty value paired with `endpoint` |
| `erupt.s3.endpoint` | `""` | Endpoint URL; empty uses the AWS default. Set for MinIO / OSS / COS / R2 |
| `erupt.s3.access-key` / `secret-key` | `""` | Static credentials; empty falls back to the default provider chain |
| `erupt.s3.path-style` | `false` | Path-style addressing (`endpoint/bucket/key`), required by MinIO and most self-hosted gateways |
| `erupt.s3.domain` | `""` | Public base URL the browser loads files from; empty derives `https://<bucket>.s3.<region>.amazonaws.com`, `<endpoint>/<bucket>` (path-style) or `<scheme>://<bucket>.<endpoint-host>` |
| `erupt.s3.local-save` | `false` | Also keep the file on the local server |

### Storage Path and Public URL

The upload path Erupt generates (`/yyyy-MM-dd/xxxx.ext`) becomes the object key under `prefix` verbatim, and the value stored in the database stays that path — swapping storage later does not rewrite your data. Objects are written with a `Content-Type` guessed from the extension so images render inline. The public URL of an attachment is `fileDomain() + path`, where `fileDomain()` is `domain` (or the derived bucket URL) followed by `prefix`. The bucket (or the CDN in front of it) must allow public reads, or `domain` must point at something that does.

### No Frontend Change Needed

Since 2.3.0, `/erupt-app` returns the registered `AttachmentProxy`'s `fileDomain()`, and the frontend adopts it automatically when `eruptSiteConfig.fileDomain` is empty — so wiring up S3 needs no `app.js` edit. A `fileDomain` set explicitly in `app.js` still takes precedence and can be used to override the value the backend returns.

:::tip Data source vs. attachment proxy
The connection attributes on the `@EruptS3` annotation serve only the object-browsing data source, and `erupt.s3.*` serves only the attachment proxy. They are independent — use either one alone, or point them at different buckets.
:::
