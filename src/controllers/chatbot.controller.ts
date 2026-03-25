import { Controller, Post, Body, Get, Param, Query, ValidationPipe, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChatbotService } from '../services/chatbot.service';
import { RetrievalService } from '../services/retrieval.service';
import { ReindexService } from '../services/reindex.service';
import { ChatQueryDto, RetrieveDto } from '../common/dto/chat.dto';
import { ReindexDto } from '../common/dto/reindex.dto';

@Controller('api')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly retrievalService: RetrievalService,
    private readonly reindexService: ReindexService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * POST /api/chat
   * Main chatbot endpoint - RAG-powered Q&A
   */
  @Post('chat')
  async chat(@Body(ValidationPipe) dto: ChatQueryDto) {
    const collectionName = dto.collectionName || dto.businessId;
    
    return await this.chatbotService.chat(
      dto.query,
      dto.businessId,
      collectionName,
      dto.topK,
    );
  }

  /**
   * POST /api/retrieve
   * Direct retrieval endpoint - returns relevant chunks without generation
   */
  @Post('retrieve')
  async retrieve(@Body(ValidationPipe) dto: RetrieveDto) {
    const collectionName = dto.collectionName || dto.businessId;
    
    return await this.retrievalService.retrieveRelevantChunks(
      dto.query,
      dto.businessId,
      collectionName,
      dto.topK,
    );
  }

  /**
   * GET /api/stats/:businessId/:collectionName
   * Get collection statistics
   */
  @Get('stats/:businessId/:collectionName')
  async getStats(
    @Param('businessId') businessId: string,
    @Param('collectionName') collectionName: string,
  ) {
    return await this.retrievalService.getCollectionStats(collectionName, businessId);
  }

  /**
   * POST /api/reindex
   * Re-embed and upsert document chunks for a business/collection.
   * Protected by CHATBOT_REINDEX_KEY.
   */
  @Post('reindex')
  async reindex(@Body(ValidationPipe) dto: ReindexDto) {
    const expectedKey = this.configService.get<string>('CHATBOT_REINDEX_KEY');
    if (expectedKey && dto.apiKey !== expectedKey) {
      throw new UnauthorizedException('Invalid reindex API key');
    }

    return await this.reindexService.reindex(
      dto.businessId,
      dto.collectionName,
      dto.documents,
    );
  }

  /**
   * GET /api/health
   * Health check endpoint
   */
  @Get('health')
  health() {
    return {
      status: 'ok',
      service: '4T Chatbot RAG System',
      timestamp: new Date().toISOString(),
    };
  }
}
