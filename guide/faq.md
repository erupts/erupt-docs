# 常见问题 FAQ

## 启动项目未创建用户与菜单

初始化用户数据 erupt 只执行一次，使用 `.erupt` 文件夹进行标识，删除 `.erupt` 文件夹，重启项目即可执行用户菜单插入 SQL。

## 登录时密码加密规则

> 如果不希望登录时密码加密，在配置文件中，将：`erupt-app.pwdTransferEncrypt` 设置为 false 即可

```java
// 1.12.11 及以上版本
md5(md5(pwd) + account)

// 1.12.10 及以下版本
md5(md5(pwd) + Calendar.DAY_OF_MONTH + account)
// Calendar.DAY_OF_MONTH → Calendar.getInstance().get(Calendar.DAY_OF_MONTH)
```

## 没有建表 SQL

erupt 底层使用了 JPA 作为 ORM 数据层，可以在项目启动时完成自动建表的操作，所以不需要执行初始化 SQL 语句。

## .erupt 文件夹存放位置

标识文件位置为：`${System.getProperty("user.dir")} / .erupt /`

`System.getProperty("user.dir")` 的值在不同环境会有差异：

| 部署方式 | 目录位置 |
| :---: | :---: |
| jar | jar 包同级目录 |
| Linux tomcat | tomcat 目录 |
| Windows tomcat | tomcat 的 bin 目录 |

> 注：`.erupt` 文件夹是 `.` 开头的，该类型文件夹在操作系统中默认是隐藏的

## 一对多排序

添加 JPA 提供的 `@OrderBy` 注解：

```java
@OneToMany(cascade = CascadeType.ALL)
@JoinColumn(name = "xxxx_id")
@OrderBy("field")
private Set<Test> test;
```

## 替换页签 Logo

在 `public` 目录下创建 `favicon.ico` 文件即可。

## 使用 UUID 作为主键

```java
@Id
@GeneratedValue(generator = "system-uuid")
@GenericGenerator(name = "system-uuid", strategy = "uuid")
@Column(name = "id", length = 32)
@EruptField
private String id;
```

## 一对多组件，添加多条数据仅有一条保存成功

**可能原因**：一对多情况使用 Set 集合存储，Set 集合去重依赖于对象的 HashCode 方法，请检查多的一方是否使用了 Lombok 的 `@Data` 注解，该注解重写了 HashCode 方法，对 Set 集合去重判断产生了影响。

**解决办法**：使用 `@Getter` 注解与 `@Setter` 注解代替 `@Data` 注解。

## 使用 new RuntimeException() 前端不提示错误信息

SpringBoot 2.2 和 2.3 异常处理的一个小变化，即 RuntimeException 错误堆栈信息需要开启配置才可抛出前端展示。解决办法：

- 新增了一个配置项 `server.error.includeMessage`，默认是 `NEVER`，只要开启就可以了
- 使用 `throw new EruptWebApiRuntimeException("error info")` 抛出异常
- 使用 `throw new EruptApiErrorTip("")` 抛出异常（支持各类 UI 样式）

## 获取当前登录用户

```java
@Autowired  // 注意：使用自动注入注解，需添加类bean注解，如：@Service、@Component
private EruptUserService eruptUserService;

public void test(){
    EruptUser eruptUser = eruptUserService.getCurrentEruptUser();
}
```

## 多对一对象，存储 id 以外的列

使用 `@JoinColumn(referencedColumnName = "code")`，标识 code 列存储到数据库中：

```java
@ManyToOne
@JoinColumn(referencedColumnName = "code")
@EruptField(
    views = @View(title = "文章", column = "title"),
    edit = @Edit(title = "文章选择", type = EditType.REFERENCE_TABLE,
         referenceTableType = @ReferenceTableType(label = "title", id = "id"))
)
private Article article_abc_def3;
```

## 启动 Erupt 前端无法正常解析数据

erupt 生成的接口返回参数被拦截，查看是否有统一的数据返回，可将封装数据的范围缩小至包，不应该将所有应用了 `RestController` 注解类或方法都统一返回。

## 菜单访问 Erupt 实体类后，提示 404

请检查入口类中的 `@EruptScan` 注解配置，包扫描路径是否包含你创建的实体类路径。

## 一对多新增保存后，多的一方数据丢失

在一对多的映射情况下，多的一方如果存有一的一方的对象，那么这个对象必须赋值否则会出现该问题。可通过 `dataProxy → beforeUpdate` 进行对象填充。

## 数据库字符集问题

```
Caused "by": "java.sql.SQLException": Incorrect string "value": '\xE7\xB3\xBB\xE7\xBB\x9F...' for column 'name' at row 1
```

库的字符集需要设置成 UTF-8，设置好后把表删除重新启动项目即可。

## 一对多，多对一不希望创建外键关系

```java
@ManyToOne
@JoinColumn(foreignKey = @ForeignKey(ConstraintMode.NO_CONSTRAINT))
private Test test;
```

## 静态资源访问 404

排查方式：

1. 是不是使用了 `@EnableWebMvc` 注解，如果使用了，去掉它
2. 查看是不是使用的 `WebMvcAutoConfigurationAdapter` 资源加载器
3. 如果确实需要使用 `WebMvcConfigurationSupport` 进行资源加载，请将 `addResourceHandlers` 方法放入到你的 `WebMvcConfigurer` 文件中
