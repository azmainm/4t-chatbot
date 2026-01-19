import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';

@Injectable()
export class EmbeddingsService {
  private readonly logger = new Logger(EmbeddingsService.name);
  private openai: OpenAI;
  private embeddingModel: string;

  constructor(private configService: ConfigService) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    
    if (!apiKey) {
      throw new Error('4T_OPENAI_API_KEY environment variable is required');
    }

    this.openai = new OpenAI({ apiKey });
    this.embeddingModel = this.configService.get<string>('openai.embeddingModel') || 'text-embedding-3-small';
    
    this.logger.log(`Initialized with model: ${this.embeddingModel}`);
  }

  /**
   * Generate embedding for a single text query
   */
  async generateEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: text,
        encoding_format: 'float',
      });

      return response.data[0].embedding;
    } catch (error) {
      this.logger.error(`Failed to generate embedding: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate embeddings for multiple texts (batch)
   */
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.openai.embeddings.create({
        model: this.embeddingModel,
        input: texts,
        encoding_format: 'float',
      });

      return response.data.map((item) => item.embedding);
    } catch (error) {
      this.logger.error(`Failed to generate embeddings: ${error.message}`);
      throw error;
    }
  }
}
