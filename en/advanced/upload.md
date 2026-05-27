# Custom File Upload

By implementing custom file upload rules, you can upload files to cloud object storage services such as Alibaba Cloud OSS, Qiniu Cloud, or Tencent Cloud COS, instead of storing them on the local disk.

## Implementation

Implement the `AttachmentProxy` interface and register it as a Spring Bean:

```java
@Service
public class OssUploadHandler implements AttachmentProxy {

    @Override
    public String upload(InputStream inputStream, String fileName, String suffix) throws Exception {
        // Upload the file to OSS and return the file access URL
        // Example: https://your-bucket.oss-cn-hangzhou.aliyuncs.com/path/to/file.jpg
        String url = ossClient.putObject(inputStream, fileName);
        return url;
    }

}
```

Set `fileDomain` in the configuration file (required if the frontend needs to access OSS resources directly):

```javascript
window.eruptSiteConfig = {
    fileDomain: "https://your-bucket.oss-cn-hangzhou.aliyuncs.com",
};
```

## Notes

- Once `AttachmentProxy` is implemented, the framework will automatically use the custom upload logic
- The returned file path will be stored in the database
- If the frontend needs to access attachments, configure `fileDomain` to point to the OSS access address
