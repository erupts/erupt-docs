# Configuration Reference

All connection settings of the module live in `erupt.s3.*`; the attributes on the `@EruptS3` annotation are per-model overrides.

## erupt.s3 Properties

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    prefix: ""
    region: us-east-1
    endpoint: ""
    access-key: ""
    secret-key: ""
    path-style: false
    domain: ""
    local-save: false
```

| Property | Default | Description |
| --- | --- | --- |
| `erupt.s3.bucket` | — | Bucket that receives attachment uploads; required once the proxy is in use. Also the default bucket for data sources |
| `erupt.s3.prefix` | `""` | Key prefix for attachments inside the bucket, e.g. `erupt/`; empty stores at the root. **Attachment proxy only** — a data source's prefix comes from `@EruptS3.prefix` |
| `erupt.s3.region` | `us-east-1` | Region name. Must match the bucket's region on AWS; for other providers it only feeds the signature, so use the officially recommended value or any non-empty string together with `endpoint` |
| `erupt.s3.endpoint` | `""` | Service URL. Empty uses the AWS default for `region`; required for MinIO / OSS / COS / R2 |
| `erupt.s3.access-key` | `""` | Static credential. Empty falls back to the AWS default credential chain |
| `erupt.s3.secret-key` | `""` | Only read when `access-key` is set |
| `erupt.s3.path-style` | `false` | Path-style addressing (`endpoint/bucket/key`). MinIO and most self-hosted gateways need `true`; Alibaba Cloud OSS requires `false` |
| `erupt.s3.domain` | `""` | Public base URL the browser loads attachments from (e.g. a CDN), no trailing `/`. Empty derives it from endpoint + bucket, see [Attachment Upload](./upload#how-the-url-is-derived-when-domain-is-empty) |
| `erupt.s3.local-save` | `false` | Also keep a copy under `erupt.upload-path` |

## @EruptS3 Annotation Attributes

| Attribute | Default | When empty | Description |
| --- | --- | --- | --- |
| `bucket` | `""` | `erupt.s3.bucket` | Bucket to list |
| `prefix` | `""` | Lists the whole bucket | Key prefix filter (does not fall back to `erupt.s3.prefix`) |
| `region` | `""` | `erupt.s3.region` | Region name |
| `endpoint` | `""` | `erupt.s3.endpoint` + `erupt.s3.path-style` | Service URL |
| `accessKey` | `""` | `erupt.s3.access-key` → default credential chain | Not recommended in the annotation |
| `secretKey` | `""` | `erupt.s3.secret-key` | Only read when `accessKey` is set |
| `pathStyle` | `false` | Falls back together with `endpoint` | Only honoured when the annotation sets `endpoint` explicitly |
| `pageSize` | `1000` | — | Maximum objects returned by a single list call |
| `maxObjects` | `5000` | — | Hard cap on objects returned across all pages |

### Fallback Rules

- `endpoint` and `pathStyle` form a pair: if the annotation sets `endpoint`, its `pathStyle` is used; otherwise both come from `erupt.s3.*`.
- `accessKey` and `secretKey` form a pair: the annotation's `secretKey` is only read when it also sets `accessKey`.
- `bucket` and `region` fall back independently.

## `endpoint` Is the Service Host, Not the Bucket Host

`endpoint` should be the provider's service domain (e.g. `https://oss-cn-hangzhou.aliyuncs.com`). Consoles often show the bucket-specific host (`https://mybucket.oss-cn-hangzhou.aliyuncs.com`); with virtual-hosted addressing the SDK prepends the bucket name again and the request lands on a bucket that does not exist. The module detects this and drops the leading `mybucket.` label, but using the service domain directly is still recommended.

## Credentials

With `access-key` / `secret-key` empty the AWS default credential chain is used, in order:

1. Environment variables `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
2. `~/.aws/credentials`
3. EC2 / ECS / EKS instance roles

This is the recommended approach in production, or inject from environment variables with `${S3_ACCESS_KEY}` placeholders in yml. **Never put keys in the `@EruptS3` annotation**: annotation values are compile-time constants and end up verbatim in the class file and the jar.
