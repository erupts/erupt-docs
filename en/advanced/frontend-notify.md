# Frontend Messages & Modals

:::danger
**Exposes public notification components that can be called from anywhere in the frontend**, for example:

1. Called inside `app.js`
2. Called in custom pages using `parent.msg.xxx`
3. Called in the return JS of custom buttons
4. Called when [erupt-websocket](/en/modules/erupt-websocket) pushes a message

:::

::: info
Note: Supported since 1.12.15+
:::

## Global Message Component

```javascript
window.msg.info('This is a normal message');
window.msg.success('This is a normal message');
window.msg.error('This is a normal message');
window.msg.warning('This is a normal message');

// loading
let loading = window.msg.loading('This is a normal message', { nzDuration: 2500 });
// Manually dismiss the loading message
window.msg.remove(loading.messageId);
```

<img src="https://cdn.nlark.com/yuque/0/2024/png/117735/1724580418261-904bba48-f20c-41eb-a349-e6cfd4025c88.png" width="1680">

## Modal Dialog Component

<img src="https://cdn.nlark.com/yuque/0/2024/png/117735/1724580593997-de4d6b65-9ebd-470f-9404-5582b73902f6.png" width="1680">

```javascript
window.modal.info({
  nzTitle: 'This is a notification message',
  nzContent: '<p>some messages...some messages...</p>',
  nzOnOk: () => console.log('Info OK')
})
window.modal.success({
  nzTitle: 'This is a notification message',
  nzContent: '<p>some messages...some messages...</p>',
  nzOnOk: () => console.log('Info OK')
})
window.modal.error({
  nzTitle: 'This is a notification message',
  nzContent: '<p>some messages...some messages...</p>',
  nzOnOk: () => console.log('Info OK')
})
window.modal.warning({
  nzTitle: 'This is a notification message',
  nzContent: '<p>some messages...some messages...</p>',
  nzOnOk: () => console.log('Info OK')
})
window.modal.confirm({
  nzTitle: 'Are you sure delete this task?',
  nzContent: '<b style="color: red;">Some descriptions</b>',
  nzOkText: 'Yes',
  nzOkType: 'primary',
  nzOkDanger: true,
  nzOnOk: () => console.log('OK'),
  nzCancelText: 'No',
  nzOnCancel: () => console.log('Cancel')
})

// Close all modals
window.modal.closeAll();
```

## Notification Component

<img src="https://cdn.nlark.com/yuque/0/2024/png/117735/1724580881381-0810d64f-ac2b-421b-88d5-355fb9476ed4.png" width="1680">

```javascript
window.notify.blank('title', 'content', [options]) // Notification without icon
window.notify.success('title', 'content', {
  nzPlacement: 'bottom'
})
window.notify.error('title', 'content')
window.notify.info('title', 'content')
window.notify.warning('title', 'content')
```

### options Parameters

| Parameter | Description | Type | Default |
| --- | --- | --- | --- |
| `nzDuration` | Duration in milliseconds. Set to `0` to prevent auto-dismiss. | `number` | `4500` |
| `nzMaxStack` | Maximum number of notifications displayed at the same time | `number` | `8` |
| `nzPauseOnHover` | Pause auto-dismiss when the mouse hovers over the notification | `boolean` | `true` |
| `nzAnimate` | Enable or disable animation | `boolean` | `true` |
| `nzTop` | Distance from the top when notifications appear from the top | `string` | `24px` |
| `nzBottom` | Distance from the bottom when notifications appear from the bottom | `string` | `24px` |
| `nzPlacement` | Placement: `topLeft` `topRight` `bottomLeft` `bottomRight` `top` `bottom` | `string` | `topRight` |
| `nzDirection` | Text direction of the notification | `'ltr' \| 'rtl'` | - |

## Rendering HTML in Components

> Supported since 1.12.23+

By default, message, modal, and notification components only accept plain text. To render HTML, wrap the content with `window.safeHtml` to tell the framework the HTML is safe to render:

```javascript
window.msg.error(window.safeHtml(`
    An error occurred
    <button style="margin-left:20px" onclick="window.location.hash = '/xxx'">View</button>
`), {
    nzDuration: 5000
})
```
