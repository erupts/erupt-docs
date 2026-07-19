# 表格展示扩展（afterFetch / extraContent）

在 `afterFetch` 与 `extraContent` 中控制表格的展示效果：单元格着色、行按钮显隐、顶部自定义内容注入。

## 单元格着色 <Badge type="tip" text="1.12.16+" />

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            i++;
            if (i % 2 != 0) {
                EruptTableStyle.cellColor(map, "text", "#09f");
            }
        }
    }
    
}
```

## 表格行按钮显示控制 <Badge type="tip" text="1.12.16+" />

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public void afterFetch(Collection<Map<String, Object>> list) {
        int i = 0;
        for (Map<String, Object> map : list) {
            // 参数说明：行数据，查看详情是否显示，编辑按钮是否显示，删除按钮是否显示
            EruptTableStyle.rowPower(map, ++i % 2 == 0, true, true);
        }
    }
    
}
```

## extraContent 自定义内容注入 <Badge type="tip" text="v1.14.3+" />

`extraContent` 方法返回的 HTML 字符串将渲染到表格或其他视图的顶部区域，适合用于展示统计摘要、公告提示、自定义图表等补充信息。

2.0.0 起方法签名增加第二个参数 `list`，可直接访问当前页查询结果：

```java
@Service
public class EruptTestDataProxy implements DataProxy<EruptTest>{

    @Override
    public String extraContent(List<Condition> conditions, Collection<Map<String, Object>> list) {
        // list 为当前页数据（2.0.0+），conditions 为搜索条件
        return "<div style='padding:8px 12px;background:#f0f9ff;border-radius:6px'>"
             + "📊 当前共 <b>" + list.size() + "</b> 条记录"
             + "</div>";
    }
    
}
```

:::tip
- 返回 `null` 时不展示任何内容（默认行为）
- `conditions` 参数为当前页面的搜索条件，可据此动态渲染内容
- `list` 参数（2.0.0+）为当前页查询结果，可直接读取展示统计信息
- 返回内容为原始 HTML，注意避免 XSS 风险，不要直接拼接用户输入
:::

## 相关能力

- 追加合计行、汇总行见[自定义行（合计行）](/zh/advanced/extra-row)
