# Python Preprocessing Setup Plan

## Overview
Create a Python codebase for semantic chunking, embedding generation, and MongoDB storage that will seamlessly integrate with the NestJS retrieval system.

## Folder Structure
```
chatbot_py_preprocessing/
├── .env.example
├── requirements.txt
├── config.py
├── semantic_chunker.py
├── embedding_generator.py
├── mongo_storage.py
├── ingest_documents.py (main script)
└── sample_data/
    └── sample_doc.md
```

## Python Dependencies (requirements.txt)
- `langchain==0.1.0` - Core LangChain
- `langchain-openai==0.0.5` - OpenAI integration
- `langchain-mongodb==0.1.0` - MongoDB vector store
- `pymongo==4.6.1` - MongoDB driver
- `python-dotenv==1.0.0` - Environment variables
- `tiktoken==0.5.2` - Token counting for OpenAI

## MongoDB Schema (Guaranteed Compatibility)
```json
{
  "_id": "ObjectId",
  "business_id": "string",
  "text": "string",
  "embedding": [float array],
  "metadata": {
    "source": "string",
    "document_type": "string",
    "timestamp": "ISODate",
    "chunk_index": "number"
  }
}
```

## Configuration
- Database: `4t-chatbot-test`
- Collection: `knowledge_base`
- Embedding Model: `text-embedding-3-small` (1536 dimensions)
- Similarity Metric: `cosine`

## Workflow Steps

### 1. Semantic Chunking (`semantic_chunker.py`)
- Use LangChain's `SemanticChunker` with embedding-based breakpoint detection
- Analyzes semantic similarity between sentences
- Creates chunks based on meaning shifts (not fixed size)
- Configurable similarity threshold

### 2. Embedding Generation (`embedding_generator.py`)
- Use OpenAI `text-embedding-3-small` model
- Batch processing for efficiency
- Generate 1536-dimensional vectors
- Same model Node.js will use for queries

### 3. MongoDB Storage (`mongo_storage.py`)
- Connect to MongoDB Atlas
- Store chunks with embeddings
- Add business_id and metadata
- Create vector search index automatically (or provide instructions)

### 4. Main Ingestion Script (`ingest_documents.py`)
- Load documents from source (MD/JSON/TXT)
- Apply semantic chunking
- Generate embeddings
- Store in MongoDB with proper schema
- Support batch processing multiple documents

## Vector Search Index Setup (MongoDB Atlas)
You will need to create this index manually in Atlas UI or via mongosh:

```json
{
  "fields": [
    {
      "type": "vector",
      "path": "embedding",
      "numDimensions": 1536,
      "similarity": "cosine"
    },
    {
      "type": "filter",
      "path": "business_id"
    }
  ]
}
```

## NestJS Compatibility Guarantee

✅ **Schema Compatibility**: Exact same schema Python writes and Node.js reads
✅ **Embedding Model**: Same model (`text-embedding-3-small`) used in both
✅ **Vector Dimensions**: 1536 dimensions consistent across stack
✅ **MongoDB Collection**: Shared collection name and database
✅ **Metadata Structure**: Node.js can filter by `business_id` and other metadata
✅ **No Runtime Dependency**: Python runs offline, Node.js only does retrieval

## Environment Variables Needed
- `MONGODB_URI` (you provide)
- `OPENAI_API_KEY` (you provide)

## Testing
Include a sample document to verify the entire pipeline works end-to-end before production use.