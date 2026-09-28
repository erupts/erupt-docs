# 配置参考

模块的所有连接信息都以 `erupt.s3.*` 为准；`@EruptS3` 注解上的属性只是对单个模型的覆盖。

## erupt.s3 配置项

```yaml
erupt:
  s3:
    bucket: erupt-uploads
    prefix: ""
    region: us-east-1
    endpoint: ""
    access-key: ""
    secret-key: ""
    path-style: false
    domain: ""
    local-save: false
```

| 配置项 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.s3.bucket` | — | 接收附件上传的 Bucket，启用附件代理后必填；也是数据源的默认 Bucket |
| `erupt.s3.prefix` | `""` | 附件在 Bucket 内的 Key 前缀，如 `erupt/`；为空存放在根目录。**只作用于附件代理**，数据源的前缀由 `@EruptS3.prefix` 决定 |
| `erupt.s3.region` | `us-east-1` | 区域名。AWS 必须与 Bucket 所在区域一致；非 AWS 服务商只参与签名计算，配合 `endpoint` 填官方推荐值或任意非空值 |
| `erupt.s3.endpoint` | `""` | 服务地址。为空使用 `region` 对应的 AWS 默认地址；MinIO / OSS / COS / R2 等必须设置 |
| `erupt.s3.access-key` | `""` | 静态凭证。为空回退到 AWS 默认凭证链 |
| `erupt.s3.secret-key` | `""` | 仅在 `access-key` 设置时读取 |
| `erupt.s3.path-style` | `false` | 路径式寻址（`endpoint/bucket/key`）。MinIO 及多数自建网关需要 `true`；阿里云 OSS 必须为 `false` |
| `erupt.s3.domain` | `""` | 浏览器加载附件的公网根地址（如 CDN），末尾不需要 `/`。为空时按 endpoint + bucket 推导，规则见[附件上传](./upload#domain-留空时的推导规则) |
| `erupt.s3.local-save` | `false` | 上传到 Bucket 的同时在 `erupt.upload-path` 下保留一份 |

## @EruptS3 注解属性

| 属性 | 默认值 | 留空时 | 说明 |
| --- | --- | --- | --- |
| `bucket` | `""` | `erupt.s3.bucket` | 要列举的 Bucket |
| `prefix` | `""` | 列举整个 Bucket | Key 前缀过滤（不回退到 `erupt.s3.prefix`） |
| `region` | `""` | `erupt.s3.region` | 区域名 |
| `endpoint` | `""` | `erupt.s3.endpoint` + `erupt.s3.path-style` | 服务地址 |
| `accessKey` | `""` | `erupt.s3.access-key` → 默认凭证链 | 不建议在注解中填写 |
| `secretKey` | `""` | `erupt.s3.secret-key` | 仅在 `accessKey` 设置时读取 |
| `pathStyle` | `false` | 随 `endpoint` 一起回退 | 只在注解显式设置了 `endpoint` 时生效 |
| `pageSize` | `1000` | — | 单次列举请求返回的最大对象数 |
| `maxObjects` | `5000` | — | 所有分页累计返回对象数的硬上限 |

### 回退规则

- `endpoint` 与 `pathStyle` 是一组：注解写了 `endpoint`，就用注解的 `pathStyle`；注解没写 `endpoint`，两者一起取 `erupt.s3.*`。
- `accessKey` 与 `secretKey` 是一组：注解写了 `accessKey`，才读注解的 `secretKey`。
- `bucket`、`region` 各自独立回退。

## endpoint 填服务地址，不是 Bucket 地址

`endpoint` 应当是服务商的服务域名（如 `https://oss-cn-hangzhou.aliyuncs.com`）。控制台里常见的是 Bucket 专属域名（`https://mybucket.oss-cn-hangzhou.aliyuncs.com`），虚拟主机寻址下 SDK 会再往前拼一次 Bucket 名，请求会落到一个不存在的 Bucket 上。模块识别这种情况并自动去掉开头的 `mybucket.`，但仍建议直接填服务域名。

## 凭证建议

`access-key` / `secret-key` 留空时走 AWS 默认凭证链，按顺序尝试：

1. 环境变量 `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`
2. `~/.aws/credentials`
3. EC2 / ECS / EKS 实例角色

生产环境推荐这种方式，或者在 yml 中用 `${S3_ACCESS_KEY}` 占位从环境变量注入。**不要把密钥写进 `@EruptS3` 注解**：注解值是编译期常量，会原样进入 class 文件与 jar 包。
