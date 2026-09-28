# Erupt S3 对象存储

erupt-data-s3 把任何 **S3 兼容的对象存储**接入 Erupt——AWS S3、MinIO、阿里云 OSS、腾讯云 COS、Cloudflare R2 等，基于 AWS SDK v2 构建。模块提供两项相互独立、但共用一套配置的能力：

| 能力 | 做什么 | 入口 |
| --- | --- | --- |
| **附件上传** | 把 Erupt 所有附件（`@Edit(type = ATTACHMENT)`、富文本图片等）从本地磁盘转存到 Bucket | [附件上传](./upload) |
| **对象浏览数据源** | 把一个 Bucket（或某个前缀）挂成 `@Erupt` 模型，在后台按权限检索、查看、删除对象 | [对象浏览数据源](./datasource) |

多数项目只用第一项；第二项适合给运维或业务人员一个可审计的对象管理界面。

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-data-s3</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

模块内置 `software.amazon.awssdk:s3`，无需额外引入。Spring Boot 自动装配生效后，`erupt.s3.*` 配置项即可使用。

## 一份配置，两处复用

连接信息统一写在 `erupt.s3.*`：

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: ap-southeast-1
    endpoint: http://minio.internal:9000   # AWS 可省略
    path-style: true                       # MinIO / 自建服务
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
```

- 附件代理 `S3AttachmentProxy` 直接读取这份配置。
- 数据源注解 `@EruptS3` 上留空的连接属性也回退到这份配置，因此一个只写 `@EruptS3` 的模型浏览的就是附件 Bucket；需要看别的 Bucket 或别的服务商时，只覆盖对应属性即可。

密钥请始终放在配置文件或环境变量，不要写进注解——注解值是编译期常量，会进 class 文件。完整字段说明见[配置参考](./config)。

## 页面导航

- [附件上传](./upload) —— 两步把附件切到 Bucket，存储路径与公网地址规则
- [对象浏览数据源](./datasource) —— `@EruptS3`、`S3ObjectModel`、支持的操作与限制
- [配置参考](./config) —— `erupt.s3.*` 与 `@EruptS3` 全部属性、回退规则、凭证建议
- [服务商接入](./providers) —— AWS / MinIO / OSS / COS / R2 的具体写法与 endpoint 规则
- [常见问题](./faq) —— 签名错误、403、Bucket 找不到等排查

:::tip 版本
对象浏览数据源自 2.1.0 起提供；附件上传代理 `S3AttachmentProxy` 与 `erupt.s3.*` 配置自 **2.3.0** 起提供。
:::
