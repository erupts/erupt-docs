# API Development & Operation Logs

## Version 1.12.x and Above

Because `@EruptRouter` was difficult to use, version 1.12.x introduced a new, simpler permission annotation API.

### API Example

```java
@RestController
@RequestMapping("/test")
public class TestController {

    // Accessible when logged in
    @GetMapping("/api-a")
    @EruptLoginAuth
    public void api() {
        // TODO
    }

    // Accessible with the corresponding permission
    @GetMapping("/api-b")
    @EruptMenuAuth("xxx") // Matches the menu type value
    @EruptRecordOperate("Callable with menu permission") // Record operation log (optional)
    public void api2() {
        // TODO
    }

    @GetMapping("/api-x") // Public endpoint, no authentication required
    public void api3(String param) {
        // TODO
    }
}
```

> Operation log recording is only supported for endpoints whose root path starts with `/erupt-api`.

### Making API Requests

When calling endpoints annotated with `@EruptLoginAuth` or `@EruptMenuAuth`, the frontend must pass a token in the request header.

#### How to Get the Token

```javascript
// Method 1: If using the tpl module, retrieve the token via the following JS snippet.
// Note: the token is only available after a successful login.
parent.getAppToken().token

// Method 2: Retrieve dynamically from a URL parameter
var token = new URLSearchParams(location.search).get("_token")
```

#### Request Examples

Import the tpl module and call network requests from template files. The token must not be obtained cross-origin — it must be retrieved from within the application.

```javascript
axios.get("http://127.0.0.1/erupt-api/test/api-b", {
    headers: {
        token: parent.getAppToken().token
    }
}).then((res) => {
    console.log(res)
})
```

```javascript
$.ajax({
    type: "GET",
    url: "http://127.0.0.1/erupt-api/test/api-a",
    headers: {
        token: parent.getAppToken().token
    },
    success: function(result) {
        console.log(result);
    }
});
```

### Frontend-Backend Separation

If your frontend and backend are deployed separately, enable `redisSession`:

```yaml
erupt:
  redisSession: true
spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

> **Note:** If testing with Postman and Redis Session is not enabled, you must pass both the token and the cookie.

## Version 1.11.x and Below

Versions 1.11.x and below use the `@EruptRouter` annotation. Refer to the legacy documentation for details.
