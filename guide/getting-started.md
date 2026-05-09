# 入门示例

使用 Erupt 创建后台管理页面的方式十分简单，一个 Java 类文件就可以办到：

```java
package xyz.erupt.example.model;

import org.hibernate.annotations.GenericGenerator;
import xyz.erupt.annotation.Erupt;
import xyz.erupt.annotation.EruptField;
import xyz.erupt.annotation.sub_field.Edit;
import xyz.erupt.annotation.sub_field.View;

import javax.persistence.*;

// @Erupt 注解修饰在类上，@EruptField 注解修饰在字段上，其他注解均为 JPA 注解
@Erupt(name = "简单的例子")
@Table(name = "demo_simple")
@Entity
public class Simple {

    // 主键
    @Id
    @GeneratedValue(generator = "generator")
    @GenericGenerator(name = "generator", strategy = "native")
    @Column(name = "id")
    @EruptField
    private Long id; // 继承 BaseModel 时无需重复声明 id

    // 文本输入
    @EruptField(
        views = @View(title = "文本"),
        edit  = @Edit(title = "文本")
    )
    private String input;

    // 数值输入
    @EruptField(
        views = @View(title = "数值"),
        edit  = @Edit(title = "数值")
    )
    private Integer number = 100; // 默认值 100

    // 布尔选择
    @EruptField(
        views = @View(title = "布尔"),
        edit  = @Edit(title = "布尔")
    )
    private Boolean bool;

    // 时间选择
    @EruptField(
        views = @View(title = "时间"),
        edit  = @Edit(title = "时间")
    )
    private Date date;
}
```

**启动项目后将类绑定到菜单即可**，步骤如下：

<img src="/getting-started/menu-bind.gif" width="900">

操作说明：登录后前往 **系统管理 → 菜单维护**，点击新增，**菜单类型**选择`表格`，**类型值**填写 `Simple`，保存后刷新即可访问该菜单。

数据库表结构与字段注释均会**自动生成**：

<img src="/getting-started/auto-table.png" width="785">

## 更多示例

更多示例代码请前往：[https://www.erupt.xyz/#!/contrast](https://www.erupt.xyz/#!/contrast)

Erupt 支持的[组件](/field-types/)多达 23 类，可根据实际需求灵活配置。

实际开发中仅需了解 [@Erupt](/annotation/erupt) 与 [@EruptField](/annotation/erupt-field) 两个注解即可上手。
