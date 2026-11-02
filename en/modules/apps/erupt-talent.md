# Erupt Talent Recruiting

[erupt-talent](https://github.com/erupt-io/erupt-talent) is an end-to-end recruiting system built on Erupt, covering **resume → screening → interview rounds → proposed hire → offer approval and e-mail → candidate confirmation → pending onboarding → onboarding → hiring funnel**.

Every screen is generated from annotations; there is no frontend code. Mailbox capture, offer mail and DingTalk calendar are configured in admin forms, not in `application.yml`, and take effect without a restart.

## Try it

```bash
mvn spring-boot:run
# http://localhost:8080  erupt / erupt
```

The first boot initializes everything (idempotently): tables in an H2 file database under `./data/`, the Recruiting menu with button-level permissions, the roles `TALENT_HR` (HR) and `TALENT_INTERVIEWER` (interviewer), six notification scenes, one settings row and two scheduled jobs.

To switch to MySQL:

```bash
export MYSQL_USER=... MYSQL_PASSWORD=...
mvn spring-boot:run -Dspring-boot.run.arguments=--spring.profiles.active=mysql
```

## Menus

| Menu | Type | Notes |
| --- | --- | --- |
| Hiring dashboard | TPL page | Funnel, key metrics, channel / position split, CSV export |
| Positions | Table | Position, headcount, open / closed, department head (first offer approver) |
| Resumes | Table | Manual entry, Excel import, mailbox capture |
| Interviews | Table | First / second / final rounds, scores, DingTalk calendar |
| Offers | Table | Two-level approval, automatic e-mail, full trail |
| Onboarding | Table | Document check, confirmation dialog, closing the loop |
| Trace log | Read-only table | Every status change, kept forever |
| Settings | [Form view](/en/advanced/form-view) | IMAP / SMTP / DingTalk / risk switches / offer template |

## Automation

- Fetches the recruiting mailbox on a schedule, parses PDF / DOCX resumes and de-duplicates by `Message-ID`
- Passing screening creates the first interview; an interview conclusion updates the resume status
- Scheduling an interview creates a DingTalk calendar event with a reminder
- A final-round hire starts the offer approval; an approved offer is e-mailed automatically
- An accepted offer creates the onboarding record; confirming onboarding closes the loop

Statuses move one way: the status fields of resumes, offers and onboarding are read-only and change only through the service layer, and every change lands in the trace log. A failed DingTalk sync, e-mail or notification never rolls back the business data; the reason stays on the record and can be retried.

## Settings in the admin

Settings are visible to super admins only, in four groups — mailbox capture, offer mail, DingTalk calendar, offer template and risk — each with a test button. Secret fields use `EditType.PASSWORD`, so the browser only ever gets a mask and the plain text never goes back; saving a mask or an empty value keeps the stored one.

The offer mail template takes variables such as `${candidateName}` `${jobPost}` `${salary}` `${onboardDate}` `${companyName}`, HTML-escaped on substitution.

## Roles

| Role | Effect |
| --- | --- |
| Super admin | Every feature and record, plus settings |
| HR `TALENT_HR` | The whole flow, viewing and exporting data; no settings |
| Interviewer `TALENT_INTERVIEWER` | Only their own interviews; may only fill in scores, comments and the conclusion |
