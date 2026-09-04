# 自定义扩展

erupt-flow 支持自定义流程节点与全局流程行为，无需任何前端代码，即可实现邮件通知、短信发送、延时等待等能力。

## 自定义节点

流程节点不止于审批与抄送 —— 延时等待、邮件通知、短信发送、Webhook 调用、数据同步……**任何业务动作都可以封装为自定义节点**。注册后自动出现在流程设计器的节点面板中，业务人员像使用内置节点一样拖拽即用，这是大多数流程引擎需要二次开发引擎本身才能做到的能力：

<img src="/flow/custom-node-plugin-zh.svg" width="900" alt="流程节点随意自定义">

:::tip
自定义节点的绑定表单也是 erupt 类 —— 节点的配置界面由 erupt 自动渲染，无需前端开发。
:::

新建类继承 `FlexFlowProcess`，泛型为 erupt 类，用于定义节点绑定表单。以延时节点为例：

```java
@Component
public class WaitNodeProcess extends FlexFlowProcess<WaitNode> {

    @Resource
    private EruptDao eruptDao;

    // 流程编码
    @Override
    public String code() {
        return "wait";
    }

    // 流程名称
    @Override
    public String name() {
        return "延时节点";
    }

    // 流程颜色
    @Override
    public String color() {
        return "#4CAF50";
    }

    // 节点初始化逻辑
    @Override
    public String prepare(EruptFlowInstance flowInstance, NodeRule nodeRule, WaitNode waitNode) {
        LocalDateTime finishDateTime = switch (waitNode.getWaitType()) {
            case AFTER_MINUTES -> LocalDateTime.now().plusMinutes(waitNode.getInterval());
            case AFTER_HOURS -> LocalDateTime.now().plusHours(waitNode.getInterval());
            case AFTER_DAYS -> LocalDateTime.now().plusDays(waitNode.getInterval());
            case CURRENT_DAY_TIME -> LocalDateTime.of(LocalDate.now(), LocalTime.parse(waitNode.getTime()));
            case FIXED_TIME -> waitNode.getDatetime();
        };
        return finishDateTime.toString();
    }

    // 节点校验逻辑，返回 Flow.await() 则下一次流程检查时再执行，Flow.next() 为执行后续流程
    @Override
    public Flow evaluate(String data, EruptFlowInstance flowInstance, NodeRule nodeRule, WaitNode waitNode) {
        if (LocalDateTime.parse(data).isBefore(LocalDateTime.now())) {
            return Flow.next();
        } else {
            return Flow.await();
        }
    }

}
```

节点的执行机制如下 —— `prepare()` 在流程到达节点时初始化，`evaluate()` 由调度器周期驱动，返回 `Flow.next()` 进入下一节点：

<img src="/flow/custom-node-zh.svg" width="900" alt="自定义节点执行机制">

节点绑定表单 `WaitNode` 的定义：

```java
@Getter
@Setter
@Erupt(name = "Wait Node")
public class WaitNode extends BaseModel {

    @EruptField(edit = @Edit(title = "延迟类型", notNull = true, type = EditType.CHOICE, choiceType = @ChoiceType(fetchHandler = WaitType.H.class)))
    private WaitType waitType;

    @EruptField(edit = @Edit(title = "延迟时间", dynamic = @Dynamic(
            dependField = "waitType", condition = "value=='AFTER_MINUTES'||value=='AFTER_HOURS'||value=='AFTER_DAYS'"
    )))
    private Integer interval;

    @EruptField(edit = @Edit(title = "指定今日时间", dynamic = @Dynamic(
            dependField = "waitType", condition = "value=='CURRENT_DAY_TIME'"),
            type = EditType.DATE, dateType = @DateType(type = DateType.Type.TIME))
    )
    private String time;

    @EruptField(edit = @Edit(title = "指定日期",
            type = EditType.DATE,
            dateType = @DateType(type = DateType.Type.DATE_TIME, pickerMode = DateType.PickerMode.FUTURE),
            dynamic = @Dynamic(dependField = "waitType", condition = "value=='FIXED_TIME'")))
    private LocalDateTime datetime;

}
```

:::tip
上例中的字段联动由 [@Dynamic 动态控制](/zh/annotation/dynamic) 提供：`condition` 为 JS 表达式，`value` 表示 `dependField` 字段的当前值。`@Dynamic` 默认 `match = Ctrl.SHOW`、`noMatch = Ctrl.HIDE`，即条件成立时显示、否则隐藏。
:::

## 自定义流程行为

用于定制流程的全局逻辑，如流程编号生成规则、通知发送方式等。

**1、新建流程全局处理类**，继承 `EruptFlowProcess`，按需重写相关方法：

```java
@Component
public class DemoFlowProcess extends EruptFlowProcess {

    // 流程编号生成逻辑
    @Override
    public String genFlowNo() {
        return RandomStringUtils.randomAlphanumeric(8);
    }

    // 自定义流程通知逻辑
    @Override
    public void notification(Long userId, String title, String content) {
        super.notification(userId, title, content);
    }
}
```

**2、在程序入口类中增加 `@EruptFlowManager` 注解**，绑定处理类即可生效：

```java
@SpringBootApplication
@EruptScan
@EruptFlowManager(DemoFlowProcess.class)
public class EruptDemoApplication {

    public static void main(String[] args) {
        SpringApplication.run(EruptDemoApplication.class, args);
    }

}
```
