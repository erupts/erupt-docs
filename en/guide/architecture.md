# Architecture

<img src="/architecture/overview.jpeg" width="900">

## Feature Map

<img src="/architecture/feature-map.jpeg" width="900">

## Functional Architecture

<img src="/architecture/arch.png" width="900">

---

## Layered Architecture

Erupt follows a modular layered design — each layer has clear responsibilities and can be pulled in on demand.

```mermaid
graph TB
    subgraph Frontend
        Web["erupt-web\nAngular admin UI (jar)"]
    end

    subgraph Security
        Security["erupt-security\nJWT / Session auth"]
    end

    subgraph Core
        Core["erupt-core\nAnnotation parsing · CRUD engine · Schema delivery"]
        UPMS["erupt-upms\nUsers · Roles · Menus · Orgs"]
    end

    subgraph Data
        JPA["erupt-jpa\nSpring Data JPA · multi-source · auto schema"]
        Mongo["erupt-mongodb\nMongoDB NoSQL"]
    end

    subgraph Extensions
        Job["erupt-job\nScheduled jobs"]
        Notice["erupt-notice\nNotifications"]
        Monitor["erupt-monitor\nService monitoring"]
        Tpl["erupt-tpl\nCustom pages"]
        Cloud["erupt-cloud\nDistributed"]
        AI["erupt-ai\nLLM integration"]
    end

    Web --> Security
    Security --> Core
    Core --> UPMS
    Core --> JPA
    Core --> Mongo
    Core -.-> Job & Notice & Monitor & Tpl & Cloud & AI
```

## Request Lifecycle

The full pipeline of a CRUD request inside the framework:

```mermaid
sequenceDiagram
    participant C as Browser
    participant S as erupt-security
    participant R as erupt-core
    participant P as DataProxy
    participant D as Database

    C->>S: HTTP request + Token
    S->>S: Token & permission check
    S->>R: Route to the matching Erupt class
    R->>R: Parse @Erupt / @EruptField metadata
    R->>R: Row / column permission filter
    R->>P: beforeFetch / validate / beforeAdd…
    P-->>R: dynamic conditions / data tweaks / reject
    R->>D: Execute JPQL / SQL
    D-->>R: result
    R->>P: afterFetch / afterAdd…
    R-->>C: JSON response
```

## DataProxy Lifecycle

DataProxy is Erupt's Service layer and exposes lifecycle hooks for every CRUD action:

```mermaid
flowchart TD
    Req[Frontend Request] --> T{Action}

    T -- Read --> BF["beforeFetch()\nInject dynamic WHERE"]
    BF --> Q[(Query)]
    Q --> AF["afterFetch()\nPost-processing / cell coloring"]

    T -- Create --> V1["validate()\nValidation"]
    V1 --> BA["beforeAdd()\nAuto-fill before insert"]
    BA --> INS[(INSERT)]
    INS --> AA["afterAdd()\nPush message / refresh cache"]

    T -- Update --> V2["validate()"]
    V2 --> BU["beforeUpdate()"]
    BU --> UPD[(UPDATE)]
    UPD --> AU["afterUpdate()"]

    T -- Delete --> BD["beforeDelete()"]
    BD --> DEL[(DELETE)]
    DEL --> AD["afterDelete()"]
```

## Annotation-Driven Pipeline

How a Java class turns into a complete admin page:

```mermaid
flowchart LR
    A["@Erupt entity\n@EruptField fields"] -->|Scan on startup| B["EruptCoreService\nMetadata registry"]
    B --> C["EruptModel\nFields · view · edit · search · permission config"]
    C --> D["Auto REST API\n/erupt-api/data/*"]
    C --> E["Schema delivered to frontend\nTable / form / search rendered automatically"]
    C --> F["Permission control\nMenu · row · column · button level"]
    D & E & F --> G[✅ Complete admin page]
```

## Module Dependencies

```mermaid
graph LR
    admin["erupt-admin\nRecommended"] --> upms["erupt-upms"]
    admin --> security["erupt-security"]
    admin --> web["erupt-web"]
    upms --> core["erupt-core"]
    security --> core
    core --> jpa["erupt-jpa"]

    job["erupt-job"] --> core
    notice["erupt-notice"] --> core
    notice --> ws["erupt-websocket"]
    monitor["erupt-monitor"] --> core
    tpl["erupt-tpl"] --> core
    magic["erupt-magic-api"] --> core
    ai["erupt-ai"] --> core

    node["erupt-cloud-node"] --> core
    server["erupt-cloud-server"] --> admin
```

## Distributed Architecture (erupt-cloud)

```mermaid
graph TB
    Browser["Admin Browser"] --> Server

    subgraph Server
        Server["erupt-cloud-server\nRegistry · auth · dispatch"]
        Redis[("Redis\nSession sharing")]
        Server --- Redis
    end

    Server <-->|"WebSocket heartbeat\nConfig push / request forwarding"| NA
    Server <-->|"WebSocket heartbeat"| NB
    Server <-->|"WebSocket heartbeat"| NC

    subgraph "Node A (Notifications)"
        NA["erupt-cloud-node\nMessage templates · channels"]
        DBA[("DB-A")]
        NA --- DBA
    end

    subgraph "Node B (Gateway)"
        NB["erupt-cloud-node\nTimeout · throttling · routing"]
        DBB[("DB-B")]
        NB --- DBB
    end

    subgraph "Node C (Algorithm Service)"
        NC["erupt-cloud-node\nPrompts · algorithm rules"]
        DBC[("DB-C")]
        NC --- DBC
    end
```
