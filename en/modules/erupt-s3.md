# Erupt S3 Object Storage Data Source

The erupt-data-s3 module provides an S3-compatible object storage data source, built on AWS SDK v2. Bind an `@Erupt` model to a bucket (AWS S3, MinIO, Aliyun OSS, Tencent COS, Cloudflare R2, etc.) and get a permissioned, searchable, auditable admin view of objects in the Erupt console — with the standard delete flow wired up.

**Read + delete only.** Uploading raw object content through an admin form is not a good fit — use the S3 SDK or your app's own upload flow directly.

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
