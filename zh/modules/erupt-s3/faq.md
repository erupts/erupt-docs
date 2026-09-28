# 常见问题

上传或列表失败时，错误提示里会带上服务商返回的原文（`S3 操作失败 → ...`），按下面的关键字对号入座。

## SignatureDoesNotMatch / 403 Forbidden

签名不匹配，几乎都是这三个原因之一：

1. **`region` 不对**：AWS 必须填 Bucket 所在区域；阿里云 OSS、腾讯云 COS 等国内厂商的 SigV4 也会校验 region，请填官方推荐值（如 `cn-hangzhou`、`ap-guangzhou`），而不是随便写。
2. **密钥错误或权限不足**：确认 AK/SK 对应的账号有该 Bucket 的 `PutObject`、`GetObject`、`ListBucket`、`DeleteObject` 权限。
3. **服务器时间偏差**：SigV4 允许的时间偏差是 15 分钟，容器或虚拟机时钟不准就会被拒。

## NoSuchBucket，但 Bucket 明明存在

多半是寻址方式不对：

- MinIO、Ceph 等自建服务：`path-style` 需要设为 `true`。
- `endpoint` 填了 Bucket 专属域名（`https://mybucket.oss-cn-hangzhou.aliyuncs.com`）：模块会自动去掉开头的 `mybucket.`，但如果 Bucket 名与配置的 `bucket` 不一致就无法识别，请改填服务域名。
- 腾讯云 COS：Bucket 名要带 APPID 后缀，如 `my-bucket-1250000000`。

## 上传成功，但浏览器加载附件 403 / 404

上传走的是 SDK 鉴权，浏览器加载走的是公网地址，两者权限独立：

- 推导出的地址直接指向存储服务，Bucket 需要允许公开读取（阿里云「公共读」、AWS 关闭「阻止公共访问」并加 Bucket Policy）。
- Cloudflare R2、Oracle OCI 默认私有，需要绑定自定义域名并填到 `domain`。
- 内网部署的 MinIO：推导地址是内网 IP，浏览器访问不到，必须填 `domain`。
- 用了 CDN：确认 CDN 回源到 Bucket 的路径包含 `prefix`。`fileDomain()` 已经拼上了 `prefix`，`domain` 里不要再重复写。

## 前端显示的附件地址还是本地的 /erupt-attachment

- 确认 Erupt 版本 ≥ 2.3.0，`/erupt-app` 接口才会下发 `fileDomain`。
- 检查 `app.js` 里有没有显式设置 `eruptSiteConfig.fileDomain`——设置了就会覆盖后端返回值，删掉或改成 S3 地址。
- 浏览器缓存了旧的 `/erupt-app` 响应，强制刷新一次。

## 报错「未配置附件存储桶 erupt.s3.bucket」

注册了 `S3AttachmentProxy` 但没有填 `erupt.s3.bucket`。附件代理不接受注解上的 Bucket，必须写在配置文件里。

## 列表里搜不到某个对象 / 筛选结果不全

数据源一次最多拉取 `maxObjects`（默认 5000）个对象，筛选和排序都在这批数据上做。前缀下对象超过上限时结果会被静默截断，请用 `prefix` 收窄范围，详见[对象浏览数据源](./datasource#筛选与排序全在内存中完成)。

## 列表页有「新增」「修改」按钮，点提交才报错

数据源没有覆写 `power()`，请在模型上显式关闭：

```java
@Erupt(name = "S3 对象", power = @Power(add = false, edit = false))
```

## 启动报 `must extend S3ObjectModel`

数据源模型必须继承 `S3ObjectModel`，字段由父类统一提供，子类不需要再声明 `key`、`size` 等字段。旧版文档中自行声明字段的写法已不再适用。

## 能不能用分片上传 / 上传超大文件

附件代理以单次 `PutObject` 写入，整个文件会先读入内存。数 GB 的文件请走应用自己的上传流程，或在前端限制附件大小。
