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

## Export Formats <Badge type="tip" text="v2.4.0+" />

Export is no longer Excel only. The **Export** button in the table toolbar has a caret listing every format the server returns from `GET /erupt-api/excel/formats`:

| Format | `format` parameter | Notes |
|---|---|---|
| Excel | `xlsx` | default; dates stay date cells |
| CSV | `csv` | RFC 4180 with a UTF-8 BOM, so Excel opens it correctly |
| JSON | `json` | the whole result as one array |
| JSON Lines | `jsonl` | one record per line, streamed, suits large exports |
| Markdown | `md` | a Markdown table |

`POST /erupt-api/excel/export/{erupt}` picks the format through the optional `format` query parameter; without it you get Excel, so older clients see no change.

- Import and the import template **stay Excel only**: the template carries validations and hints a text format cannot hold
- An Excel export now **imports back as it is**: columns that are table-only (ID, attachments, computed views) are skipped on the way in, and only a title the model knows nothing about is an error
- The `excelExport` hook fires for the Excel format only; its parameter is still the POI `Workbook`

### Custom Formats

Implement `TableCodec` and register it as a Spring bean to add a format to the list. A codec only deals with the encoding: the `TableSheet` it receives already holds display values (choice labels, boolean wording, reference labels).

```java
public interface TableCodec {

    String format();    // lower-case file extension; doubles as the format key the client sends

    String name();      // shown to users next to the export button

    String mediaType(); // Content-Type of the response

    // write the sheet; when sheet.template() is true there are no rows, only the header
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
