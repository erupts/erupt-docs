# Erupt File Center 文件中心

erupt-file-center 在后台里放一个文件中心：附件上传目录、服务器上的任意目录、S3 存储桶和 SFTP 目录，都以访达（Finder）式的分栏方式浏览，图片、视频、音频、PDF 与文本直接预览。页面上可以上传（支持拖拽）、新建文件夹、重命名、删除、下载，以及复制文件的公开链接。

> 最低版本要求：**2.4.0**

## 引入方式

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-file-center</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

`erupt-spring-boot-starter-all` 已包含本模块，使用 starter-all 的项目无需再单独引入。模块依赖 `erupt-upms`；另外两个依赖都是可选的：

- **S3 存储**需要 [erupt-data-s3](/zh/modules/erupt-s3/) 在 classpath 上（提供 AWS S3 SDK）
- **SFTP 存储**需要 JSch（`com.github.mwiede:jsch`），[erupt-remote](/zh/modules/erupt-remote) 已自带；没有引入 erupt-remote 的项目在本模块旁边加上它即可

引入后自动装配生效，会注册两个菜单：**文件中心**（类型为*路由*，值为 `/file-center`，对应 erupt-web 的同名路由）和它下面的**写入**按钮。页面所有请求都走本模块提供的 `/erupt-api/file-center` 接口。

## 存储位置

页面左上角的下拉框列出全部存储位置（store），顺序固定如下：

| 存储 | 位置 | 公开链接 |
| --- | --- | --- |
| Uploads | `erupt.upload-path`，即[附件字段](/zh/advanced/upload)写入的目录 | `/erupt-attachment/...` |
| `erupt.file-center.roots` | 服务器上的任意目录 | 无，只能通过页面下载 |
| S3 · bucket | 附件上传所用的桶（`erupt.s3`），引入 erupt-data-s3 且配置了 bucket 时出现 | 桶地址或 `erupt.s3.domain` |
| `erupt.file-center.stores` | 任意数量的本地目录、带独立密钥的桶或前缀、SFTP 目录 | 桶地址或该 store 的 `domain`；本地目录与 SFTP 无 |

前两类只要配置路径即可；`erupt.s3` 桶复用 erupt-data-s3 的配置，不需要在本模块里重复填写密钥。`stores` 下的每一项都有自己的 `type`（`local` / `s3` / `sftp`，默认 `local`）和各自的连接参数：

```yaml
erupt:
  file-center:
    roots:                         # 额外的本地目录，键名就是页面上显示的名称
      Reports: /data/reports
    stores:
      - name: Backups
        type: local
        path: /var/backups
      - name: Media
        type: s3
        bucket: media
        endpoint: https://oss-cn-hangzhou.aliyuncs.com   # MinIO、OSS、COS、R2 等任意 S3 协议服务
        region: cn-hangzhou
        access-key: ${MEDIA_AK}
        secret-key: ${MEDIA_SK}
        path-style: false
        prefix: public             # 以桶内的这个前缀作为 store 根目录
        domain: https://cdn.example.com
      - name: Partner SFTP
        type: sftp
        host: sftp.example.com
        port: 22
        username: exchange
        password: ${SFTP_PASSWORD}
        path: /outbound            # 以远端的这个目录作为 store 根目录
        known-hosts: /etc/ssh/ssh_known_hosts
    text-preview-bytes: 262144
```

### S3 存储

`prefix` 让一个桶里的某个前缀成为独立的 store 根目录，键中的 `/` 被当作文件夹；`domain` 用于生成公开链接，不填则按桶地址拼接（path-style 时桶名在路径里，否则在域名前）。新建文件夹会写入一个以 `/` 结尾的空对象作标记；重命名文件夹会逐个复制再删除其下的对象，大目录请留意耗时。

### SFTP 存储

`type: sftp` 以 `path` 指定的远端目录为根，通过 **密码** 或 **私钥** 登录：`private-key` 既可以是 PEM 文本，也可以是密钥文件路径，配合 `passphrase` 使用；填了私钥就只走公钥认证，否则走密码。`known-hosts` 指向 known_hosts 文件时会校验服务器的主机密钥（StrictHostKeyChecking），不填则接受任何主机密钥。模块只保持一条 SSH 会话，断开后自动重连；每次操作单独开一个通道，因此下载大文件不会阻塞其他人的目录列表。

:::warning
生产环境建议配置 `known-hosts`，否则无法防范中间人攻击。
:::

## 页面操作

**分栏浏览** 点开一个文件夹，它的内容在右侧新开一栏，一路点下去就是完整路径，顶部面包屑可以直接跳回上层。键盘 `↑` `↓` 在当前栏内移动，`→` 进入选中的文件夹，`←` 收起当前栏回到上一级。最右一栏上方的搜索框只过滤当前目录。

![文件中心分栏浏览与预览](/file-center/file-center.png)

**预览** 选中文件后右侧面板按类型显示：图片、视频、音频直接播放，PDF 内嵌显示，文本（`text/*`、JSON / XML / YAML / CSV / SQL，以及 `.md` `.log` `.properties` `.java` 等常见源码后缀）显示内容，超过 `text-preview-bytes` 的文本只提示「文件太大，不预览」。面板同时列出大小、修改时间与类型，宽度可拖动。

| 操作 | 说明 |
| --- | --- |
| 上传 | 工具栏按钮选择文件，或把文件直接拖到某一栏里就上传到那个目录；同名文件会被覆盖 |
| 新建文件夹 | 在当前目录下新建，名称中不允许出现 `/` |
| 重命名 | 只在同一目录内改名，名称中不允许出现 `/` |
| 删除 | 支持多选，文件夹连同内容一起删除，删除前会确认 |
| 下载 | 浏览器直接下载当前预览的文件 |
| 新窗口打开 | 在新标签页打开文件本身 |
| 复制链接 | 复制文件的公开地址，只对有公开链接的存储可用（Uploads 与 S3） |

每个路径在服务端都会先归一化（`\` 转 `/`、去掉空段与 `.`），出现 `..` 直接拒绝，本地目录还会再校验解析后的绝对路径仍在根目录之内——任何请求都无法越出某个 store 的范围，store 根目录本身也不能被删除。

### 接口

所有接口位于 `/erupt-api/file-center` 下，鉴权方式为菜单鉴权，统一对应**文件中心**菜单（`@EruptRouter(verifyType = MENU)`）；`store` 参数是存储名，`path` 是以 `/` 开头的 store 内相对路径：

| 接口 | 说明 |
| --- | --- |
| `GET /info` | 页面初始化：存储列表、当前用户是否可写、`textPreviewBytes` |
| `GET /list?store=&path=` | 目录列表，文件夹在前、文件在后，各按名称排序 |
| `GET /stat?store=&path=` | 单个条目的信息和公开链接 |
| `GET /raw?store=&path=&download=&_token=` | 文件内容本身，用于预览与下载；由浏览器直接打开，token 走 `_token` 参数 |
| `POST /upload?store=&path=` | 表单字段 `files`，上传到指定目录 |
| `POST /mkdir?store=&path=&name=` | 新建文件夹 |
| `POST /rename?store=&path=&name=` | 重命名 |
| `POST /delete?store=` | 请求体为路径列表 |

## 权限

文件中心只有一个菜单，加上菜单下的一个**写入**按钮（值 `file-center@write`）：

- 拥有**文件中心**菜单的角色可以浏览、预览、下载，所有接口都以这个菜单鉴权
- 上传、新建文件夹、重命名、删除还需要**写入**按钮；没有它页面是只读的，相应按钮置灰，服务端也会拒绝（提示「没有写入权限」）

写权限对所有存储一视同仁，不区分 store。需要更细的粒度时，用[自定义存储](#自定义存储)按用户决定是否抛出异常即可。

## 配置参数

| 参数 | 默认值 | 说明 |
| --- | --- | --- |
| `erupt.file-center.roots` | 无 | 额外的本地目录，`名称: 路径` 形式的 map，名称即页面显示名 |
| `erupt.file-center.stores` | 无 | 存储列表，每项见下表 |
| `erupt.file-center.text-preview-bytes` | `262144`（256 KB） | 文本预览最多读取的字节数，超过的文件不预览 |

`stores` 每一项的字段，按类型分组：

| 字段 | 适用类型 | 说明 |
| --- | --- | --- |
| `name` | 全部 | 必填，页面显示名，也是接口里的 `store` 参数；重名时后者覆盖前者 |
| `type` | 全部 | `local`（默认）/ `s3` / `sftp` |
| `path` | local / sftp | 本地目录；或 SFTP 上作为根的远端目录，必填 |
| `host` `port` `username` | sftp | 主机、端口（默认 22）、用户名，`host` 与 `username` 必填 |
| `password` | sftp | 密码登录 |
| `private-key` `passphrase` | sftp | 私钥登录，PEM 文本或密钥文件路径，以及口令 |
| `known-hosts` | sftp | known_hosts 文件路径，填了才校验主机密钥 |
| `bucket` | s3 | 必填 |
| `region` | s3 | 默认 `us-east-1` |
| `endpoint` | s3 | 非 AWS 服务的接入地址，留空即 AWS |
| `access-key` `secret-key` | s3 | 访问密钥，留空走 SDK 默认凭证链 |
| `path-style` | s3 | 是否使用 path-style 地址，MinIO 等自建服务通常为 `true` |
| `prefix` | s3 | 桶内前缀，作为 store 的根 |
| `domain` | s3 | 公开链接使用的域名 |

:::tip
`erupt.s3` 的附件桶已经作为「S3 · bucket」自动出现，不必再写进 `stores`；`stores` 适合挂另一个桶、同一个桶的另一个前缀，或使用不同密钥的桶。
:::

## 自定义存储

存储抽象是 `xyz.erupt.filecenter.store.FileStore` 接口，路径一律是 store 内相对路径（根为 `/`）。任何实现它的 Spring Bean 都会自动加入列表，排在配置的存储之后：

```java
@Component
public class ArchiveStore implements FileStore {

    @Override
    public String name() {
        return "Archive";
    }

    @Override
    public List<FileEntry> list(String dir) throws IOException {
        // 返回目录内容：文件夹在前、文件在后，各按名称排序
    }

    @Override
    public FileEntry stat(String path) throws IOException {
        // 不存在时返回 null
    }

    @Override
    public InputStream read(String path) throws IOException { ... }

    @Override
    public void write(String path, InputStream content, long size, String contentType) throws IOException { ... }

    @Override
    public void mkdir(String path) throws IOException { ... }

    @Override
    public void rename(String path, String newName) throws IOException {
        // 只在同一目录内改名
    }

    @Override
    public void delete(String path) throws IOException {
        // 文件夹连同内容一起删除
    }

    @Override
    public String publicUrl(String path) {
        // 浏览器可以直接访问的地址，没有则返回 null（默认实现）
        return null;
    }

}
```

`FileEntry` 是一条列表记录：`name`、`path`（以 `/` 开头、目录不带尾部 `/`）、`dir`、`size`、`modified`（毫秒时间戳，可为 null）、`contentType`。接口上的静态方法可以直接复用：`FileStore.normalize(path)` 归一化并拒绝 `..`，`FileStore.join(dir, name)` 校验名称并拼接，`FileStore.parentOf` / `FileStore.nameOf` 取父目录和文件名。只读的存储在写操作里抛出 `IOException` 即可，页面会把异常信息提示给用户。
