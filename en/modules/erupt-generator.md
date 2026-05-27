# Erupt Generator Code Generation

erupt-generator provides visual code generation capabilities. Use the interface to quickly generate Erupt entity class code, then copy it directly into your project — significantly boosting development efficiency.

## Adding the Dependency

```xml
<dependency>
  <groupId>xyz.erupt</groupId>
  <artifactId>erupt-generator</artifactId>
  <version>${erupt.version}</version>
</dependency>
```

After a successful import, restart the application to see the **Code Generation** menu entries.

## Menu Entry

<img src="/generator/menu.png" width="300">

## Code Generation Interface

Configure field information through the visual interface to automatically generate complete Erupt entity class code:

<img src="/generator/ui.png" width="900">

## Workflow

1. Open the **Code Generation** menu and click **Add**
2. Fill in the class name, package name, and other basic information
3. Add fields, configuring field types, display names, edit components, etc.
4. Click **Generate Code**, then copy or download the generated Java file
5. Place the file in the corresponding package path in your project and restart
6. Add the class as a menu entry in Menu Management to start using it

:::tip
The generated code is based on standard Erupt annotations and can be further customized to add complex business logic.
:::

## EZDML Assisted Modeling

For quickly generating code from a database schema, you can use the EZDML data modeling tool. See [EZDML Code Generation](/en/modules/third-party/ezdml).
