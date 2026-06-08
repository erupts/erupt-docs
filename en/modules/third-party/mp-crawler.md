# WeChat Official Account Crawler

A Spring Boot-based web interface for crawling WeChat Official Account articles, supporting keyword-based public account search. The admin management interface is built with Erupt.

- Repository: [https://gitee.com/calvinhwang123/mp-weixin-demo](https://gitee.com/calvinhwang123/mp-weixin-demo)

## Notes

- Before crawling articles, you must scan a QR code to log in and obtain a TOKEN
- **Do not crawl too frequently** — this will trigger rate limiting by WeChat, and you may need to wait a while or until the next day for the restriction to be lifted
- It is recommended to store collected images locally to avoid broken image links
