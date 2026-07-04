# Quick Start

## Requirements

- Java **17+**
- Spring Boot **3.x**
- Browser: IE 11+ or any modern browser
- Minimum server: 0.5 core / 200 MB RAM
- Supports Kubernetes and Docker deployments

## Prerequisites

- Java, [Maven](https://maven.apache.org)
- [Spring Boot](https://spring.io), JPA
- Database: SQL + MySQL / PostgreSQL / SQL Server / H2 / Oracle

## Spring Boot Deployment (Recommended)

### 1. Generate the project

Go to **[https://start.erupt.xyz](https://start.erupt.xyz)**, pick the modules, database, and version you need, then click "Generate Project" to download and unzip the archive.

Project layout:

```
demo -- project name
├── src
│    └── main
│         ├── java -- source code
│         │    └── com.example.demo -- package
│         │              └── DemoApplication -- entry class
│         └── resources -- resources
│                  ├── public
│                  │    ├── app.js    -- frontend config (title, logo, etc.)
│                  │    └── home.html -- home layout
│                  └── application.yml -- configuration file
└── pom.xml -- Maven dependencies
```

> **Note: spring-boot-devtools is not compatible — do not add this dependency**

### 2. Configure the database connection

Open `src/main/resources/application.yml` and edit the database settings:

```yaml
spring:
  datasource:
    url: jdbc:mysql://127.0.0.1:3306/erupt?useUnicode=true&characterEncoding=UTF-8&serverTimezone=Asia/Shanghai
    username: root
    password: 123456
  jpa:
    show-sql: true
    generate-ddl: true
    database: mysql
```

> An empty database is enough — the schema is generated automatically. For other databases, see [Database Support](/en/guide/database).

### 3. Start the project

Run `mvn spring-boot:run` or `gradle bootRun`.

### 4. Access the system

Once started, open the browser at `http://localhost:8080`.

Default credentials: `erupt / erupt` (**please change the default password as soon as possible for security**).

## Manual Integration (Existing Project)

To integrate Erupt into an existing Spring Boot project, follow the steps below.

### 1. Add dependencies

For version numbers, see the [Changelog](/en/guide/changelog).

**Option 1: Use the Starter (2.0.2+, recommended)**

```xml
<!-- Erupt core starter: includes permission management and the admin web UI -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-spring-boot-starter</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

To bring in every feature module at once (job scheduling, code generation, monitoring, notifications, AI, printing, etc.), use the all-in-one starter:

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-spring-boot-starter-all</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

**Option 2: Add modules individually**

```xml
<!-- Backend permission logic -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-admin</artifactId>
  <version>${erupt.version}</version>
</dependency>
<!-- Admin web UI (skip when using frontend/backend separation) -->
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

### 2. Annotate the entry class

```java
@SpringBootApplication
@EntityScan
@EruptScan
public class DemoApplication {
    public static void main(String[] args) {
        SpringApplication.run(DemoApplication.class, args);
    }
}
```

### 3. Create the frontend config files

| File | Description |
| --- | --- |
| `resources/public/app.js` | Frontend config — title, logo, lifecycle hooks, etc. |
| `resources/public/app.css` | Frontend styles (optional) |
| `resources/public/home.html` | Home layout (without it, the home page returns 404) |

### 4. Configure the database and start

Follow steps 2–4 of the "Spring Boot Deployment" section above.

## Running from Source

> Running from a jar dependency is recommended. Building from source is mainly useful for exploring Erupt internals.

1. Clone the Erupt repository from GitHub or Gitee.
2. Run the `main` method of `EruptSampleApplication`, then open http://127.0.0.1:8080.
3. The default datasource is an embedded H2 instance — no IP needed. Switch to MySQL, PostgreSQL, etc. as needed.

## Docker

```bash
docker push erupts/erupt:version
```

Image and version info: [https://hub.docker.com/repository/docker/erupts/erupt/general](https://hub.docker.com/repository/docker/erupts/erupt/general)

The Docker image is `erupt-cloud-server`. You can develop `erupt-cloud-node` nodes to achieve distributed capabilities.

## Cannot log in after a successful start

If the default password does not work, check the database for user data. If the user table is empty, locate the `.erupt` folder in the project, delete it, and restart.

See [FAQ](/en/guide/faq) for more details.

## Next Step

After the project starts successfully, head to the [First Example](/en/guide/getting-started) to learn how to build your first admin page with a single Java class.
