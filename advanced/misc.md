# 杂项功能

## 热构建（修改注解无需重启）

开启热部署后修改 erupt 注解内容无需重启项目，刷新页面即可看到调整后的效果。

**版本支持**：1.12.14 及以上版本

### 限制

1. 开发工具目前仅支持 **IntelliJ IDEA**，其他工具需自行探索
2. 添加**类**与添加**字段**不支持热部署，仅支持 erupt 注解的调整

### 使用步骤

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

## 逻辑删除

逻辑删除的本质是**修改操作**，所谓的逻辑删除其实并不是真正的删除，而是在表中将对应的是否删除标识（deleted）或者说是状态字段（status）做修改操作。

### 代码实现

```java
@Erupt(
        name = "逻辑删除",
        filter = @Filter("deleted = false"),
)
@SQLDelete(sql="update test set deleted = true, deleteTime = now() where id = ?")
@Table(name = "test")
@Entity
public class Test extends BaseModel {

    @EruptField(
            views = @View(title = "xxx"),
            edit = @Edit(title = "xxx")
    )
    private String name;
    
    private Date deleteTime;
    
    private Boolean deleted = false;
    
}
```

### 原理解析

1. 使用 `deleted` 属性做逻辑删除标识
2. 使用 `@SQLDelete` 注解覆盖原有删除逻辑
3. 使用 `filter` 做查询过滤

## 扩展 Erupt 注解配置

通过自定义注解并与 erupt 注解协同使用，可以扩展 erupt 的注解体系，为特定业务场景提供更语义化的配置方式。

## 全局 UI 提示组件

erupt 提供了全局 UI 提示组件，可以在自定义按钮中使用：

```java
// 在 OperationHandler 的 exec 方法中返回如下字符串

// 消息提示
return "window.msg.info('This is a normal message')";
return "window.msg.success('成功信息')";
return "window.msg.warning('警告信息')";
return "window.msg.error('错误信息')";

// 代码预览弹窗
return "codeModal('sql',`select * from xxx`)";

// 打开新窗口
return "window.open('https://xxxxx')";

// 弹出对话框
return "alert('message')";
```

详见：[app.js 全局 UI 组件文档](https://www.yuque.com/erupts/erupt/srxt3l6q24h9c001)
