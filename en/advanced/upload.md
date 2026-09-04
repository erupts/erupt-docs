# Custom File Upload (AttachmentProxy)

By implementing custom file upload rules, you can upload files to cloud object storage services such as Alibaba Cloud OSS, Qiniu Cloud, or Tencent Cloud COS, instead of storing them on the local disk.

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

## Example: Upload to Qiniu Cloud Storage

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
