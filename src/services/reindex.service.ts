import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MongoClient, Db } from 'mongodb';
import { EmbeddingsService } from './embeddings.service';

interface ReindexDocument {
  text: string;
  metadata?: Record<string, any>;
}

@Injectable()
export class ReindexService {
  private readonly logger = new Logger(ReindexService.name);
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

    this.logger.log(`ReindexService connected to MongoDB: ${database}`);
  }

  async reindex(
    businessId: string,
    collectionName: string,
    documents: ReindexDocument[],
  ): Promise<{ success: boolean; documentsProcessed: number }> {
    const startTime = Date.now();
    const collection = this.db.collection(collectionName);

    this.logger.log(
      `Starting reindex: ${documents.length} docs for business=${businessId} collection=${collectionName}`,
    );

    // Delete existing documents for this businessId
    const deleteResult = await collection.deleteMany({
      business_id: businessId,
    });
    this.logger.log(`Deleted ${deleteResult.deletedCount} existing documents`);

    if (documents.length === 0) {
      return { success: true, documentsProcessed: 0 };
    }

    // Generate embeddings in batches of 20
    const BATCH_SIZE = 20;
    const allRecords: any[] = [];

    for (let i = 0; i < documents.length; i += BATCH_SIZE) {
      const batch = documents.slice(i, i + BATCH_SIZE);
      const texts = batch.map((doc) => doc.text);
      const embeddings = await this.embeddingsService.generateEmbeddings(texts);

      for (let j = 0; j < batch.length; j++) {
        allRecords.push({
          business_id: businessId,
          text: batch[j].text,
          embedding: embeddings[j],
          metadata: {
            ...batch[j].metadata,
            timestamp: new Date(),
            chunk_index: i + j,
            chunk_length: batch[j].text.length,
          },
        });
      }

      this.logger.log(
        `Embedded batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(documents.length / BATCH_SIZE)}`,
      );
    }

    // Insert all records
    await collection.insertMany(allRecords);

    const elapsed = Date.now() - startTime;
    this.logger.log(
      `Reindex complete: ${allRecords.length} documents in ${elapsed}ms`,
    );

    return { success: true, documentsProcessed: allRecords.length };
  }

  async onModuleDestroy() {
    await this.client?.close();
  }
}
