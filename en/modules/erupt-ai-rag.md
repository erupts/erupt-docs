# Erupt AI RAG <Badge type="tip" text="v2.1.0+" />

erupt-ai-rag is the knowledge-base extension of erupt-ai. Turn business documents into AI-searchable knowledge: upload documents → automatic chunking → vector embedding → semantic retrieval, all managed visually.
The AI **decides on its own** when to query which knowledge base during conversations (Agentic RAG) — no manual mounting required.

:::info Repository
[https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-rag](https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-rag)
:::

## Getting Started

1. Add the dependency (requires [erupt-ai](/en/modules/erupt-ai)):

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-rag</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. After startup, the **Knowledge Base** menu group is added (the Embedding Model menu is provided by erupt-ai, under the **AI Manager** menu group).

## Embedding Models

Go to **AI → Embedding Model** to configure the embedding model used for vectorization. 12 provider types are built in:

| Provider | Description |
|---|---|
| **OpenAI Compatible** | Any service compatible with the OpenAI Embedding API |
| **Ollama** | Locally deployed open-source embedding models |
| **Gemini** | Google Gemini Embedding |
| **Qwen** | Alibaba Cloud Qwen |
| **GLM** | Zhipu AI |
| **SiliconFlow** | SiliconFlow |
| **Doubao** | ByteDance Doubao (Volcano Engine) |
| **Cohere** | Cohere Embed |
| **Voyage** | Voyage AI |
| **Jina** | Jina Embeddings |
| **Mistral** | Mistral |
| **OpenRouter** | OpenRouter aggregation platform |

> ⚠️ The vector dimension cannot be changed after the first embedding; if a knowledge base's embedding model is changed, all documents must be re-embedded.

## Vector Store

The vector store is deployment infrastructure and is configured via properties (leave blank to auto-select: the single persistent implementation on the classpath, otherwise in-memory storage):

```yaml
erupt:
  ai:
    rag:
      vector-store:
        type: PGVECTOR   # Options: QDRANT / MILVUS / PGVECTOR / REDIS / MEMORY
        uri: postgresql://user:password@host:5432/db
        api-key:         # Optional authentication key
```

| Type | uri format |
|---|---|
| **QDRANT** | `host:6334` (gRPC, `https://` prefix for TLS) |
| **MILVUS** | `http://host:19530` |
| **PGVECTOR** | `postgresql://user:password@host:5432/db` (blank = reuse the application datasource) |
| **REDIS** | `host:6379` (`rediss://` prefix for TLS, blank = localhost) |
| **MEMORY** | No configuration needed; suitable for development |

## Knowledge Bases & Documents

Go to **AI → Knowledge Base** to create a knowledge base, select an embedding model, and configure retrieval parameters:

| Parameter | Default | Description |
|---|---|---|
| Chunk Size | 500 | Max characters per chunk |
| Chunk Overlap | 50 | Characters shared by adjacent chunks |
| Top K | 5 | Number of chunks returned per retrieval |
| Min Score | 0.5 | Similarity threshold (0–1); lower-scored results are dropped |

> 💡 The **Remark** field is read by the AI to decide which knowledge base fits the current question — describe the content scope clearly.

Upload documents under a knowledge base (supports `txt` / `md` / `markdown`, or paste text directly). The system automatically chunks and embeds them, with status flowing: `Pending → Embedding → Ready` (errors are shown on failure and documents can be re-embedded).

The **Retrieval Test** row operation provides a visual interface — enter a question to verify recall results and similarity scores.

## Agentic RAG

Knowledge base retrieval is exposed as AI Tools (`listKnowledgeBases` / `searchKnowledgeBase`). During conversations the AI decides autonomously: first list available knowledge bases, then run semantic retrieval against the appropriate one, preferring retrieved passages when answering.
These tools are also governed by **Role-Level Tool Authorization**, giving fine-grained control over which roles may search which knowledge.
