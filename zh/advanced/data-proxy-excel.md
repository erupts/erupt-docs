# Excel 导入导出（excel*）

DataProxy 提供 Excel 导入导出过程的钩子方法，可自定义导出文件、校验导入数据。

> 需引入 `erupt-excel` 模块

## excelExport — 自定义导出文件

Excel 文件生成完毕后触发，参数为 Apache POI `Workbook` 对象，可修改样式、追加 Sheet 等。

```java
@Override
public void excelExport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    Sheet sheet = wb.getSheetAt(0);
    // 在第一行前插入标题
    sheet.shiftRows(0, sheet.getLastRowNum(), 1);
    Row titleRow = sheet.createRow(0);
    titleRow.createCell(0).setCellValue("数据导出报表");
}
```

## excelImport — 原始 POI 阶段处理

Excel 文件上传后、数据解析前触发，参数同为 `Workbook`，可做预校验或格式修正。

```java
@Override
public void excelImport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    // 校验 Sheet 数量
    if (wb.getNumberOfSheets() < 1) {
        throw new EruptApiErrorTip("Excel 文件格式错误");
    }
}
```

## excelImportProcess — 结构化数据阶段处理

Excel 数据已解析为 Model 列表后触发，可对每条记录进行批量校验或补充字段。

```java
@Override
public void excelImportProcess(List<EruptTest> list) {
    for (EruptTest item : list) {
        if (item.getName() == null || item.getName().isBlank()) {
            throw new EruptApiErrorTip("导入数据中存在名称为空的记录，请检查后重试");
        }
        item.setCreateBy(getCurrentUser());
    }
}
```

## 多格式导出 <Badge type="tip" text="v2.4.0+" />

导出不再只有 Excel。表格工具栏的**导出**按钮带一个下拉箭头，列出服务端 `GET /erupt-api/excel/formats` 返回的全部格式：

| 格式 | `format` 参数 | 说明 |
|---|---|---|
| Excel | `xlsx` | 默认，日期保留为日期单元格 |
| CSV | `csv` | RFC 4180，带 UTF-8 BOM，Excel 直接打开不乱码 |
| JSON | `json` | 整个结果一个数组 |
| JSON Lines | `jsonl` | 一行一条记录，流式写出，适合大数据量 |
| Markdown | `md` | Markdown 表格 |

`POST /erupt-api/excel/export/{erupt}` 通过可选的 `format` 查询参数选择格式，不传即 Excel，老客户端无感知。

- 导入与导入模板**仍只支持 Excel**：模板里有下拉校验与提示，文本格式放不下
- Excel 导出文件可以**原样导回**：只在表格展示、不在表单里的列（ID、附件、计算列等）导入时自动跳过，只有模型完全不认识的列标题才报错
- `excelExport` 钩子只在 Excel 格式下触发，参数仍是 POI `Workbook`

### 自定义格式

实现 `TableCodec` 并注册为 Spring Bean，即可在下拉里多出一种格式。它只负责「编码」：拿到的 `TableSheet` 单元格已经是展示值（选项标签、布尔文案、引用显示列）。

```java
public interface TableCodec {

    String format();    // 小写扩展名，同时作为客户端传的 format 参数

    String name();      // 导出按钮旁展示给用户的名称

    String mediaType(); // 响应的 Content-Type

    // 写出表格；sheet.template() 为 true 时没有数据行，只需写表头
    void write(TableSheet sheet, OutputStream out) throws IOException;

}
```

```java
@Component
public class TsvCodec implements TableCodec {

    @Override
    public String format() { return "tsv"; }

    @Override
    public String name() { return "TSV"; }

    @Override
    public String mediaType() { return "text/tab-separated-values"; }

    @Override
    public void write(TableSheet sheet, OutputStream out) throws IOException {
        Writer writer = new OutputStreamWriter(out, StandardCharsets.UTF_8);
        writer.write(sheet.columns().stream().map(TableSheet.TableColumn::title).collect(joining("\t")) + "\n");
        for (List<Object> row : sheet.rows()) {
            writer.write(row.stream().map(String::valueOf).collect(joining("\t")) + "\n");
        }
        writer.flush();
    }

}
```
