# Retrieval Strategy

## Preprocessing Phase (Python – offline / batch)

```
Raw docs (JSON / MD)
   ↓
Semantic chunking (Python)
   ↓
Embeddings (OpenAI / etc.)
   ↓
MongoDB (vectors + text + metadata)
```

## Runtime Phase (Node.js – live server)

```
User query
   ↓
Embedding (same model)
   ↓
Vector similarity search
   ↓
Top-k relevant chunks
   ↓
LLM response
```

---

## Example Scenario

You have product documentation written in Markdown and JSON for an API platform.

### SOURCE DOCUMENT (before chunking)

**Markdown file (auth.md)**

- "Authentication in our API is handled using JWT tokens."
- "Tokens must be sent in the Authorization header."
- "Each token expires after 24 hours."
- "Refresh tokens can be used to obtain a new access token."
- "If a token is expired, the API returns a 401 error."

---

## PYTHON SIDE (offline / ingestion phase)

### Step 1: Load raw documents

Python reads:
- `auth.md`
- related JSON config files

The text is still one continuous block

### Step 2: Semantic chunking (meaning-based, not size-based)

The semantic chunker analyzes meaning changes and groups sentences:

**Semantic Chunk A – "How authentication works"**
- "Authentication in our API is handled using JWT tokens."
- "Tokens must be sent in the Authorization header."

**Semantic Chunk B – "Token lifecycle"**
- "Each token expires after 24 hours."
- "Refresh tokens can be used to obtain a new access token."

**Semantic Chunk C – "Error behavior"**
- "If a token is expired, the API returns a 401 error."

### Step 3: Create embeddings (still Python)

Each chunk is converted into a vector:
- Chunk A → Vector A
- Chunk B → Vector B
- Chunk C → Vector C

### Step 4: Store in MongoDB

MongoDB now contains:

**Document 1**
- Text: Chunk A
- Embedding: Vector A
- Metadata: source=auth.md, topic=authentication

**Document 2**
- Text: Chunk B
- Embedding: Vector B
- Metadata: source=auth.md, topic=token_lifecycle

**Document 3**
- Text: Chunk C
- Embedding: Vector C
- Metadata: source=auth.md, topic=errors

➡️ **Python's job is finished.**

---

## NODE.JS SIDE (live / runtime retrieval)

### Step 5: User asks a question

User query:
> "Why am I getting a 401 error when calling the API?"

### Step 6: Query embedding (Node.js)

Node.js converts the query into a vector using the same embedding model

Result: **Query Vector Q**

### Step 7: Vector similarity search (MongoDB)

MongoDB compares **Query Vector Q** with:
- Vector A
- Vector B
- Vector C

Closest match: ➡️ **Vector C** (Error behavior chunk)

### Step 8: Retrieved semantic context

Node.js receives:
> "If a token is expired, the API returns a 401 error."

This was retrieved by meaning, not keywords.

### Step 9: LLM response generation

Node.js sends:
- User question
- Retrieved chunk

The model responds:
> "You are receiving a 401 error because your JWT token has expired. You need to refresh the token or request a new one."

---

## Key Insight from the Flow

- Python never runs in production
- Node.js never chunks documents
- Semantic meaning is preserved because:
  - chunks were semantically created
  - embeddings live in the same vector space
- Retrieval quality depends on embeddings, not the language used

**End of flow.**