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

---

需要自定义节点类型或全局流程行为？请继续阅读 [自定义扩展](/zh/modules/pro/erupt-flow/custom-node)。
