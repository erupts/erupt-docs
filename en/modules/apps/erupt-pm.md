# Erupt PM Project Management

[erupt-pm](https://github.com/erupt-io/erupt-pm) is a project-management application built on Erupt: projects → iterations → tasks (sub-tasks, dependencies, milestones) → worklogs, plus a risk register. Every screen is generated from annotations; there is no frontend code in the repository.

It doubles as a full example of [@Vis multi-view](/en/annotation/vis): the same task table is shown as a board, a gantt, a calendar, a timeline and a plain table.

## Try it

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

The default profile uses a file-backed H2 database under `./data`, and a demo project (two sprints, 13 tasks, worklogs, risks) is seeded on the first boot. For MySQL run with `--spring.profiles.active=mysql` and supply `MYSQL_USER` / `MYSQL_PASSWORD` through the environment.

Requires Java 17.

## Entities and views

| Entity | Views | Notes |
| --- | --- | --- |
| Project | Table, Card | Owner, schedule, status, colour |
| Iteration | Table, Gantt (grouped by project), Calendar | Sprint time boxes with a goal |
| Task | Board (status × assignee swimlanes, estimate sum), Gantt (sub-task tree, finish-to-start dependencies, milestones, colour by priority, drag to reschedule), Calendar (due date), Timeline (creation), Table, My Tasks | `TaskProxy` fills the reporter, keeps status / progress in sync and notifies the assignee |
| Worklog | Table | Hours per task; `WorklogProxy` re-totals `Task.spentHours` |
| Risk | Table, Board (status × project) | Probability, impact, owner, mitigation |

My Tasks is a board filtered to the session user by a `FilterHandler`, across every project.

## Framework features demonstrated

- [@Vis](/en/annotation/vis): [board](/en/annotation/vis-board) swimlanes and `sumField`, [gantt](/en/annotation/vis-gantt) `pidField` / `dependencyField` / `milestoneField` / `progressField` / `colorField`, [calendar](/en/annotation/vis-calendar), [timeline](/en/annotation/vis-timeline)
- Self-referencing pickers through a lightweight projection entity (`TaskRef`, same table as `Task`)
- `ReferenceTableType.dependField`: iterations filtered by the chosen project
- [DataProxy](/en/advanced/data-proxy) lifecycle hooks and the pre-update snapshot (`OldEntityTL`)
- Row-level filtering with `FilterHandler`, both on the entity and on a single `@Vis`
- [erupt-comment](/en/modules/erupt-comment) discussions and [erupt-revision](/en/modules/erupt-revision) field-level history with rollback
- [erupt-notice](/en/modules/erupt-notice) scenes (task assigned, due soon) and an [erupt-job](/en/modules/erupt-job) daily reminder
- Module registration (`EruptModule`), idempotent seeding on `ApplicationReadyEvent`, i18n CSV
