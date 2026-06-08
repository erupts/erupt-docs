# V 1.13.x Upgrade Guide

This document covers the notable changes when upgrading from 1.12.x to 1.13.x.

## Upgrade Requirements

1. Spring Boot must be upgraded to 3.x. For migration steps, see [Spring Boot 3.0 Migration Guide](https://github.com/spring-projects/spring-boot/wiki/Spring-Boot-3.0-Migration-Guide).
2. JDK 17 is the minimum supported version.
3. The primary-key generation strategy has changed; PostgreSQL < 10 and Oracle < 12c are no longer supported.
4. The RESTful `delete` and `put` endpoints are officially removed and replaced with `HTTP POST`. Update your API calls after upgrading. Removed endpoints:
   - `delete /erupt-api/data/modify/{erupt}`
   - `put /erupt-api/data/modify/{erupt}`
5. All node instances of an Erupt-Cloud cluster must be upgraded to 1.13.x.
6. EruptDao removed deprecated `queryXXX` APIs — use `lambdaQuery` instead.
7. The `@ShowBy` annotation has been renamed to `@Dynamic`. Update existing annotations:

```yaml
showBy = @ShowBy
↓
dynamic = @Dynamic
```
