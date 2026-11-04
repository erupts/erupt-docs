# 多表单块 MULTI_FORM <Badge type="tip" text="v2.1.1+" />

一对多关系的另一种编辑形态：子表的每一行渲染为一个内联表单块（而非 TAB_TABLE_ADD 的表格形式），支持在编辑时增删表单块，查看时以只读表单展示。适合子表字段较多、以表单方式录入更直观的场景。

![multi-form](/field-types/multi-form.png)

## 基础用法

用法与 `TAB_TABLE_ADD` 一致，仅需将编辑类型改为 `EditType.MULTI_FORM`，对应 JPA `@OneToMany`，保存主表时子表数据同步级联保存：

```java
@OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
@JoinColumn(name = "main_id")
@OrderBy
@EruptField(
    edit = @Edit(title = "子表数据", type = EditType.MULTI_FORM)
)
private Set<ChildTable> items;
```

子表实体类：

```java
@Entity
@Table(name = "t_child")
@Erupt(name = "子表")
public class ChildTable extends BaseModel {

    @EruptField(views = @View(title = "名称"), edit = @Edit(title = "名称", notNull = true))
    private String name;

    @EruptField(views = @View(title = "说明"), edit = @Edit(title = "说明", type = EditType.TEXTAREA))
    private String remark;

}
```

> **注意**：与 `TAB_TABLE_ADD` 相同，不要在子表实体上使用 Lombok 的 `@Data` 注解，否则 `Set` 的 `equals/hashCode` 实现会导致去重异常。

## 使用约束

- **字段必须是带泛型的集合**：框架在解析模型时取字段泛型的第一个参数作为子模型类型（`Set<ChildTable>`、`List<ChildTable>` 均可）。写成裸类型（如 `private Set items;`）或非集合类型会在启动阶段直接报错「Component modification field is incorrect」。
- **子类必须是 `@Erupt` 模型**：子模型会被当作一个完整的 erupt 视图构建（与 `TAB_TABLE_ADD` / `TAB_TABLE_REFER` 走同一条 `tabErupts` 通道），因此子类必须标注 `@Erupt`，其字段的 `@EruptField` / `@Edit` 配置会原样生效。
- **子表单块支持嵌套**：子模型内部还可以再声明 `MULTI_FORM` 或其它 Tab 类字段。

## 界面行为

- 每个表单块顶部有序号（`#1`、`#2` …）与**复制**、**删除**两个操作；复制会剥离主键（含嵌套的一对多子数据），生成一条全新记录
- 块数量超过 5 个时自动分页展示，新增后会自动跳到最后一页
- 新增块时会向后端请求初始值，`@Edit` 上配置的默认值同样生效

## 只读视图与打印

`MULTI_FORM` 的 `@View` 展示类型会自动推断为 `ViewType.TAB_VIEW`，无需手动指定：

- **查看详情**：复用同一套表单块渲染，以只读形式展示，无「新增 / 复制 / 删除」按钮；无数据时显示空态
- **打印模板**：打印模板生成器把 `MULTI_FORM` 识别为容器类型，自动展开为一张循环子表格，与 `TAB_TABLE_ADD` 的处理方式一致，无需额外配置

## 校验

提交时框架会**逐块递归校验子模型的必填项**。任意一块未通过时，错误信息会带上块序号，例如：

```
子表数据 #2: 名称 不能为空
```

## 限制

- **不支持 Excel 导入导出**：`MULTI_FORM` 在 `EditType` 上声明了 `excelOperator = false`，与 `TAB_TABLE_ADD`、`TAB_TABLE_REFER`、`CHECKBOX` 等一对多 / 多对多组件一致

## 与 TAB_TABLE_ADD 的区别

| | TAB_TABLE_ADD | MULTI_FORM |
|---|---|---|
| 渲染位置 | 主表单底部的标签页区域 | 直接内嵌在主表单的字段位置 |
| 展现形式 | 表格行 | 内联表单块 |
| 编辑方式 | 点开弹窗编辑单行 | 直接在表单块内就地编辑 |
| 字段可见性 | 一次只能看到当前编辑行 | 所有块的字段同时可见 |
| 适用场景 | 子表字段少、行数多 | 子表字段多、行数少 |
| Excel 导入导出 | 不支持 | 不支持 |

:::tip
`formSteps` 分步表单模式下，`TAB_TABLE_ADD` 这类标签页子表会统一落在最后一步；而 `MULTI_FORM` 因为是内嵌字段，会跟随它所在的 `DIVIDE` 步骤一起展示。
:::
