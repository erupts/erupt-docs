# Erupt Web Frontend

erupt-web is the frontend module of the Erupt framework, built with Angular. It provides a complete admin management interface and is distributed as a Jar file — no separate frontend deployment is needed.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-web</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

For a frontend/backend separated deployment, you can omit this dependency and deploy the frontend independently. See [Frontend/Backend Separation](/en/guide/separation).

## Frontend Source Code

Frontend repository: [https://github.com/erupts/erupt-web](https://github.com/erupts/erupt-web)

## Customizing the Appearance

You can customize the frontend appearance by modifying `resources/public/app.js` and `resources/public/app.css`. See [Configuration](/en/guide/configuration).
