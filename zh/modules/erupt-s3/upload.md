# 附件上传（S3AttachmentProxy） <Badge type="tip" text="v2.3.0+" />

`S3AttachmentProxy` 是模块内置的 [附件存储（AttachmentProxy）](/zh/advanced/upload) 实现。注册后，Erupt 所有附件上传——`@Edit(type = ATTACHMENT)`、富文本编辑器图片、头像等——都会写入 Bucket，而不是本地磁盘。

## 两步接入

**第一步**：在 Spring Boot 入口类上注册代理：

```java
@SpringBootApplication
@EruptScan
@EruptAttachmentUpload(S3AttachmentProxy.class)
public class DemoApplication { ... }
```

**第二步**：在配置文件中填写 `erupt.s3.*`：

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: ap-southeast-1
    endpoint: http://minio.internal:9000   # AWS 可省略
    path-style: true                       # MinIO / 自建服务
    prefix: erupt/                         # 可选的 Key 前缀
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://cdn.example.com        # 可选，浏览器访问附件的公网地址
    local-save: false                      # true 时同时在 erupt.upload-path 下保留一份
```

`bucket` 必填，其余按服务商填写——各家的 endpoint / region / path-style 组合见[服务商接入](./providers)，全部配置项见[配置参考](./config#erupt-s3-配置项)。

## 存储路径与访问地址

Erupt 为每个附件生成的路径形如 `/yyyy-MM-dd/xxxx.ext`（文件名规则见 [erupt.keep-upload-file-name](/zh/advanced/upload#erupt-keep-upload-file-name)）。代理按下面的规则处理它：

| 环节 | 值 |
| --- | --- |
| 对象 Key | `prefix` + 路径去掉开头的 `/`，如 `erupt/2026-09-28/aBcDeFgHiJkL.png` |
| 数据库中保存的值 | 仍是原始路径 `/2026-09-28/aBcDeFgHiJkL.png` |
| 浏览器访问地址 | `fileDomain()` + 路径，其中 `fileDomain()` = `domain`（或推导出的 Bucket 地址）+ `/` + `prefix` |
| `Content-Type` | 按扩展名推断后写入对象，图片可直接内联展示 |

数据库里只存相对路径，意味着日后从本地磁盘迁到 S3、或从一家服务商换到另一家，都不需要改写已有数据——只要 `domain` 指向新地址即可。

### `domain` 留空时的推导规则

| 配置情况 | 推导出的公网地址 |
| --- | --- |
| `endpoint` 为空（AWS） | `https://<bucket>.s3.<region>.amazonaws.com` |
| `path-style: true` | `<endpoint>/<bucket>` |
| `path-style: false` | `<scheme>://<bucket>.<endpoint-host>[:port]` |

推导地址直接指向存储服务本身，因此 **Bucket 必须允许公开读取**。生产环境更常见的做法是在 Bucket 前面放 CDN，并把 CDN 域名填到 `domain`。Cloudflare R2、Oracle OCI 这类默认私有的服务，需要先绑定自定义域名再填到 `domain`。

## 前端无需改动

自 2.3.0 起，`/erupt-app` 接口会返回已注册 `AttachmentProxy` 的 `fileDomain()`，前端在 `eruptSiteConfig.fileDomain` 为空时自动采用。因此接入 S3 不必修改 `app.js`。`app.js` 中显式设置的 `fileDomain` 仍优先生效，可用于覆盖后端返回的地址。

## 与本地存储并存

`local-save: true` 时，文件在写入 Bucket 的同时也会在 `erupt.upload-path` 下保留一份。适合迁移期间做双写，或者应用内还有直接读本地文件的代码。稳定后关掉即可。

## 上传失败的表现

上传遇到网络、鉴权或 Bucket 不存在等错误时，前端会收到形如 `S3 操作失败 → <服务端错误信息>` 的提示，错误信息来自服务商返回的原文，按[常见问题](./faq)排查即可。`bucket` 未配置时会直接报「未配置附件存储桶 erupt.s3.bucket」。

:::info 单次 PutObject
代理以单次 `PutObject` 写入整个文件，不使用分片上传，兼容性最好；超大文件（数 GB）的场景请评估内存占用，或在前端限制附件大小。
:::
