# Excel Import & Export (excel*)

DataProxy provides hooks into the Excel import/export pipeline, letting you customize export files and validate imported data.

> Requires the `erupt-excel` module

## excelExport — Customize the Export File

Triggered after the Excel file is generated. Cast the parameter to Apache POI `Workbook` to modify styles, append sheets, etc.

```java
@Override
public void excelExport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    Sheet sheet = wb.getSheetAt(0);
    // Insert a title row at the top
    sheet.shiftRows(0, sheet.getLastRowNum(), 1);
    Row titleRow = sheet.createRow(0);
    titleRow.createCell(0).setCellValue("Data Export Report");
}
```

## excelImport — Raw POI Stage

Triggered after the Excel file is uploaded but before data is parsed. The parameter is the same `Workbook` object — use it for pre-validation or format correction.

```java
@Override
public void excelImport(Object workbook) {
    Workbook wb = (Workbook) workbook;
    if (wb.getNumberOfSheets() < 1) {
        throw new EruptApiErrorTip("Invalid Excel file format");
    }
}
```

## excelImportProcess — Structured Data Stage

Triggered after Excel rows are parsed into model objects, before they are saved. Use it for batch validation or to fill in extra fields.

```java
@Override
public void excelImportProcess(List<EruptTest> list) {
    for (EruptTest item : list) {
        if (item.getName() == null || item.getName().isBlank()) {
            throw new EruptApiErrorTip("Some rows have an empty name — please fix the file and retry");
        }
        item.setCreateBy(getCurrentUser());
    }
}
```
