# Object Data Source

Mount a bucket (or a prefix inside it) as an `@Erupt` model and the admin console gets an object listing for free: search by key, view details, delete — with Erupt's menu permissions and operation log applied.

**The data source is read + delete only.** Uploading raw object content through an admin form is not a good fit — use [Attachment Upload](./upload) or your application's own upload flow.

## Defining the Model

An object listing has a fixed schema, so the module declares the columns once in `S3ObjectModel`. A model just extends it and adds two annotations:

```java
@Getter
@Setter
@Erupt(name = "S3 Objects", power = @Power(add = false, edit = false))
@EruptS3(bucket = "prod-uploads", prefix = "reports/", region = "us-east-1")
@EruptDataProcessor(EruptS3DataService.DATA_PROCESSOR)
public class S3ProductionUpload extends S3ObjectModel {
}
```

- `@EruptS3`: binds the bucket and connection settings; empty attributes fall back to `erupt.s3.*`, see the [Configuration Reference](./config#erupts3-annotation-attributes).
- `@EruptDataProcessor(EruptS3DataService.DATA_PROCESSOR)`: routes the model to the S3 data source.
- `power = @Power(add = false, edit = false)`: hides the Add and Edit buttons — see [read-only behaviour](#read-only-means-errors-on-submit-not-buttons-hidden) below.

When the connection is already configured in `erupt.s3.*`, a model can carry just the prefix and browses the attachment bucket:

```java
@EruptS3(prefix = "erupt/")
```

To reach another bucket or provider, override only what differs:

```java
@EruptS3(bucket = "archive", endpoint = "https://oss-cn-hangzhou.aliyuncs.com", region = "cn-hangzhou")
```

## S3ObjectModel Fields

| Field | Type | Populated in | Notes |
| --- | --- | --- | --- |
| `id` | `String` | list + find | The object key and primary key; LIKE search enabled |
| `size` | `Long` | list + find | Bytes |
| `lastModified` | `Date` | list + find | |
| `etag` | `String` | list + find | |
| `storageClass` | `String` | list + find | e.g. `STANDARD` |
| `contentType` | `String` | find only | From `HeadObject` |
| `metadata` | `Map<String, String>` | find only | `x-amz-meta-*` user metadata; not rendered, for `DataProxy` and handlers |

The object key lives in `id`, Erupt's default primary key column, so `primaryKeyCol` needs no setting. To retitle or hide a column, redeclare the field in the subclass with your own `@EruptField`.

## Supported Operations

| Operation | S3 call | Notes |
| --- | --- | --- |
| List | `ListObjectsV2` | Continuation-token paging, at most `pageSize` per call and `maxObjects` in total |
| Find | `HeadObject` | Additionally populates `contentType` and `metadata` |
| Delete | `DeleteObject` | By key |
| Add / edit | — | Not supported; submitting raises "Object contents cannot be edited in place" |

The `S3Client` is cached per (endpoint, region, accessKey, addressing style) tuple, shared by every model on the same connection, and released on application shutdown.

## Limits and Caveats

### Read-only means "errors on submit", not "buttons hidden"

`addData` / `editData` throw outright, but the data source does not override `power()`, so without `@Power` the Add and Edit buttons still render and the user only sees the error after filling in the form. Turn those two permissions off on the model as in the example above; add `delete = false` as well to block deletion.

### Filtering and sorting happen entirely in memory

S3's `ListObjectsV2` only supports `prefix` filtering, so every condition other than `prefix` — plus sorting and paging — is evaluated by the base engine over the **already-fetched** object list, i.e. at most `maxObjects` entries. That means:

- filtering across a bucket larger than `maxObjects` gives incomplete results, with no warning;
- every list refresh re-issues the paginated `ListObjectsV2` calls (nothing is cached), so large buckets feel noticeably slow.

Narrow the scope with `prefix` down to a manageable size rather than raising `maxObjects`.

### Other

- On huge buckets (>5000 objects under the prefix) results are truncated; narrow with `prefix` or raise `maxObjects` explicitly.
- The model class needs a public no-arg constructor, otherwise opening the list fails at runtime.
- `metadata` is only populated on find and carries no `@EruptField`, so it never appears in the table or form.
