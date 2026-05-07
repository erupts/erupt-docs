# 快速上手

> 本节将带你在 5 分钟内跑起一个 Erupt 项目。

## 环境要求

- JDK 8+
- Maven 3.5+
- MySQL 5.7+ / H2（体验用）

## 创建 Spring Boot 项目

在 `pom.xml` 中添加依赖：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-admin</artifactId>
    <version>最新版本</version>
</dependency>
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-web</artifactId>
    <version>最新版本</version>
</dependency>
```

## 配置数据源

```yaml
# application.yml
spring:
  datasource:
    url: jdbc:mysql://localhost:3306/erupt?useSSL=false
    username: root
    password: root
  jpa:
    hibernate:
      ddl-auto: update
```

## 启动类

```java
@SpringBootApplication
public class Application {
    public static void main(String[] args) {
        SpringApplication.run(Application.class, args);
    }
}
```

## 创建第一个实体

```java
@Erupt(name = "用户管理")
@Entity
@Table(name = "t_user")
public class User extends BaseModel {

    @EruptField(
        views = @View(title = "用户名"),
        edit = @Edit(title = "用户名", notNull = true)
    )
    private String username;

    @EruptField(
        views = @View(title = "邮箱"),
        edit = @Edit(title = "邮箱", type = EditType.INPUT)
    )
    private String email;
}
```

启动项目，访问 `http://localhost:8080` 即可看到自动生成的管理页面。

::: info
更多字段类型配置参见 [字段类型总览](/guide/field-types)。
:::
