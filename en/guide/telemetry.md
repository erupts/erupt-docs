# Anonymous Telemetry <Badge type="tip" text="v2.1.2+" />

After startup, Erupt reports an **anonymous instance profile**. It exists to answer questions like "which JDK / database / Spring Boot versions still need support" and "which modules deserve investment" with real numbers instead of guesses.

This page lists exactly what is collected, how to turn it off, and how to self-host the collector. **If you'd rather not report, [jump to opting out](#opting-out).**

:::tip In one line
On by default. Only non-identifying runtime information is sent — **no** hostname, application name, JDBC url, IP address, business data, or user data. Failures are silently ignored and never block your application.
:::

## What is collected

The payload is defined by `xyz.erupt.upms.telemetry.TelemetryPayload`. These are all of its fields — **there is no 16th**:

| Field | Example | Why it is collected |
| --- | --- | --- |
| `schema` | `2` | Payload layout version, bumped when fields change |
| `eventType` | `boot` / `heartbeat` | Distinguishes the startup report from the periodic one |
| `instanceId` | Random UUID | **Deduplication only**, see [Instance identity](#instance-identity) |
| `eruptVersion` | `2.1.2` | Version distribution — decides how long old versions stay supported |
| `modules` | `["erupt-jpa","erupt-ai"]` | Installed modules — tells which ones deserve investment |
| `eruptCount` | `37` | Number of registered `@Erupt` classes — separates real deployments from tutorial demos |
| `javaVersion` | `17.0.11` | Decides when the JDK baseline can be raised |
| `javaVendor` | `Eclipse Adoptium` | Same as above |
| `os` | `Linux` | Operating system distribution |
| `osDistro` | `ubuntu` / `kylin` / `openeuler` | Linux distribution id — `os.name` is always a bare `Linux`, so without this the distro mix is invisible |
| `arch` | `aarch64` | Share of ARM deployments |
| `containerized` | `true` | Whether it runs in a container — decides how much the official Docker image is worth |
| `dbType` | `MySQL` | Guides cross-database SQL compatibility priorities |
| `dbVersion` | `8.0` | **major.minor only** — coarse enough to stay anonymous, precise enough to act on |
| `springBootVersion` | `3.5.16` | Decides how long Spring Boot 2.x has to stay supported |
| `locale` | `en-US` | Decides which i18n translations deserve investment |
| `timezone` | `Asia/Shanghai` | Coarse regional distribution, cleaner than keeping IP addresses |

### Explicitly not collected

- ❌ Hostname, application name, `spring.application.name`
- ❌ JDBC url, database name, table names, column names
- ❌ IP addresses (not recorded on the receiving side either)
- ❌ User accounts, menu names, any business data
- ❌ Your `@Erupt` class names (only the **count** is sent)
- ❌ Environment variables or configuration file contents

The class javadoc on `TelemetryPayload` states this as a hard constraint:

> Every field here must be non-identifying: no hostname, no application name, no JDBC url, no user data.

All of the value-resolution logic lives in a single class, `xyz.erupt.upms.telemetry.EruptTelemetry` (~330 lines). You are encouraged to read it and verify.

## When it reports

| Event | Timing |
| --- | --- |
| `boot` | **15 seconds after** `ApplicationReadyEvent`, staying clear of startup networking and the connection pool |
| `heartbeat` | Every **24 hours** thereafter |

Implementation details:

- Runs on a **daemon thread** named `erupt-telemetry` — it can never hold the JVM open;
- Connect and read timeouts are **3 seconds** each;
- Any failure (offline, intranet-only, firewalled) is **silently ignored** — no error log, no retry;
- `boot` is reported once per JVM; a republished Spring context refresh will not double count.

## Instance identity

`instanceId` is a random UUID persisted in `.erupt/telemetry.id`. Its only purpose is **deduplication** — otherwise every restart would look like a new user and the statistics would be meaningless.

It is not tied to any identity. If the file cannot be written (read-only filesystem, for example), Erupt **skips reporting entirely** rather than minting a fresh identity on every restart and polluting the numbers.

Deleting the file is equivalent to taking on a new identity.

## Opting out

Any one of the three below is sufficient — a single one disables reporting completely.

### 1. Configuration file

```yaml
erupt:
  telemetry:
    enabled: false
```

### 2. Environment variable

```bash
export ERUPT_TELEMETRY_DISABLED=1   # or true
```

Useful for container / K8S setups where editing yaml is inconvenient.

### 3. CI environments are skipped automatically

Whenever a non-blank `CI` environment variable is detected, reporting is **skipped automatically** with no configuration — throwaway build-agent instances would otherwise flood the statistics.

## The first-run notice

The first time `.erupt/telemetry.id` is created — and only that time — one line is written to the startup log:

```
Erupt collects anonymous usage statistics (see README); disable with erupt.telemetry.enabled=false or ERUPT_TELEMETRY_DISABLED=1
```

Later restarts stay silent, so the startup log is never spammed.

## Self-hosting the collector

If your organization runs several Erupt instances and wants its own view of internal version and module distribution, point the endpoint at your own service:

```yaml
erupt:
  telemetry:
    endpoint: https://telemetry.your-company.internal/v1/ping
```

The contract is small:

- Request: `POST`, `Content-Type: application/json`, body is the JSON of the table above;
- Header: `User-Agent: erupt/{version}`;
- Response: return `200`; the body may be empty.

### Optional: push a notice back to operators

When the endpoint returns `200` with a body shaped like the following, Erupt logs the `message` — useful for release or security advisories:

```json
{"level": "warn", "message": "2.1.0 has a known issue, upgrading to 2.1.2 is recommended"}
```

- `level: warn` is written through `log.warn`, anything else through `log.info`;
- At most **4KB** of the response body is read, and `message` is **truncated to 300 characters**;
- Control characters are stripped — the response is remote input and must not be able to forge log lines.

## Configuration reference

```yaml
erupt:
  telemetry:
    # Whether to report anonymous usage statistics, default true
    enabled: true
    # Reporting endpoint, default https://telemetry.erupt.xyz/v1/ping
    endpoint: https://telemetry.erupt.xyz/v1/ping
```

## FAQ

**Q: Does erupt-cloud-node report?**

No. The telemetry code lives in `erupt-upms` rather than `erupt-core` precisely because `erupt-cloud-node` depends only on `erupt-core` — that module boundary is what guarantees nodes never report.

**Q: Will an intranet or offline deployment error out or slow down?**

No. Three-second timeouts, a daemon thread, silent failure. The worst case is a background thread waiting three seconds every 24 hours before giving up.

**Q: If I turn it off, do I lose functionality?**

No. Telemetry participates in no feature logic and performs no licensing check of any kind.

## See also

- [Configuration](/en/guide/configuration)
- [Governance & License Commitment](/en/guide/governance)
