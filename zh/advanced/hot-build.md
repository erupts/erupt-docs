# 热构建

开启热部署后修改 erupt 注解内容无需重启项目，刷新页面即可看到调整后的效果。

**版本支持**：1.12.14 及以上版本

## 限制

1. 开发工具目前仅支持 **IntelliJ IDEA**，其他工具需自行探索
2. 添加**类**与添加**字段**不支持热部署，仅支持 erupt 注解的调整

## 使用步骤

1. 前往 Settings 开启 Reload Class after compilation
2. 开启 On Frame deactivation → Update Classes and resources
3. 开启热构建配置：

```yaml
erupt:
  # 生产环境请勿开启
  hot-build: true
```

4. 使用 **debug** 方式启动（必须，run 启动不生效）
5. 调整注解值（如修改名称，添加排序），刷新页面即可看到效果（热部署生效时间通常 2~6 秒左右）
