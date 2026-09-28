# 附件存储（AttachmentProxy）

Erupt 的附件（`@Edit(type = ATTACHMENT)`、富文本图片等）默认落在本地磁盘。要改存到对象存储，有两条路：

| 方案 | 适用场景 | 工作量 |
| --- | --- | --- |
| **引入 erupt-data-s3**（推荐） | 存储服务提供 S3 兼容 API——AWS S3、阿里云 OSS、腾讯云 COS、MinIO、Cloudflare R2 等，见下方[兼容性表](#各云厂商-s3-兼容性) | 一个注解 + 几行 yml |
| 自行实现 `AttachmentProxy` | 存储服务不走 S3 协议（如又拍云、FastDFS），或需要在上传时做额外处理 | 写一个类 + 引入厂商 SDK |

## 推荐方案：erupt-data-s3 <Badge type="tip" text="v2.3.0+" />

`erupt-data-s3` 内置了现成的 `S3AttachmentProxy`，基于 AWS SDK v2，两步接入：

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
    endpoint: http://minio.internal:9000   # AWS 可省略
    path-style: true                       # MinIO / 自建服务
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://cdn.example.com        # 可选，公网访问地址
```

完整配置项、存储路径规则与前端行为见 [Erupt S3 → 附件上传](/zh/modules/erupt-s3/upload)。

### 各云厂商 S3 兼容性

`S3AttachmentProxy` 只用到四个最基础的 S3 调用：`PutObject`（单次上传，不走分片）、`HeadObject`、`ListObjectsV2`、`DeleteObject`，签名为 SigV4。任何实现了这几个接口的服务都能直接接入，门槛很低。下表按「能否直接用 erupt-data-s3」分级：

- ✅ **原生 / 兼容**：填 endpoint、region、密钥即可
- ⚠️ **部分兼容**：能用，但有前置条件或已知限制
- ❌ **不支持**：没有 S3 API，需自行实现 `AttachmentProxy`

**国内厂商**

| 服务商 | 兼容性 | `endpoint` 示例 | `region` | `path-style` | 备注 |
| --- | --- | --- | --- | --- | --- |
| 阿里云 OSS | ✅ 兼容 | `https://oss-cn-hangzhou.aliyuncs.com` | `cn-hangzhou` | `false` | 仅支持虚拟主机寻址，`path-style` 必须为 `false` |
| 腾讯云 COS | ✅ 兼容 | `https://cos.ap-guangzhou.myqcloud.com` | `ap-guangzhou` | `false` | 两种寻址都支持，推荐虚拟主机 |
| 华为云 OBS | ✅ 兼容 | `https://obs.cn-north-4.myhuaweicloud.com` | `cn-north-4` | `false` | 两种寻址都支持 |
| 百度智能云 BOS | ✅ 兼容 | `https://s3.bj.bcebos.com` | `bj` | `false` | 使用 S3 专用域名（带 `s3.` 前缀） |
| 七牛云 Kodo | ✅ 兼容 | `https://s3.cn-east-1.qiniucs.com` | `cn-east-1` | `false` | 需在控制台开通 S3 兼容访问；旧版 SDK 方式见下方示例 |
| 火山引擎 TOS | ✅ 兼容 | `https://tos-s3-cn-beijing.volces.com` | `cn-beijing` | `false` | 使用带 `tos-s3-` 前缀的 S3 专用域名 |
| 京东云 OSS | ✅ 兼容 | `https://s3.cn-north-1.jdcloud-oss.com` | `cn-north-1` | `false` | |
| UCloud US3 | ✅ 兼容 | `https://s3-cn-bj.ufileos.com` | `cn-bj` | `false` | |
| 金山云 KS3 | ⚠️ 部分兼容 | 以控制台 S3 Endpoint 为准 | 以控制台为准 | `false` | 部分区域 SigV4 支持不完整，接入前先用测试 Bucket 验证 |
| 天翼云 ZOS | ⚠️ 部分兼容 | 以控制台 S3 Endpoint 为准 | 以控制台为准 | `false` | 各区域 endpoint 格式不统一 |
| 又拍云 USS | ❌ 不支持 | — | — | — | 私有 REST API，需自行实现 `AttachmentProxy` |

**海外厂商**

| 服务商 | 兼容性 | `endpoint` 示例 | `region` | `path-style` | 备注 |
| --- | --- | --- | --- | --- | --- |
| AWS S3 | ✅ 原生 | 留空 | `us-east-1` | `false` | 留空 `access-key` 可走 IAM 角色 |
| Cloudflare R2 | ✅ 兼容 | `https://<account-id>.r2.cloudflarestorage.com` | `auto` | `true` | Bucket 默认不公开，需绑定自定义域名或开启 r2.dev 并填到 `domain` |
| Backblaze B2 | ✅ 兼容 | `https://s3.us-west-004.backblazeb2.com` | `us-west-004` | `true` | |
| DigitalOcean Spaces | ✅ 兼容 | `https://nyc3.digitaloceanspaces.com` | `nyc3` | `false` | |
| Wasabi | ✅ 兼容 | `https://s3.us-east-1.wasabisys.com` | `us-east-1` | `false` | |
| Linode / Akamai | ✅ 兼容 | `https://us-east-1.linodeobjects.com` | `us-east-1` | `false` | |
| Scaleway | ✅ 兼容 | `https://s3.fr-par.scw.cloud` | `fr-par` | `false` | |
| Oracle OCI | ✅ 兼容 | `https://<namespace>.compat.objectstorage.<region>.oraclecloud.com` | `<region>` | `true` | 使用 Customer Secret Key |
| IBM Cloud COS | ✅ 兼容 | `https://s3.us-south.cloud-object-storage.appdomain.cloud` | `us-south` | `false` | 需创建 HMAC 凭证 |
| Google Cloud Storage | ⚠️ 部分兼容 | `https://storage.googleapis.com` | `auto` | `true` | 走 XML API 互操作模式，需生成 HMAC 密钥；部分高级特性不可用 |
| Azure Blob Storage | ❌ 不支持 | — | — | — | 无原生 S3 API，需自行实现 `AttachmentProxy` 或前置 S3 网关 |

**自建 / 开源**

| 服务 | 兼容性 | `endpoint` 示例 | `region` | `path-style` |
| --- | --- | --- | --- | --- |
| MinIO | ✅ 兼容 | `http://minio.internal:9000` | 任意非空 | `true` |
| Ceph RGW | ✅ 兼容 | `http://rgw.internal:7480` | 任意非空 | `true` |
| SeaweedFS | ✅ 兼容 | `http://seaweed.internal:8333` | 任意非空 | `true` |
| Garage / RustFS | ✅ 兼容 | 按部署地址 | 任意非空 | `true` |

:::info endpoint 以控制台为准
表中 endpoint 为各厂商的通用格式示例，区域、域名后缀可能随时间变化，接入前请以对应控制台展示的 **S3 兼容 Endpoint** 为准。非 AWS 服务商的 `region` 只参与签名计算，多数情况下填任意非空值即可，表中给出的是官方推荐值。
:::

:::tip 附件公网地址
浏览器加载附件走 `domain + path`，Bucket 或其前面的 CDN 需允许公开读取。国内厂商一般直接在 Bucket 权限里开「公共读」并把 CDN 域名填到 `domain`；R2、OCI 等默认私有的服务需先绑定自定义域名。
:::

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

## 自行实现 AttachmentProxy（非 S3 协议存储）

存储服务没有 S3 兼容 API 时，实现 `AttachmentProxy` 接口即可接入任意存储。下面以七牛云 SDK 为例（七牛云 Kodo 现已支持 S3 协议，实际项目可直接用 erupt-data-s3；这里保留 SDK 写法作为自定义实现的参考）。

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

2.3.0 起 `/erupt-app` 接口会返回 `AttachmentProxy.fileDomain()`，前端在 `eruptSiteConfig.fileDomain` 为空时自动采用，因此这一步可以省略；`app.js` 中的值仍作为显式覆盖优先生效。
