# Erupt AI RAG 知识库 <Badge type="tip" text="v2.1.0+" />

erupt-ai-rag 是 erupt-ai 的知识库扩展模块，将业务文档转化为 AI 可检索的知识：上传文档 → 自动分块 → 向量嵌入 → 语义检索，全流程可视化管理。
AI 在对话中会**自主决定**何时查询哪个知识库（Agentic RAG），无需手动挂载。

:::info 仓库地址
[https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-rag](https://github.com/erupts/erupt/tree/master/erupt-ai/erupt-ai-rag)
:::

## 使用方法

1. 添加依赖（需配合 [erupt-ai](/zh/modules/erupt-ai) 使用）：

```xml
<dependency>
    <groupId>xyz.erupt</groupId>
    <artifactId>erupt-ai-rag</artifactId>
    <version>${erupt.version}</version>
</dependency>
```

2. 启动后新增 **知识库** 菜单组（嵌入模型菜单由 erupt-ai 提供，位于 **AI Manager** 菜单组下）。

## 嵌入模型

进入 **AI → 嵌入模型**，配置向量化所用的 Embedding 模型，内置 12 种提供商：

| 提供商 | 说明 |
|---|---|
| **OpenAI Compatible** | 兼容 OpenAI Embedding 接口的任意服务 |
| **Ollama** | 本地部署的开源嵌入模型 |
| **Gemini** | Google Gemini Embedding |
| **Qwen** | 阿里云通义千问 |
| **GLM** | 智谱 AI |
| **SiliconFlow** | 硅基流动 |
| **Doubao** | 字节豆包（火山引擎） |
| **Cohere** | Cohere Embed |
| **Voyage** | Voyage AI |
| **Jina** | Jina Embeddings |
| **Mistral** | Mistral |
| **OpenRouter** | OpenRouter 聚合平台 |

> ⚠️ 向量维度（dimension）在首次嵌入后不可修改；更换知识库的嵌入模型后需重新嵌入全部文档。

## 向量存储

向量存储属于部署基础设施，通过配置文件指定（不配置则自动选择：classpath 中唯一可用的持久化实现，否则使用内存存储）：

```yaml
erupt:
  ai:
    rag:
      vector-store:
        type: PGVECTOR   # 可选：QDRANT / MILVUS / PGVECTOR / REDIS / MEMORY
        uri: postgresql://user:password@host:5432/db
        api-key:         # 可选，鉴权密钥
```

| 类型 | uri 格式 |
|---|---|
| **QDRANT** | `host:6334`（gRPC，TLS 用 `https://` 前缀） |
| **MILVUS** | `http://host:19530` |
| **PGVECTOR** | `postgresql://user:password@host:5432/db`（留空则复用应用数据源） |
| **REDIS** | `host:6379`（TLS 用 `rediss://` 前缀，留空为 localhost） |
| **MEMORY** | 无需配置，适合开发调试 |

## 知识库与文档

进入 **AI → 知识库** 创建知识库，选择嵌入模型并配置检索参数：

| 参数 | 默认值 | 说明 |
|---|---|---|
| 分块大小（chunkSize） | 500 | 每个分块的最大字符数 |
| 分块重叠（chunkOverlap） | 50 | 相邻分块共享的字符数 |
| Top K | 5 | 每次检索返回的分块数 |
| 最低分数（minScore） | 0.5 | 相似度阈值（0~1），低于该分数的结果被丢弃 |

> 💡 **备注**字段会被 AI 读取，用于判断哪个知识库适合回答当前问题——请清晰描述知识库的内容范围。

在知识库下上传文档（支持 `txt` / `md` / `markdown`，也可直接粘贴文本内容），系统自动完成分块与向量嵌入，
状态流转：`待嵌入 → 嵌入中 → 就绪`（失败时展示错误信息，可重新嵌入）。

行操作中的 **检索测试** 提供可视化界面，输入问题即可验证召回效果与相似度分数。

## Agentic RAG

知识库检索以 AI Tool 形式暴露（`listKnowledgeBases` / `searchKnowledgeBase`），AI 在对话中自主决定：
先列出可用知识库，再对合适的知识库发起语义检索，并优先采用召回内容作答。
该工具同样受**角色级 Tool 授权**管控，可精细控制哪些角色允许检索哪些知识。
