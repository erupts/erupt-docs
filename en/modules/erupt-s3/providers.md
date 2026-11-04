# Providers

Providers differ in only three fields: `endpoint`, `region` and `path-style`. Below are complete settings for the common ones (shown as attachment upload configuration; the `@EruptS3` annotation takes the same values). For more providers and how well each supports S3, see [S3 Compatibility by Cloud Provider](/en/advanced/upload#s3-compatibility-by-cloud-provider).

## AWS S3

```yaml
erupt:
  s3:
    bucket: prod-uploads
    region: ap-southeast-1        # must match the bucket's region
    # endpoint left empty
    # access-key left empty → IAM role / environment variables
```

The public URL derives to `https://prod-uploads.s3.ap-southeast-1.amazonaws.com`; disable "Block public access" on the bucket and add a public-read bucket policy, or put CloudFront in front and set `domain`.

## MinIO / Self-Hosted

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: us-east-1             # any non-empty value
    endpoint: http://minio.internal:9000
    path-style: true              # almost always required for self-hosted
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://files.example.com   # the browser cannot reach an internal endpoint; a public URL is required
```

Ceph RGW, SeaweedFS, Garage and RustFS use the same settings with a different `endpoint`. For internal deployments `domain` is mandatory, otherwise the derived URL is an internal address.

## Alibaba Cloud OSS

```yaml
erupt:
  s3:
    bucket: my-bucket
    region: cn-hangzhou
    endpoint: https://oss-cn-hangzhou.aliyuncs.com
    path-style: false             # OSS supports virtual-hosted addressing only
    access-key: ${OSS_ACCESS_KEY}
    secret-key: ${OSS_SECRET_KEY}
```

Set the bucket ACL to public-read, or bind a CDN domain and set it as `domain`.

## Tencent Cloud COS

```yaml
erupt:
  s3:
    bucket: my-bucket-1250000000  # COS bucket names carry the APPID suffix
    region: ap-guangzhou
    endpoint: https://cos.ap-guangzhou.myqcloud.com
    path-style: false
    access-key: ${COS_SECRET_ID}
    secret-key: ${COS_SECRET_KEY}
```

## Cloudflare R2

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: auto
    endpoint: https://<account-id>.r2.cloudflarestorage.com
    path-style: true
    access-key: ${R2_ACCESS_KEY}
    secret-key: ${R2_SECRET_KEY}
    domain: https://files.example.com   # R2 is private by default; bind a custom domain or enable r2.dev
```

## Qiniu Kodo

```yaml
erupt:
  s3:
    bucket: my-bucket
    region: cn-east-1
    endpoint: https://s3.cn-east-1.qiniucs.com
    path-style: false
    access-key: ${QINIU_ACCESS_KEY}
    secret-key: ${QINIU_SECRET_KEY}
    domain: https://cdn.example.com     # Qiniu bucket domains are bound in the console
```

## Huawei Cloud OBS / Baidu BOS / Volcengine TOS

Same as OSS with a different endpoint and region:

| Provider | `endpoint` | `region` |
| --- | --- | --- |
| Huawei Cloud OBS | `https://obs.cn-north-4.myhuaweicloud.com` | `cn-north-4` |
| Baidu AI Cloud BOS | `https://s3.bj.bcebos.com` | `bj` |
| Volcengine TOS | `https://tos-s3-cn-beijing.volces.com` | `cn-beijing` |

:::info Check the console for the exact endpoint
The endpoints above are each provider's common format; regions and domain suffixes change over time, so use the **S3-compatible endpoint** shown in the console. A bucket-specific host also works (the module strips the leading bucket label), but the service domain is recommended.
:::

## Multiple Providers at Once

`erupt.s3.*` holds a single configuration, used by the attachment proxy and as the default for data sources. Data source models can each point at a different provider by overriding `endpoint` / `region` / `bucket` on `@EruptS3`:

```java
@EruptS3(bucket = "archive", endpoint = "https://oss-cn-hangzhou.aliyuncs.com", region = "cn-hangzhou")
```

Credentials should still come from the default credential chain or environment variables rather than the annotation.
