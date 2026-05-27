# 自定义文件上传

通过自定义文件上传规则，可以将文件上传到阿里云 OSS、七牛云、腾讯云 COS 等对象存储服务，而不是存储在本地磁盘。

## 实现方式

实现 `AttachmentProxy` 接口并注册为 Spring Bean：

```java
@Service
public class OssUploadHandler implements AttachmentProxy {

    @Override
    public String upload(InputStream inputStream, String fileName, String suffix) throws Exception {
        // 将文件上传到 OSS，返回文件访问 URL
        // 例如：https://your-bucket.oss-cn-hangzhou.aliyuncs.com/path/to/file.jpg
        String url = ossClient.putObject(inputStream, fileName);
        return url;
    }

}
```

配置文件中设置 `fileDomain`（如果需要前端直接访问 OSS 资源）：

```javascript
window.eruptSiteConfig = {
    fileDomain: "https://your-bucket.oss-cn-hangzhou.aliyuncs.com",
};
```

## 注意事项

- 实现 `AttachmentProxy` 接口后，框架会自动使用自定义上传逻辑
- 返回的文件路径会存储到数据库中
- 如果前端需要访问附件，需要配置 `fileDomain` 指向 OSS 访问地址
