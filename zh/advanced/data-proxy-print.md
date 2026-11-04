# 打印内容处理（print）

打印操作时触发 DataProxy 的 `print` 方法，接收当前 model 和框架生成的 HTML 内容字符串，返回最终要渲染的 HTML，可用于追加水印、页眉页脚或自定义排版。

```java
@Override
public String print(EruptTest model, String content) {
    // 在打印内容末尾追加水印
    return content + "<div style='color:#ccc;font-size:12px'>打印人：" + getCurrentUser() + "</div>";
}
```
