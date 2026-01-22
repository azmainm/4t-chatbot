export default () => ({
  port: parseInt(process.env.PORT || '3000', 10),
  mongodb: {
    uri: process.env.MONGODB_URI,
    database: 'chatbot',
  },
  openai: {
    apiKey: process.env['FOURT_OPENAI_API_KEY'] || process.env['4T_OPENAI_API_KEY'], // Render doesn't allow vars starting with numbers
    embeddingModel: 'text-embedding-3-small',
    chatModel: 'gpt-5-nano', // Optimized for simple FAQ-style responses
    embeddingDimensions: 1536,
  },
  retrieval: {
    topK: 5, // Number of chunks to retrieve
    numCandidates: 20, // MongoDB vector search candidates
    similarityThreshold: 0.7, // Minimum similarity score
  },
});
