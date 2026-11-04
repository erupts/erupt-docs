# 服务商接入

不同服务商的差别只在三个字段：`endpoint`、`region`、`path-style`。下面给出常见服务商的完整写法（以附件上传配置为例，`@EruptS3` 注解同理），更多厂商及其兼容程度见[各云厂商 S3 兼容性](/zh/advanced/upload#各云厂商-s3-兼容性)。

## AWS S3

```yaml
erupt:
  s3:
    bucket: prod-uploads
    region: ap-southeast-1        # 必须与 Bucket 所在区域一致
    # endpoint 留空
    # access-key 留空 → 走 IAM 角色 / 环境变量
```

公网地址自动推导为 `https://prod-uploads.s3.ap-southeast-1.amazonaws.com`，Bucket 需关闭「阻止公共访问」并设置公共读策略，或前置 CloudFront 后填 `domain`。

## MinIO / 自建服务

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: us-east-1             # 任意非空值
    endpoint: http://minio.internal:9000
    path-style: true              # 自建服务几乎都需要
    access-key: ${S3_ACCESS_KEY}
    secret-key: ${S3_SECRET_KEY}
    domain: https://files.example.com   # 内网 endpoint 浏览器访问不到，必须填公网地址
```

Ceph RGW、SeaweedFS、Garage、RustFS 写法相同，只换 `endpoint`。内网部署时 `domain` 必填，否则推导出的地址是内网 IP。

## 阿里云 OSS

```yaml
erupt:
  s3:
    bucket: my-bucket
    region: cn-hangzhou
    endpoint: https://oss-cn-hangzhou.aliyuncs.com
    path-style: false             # OSS 仅支持虚拟主机寻址
    access-key: ${OSS_ACCESS_KEY}
    secret-key: ${OSS_SECRET_KEY}
```

Bucket 读写权限设为「公共读」，或绑定 CDN 加速域名后填到 `domain`。

## 腾讯云 COS

```yaml
erupt:
  s3:
    bucket: my-bucket-1250000000  # COS 的 Bucket 名带 APPID 后缀
    region: ap-guangzhou
    endpoint: https://cos.ap-guangzhou.myqcloud.com
    path-style: false
    access-key: ${COS_SECRET_ID}
    secret-key: ${COS_SECRET_KEY}
```

## Cloudflare R2

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    region: auto
    endpoint: https://<account-id>.r2.cloudflarestorage.com
    path-style: true
    access-key: ${R2_ACCESS_KEY}
    secret-key: ${R2_SECRET_KEY}
    domain: https://files.example.com   # R2 默认私有，必须绑定自定义域名或开启 r2.dev
```

## 七牛云 Kodo

```yaml
erupt:
  s3:
    bucket: my-bucket
    region: cn-east-1
    endpoint: https://s3.cn-east-1.qiniucs.com
    path-style: false
    access-key: ${QINIU_ACCESS_KEY}
    secret-key: ${QINIU_SECRET_KEY}
    domain: https://cdn.example.com     # 七牛的 Bucket 域名需在控制台绑定
```

## 华为云 OBS / 百度 BOS / 火山引擎 TOS

写法与 OSS 相同，只换 endpoint 与 region：

| 服务商 | `endpoint` | `region` |
| --- | --- | --- |
| 华为云 OBS | `https://obs.cn-north-4.myhuaweicloud.com` | `cn-north-4` |
| 百度智能云 BOS | `https://s3.bj.bcebos.com` | `bj` |
| 火山引擎 TOS | `https://tos-s3-cn-beijing.volces.com` | `cn-beijing` |

:::info endpoint 以控制台为准
以上 endpoint 为各厂商的通用格式，区域和域名后缀可能变化，接入前请以控制台展示的 **S3 兼容 Endpoint** 为准。填成 Bucket 专属域名也能识别（模块会去掉开头的 Bucket 名），但推荐直接填服务域名。
:::

## 同时使用多个服务商

`erupt.s3.*` 只能配一套，供附件代理和默认数据源使用。数据源模型可以各自指向不同的服务商，在 `@EruptS3` 上覆盖 `endpoint` / `region` / `bucket` 即可：

```java
@EruptS3(bucket = "archive", endpoint = "https://oss-cn-hangzhou.aliyuncs.com", region = "cn-hangzhou")
```

凭证仍建议走默认凭证链或环境变量，而不是写在注解里。
