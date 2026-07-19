# 自定义文件上传（AttachmentProxy）

通过自定义文件上传规则，可以将文件上传到阿里云 OSS、七牛云、腾讯云 COS 等对象存储服务，而不是存储在本地磁盘。

## 接口说明

### `@EruptAttachmentUpload` 注解

在 Spring Boot 入口类上添加此注解，指定 `AttachmentProxy` 的实现类：

```java
@EruptAttachmentUpload(QiniuOosProxy.class)
@SpringBootApplication
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

注解定义：

```java
// 仅需实现 AttachmentProxy 接口就可以自定义附件存储规则，如上传到 fastDFS 或者 OSS 中
public @interface EruptAttachmentUpload {
    Class<? extends AttachmentProxy> value();
}
```

### `AttachmentProxy` 接口

```java
public interface AttachmentProxy {

    /**
     * @param inputStream 数据流
     * @param path        上传位置
     * @return 存储路径，正常情况下直接返回 path 参数即可
     */
    String upLoad(InputStream inputStream, String path);

    /**
     * 附件网络根地址
     */
    String fileDomain();

    /**
     * 是否同时保存到本地
     */
    default boolean isLocalSave() {
        return true;
    }
}
```

## 示例：上传到七牛云存储

### 1. 添加依赖

```xml
<dependency>
    <groupId>com.qiniu</groupId>
    <artifactId>qiniu-java-sdk</artifactId>
    <version>[7.2.0, 7.2.99]</version>
</dependency>
```

### 2. 实现 `AttachmentProxy`

新建 `QiniuOosProxy.java`：

```java
/**
 * 七牛对象存储 demo
 *
 * @author yuepeng
 * @date 2020-05-17
 */
@Service
public class QiniuOosProxy implements AttachmentProxy {

    @Value("${qiniu.access_key}")
    private String accessKey; // 七牛云 ACCESS_KEY

    @Value("${qiniu.secret_key}")
    private String secretKey; // 七牛云 SECRET_KEY

    @Value("${qiniu.bucket}")
    private String bucket; // bucket 名称

    @Override
    public String upLoad(InputStream inputStream, String path) {
        UploadManager uploadManager = new UploadManager(new Configuration(Region.huanan()));
        String uploadToken = Auth.create(accessKey, secretKey).uploadToken(bucket);
        // 去掉开头的斜杠，避免访问地址出现双斜杠
        path = path.startsWith("/") ? path.substring(1) : path;
        try {
            Response response = uploadManager.put(inputStream, path, uploadToken, null, MimeUtil.getMimeType(path));
            if (!response.isOK()) {
                throw new EruptWebApiRuntimeException("上传七牛云存储空间失败");
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

### 3. 注册注解

```java
@SpringBootApplication
@EruptAttachmentUpload(QiniuOosProxy.class)
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```

### 4. 配置前端访问地址

由于附件根地址发生变化，需在 `app.js` 中更新配置：

```javascript
window.eruptSiteConfig.fileDomain = "http://xxxx.com"; // OSS 域名路径
```
