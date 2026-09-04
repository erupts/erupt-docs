# 自定义文件上传（AttachmentProxy）

通过自定义文件上传规则，可以将文件上传到阿里云 OSS、七牛云、腾讯云 COS 等对象存储服务，而不是存储在本地磁盘。

## 本地存储配置项

不实现 `AttachmentProxy` 时，附件默认存储在本地磁盘，相关配置位于 `EruptProp`：

| 配置项 | 类型 | 默认值 | 说明 |
| --- | --- | --- | --- |
| `erupt.upload-path` | `String` | `/opt/erupt-attachment` | 附件存储根目录 |
| `erupt.keep-upload-file-name` | `boolean` | `false` | 是否保留上传文件的原始文件名 |

```yaml
erupt:
  upload-path: /opt/erupt-attachment
  keep-upload-file-name: false
```

### `erupt.upload-path`

附件写入磁盘的根目录，同时也是附件访问路径 `/erupt-attachment/**` 映射到的静态资源目录。

- 默认值为 `/opt/erupt-attachment`。在 Windows 或本地开发环境下该绝对路径通常不存在，建议显式改为本机可写目录。
- 支持 `classpath:` 前缀，此时会按 classpath 资源方式映射（一般仅用于只读的内置资源）。
- 上传与下载都会对最终路径做归一化并校验是否逃逸出该根目录，越界请求会被直接拒绝。

### `erupt.keep-upload-file-name`

控制生成的存储路径中文件名部分的形态，两种模式的目录前缀都是当前日期（`yyyy-MM-dd`）：

| 取值 | 生成路径示例 | 说明 |
| --- | --- | --- |
| `false`（默认） | `/2026-08-30/aBcDeFgHiJkL.png` | 文件名替换为 12 位随机字母，仅保留原扩展名 |
| `true` | `/2026-08-30/年度报表.png` | 保留原始文件名，但会剔除其中的 `&`、`#`、`?` 与空白字符 |

::: warning 开启前请评估
`keep-upload-file-name = true` 时同名文件会相互覆盖，且文件名来自用户输入。默认的随机文件名模式更安全，除非业务确实需要按原名下载，否则不建议开启。
:::

> 以上两项仅影响**本地存储**。若实现了 `AttachmentProxy` 且 `isLocalSave()` 返回 `false`，文件不会写入 `upload-path`；但存储路径（含日期目录与文件名）仍由 `keep-upload-file-name` 决定，并作为 `path` 参数传给 `upLoad()`。

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
