# 公众号采集

使用 Spring Boot 实现的 WEB 界面采集公众号文章，支持按关键词搜索公众号等，基于 Erupt 构建后台管理界面。

- 仓库地址：[https://gitee.com/calvinhwang123/mp-weixin-demo](https://gitee.com/calvinhwang123/mp-weixin-demo)

## 注意事项

- 文章采集前需要先扫码登录获取 TOKEN
- **采集频率不能太快**，否则会被微信官方限制，需要等待片刻或第二天才能解封
- 建议对采集的图片进行本地化存储，避免图片链接失效
