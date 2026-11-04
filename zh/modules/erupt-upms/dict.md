# 字典管理

字典用于维护结构简单、又经常变动的 key-value 数据：民族、国家、订单状态、客户来源、HTTP 方法等。把它们从代码中的枚举挪到字典里，运营人员就能自助增改选项，无需发版。

## 结构

字典分两级：

| 层级 | 字段 | 说明 |
| --- | --- | --- |
| 字典 | 编码 | 唯一标识，代码中通过它引用整组选项 |
| | 名称 / 备注 | 说明用途 |
| 字典项 | 编码 | 同一字典内唯一，建议作为存储值 |
| | 名称 | 界面显示文字 |
| | 值 | 附加取值，可存颜色、数值等扩展信息 |
| | 排序 | 下拉中的显示顺序 |

在字典列表的行操作中进入**字典项**维护。字典支持导出，字典项支持导入 / 导出，便于在环境间迁移。

## 作为下拉选项

在 `@Edit` 中通过 `ChoiceType.fetchHandler` 引用字典编码，字段即渲染为下拉框，选项实时来自字典：

```java
@EruptField(
    views = @View(title = "客户来源"),
    edit = @Edit(
        title = "客户来源",
        type = EditType.CHOICE,
        choiceType = @ChoiceType(
            fetchHandler = DictCodeChoiceFetchHandler.class,
            fetchHandlerParams = "customer_source"   // 字典编码
        )
    )
)
private String source;
```

| Handler | 存入数据库的值 |
| --- | --- |
| `DictCodeChoiceFetchHandler` | 字典项**编码**（推荐，不受 id 变动影响） |
| `DictChoiceFetchHandler` | 字典项 **id** |

选项默认缓存，`fetchHandlerParams` 第二个参数可指定缓存毫秒数。多选字段同样适用，详见[单选 CHOICE → 字典选项](/zh/field-types/choice#字典选项)。
