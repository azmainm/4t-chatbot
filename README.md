# 4T Chatbot - RAG-Powered Multi-Business Chatbot System

A production-ready NestJS backend for building AI-powered chatbots with Retrieval-Augmented Generation (RAG) using MongoDB Atlas Vector Search and OpenAI.

## Features

- **Semantic Search**: Vector-based retrieval using MongoDB Atlas Vector Search
- **Multi-Business Support**: Configurable collections and business-specific filtering
- **RAG Pipeline**: Retrieval-Augmented Generation for accurate, context-aware responses
- **Modern Stack**: NestJS + TypeScript + LangChain + OpenAI + MongoDB
- **Production Ready**: Validation, error handling, logging, and health checks

## Architecture

The system consists of two main parts:

1. **Python Preprocessing** (`../chatbot_py_preprocessing/`): Semantic chunking, embedding generation, MongoDB storage
2. **NestJS API** (this project): Real-time retrieval and chat endpoints

### Tech Stack

- **NestJS**: Backend framework
- **MongoDB Atlas**: Document + vector storage with vector search index
- **OpenAI**: Embeddings (`text-embedding-3-small`) and chat (`gpt-4o-mini`)
- **LangChain**: RAG orchestration utilities
- **TypeScript**: Type-safe development

## Description

This chatbot system uses a RAG (Retrieval-Augmented Generation) approach:

1. User sends a question
2. System generates query embedding using OpenAI
3. MongoDB Vector Search finds semantically similar document chunks
4. System filters results by business ID
5. Retrieved context + query sent to OpenAI for generation
6. System returns answer with source citations

## Setup

### Prerequisites

- Node.js 18+
- MongoDB Atlas cluster with Vector Search enabled
- OpenAI API key
- Knowledge base ingested via Python preprocessing pipeline

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the root directory:

```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatbot
FOURT_OPENAI_API_KEY=sk-your-openai-api-key
# Note: Can also use 4T_OPENAI_API_KEY locally, but Render requires FOURT_OPENAI_API_KEY
PORT=3000
```

**Important:**
- MongoDB URI must include `/chatbot` database suffix
- Use `FOURT_OPENAI_API_KEY` (or `4T_OPENAI_API_KEY` locally) for 4Trades businesses

### Vector Search Index

Ensure your MongoDB collection has a vector search index named `vector_index`:

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

## Running the Application

```bash
# Development mode with hot reload
npm run start:dev

# Production mode
npm run build
npm run start:prod
```

Server will start on `http://localhost:3000`

## API Endpoints

### POST `/api/chat`
RAG-powered chatbot endpoint

**Request:**
```json
{
  "query": "How much does the AI calling agent cost?",
  "businessId": "4trades",
  "topK": 5,
  "collectionName": "4trades"
}
```

**Response:**
```json
{
  "answer": "The AI Calling Agent has two pricing plans...",
  "sources": [
    {
      "text": "Base Plan: $100 per month...",
      "source": "4Trades_Knowledge_Clean.md",
      "score": 0.89
    }
  ],
  "query": "How much does the AI calling agent cost?",
  "processingTime": 1234
}
```

### POST `/api/retrieve`
Direct retrieval endpoint (no generation)

**Request:**
```json
{
  "query": "payment methods",
  "businessId": "4trades",
  "topK": 3,
  "collectionName": "4trades"
}
```

**Response:**
```json
{
  "chunks": [
    {
      "_id": "...",
      "business_id": "4trades",
      "text": "Payment gateway supports...",
      "metadata": {...},
      "score": 0.92
    }
  ],
  "query": "payment methods",
  "totalRetrieved": 3,
  "processingTime": 456
}
```

### GET `/api/stats/:businessId/:collectionName`
Get collection statistics

**Response:**
```json
{
  "collection": "4trades",
  "businessId": "4trades",
  "totalDocuments": 31
}
```

### GET `/api/health`
Health check endpoint

**Response:**
```json
{
  "status": "ok",
  "service": "4T Chatbot RAG System",
  "timestamp": "2026-01-19T15:30:00.000Z"
}
```

## Configuration

Edit `src/config/configuration.ts` to adjust:

- `topK`: Number of chunks to retrieve (default: 5)
- `numCandidates`: MongoDB vector search candidates (default: 20)
- `similarityThreshold`: Minimum similarity score (default: 0.7)
- `embeddingModel`: OpenAI embedding model
- `chatModel`: OpenAI chat model

## Multi-Business Support

Each business should have:
- A MongoDB collection (e.g., `4trades`, `business2`)
- Documents with `business_id` field for filtering
- Knowledge base preprocessed via Python pipeline

To add a new business:
1. Preprocess their docs with Python pipeline
2. Store in collection with their `business_id`
3. Create vector search index on that collection
4. Call API with their `businessId` and `collectionName`

## Project Structure

```
src/
├── config/
│   └── configuration.ts       # Environment config
├── common/
│   ├── dto/                   # Data transfer objects
│   └── interfaces/            # TypeScript interfaces
├── services/
│   ├── embeddings.service.ts  # OpenAI embeddings
│   ├── retrieval.service.ts   # Vector search
│   └── chatbot.service.ts     # RAG orchestration
├── controllers/
│   └── chatbot.controller.ts  # API endpoints
├── app.module.ts              # Main module
└── main.ts                    # Bootstrap
```

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Documentation

- **Preprocessing Setup**: See `../chatbot_py_preprocessing/README.md`
- **Architecture**: See `docs/SEMANTIC_SEARCH_ARCHITECTURE.md`
- **Retrieval Strategy**: See `docs/RETRIEVAL_STRATEGY.md`

## Troubleshooting

**"Vector search index not found"**
- Create the index in MongoDB Atlas UI
- Ensure index name is `vector_index`
- Check dimensions match (1536)

**"No relevant chunks found"**
- Check `business_id` matches
- Verify collection has data
- Try broader queries

**"Failed to generate embedding"**
- Verify `FOURT_OPENAI_API_KEY` is set
- Check OpenAI API quota/limits
- Ensure API key is valid

## License

UNLICENSED - Private project
