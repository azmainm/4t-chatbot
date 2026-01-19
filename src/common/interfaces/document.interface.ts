export interface DocumentChunk {
  _id: string;
  business_id: string;
  text: string;
  embedding: number[];
  metadata: {
    source: string;
    document_type: string;
    timestamp: Date;
    chunk_index: number;
    chunk_length: number;
    [key: string]: any;
  };
  score?: number; // Similarity score from vector search
}

export interface RetrievalResult {
  chunks: DocumentChunk[];
  query: string;
  totalRetrieved: number;
  processingTime: number;
}

export interface ChatResponse {
  answer: string;
  sources: Array<{
    text: string;
    source: string;
    score: number;
  }>;
  query: string;
  processingTime: number;
}
