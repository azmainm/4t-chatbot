# Semantic Search RAG Chatbot Architecture

## Core RAG Pipeline

1. **Ingestion**: Document → Chunk → Embed (OpenAI) → Store in MongoDB Atlas
2. **Retrieval**: User query → Embed → Vector similarity search → Top-K relevant chunks
3. **Generation**: Retrieved chunks + query → OpenAI chat → Response

## Embedding Model Choice

- `text-embedding-3-small` (cheaper, 1536 dimensions, fast)
- `text-embedding-3-large` (better quality, 3072 dimensions, more expensive)
- Configurable per business if needed

## MongoDB Atlas Vector Search Setup

Create vector index with:
- `numDimensions`: Match your embedding model (1536 or 3072)
- `similarity`: `cosine` (most common) or `dotProduct` or `euclidean`
- `path`: Field name for embeddings (e.g., `"embedding"`)
- Include filter fields: `business_id`, `metadata.*`

## Document Schema in MongoDB

```typescript
{
  _id: ObjectId,
  business_id: string,        // For multi-tenant filtering
  text: string,               // Original chunk text
  embedding: number[],        // Vector embedding
  metadata: {
    source: string,
    timestamp: Date,
    document_type: string,
    // business-specific metadata
  }
}
```

## Chunking Strategy

- Use `RecursiveCharacterTextSplitter` from LangChain
- Chunk size: 500-1000 characters (balance context vs precision)
- Overlap: 100-200 characters to preserve context

## Retrieval Configuration

- Top-K results: 3-5 chunks typically
- Always filter by `business_id` for multi-tenant isolation
- Use metadata filters if needed (date ranges, doc types)

## Multi-Business Configuration

Separate collections per business OR single collection with `business_id` filtering (recommended for easier management)

Per-business settings:
- Embedding model choice
- Chunk size/overlap
- Top-K retrieval count
- System prompts
- API exposure method (REST/WebSocket/etc)

## MongoDB Atlas Requirements

- Version 6.0.11+ or 7.0.2+
- Vector search enabled on cluster
- Vector index created on your collection's embedding field
