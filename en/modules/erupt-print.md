# Erupt Print Module

erupt-print provides HTML template-based printing capabilities. It supports configuring template variables that are dynamically populated with business data to generate printable documents or reports.

> **Added in 2.0.0**: erupt-print now supports Erupt entities directly — define print templates and variables for any Erupt table, then print any row with a single click. It is no longer limited to erupt-flow workflow documents.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-print</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

## Core Concepts

| Concept | Description |
|---------|-------------|
| Print template | An HTML template editable in the management UI |
| Template variable | Placeholders defined in the template, replaced at runtime with Erupt entity field values |
| Print trigger | One-click print from the row action column — fills the template with the current row's data |
| Built-in print | The default layout of a model without templates: a configurable preview generated from the form fields, no template needed <Badge type="tip" text="v2.4.0+" /> |

## Workflow

1. **Define a template**: Create a new template under the "Print Templates" menu and write the HTML layout.
2. **Configure variables**: Insert variable placeholders in the template and bind them to Erupt entity field names.
3. **Associate with an Erupt**: Link the template to the target Erupt entity.
4. **Trigger printing**: Click the print button on a table row — the system fills in the variables and opens the print preview.

Printing works without any template as well: the print entry opens the [built-in print](#built-in-print) preview directly. Once the model has templates, a "Select print layout" list comes first — "Default layout" is the built-in print, the rest render through a template.

## Template Variable Configuration

Define variables in the print template; values are dynamically populated from Erupt entity fields or workflow business data:

<img src="/print/var.png" width="900">

## Print Result

<img src="/print/result.png" width="700">

## Built-in Print <Badge type="tip" text="v2.4.0+" />

Built-in print lays the record out as a form, and the preview is headed by a **settings bar** whose changes show at once:

| Setting | Notes |
| --- | --- |
| Form style | Label above / label left |
| Columns | 1 – 4; a full-line model (`@Layout(formSize = FormSize.FULL_LINE)`) defaults to 1, every other to 3 |
| Border / border color | Cell borders on or off, and their color (default `#d9d9d9`) |
| Font size | 10 – 24 px, default 13 |
| Title | Whether a title is printed above the form, the current menu name by default |
| Paper size / orientation | A4 / A3 / A5 / Letter / auto, portrait or landscape; default A4 portrait |
| Margin | 0 – 50 mm, default 10 |

The settings are kept in the browser's localStorage under `print-builtin-config`, apply to every model, and the next print starts from the last choice; the default print of an [erupt-flow](/en/modules/pro/erupt-flow/) approval shares the same settings (a flow's custom print template keeps the page setup saved with it).

### What Prints

- Visible, titled form fields fill the grid in order; full-row fields (textarea, rich text, code, attachments, signature, map, tags…) take a row of their own, the previous row's last cell widens to close it, so every row is complete
- **One-to-many / many-to-many / multi-form** fields print as a sub-table whose columns are the sub-model's table columns, with booleans, choices and dates as display values
- **Tab tree** fields print the names of their checked nodes, comma-separated in tree order
- **Combine** fields render nested as a titled section; dividers and callouts print too
- Non-printable types (password, empty, TPL…) are skipped

### How It Prints

"Print" writes the preview into a hidden iframe that carries the site's own stylesheets minus the dark / compact theme bundle (paper is always the light, regular-density theme), waits for stylesheets, images and fonts to load, then opens the browser's print dialog; the iframe is removed afterwards. The layout therefore **reflows to the paper width** instead of printing the on-screen pixel sizes; the `@page` size, orientation and margin come from the settings bar. Template print goes through the same path without the site styles, so the shell's global styles never restyle a template.

## Print Permission

The print entries (the toolbar's "Print" and "Print layout", and "Print" in the record panel's "More" menu) are shown only to users who **may read a record's details**: the model's `@Power(print)` is on and the current user holds `edit` or `viewDetails`. A model with `@Power(print = false)` has neither a print entry nor the print-layout management entry. The server's template rendering endpoint checks the same rule, and the record must fall within the user's row-data scope — see [@Power → print](/en/annotation/power#print-print-permission).

## Template Print Request <Badge type="tip" text="v2.4.0+" />

When printing through a template the client no longer sends the template content; it posts only the print config's id:

```
POST /erupt-api/print/{erupt}/{id}?config=<print config id>
```

The server looks the config up by `erupt` and `config` (an unknown id is an error), loads the record, renders the template content with Velocity and returns the HTML; the client prints it with the page setup saved on that config (paper, orientation, four margins). Template content is maintained only under "Print layout", so a print request cannot inject an arbitrary template.
