# Attachment Upload (S3AttachmentProxy) <Badge type="tip" text="v2.3.0+" />

`S3AttachmentProxy` is the module's built-in [Attachment Storage (AttachmentProxy)](/en/advanced/upload) implementation. Once registered, every Erupt attachment upload — `@Edit(type = ATTACHMENT)`, rich-text editor images, avatars — is written to the bucket instead of the local disk.

## Two Steps

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
    domain: https://cdn.example.com        # optional public URL the browser loads attachments from
    local-save: false                      # true also keeps a copy under erupt.upload-path
```

`bucket` is required; the rest depends on the provider — see [Providers](./providers) for each provider's endpoint / region / path-style combination and the [Configuration Reference](./config#erupt-s3-properties) for every property.

## Storage Path and Public URL

Erupt generates a path like `/yyyy-MM-dd/xxxx.ext` for each attachment (filename rules: [erupt.keep-upload-file-name](/en/advanced/upload#erupt-keep-upload-file-name)). The proxy handles it as follows:

| Stage | Value |
| --- | --- |
| Object key | `prefix` + the path without its leading `/`, e.g. `erupt/2026-09-28/aBcDeFgHiJkL.png` |
| Value stored in the database | Still the original path `/2026-09-28/aBcDeFgHiJkL.png` |
| URL the browser loads | `fileDomain()` + path, where `fileDomain()` = `domain` (or the derived bucket URL) + `/` + `prefix` |
| `Content-Type` | Guessed from the extension and written with the object, so images render inline |

Because the database only stores the relative path, moving from local disk to S3 later, or from one provider to another, never rewrites existing data — just point `domain` at the new location.

### How the URL Is Derived When `domain` Is Empty

| Configuration | Derived public URL |
| --- | --- |
| `endpoint` empty (AWS) | `https://<bucket>.s3.<region>.amazonaws.com` |
| `path-style: true` | `<endpoint>/<bucket>` |
| `path-style: false` | `<scheme>://<bucket>.<endpoint-host>[:port]` |

The derived URL points straight at the storage service, so **the bucket must allow public reads**. In production it is more common to put a CDN in front of the bucket and set its domain as `domain`. Services that are private by default, such as Cloudflare R2 or Oracle OCI, need a custom domain bound first.

## No Frontend Change Needed

Since 2.3.0, `/erupt-app` returns the registered `AttachmentProxy`'s `fileDomain()`, and the frontend adopts it automatically when `eruptSiteConfig.fileDomain` is empty — so wiring up S3 needs no `app.js` edit. A `fileDomain` set explicitly in `app.js` still takes precedence and can override the value the backend returns.

## Coexisting with Local Storage

With `local-save: true`, each file is written to the bucket and also kept under `erupt.upload-path`. Useful for dual-writing during a migration, or when application code still reads local files directly. Turn it off once things are stable.

## When an Upload Fails

Network, authentication or missing-bucket errors surface in the frontend as `S3 operation failed → <provider error message>`, with the provider's original message attached; see the [FAQ](./faq) to diagnose. A missing `bucket` fails immediately with "Attachment bucket erupt.s3.bucket is not configured".

:::info Single PutObject
The proxy writes each file with a single `PutObject` call, no multipart upload, which maximises compatibility. For very large files (several GB) consider the memory footprint, or cap attachment size in the frontend.
:::
