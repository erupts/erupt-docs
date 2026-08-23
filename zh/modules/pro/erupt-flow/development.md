# 流程开发

erupt 流程引擎中驱动的表单即 erupt 类，流程与业务模型共用同一套注解体系，实现数据深度可控。本文介绍数据模型定义、流程回调与 API 发起流程。

## 定义数据模型

在任意 erupt 类中增加 `@EruptFlow` 注解，该类即可作为流程表单被流程设计器使用：

```java
@EruptFlow
@Erupt(name = "学生管理")
@Table(name = "demo_student")
@Entity
@Getter
public class Student extends BaseModel {

    @EruptField(
        views = @View(title = "姓名"),
        edit = @Edit(title = "姓名", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "性别"),
        edit = @Edit(title = "性别",
                     boolType = @BoolType(trueText = "男", falseText = "女"))
    )
    private Boolean sex;

    @EruptField(
        views = @View(title = "出生日期"),
        edit = @Edit(title = "出生日期",
                     dateType = @DateType(pickerMode = DateType.PickerMode.HISTORY)
                    ))
    private Date birthday;

    @EruptField(
        views = @View(title = "年级（高中）"),
        edit = @Edit(title = "年级（高中）", type = EditType.CHOICE, search = @Search,
                     choiceType = @ChoiceType(vl = {
                         @VL(value = "1", label = "一年级"),
                         @VL(value = "2", label = "二年级"),
                         @VL(value = "3", label = "三年级")
                     }, type = ChoiceType.Type.RADIO, trigger = Student.class, triggerParams = {"123"})
                    ))
    private Integer grade;

}
```

<img src="/flow/model.png" width="820">

## 流程回调（FlowProxy）

当需要在节点流转时执行业务逻辑（如更新业务状态、发送通知）时，可实现流程回调。

**1、实现 `FlowProxy` 接口**，节点经过后会调用对应方法：

```java
@Component
public class FlowProxyImpl implements FlowProxy {

    @Override
    public void onNodeStart(EruptFlowInstance flowInstance, NodeRule nodeRule) {

    }

    @Override
    public void onNodeEnd(EruptFlowInstance flowInstance, NodeRule nodeRule, Flow flow) {

    }

    @Override
    public void onReject(EruptFlowInstance flowInstance, NodeRule nodeRule) {

    }

}
```

**2、绑定到 `@EruptFlow` 注解**：

```java
@EruptFlow(flowProxy = FlowProxyImpl.class)
@Erupt(name = "学生管理")
@Table(name = "demo_student")
@Entity
@Getter
public class Student extends BaseModel {
}
```

`FlowProxy` 三个方法均为 default 方法，按需重写即可：

| 方法 | 触发时机 |
| --- | --- |
| onNodeStart | 节点开始时 |
| onNodeEnd | 节点结束时 |
| onReject | 流程被驳回时 |

## 通过 API 发起流程

除了在界面上发起流程，也可以在代码中注入 `FlowExternalService` 调用 `launchFlow` 方法发起：

```java
public class FlowTest extends EruptDemoApplicationTests {

    @Resource
    private FlowExternalService flowExternalService;

    @Resource
    private EruptDao eruptDao;

    @Test
    void testLaunchFlow() {
        Student student = new Student();
        student.setName("张三");
        student.setSex(true);
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .eq(EruptUser::getAccount, "erupt").one();
        // 参数1 流程编码，创建流程后可在编辑页面看到
        // 参数2 流程发起人，可通过查询 EruptUser 表拿到
        // 参数3 流程绑定的数据模型实例对象
        flowExternalService.launchFlow("P1te0FLS", eruptUser, student);
    }
}
```

流程编码在流程编辑页面查看：

<img src="/flow/flow-code.png" width="900">

## Flex 节点 <Badge type="tip" text="v2.1.0+" />

Flex 节点是流程中的**自动执行节点**：流程流转至该节点时无需人工审批，自动完成调用接口、执行脚本、操作数据、计算变量、发送通知、等待外部回调等动作，让流程具备自动化编排能力。

### 变量占位符

Flex 节点的配置项支持 `${表达式}` 占位符，表达式为 **JavaScript 表达式**，由沙箱化的 Nashorn 引擎求值（禁止访问任何 Java 类），可用的上下文对象有三个：

| 上下文 | 含义 | 示例 |
| --- | --- | --- |
| `form` | 流程表单数据 | `${form.amount}`、`${form.user.name}` |
| `vars` | 变量节点计算出的变量 | `${vars.tax}` |
| `flow` | 流程实例本身 | `${flow.no}`、`${flow.status}` |

支持算术运算、三元表达式与字符串方法，如 `${form.amount > 1000 ? '高' : '低'}`、`${form.amount * 2}`。表达式求值失败或变量不存在时替换为空字符串。

### HTTP 请求节点

调用外部 HTTP 接口。请求返回 2xx 时，响应状态码与响应体记录为节点流转数据；请求异常或非 2xx 状态则流程以异常终止。连接超时 10 秒，读取超时 30 秒。

| 配置项 | 说明 |
| --- | --- |
| 请求方式 | GET / POST / PUT / DELETE / PATCH |
| 请求地址 | 支持占位符，如 `https://api.example.com/order/${form.id}` |
| 请求头 | 每行一条，格式 `Key: Value` |
| 请求体 | 仅 POST / PUT / PATCH 显示，支持占位符，如 `{"orderId": "${form.id}"}` |

### 脚本节点

执行 JavaScript（Nashorn）脚本。脚本中可读取 `form`（表单数据）与 `flow`（流程实例），并通过 `bean('name')` 调用任意 Spring Bean，例如：

```javascript
bean('orderService').audit(form.id)
```

脚本返回值记录为节点流转数据；脚本抛出异常则流程终止。

:::warning
与 `${...}` 占位符使用的沙箱引擎不同，脚本节点的引擎**未做沙箱限制**，属于可信逻辑，仅允许具备流程定义编辑权限的用户配置。
:::

### 数据节点

对任意已注册的 Erupt 模型执行数据的新增 / 修改 / 删除，复用 Erupt 数据层能力（DataProxy、校验、权限均生效）。

| 配置项 | 说明 |
| --- | --- |
| 目标 Erupt | 选择目标 Erupt 模型 |
| 操作类型 | INSERT / UPDATE / DELETE |
| 数据（JSON） | 支持 `${form.x}` / `${flow.x}`；新增/修改填字段值（修改必须包含主键）；删除格式为 `{"ids": ["${form.id}"]}` |

### 变量节点

计算命名变量并写入流程上下文的 `vars` 命名空间，供下游节点通过 `${vars.<name>}` 引用，实现节点间传递计算数据。

配置为一个 JSON 对象，键为变量名，值为 JavaScript 表达式（可引用 `form.x` / `vars.x` / `flow.x`），按声明顺序依次求值，后面的表达式可引用前面已计算出的变量：

```json
{
  "tax": "form.amount * 0.1",
  "total": "form.amount + vars.tax"
}
```

### 通知节点

向流程发起人发送通知，依赖 erupt-notice 模块的通知渠道。

| 配置项 | 说明 |
| --- | --- |
| 通知标题 | 支持 `${form.字段}` 占位符 |
| 通知内容 | HTML，支持 `${form.字段}` 占位符 |
| 通知渠道 | 多选，来自 erupt-notice 已配置的渠道 |
| 通知场景 | 选择通知场景 |

### 等待回调节点

流程流转至该节点后**暂停**，直至外部系统主动回调后继续向下流转，适合对接异步任务（如等待第三方系统处理完成）。定时调度不会驱动处于等待状态的节点，可无限期等待外部触发。

外部系统通过以下接口恢复流程（需携带 erupt 登录令牌鉴权，请求头 `token`）：

```
POST /erupt-api/flow/callback/{no}
```

- `{no}`：流程实例的业务编号（`EruptFlowInstance.no`），且实例须处于审批中状态并停留在等待回调节点；
- 请求体（可选）：JSON 对象，会存入表单数据的 `form.<resultKey>`（配置项 **Result Key**，默认 `callback`），下游节点可通过 `${form.callback.x}` 读取回调结果。

```bash
curl -X POST "https://your-host/erupt-api/flow/callback/FL20260814001" \
  -H "token: <erupt-token>" \
  -H "Content-Type: application/json" \
  -d '{"result": "success", "score": 98}'
```

---

需要自定义节点类型或全局流程行为？请继续阅读 [自定义扩展](/zh/modules/pro/erupt-flow/custom-node)。
