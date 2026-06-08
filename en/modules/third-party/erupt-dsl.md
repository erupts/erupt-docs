# erupt-dsl ORM Dynamic Queries

QueryDSL is a general-purpose query framework focused on building type-safe SQL queries via Java API. Built on top of various ORM frameworks and SQL, the query syntax is similar to SQL — code replaces SQL strings. erupt-dsl integrates it into the Erupt ecosystem.

- Author's homepage: [https://github.com/wjw465150](https://github.com/wjw465150)
- Repository: [https://github.com/wjw465150/erupt-dsl](https://github.com/wjw465150/erupt-dsl)

## Usage

### 1. Maven Configuration

```xml
<!-- dependencies configuration -->
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

<!-- build → plugins configuration -->
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
        <!-- Output directory for generated Q classes -->
        <outputDirectory>target/generated-sources/java</outputDirectory>
        <processor>com.querydsl.apt.jpa.JPAAnnotationProcessor</processor>
        <options>
          <!-- Packages to exclude from QueryDSL (comma-separated) -->
          <querydsl.excludedPackages>xyz.erupt.upms,xyz.erupt.bi</querydsl.excludedPackages>
        </options>
      </configuration>
    </execution>
  </executions>
</plugin>
```

### 2. Bean Injection

```java
@PersistenceContext
private EntityManager entityManager;

@Bean
public JPAQueryFactory jpaQueryFactory() {
    return new JPAQueryFactory(entityManager);
}
```

### 3. Generate Q Classes

Execute the Maven `process` command to generate the callable Q classes.

> Q classes are JPA entity classes prefixed with `Q`, used for DSL queries.

<img src="/third-party/dsl-maven.png" width="474">

### 4. Usage Example

```java
@Resource
private JPAQueryFactory jpaQueryFactory;

public void test() {
    // Classes prefixed with Q are the generated query shortcut classes
    List<String> names = jpaQueryFactory
        .select(QEruptUser.eruptUser.name)
        .from(QEruptUser.eruptUser)
        .fetch();
    names.forEach(System.out::println);
    // Output: erupt / guest / test
}
```
