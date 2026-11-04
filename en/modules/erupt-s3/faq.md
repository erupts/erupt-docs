# FAQ

When an upload or listing fails, the error message carries the provider's original text (`S3 operation failed → ...`). Match it against the entries below.

## SignatureDoesNotMatch / 403 Forbidden

A signature mismatch is almost always one of three things:

1. **Wrong `region`**: AWS requires the bucket's actual region; Chinese providers such as Alibaba Cloud OSS and Tencent Cloud COS also validate the region in SigV4, so use the officially recommended value (`cn-hangzhou`, `ap-guangzhou`, ...) rather than an arbitrary one.
2. **Wrong keys or missing permissions**: make sure the account behind the AK/SK has `PutObject`, `GetObject`, `ListBucket` and `DeleteObject` on the bucket.
3. **Clock skew**: SigV4 tolerates 15 minutes; a container or VM with a drifting clock gets rejected.

## NoSuchBucket, but the bucket exists

Usually the addressing style:

- MinIO, Ceph and other self-hosted services: set `path-style` to `true`.
- `endpoint` set to a bucket-specific host (`https://mybucket.oss-cn-hangzhou.aliyuncs.com`): the module strips the leading `mybucket.`, but only when it matches the configured `bucket`; use the service domain instead.
- Tencent Cloud COS: bucket names carry the APPID suffix, e.g. `my-bucket-1250000000`.

## Upload succeeds, but the browser gets 403 / 404 loading the attachment

Uploads are authenticated by the SDK; browser loads go through the public URL, and the two permissions are independent:

- The derived URL points straight at the storage service, so the bucket must allow public reads (public-read ACL on Alibaba Cloud; disable "Block public access" and add a bucket policy on AWS).
- Cloudflare R2 and Oracle OCI are private by default; bind a custom domain and set it as `domain`.
- MinIO on an internal network: the derived URL is an internal address the browser cannot reach — set `domain`.
- Behind a CDN: make sure the CDN origin path includes `prefix`. `fileDomain()` already appends `prefix`, so do not repeat it in `domain`.

## The frontend still shows local /erupt-attachment URLs

- Confirm Erupt ≥ 2.3.0; only then does `/erupt-app` return `fileDomain`.
- Check `app.js` for an explicit `eruptSiteConfig.fileDomain` — it overrides the backend value; remove it or point it at S3.
- The browser may have cached an old `/erupt-app` response; hard-refresh once.

## "Attachment bucket erupt.s3.bucket is not configured"

`S3AttachmentProxy` is registered but `erupt.s3.bucket` is empty. The attachment proxy does not read a bucket from any annotation; it must be in the configuration file.

## An object is missing from the list / filter results are incomplete

The data source fetches at most `maxObjects` (default 5000) objects per request, and filtering and sorting run over that batch. When the prefix holds more objects the result is silently truncated — narrow with `prefix`, see [Object Data Source](./datasource#filtering-and-sorting-happen-entirely-in-memory).

## The list shows Add and Edit buttons that fail on submit

The data source does not override `power()`; turn them off on the model:

```java
@Erupt(name = "S3 Objects", power = @Power(add = false, edit = false))
```

## Startup fails with `must extend S3ObjectModel`

Data source models must extend `S3ObjectModel`; the parent provides every field, so the subclass declares none of `key`, `size`, etc. The older documentation pattern of declaring fields by hand no longer applies.

## Can I use multipart upload / very large files?

The attachment proxy writes with a single `PutObject` and reads the whole file into memory first. Route multi-GB files through your application's own upload flow, or cap attachment size in the frontend.
