# Workflow Development

Forms driven by the erupt workflow engine are erupt classes — workflows and business models share the same annotation system, giving you full control over data. This guide covers data model definition, flow callbacks, and launching flows via API.

## Define the Data Model

Add the `@EruptFlow` annotation to any erupt class and it becomes available as a workflow form in the flow designer:

```java
@EruptFlow
@Erupt(name = "Student Management")
@Table(name = "demo_student")
@Entity
@Getter
public class Student extends BaseModel {

    @EruptField(
        views = @View(title = "Name"),
        edit = @Edit(title = "Name", notNull = true)
    )
    private String name;

    @EruptField(
        views = @View(title = "Gender"),
        edit = @Edit(title = "Gender",
                     boolType = @BoolType(trueText = "Male", falseText = "Female"))
    )
    private Boolean sex;

    @EruptField(
        views = @View(title = "Birthday"),
        edit = @Edit(title = "Birthday",
                     dateType = @DateType(pickerMode = DateType.PickerMode.HISTORY)
                    ))
    private Date birthday;

    @EruptField(
        views = @View(title = "Grade"),
        edit = @Edit(title = "Grade", type = EditType.CHOICE, search = @Search,
                     choiceType = @ChoiceType(vl = {
                         @VL(value = "1", label = "Grade 1"),
                         @VL(value = "2", label = "Grade 2"),
                         @VL(value = "3", label = "Grade 3")
                     }, type = ChoiceType.Type.RADIO, trigger = Student.class, triggerParams = {"123"})
                    ))
    private Integer grade;

}
```

<img src="/flow/model.png" width="820">

## Flow Callbacks (FlowProxy)

Implement flow callbacks when business logic must run on node transitions (e.g., updating business status, sending notifications).

**1. Implement the `FlowProxy` interface** — the corresponding methods are invoked as nodes are passed:

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

**2. Bind it via the `@EruptFlow` annotation**:

```java
@EruptFlow(flowProxy = FlowProxyImpl.class)
@Erupt(name = "Student Management")
@Table(name = "demo_student")
@Entity
@Getter
public class Student extends BaseModel {
}
```

All three `FlowProxy` methods are default methods — override only what you need:

| Method | Triggered |
| --- | --- |
| onNodeStart | When a node starts |
| onNodeEnd | When a node ends |
| onReject | When the flow is rejected |

## Launch a Flow via API

Besides launching flows from the UI, you can inject `FlowExternalService` and call `launchFlow` in code:

```java
public class FlowTest extends EruptDemoApplicationTests {

    @Resource
    private FlowExternalService flowExternalService;

    @Resource
    private EruptDao eruptDao;

    @Test
    void testLaunchFlow() {
        Student student = new Student();
        student.setName("John");
        student.setSex(true);
        EruptUser eruptUser = eruptDao.lambdaQuery(EruptUser.class)
            .eq(EruptUser::getAccount, "erupt").one();
        // Param 1: flow code, visible on the edit page after the flow is created
        // Param 2: flow initiator, obtainable by querying the EruptUser table
        // Param 3: instance of the data model bound to the flow
        flowExternalService.launchFlow("P1te0FLS", eruptUser, student);
    }
}
```

The flow code is shown on the flow edit page:

<img src="/flow/flow-code.png" width="900">

---

Need custom node types or global flow behavior? Continue with [Custom Extensions](/en/modules/pro/erupt-flow/custom-node).
