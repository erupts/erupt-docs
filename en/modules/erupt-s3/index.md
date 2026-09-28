# Erupt S3 Object Storage

erupt-data-s3 connects any **S3-compatible object storage** to Erupt — AWS S3, MinIO, Alibaba Cloud OSS, Tencent Cloud COS, Cloudflare R2 and more — built on AWS SDK v2. The module offers two independent capabilities that share one set of configuration:

| Capability | What it does | Page |
| --- | --- | --- |
| **Attachment upload** | Moves every Erupt attachment (`@Edit(type = ATTACHMENT)`, rich-text images, etc.) from the local disk into a bucket | [Attachment Upload](./upload) |
| **Object browsing data source** | Mounts a bucket (or a prefix inside it) as an `@Erupt` model so objects can be searched, inspected and deleted from the admin console with permissions | [Object Data Source](./datasource) |

Most projects only need the first; the second gives ops or business users an auditable object management view.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-s3</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

The module ships `software.amazon.awssdk:s3` — nothing extra to add. Once Spring Boot auto-configuration kicks in, the `erupt.s3.*` properties are available.

## One Configuration, Used Twice

Connection settings live in `erupt.s3.*`:

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: ap-southeast-1
    endpoint: http://minio.internal:9000   # omit for AWS
    path-style: true                       # MinIO / self-hosted
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
```

- The attachment proxy `S3AttachmentProxy` reads this configuration directly.
- Connection attributes left empty on the `@EruptS3` data source annotation fall back to it too, so a model carrying nothing but `@EruptS3` browses the attachment bucket; override only the attributes that differ to reach another bucket or provider.

Keep credentials in configuration or environment variables, never in the annotation — annotation values are compile-time constants and end up in the class file. See the [Configuration Reference](./config) for every property.

## Pages

- [Attachment Upload](./upload) — two steps to store attachments in a bucket; storage path and public URL rules
- [Object Data Source](./datasource) — `@EruptS3`, `S3ObjectModel`, supported operations and limits
- [Configuration Reference](./config) — every `erupt.s3.*` property and `@EruptS3` attribute, fallback rules, credential advice
- [Providers](./providers) — concrete settings for AWS / MinIO / OSS / COS / R2 and the endpoint rules
- [FAQ](./faq) — signature errors, 403s, missing buckets and other troubleshooting

:::tip Versions
The object browsing data source has been available since 2.1.0; the `S3AttachmentProxy` and the `erupt.s3.*` properties since **2.3.0**.
:::
