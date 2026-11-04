# Governance & License Commitment

If you are evaluating Erupt for a long-lived internal system, this page answers the question you should be asking: **could this framework suddenly change its license in a few years and force us to pay or migrate?**

It cannot, and the commitment is written down in the main repository: [`.github/GOVERNANCE.md`](https://github.com/erupts/erupt/blob/master/.github/GOVERNANCE.md). This page explains it.

## License commitment

The open-source Erupt framework — including but not limited to `erupt-core`, `erupt-annotation`, `erupt-jpa`, `erupt-mongodb`, `erupt-upms`, `erupt-security`, `erupt-web`, `erupt-ai`, `erupt-ai-claw`, `erupt-cloud`, `erupt-job`, `erupt-monitor`, `erupt-generator`, `erupt-magic-api`, `erupt-notice`, `erupt-print`, `erupt-terminal`, `erupt-websocket`, `erupt-toolkit`, `erupt-tpl`, `erupt-excel`, and **all** current and future modules in the [`erupts/erupt`](https://github.com/erupts/erupt) repository — is and will always remain licensed under the **Apache License 2.0**.

Four commitments:

| Commitment | What it means |
| --- | --- |
| **No relicensing** | No move to BSL, SSPL, Commons Clause, Elastic License 2.0, or any other non-OSI-approved license |
| **No retroactive changes** | Code that is Apache 2.0 today stays Apache 2.0; future contributions to the open-source repository are accepted under Apache 2.0 |
| **Independent evolution** | Commercial extension modules (`erupt-flow`, `erupt-tenant`, `erupt-cube`) are maintained in separate private repositories and **do not affect** the licensing, roadmap, or feature set of the open-source core |
| **Open source first** | Bug fixes, performance improvements, and general-purpose features **default to the open-source core**. Only clearly enterprise-grade, advanced-scenario features (multi-tenant infrastructure, semantic-layer BI, workflow engines) ship as commercial modules |

:::tip What this means in practice
No project-count limits · no commercial restrictions · no license file · no crippled features. Apache 2.0 legally guarantees your freedom to use, modify, and redistribute forever — **independent of any future direction the project or its maintainer may take**.
:::

## Open-source core vs commercial modules

The boundary is drawn by **repository**, not by feature flags:

| | Open-source core | Commercial modules |
| --- | --- | --- |
| Repository | Public [`erupts/erupt`](https://github.com/erupts/erupt) | Separate private repositories |
| License | Apache 2.0, forever | Commercial license |
| Scope | Annotation engine, UPMS, data connectors, AI, reporting, cloud — all 50+ modules | Multi-tenancy, semantic-layer BI, workflow engine |
| Affects the other? | No | No |

In other words, the open-source core is never weakened to make room for a commercial module. **The test for which side a feature belongs to is "is it exclusive to enterprise-grade complex scenarios", not "is it valuable".**

## Decision-making

- The project is maintained by YuePeng and contributors;
- Routine maintenance, bug fixes, and feature implementation are decided by the maintainer;
- Larger architectural changes are discussed in [GitHub Discussions](https://github.com/erupts/erupt/discussions) before implementation;
- Anyone can propose a feature, report a bug, or submit a pull request — see the [contributing guide](/en/guide/contributing).

## Data boundary

Governance is not only a licensing question, it is a data question. The one place Erupt initiates an outbound network request is anonymous telemetry; what it collects, how to disable it, and how to self-host it are fully documented on the [Anonymous Telemetry](/en/guide/telemetry) page.

Beyond that, Erupt performs **no network-based license validation of any kind** — no license server, no activation key, and it runs fine fully offline.

## Contact

- GitHub: [@erupts](https://github.com/erupts)
- Email: erupts@126.com
- Discussions: [GitHub Discussions](https://github.com/erupts/erupt/discussions)

## See also

- [Anonymous Telemetry](/en/guide/telemetry)
- [Contributing](/en/guide/contributing)
- [Community](/en/guide/community)
