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
