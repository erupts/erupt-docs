# Integrating Existing Projects

## Embedding a Project

1. Go to Menu Management, set the **Menu Type** to **Open Link in Frame**, and set the **Type Value** to the URL of the project to embed. Save the configuration.

2. The embedded page can retrieve the current user's token. The `_token` parameter will be present in the URL:

   Example: `https://www.erupt.xyz?_token=gK4Ot4rs0h3xzJi0`

   Use this token to retrieve the current user's basic information, menu permissions, and more. Include the token in frontend API requests.

3. If using a shared session, enable Redis Session:

```yaml
erupt:
  redisSession: true

spring:
  redis:
    database: 0
    timeout: 10000
    host: 127.0.0.1
```

4. Retrieve Erupt user data by token:

```http
GET {{host}}/erupt-api/userinfo
token: {{token}}
```

Response example:

```json
{
  "nickname": "xxx",
  "indexMenuType": "xxx",
  "indexMenuValue": "xxx",
  "resetPwd": false,
  "org": "org code",
  "post": "post code",
  "roles": ["code1", "code2", "code3"]
}
```

Check menu permission:

```http
GET {{host}}/erupt-api/erupt-permission/{{menu-type-value}}
token: {{token}}
Returns: true | false
```

## External Integration

You can integrate using Open API. See the Open API section in the UPMS module documentation.

## Frontend-Backend Separation Deployment

Specify the backend API address in `app.js`:

```javascript
window.eruptSiteConfig = {
    domain: "http://your-backend-api.com",
};
```

See: [Frontend-Backend Separation Deployment](/en/guide/separation)
