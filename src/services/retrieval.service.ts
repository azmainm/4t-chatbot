import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db, Collection } from 'mongodb';
import { EmbeddingsService } from './embeddings.service';
import { DocumentChunk, RetrievalResult } from '../common/interfaces/document.interface';

@Injectable()
export class RetrievalService {
  private readonly logger = new Logger(RetrievalService.name);
  private client: MongoClient;
  private db: Db;

  constructor(
    private configService: ConfigService,
    private embeddingsService: EmbeddingsService,
  ) {
    this.initializeMongoClient();
  }

  private async initializeMongoClient() {
    const uri = this.configService.get<string>('mongodb.uri');
    const database = this.configService.get<string>('mongodb.database');

    if (!uri) {
      throw new Error('MONGODB_URI environment variable is required');
    }

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.db = this.client.db(database);
    
    this.logger.log(`Connected to MongoDB: ${database}`);
  }

  /**
   * Retrieve relevant document chunks using vector similarity search
   */
  async retrieveRelevantChunks(
    query: string,
    businessId: string,
    collectionName: string,
    topK?: number,
  ): Promise<RetrievalResult> {
    const startTime = Date.now();

    try {
      // Generate query embedding
      const queryEmbedding = await this.embeddingsService.generateEmbedding(query);

      const collection: Collection = this.db.collection(collectionName);
      
      const k = topK || this.configService.get<number>('retrieval.topK');
      const numCandidates = this.configService.get<number>('retrieval.numCandidates');

      // Vector search aggregation pipeline
      const pipeline = [
        {
          $vectorSearch: {
            index: 'vector_index',
            path: 'embedding',
            queryVector: queryEmbedding,
            numCandidates: numCandidates,
            limit: k,
            filter: {
              business_id: { $eq: businessId },
            },
          },
        },
        {
          $addFields: {
            score: { $meta: 'vectorSearchScore' },
          },
        },
        {
          $project: {
            embedding: 0, // Exclude embedding from results for performance
          },
        },
      ];

      const chunks = await collection.aggregate(pipeline).toArray();

      const processingTime = Date.now() - startTime;

      this.logger.log(
        `Retrieved ${chunks.length} chunks for business: ${businessId} in ${processingTime}ms`,
      );

      return {
        chunks: chunks as DocumentChunk[],
        query,
        totalRetrieved: chunks.length,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Retrieval failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Get collection statistics
   */
  async getCollectionStats(collectionName: string, businessId: string) {
    const collection = this.db.collection(collectionName);
    const totalDocs = await collection.countDocuments({ business_id: businessId });
    
    return {
      collection: collectionName,
      businessId,
      totalDocuments: totalDocs,
    };
  }

  async onModuleDestroy() {
    await this.client?.close();
    this.logger.log('MongoDB connection closed');
  }
}
