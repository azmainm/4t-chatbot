import { Controller, Post, Body, Get, Param, Query, ValidationPipe } from '@nestjs/common';
import { ChatbotService } from '../services/chatbot.service';
import { RetrievalService } from '../services/retrieval.service';
import { ChatQueryDto, RetrieveDto } from '../common/dto/chat.dto';

@Controller('api')
export class ChatbotController {
  constructor(
    private readonly chatbotService: ChatbotService,
    private readonly retrievalService: RetrievalService,
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
