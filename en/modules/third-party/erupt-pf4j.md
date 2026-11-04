# erupt-pf4j Dynamic Plugin Loading

Implements dynamic plugin loading for the Erupt ecosystem based on [PF4J](https://pf4j.org/), supporting hot-loading of Erupt modules without restarting the application.

- Repository: [https://github.com/snice/erupt-pf4j-demo](https://github.com/snice/erupt-pf4j-demo)
- Author: 码农朱哲 (Programmer Zhu Zhe)

## Features

- During development, after modifying Erupt code, restart the plugin from the admin interface instead of restarting the entire application
- In production, dynamically load Erupt modules via jar or zip files without redeploying

## Usage

With the erupt dependency already included, add erupt-pf4j:

```xml
<!-- Repository configuration -->
<repository>
  <id>jitpack.io</id>
  <url>https://jitpack.io</url>
</repository>

<!-- Dependency -->
<dependency>
  <groupId>com.github.snice</groupId>
  <artifactId>erupt-pf4j</artifactId>
  <version>0.0.1</version>
</dependency>
```
