# Custom File Upload (AttachmentProxy)

Erupt attachments (`@Edit(type = ATTACHMENT)`, rich-text images, etc.) land on the local disk by default. To move them to object storage you have two options:

| Option | When to use | Effort |
| --- | --- | --- |
| **Add erupt-data-s3** (recommended) | The storage service exposes an S3-compatible API — AWS S3, Alibaba Cloud OSS, Tencent Cloud COS, MinIO, Cloudflare R2, etc.; see the [compatibility table](#s3-compatibility-by-cloud-provider) below | One annotation + a few lines of yml |
| Implement `AttachmentProxy` yourself | The storage service does not speak S3 (e.g. Upyun, FastDFS), or you need extra processing at upload time | One class + the vendor SDK |

## Recommended: erupt-data-s3 <Badge type="tip" text="v2.3.0+" />

`erupt-data-s3` ships a ready-made `S3AttachmentProxy` built on AWS SDK v2. Two steps:

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-s3</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

```java
@SpringBootApplication
@EruptScan
@EruptAttachmentUpload(S3AttachmentProxy.class)
public class DemoApplication { ... }
```

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: ap-southeast-1
    endpoint: http://minio.internal:9000   # omit for AWS
    path-style: true                       # MinIO / self-hosted
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://cdn.example.com        # optional public URL
```

For the full property list, storage path rules and frontend behaviour see [Erupt S3 → Attachment Upload](/en/modules/erupt-s3/upload).

### S3 Compatibility by Cloud Provider

`S3AttachmentProxy` relies on only four basic S3 calls — `PutObject` (single-shot, no multipart), `HeadObject`, `ListObjectsV2` and `DeleteObject` — signed with SigV4. Any service implementing those works out of the box, so the bar is low. The table grades providers by whether erupt-data-s3 can be used directly:

- ✅ **Native / compatible**: fill in endpoint, region and credentials and go
- ⚠️ **Partial**: works, but with prerequisites or known limitations
- ❌ **Not supported**: no S3 API; implement `AttachmentProxy` yourself

**China**

| Provider | Compatibility | `endpoint` example | `region` | `path-style` | Notes |
| --- | --- | --- | --- | --- | --- |
| Alibaba Cloud OSS | ✅ Compatible | `https://oss-cn-hangzhou.aliyuncs.com` | `cn-hangzhou` | `false` | Virtual-hosted addressing only; `path-style` must be `false` |
| Tencent Cloud COS | ✅ Compatible | `https://cos.ap-guangzhou.myqcloud.com` | `ap-guangzhou` | `false` | Both addressing styles supported; virtual-hosted recommended |
| Huawei Cloud OBS | ✅ Compatible | `https://obs.cn-north-4.myhuaweicloud.com` | `cn-north-4` | `false` | Both addressing styles supported |
| Baidu AI Cloud BOS | ✅ Compatible | `https://s3.bj.bcebos.com` | `bj` | `false` | Use the dedicated S3 domain (with the `s3.` prefix) |
| Qiniu Kodo | ✅ Compatible | `https://s3.cn-east-1.qiniucs.com` | `cn-east-1` | `false` | Enable S3-compatible access in the console; the legacy SDK approach is shown in the example below |
| Volcengine TOS | ✅ Compatible | `https://tos-s3-cn-beijing.volces.com` | `cn-beijing` | `false` | Use the dedicated S3 domain (with the `tos-s3-` prefix) |
| JD Cloud OSS | ✅ Compatible | `https://s3.cn-north-1.jdcloud-oss.com` | `cn-north-1` | `false` | |
| UCloud US3 | ✅ Compatible | `https://s3-cn-bj.ufileos.com` | `cn-bj` | `false` | |
| Kingsoft Cloud KS3 | ⚠️ Partial | S3 endpoint from the console | From the console | `false` | SigV4 support is incomplete in some regions; verify with a test bucket first |
| China Telecom ZOS | ⚠️ Partial | S3 endpoint from the console | From the console | `false` | Endpoint format differs between regions |
| Upyun USS | ❌ Not supported | — | — | — | Proprietary REST API; implement `AttachmentProxy` yourself |

**International**

| Provider | Compatibility | `endpoint` example | `region` | `path-style` | Notes |
| --- | --- | --- | --- | --- | --- |
| AWS S3 | ✅ Native | leave empty | `us-east-1` | `false` | Leave `access-key` empty to use an IAM role |
| Cloudflare R2 | ✅ Compatible | `https://<account-id>.r2.cloudflarestorage.com` | `auto` | `true` | Buckets are private by default; bind a custom domain or enable r2.dev and set it as `domain` |
| Backblaze B2 | ✅ Compatible | `https://s3.us-west-004.backblazeb2.com` | `us-west-004` | `true` | |
| DigitalOcean Spaces | ✅ Compatible | `https://nyc3.digitaloceanspaces.com` | `nyc3` | `false` | |
| Wasabi | ✅ Compatible | `https://s3.us-east-1.wasabisys.com` | `us-east-1` | `false` | |
| Linode / Akamai | ✅ Compatible | `https://us-east-1.linodeobjects.com` | `us-east-1` | `false` | |
| Scaleway | ✅ Compatible | `https://s3.fr-par.scw.cloud` | `fr-par` | `false` | |
| Oracle OCI | ✅ Compatible | `https://<namespace>.compat.objectstorage.<region>.oraclecloud.com` | `<region>` | `true` | Use a Customer Secret Key |
| IBM Cloud COS | ✅ Compatible | `https://s3.us-south.cloud-object-storage.appdomain.cloud` | `us-south` | `false` | Requires HMAC credentials |
| Google Cloud Storage | ⚠️ Partial | `https://storage.googleapis.com` | `auto` | `true` | XML API interoperability mode; requires HMAC keys, some advanced features unavailable |
| Azure Blob Storage | ❌ Not supported | — | — | — | No native S3 API; implement `AttachmentProxy` yourself or put an S3 gateway in front |

**Self-hosted / open source**

| Service | Compatibility | `endpoint` example | `region` | `path-style` |
| --- | --- | --- | --- | --- |
| MinIO | ✅ Compatible | `http://minio.internal:9000` | any non-empty | `true` |
| Ceph RGW | ✅ Compatible | `http://rgw.internal:7480` | any non-empty | `true` |
| SeaweedFS | ✅ Compatible | `http://seaweed.internal:8333` | any non-empty | `true` |
| Garage / RustFS | ✅ Compatible | your deployment URL | any non-empty | `true` |

:::info Check the console for the exact endpoint
The endpoints above are the providers' common formats; regions and domain suffixes change over time, so use the **S3-compatible endpoint** shown in the provider console. For non-AWS providers `region` only feeds the signature — any non-empty value usually works; the table lists the officially recommended one.
:::

:::tip Public attachment URL
The browser loads attachments from `domain + path`, so the bucket (or the CDN in front of it) must allow public reads. Chinese providers usually expose a "public read" switch on the bucket; put the CDN domain into `domain`. Services that are private by default (R2, OCI, ...) need a custom domain bound first.
:::

## Local Storage Configuration

Without an `AttachmentProxy` implementation, attachments are stored on the local disk. The relevant properties live in `EruptProp`:

| Property | Type | Default | Description |
| --- | --- | --- | --- |
| `erupt.upload-path` | `String` | `/opt/erupt-attachment` | Root directory for attachment storage |
| `erupt.keep-upload-file-name` | `boolean` | `false` | Whether to preserve the original filename of uploaded files |

```yaml
erupt:
  upload-path: /opt/erupt-attachment
  keep-upload-file-name: false
```

### `erupt.upload-path`

The root directory attachments are written to, and also the static-resource directory that the `/erupt-attachment/**` access path is mapped to.

- The default is `/opt/erupt-attachment`. That absolute path usually does not exist on Windows or in a local development environment, so set it explicitly to a writable directory on your machine.
- A `classpath:` prefix is supported, in which case the mapping is resolved as a classpath resource (generally only useful for read-only bundled assets).
- Both upload and download normalize the resolved path and verify that it does not escape this root; requests that do are rejected outright.

### `erupt.keep-upload-file-name`

Controls the filename part of the generated storage path. In both modes the directory prefix is the current date (`yyyy-MM-dd`):

| Value | Example generated path | Description |
| --- | --- | --- |
| `false` (default) | `/2026-08-30/aBcDeFgHiJkL.png` | The filename is replaced with 12 random letters; only the original extension is kept |
| `true` | `/2026-08-30/annual-report.png` | The original filename is preserved, with `&`, `#`, `?` and whitespace stripped out |

::: warning Evaluate before enabling
With `keep-upload-file-name = true`, files with identical names overwrite each other, and the filename comes from user input. The default random-filename mode is safer — do not enable this unless your business genuinely needs downloads under the original name.
:::

> Both properties affect **local storage only**. If you implement `AttachmentProxy` and `isLocalSave()` returns `false`, nothing is written to `upload-path`; the storage path (date directory plus filename) is still derived from `keep-upload-file-name` and passed to `upLoad()` as the `path` argument.

## Interface Reference

### `@EruptAttachmentUpload` Annotation

Add this annotation to your Spring Boot entry class, specifying the `AttachmentProxy` implementation:

```java
@EruptAttachmentUpload(QiniuOosProxy.class)
@SpringBootApplication
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

Annotation definition:

```java
// Just implement AttachmentProxy to customize attachment storage — e.g. upload to fastDFS or OSS
public @interface EruptAttachmentUpload {
    Class<? extends AttachmentProxy> value();
}
```

### `AttachmentProxy` Interface

```java
public interface AttachmentProxy {

    /**
     * @param inputStream file data stream
     * @param path        upload path
     * @return storage path — in most cases, return the path parameter as-is
     */
    String upLoad(InputStream inputStream, String path);

    /**
     * Base URL for accessing attachments over the network
     */
    String fileDomain();

    /**
     * Whether to also save the file locally
     */
    default boolean isLocalSave() {
        return true;
    }
}
```

## Implementing AttachmentProxy Yourself (non-S3 storage)

When the storage service has no S3-compatible API, implement the `AttachmentProxy` interface to plug in any backend. The example below uses the Qiniu SDK (Qiniu Kodo now speaks S3, so real projects can use erupt-data-s3 directly; the SDK version is kept as a reference for custom implementations).

### 1. Add Dependency

```xml
<dependency>
    <groupId>com.qiniu</groupId>
    <artifactId>qiniu-java-sdk</artifactId>
    <version>[7.2.0, 7.2.99]</version>
</dependency>
```

### 2. Implement `AttachmentProxy`

Create `QiniuOosProxy.java`:

```java
/**
 * Qiniu object storage demo
 *
 * @author yuepeng
 * @date 2020-05-17
 */
@Service
public class QiniuOosProxy implements AttachmentProxy {

    @Value("${qiniu.access_key}")
    private String accessKey; // Qiniu ACCESS_KEY

    @Value("${qiniu.secret_key}")
    private String secretKey; // Qiniu SECRET_KEY

    @Value("${qiniu.bucket}")
    private String bucket; // bucket name

    @Override
    public String upLoad(InputStream inputStream, String path) {
        UploadManager uploadManager = new UploadManager(new Configuration(Region.huanan()));
        String uploadToken = Auth.create(accessKey, secretKey).uploadToken(bucket);
        // Strip leading slash to avoid double-slash in the access URL
        path = path.startsWith("/") ? path.substring(1) : path;
        try {
            Response response = uploadManager.put(inputStream, path, uploadToken, null, MimeUtil.getMimeType(path));
            if (!response.isOK()) {
                throw new EruptWebApiRuntimeException("Failed to upload to Qiniu storage");
            }
            return "/" + path;
        } catch (QiniuException ex) {
            throw new EruptWebApiRuntimeException(ex.response.toString());
        }
    }

    @Override
    public boolean isLocalSave() {
        return false;
    }

    @Override
    public String fileDomain() {
        return "http://oos.erupt.xyz";
    }
}
```

### 3. Register the Annotation

```java
@SpringBootApplication
@EruptAttachmentUpload(QiniuOosProxy.class)
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

### 4. Configure the Frontend Access URL

Since the attachment base URL has changed, update `app.js`:

```javascript
window.eruptSiteConfig.fileDomain = "http://xxxx.com"; // Your OSS domain
```

Since 2.3.0, `/erupt-app` returns `AttachmentProxy.fileDomain()` and the frontend adopts it automatically when `eruptSiteConfig.fileDomain` is empty, so this step can be skipped; a value set in `app.js` still acts as an explicit override.
