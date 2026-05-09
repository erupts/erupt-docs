# erupt-dsl ORM 动态查询

QueryDSL 是一个通用的查询框架，专注于通过 Java API 构建类型安全的 SQL 查询。基于各种 ORM 框架以及 SQL 之上，查询方式类似于 SQL，用代码替代 SQL，erupt-dsl 将其集成进 Erupt 体系。

- 作者主页：[https://github.com/wjw465150](https://github.com/wjw465150)
- 开源地址：[https://github.com/wjw465150/erupt-dsl](https://github.com/wjw465150/erupt-dsl)

## 使用方法

### 1. Maven 配置

```xml
<!-- dependencies 配置 -->
<dependency>
  <groupId>com.github.wjw465150</groupId>
  <artifactId>erupt-dsl</artifactId>
  <version>1.7.3</version>
</dependency>
<dependency>
  <groupId>com.querydsl</groupId>
  <artifactId>querydsl-jpa</artifactId>
  <version>4.4.0</version>
</dependency>
<dependency>
  <groupId>com.querydsl</groupId>
  <artifactId>querydsl-apt</artifactId>
  <version>4.4.0</version>
  <scope>provided</scope>
</dependency>

<!-- build → plugins 配置 -->
<plugin>
  <groupId>com.mysema.maven</groupId>
  <artifactId>apt-maven-plugin</artifactId>
  <version>1.1.3</version>
  <executions>
    <execution>
      <goals>
        <goal>process</goal>
      </goals>
      <configuration>
        <!-- 生成的 Q 类存放位置 -->
        <outputDirectory>target/generated-sources/java</outputDirectory>
        <processor>com.querydsl.apt.jpa.JPAAnnotationProcessor</processor>
        <options>
          <!-- 设定 QueryDSL 要排除的包（逗号分割） -->
          <querydsl.excludedPackages>xyz.erupt.upms,xyz.erupt.bi</querydsl.excludedPackages>
        </options>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### 2. Bean 注入

```java
@PersistenceContext
private EntityManager entityManager;

@Bean
public JPAQueryFactory jpaQueryFactory() {
    return new JPAQueryFactory(entityManager);
}
```

### 3. Q 类生成

执行 Maven `process` 命令，生成可调用的 Q 类。

> Q 类是以 Q 开头的 JPA 实体类，用于 DSL 调用。

<img src="/third-party/dsl-maven.png" width="474">

### 4. 使用方式

```java
@Resource
private JPAQueryFactory jpaQueryFactory;

public void test() {
    // Q 开头的类为生成的快捷查询类
    List<String> names = jpaQueryFactory
        .select(QEruptUser.eruptUser.name)
        .from(QEruptUser.eruptUser)
        .fetch();
    names.forEach(System.out::println);
    // 输出：erupt / guest / test
}
```
