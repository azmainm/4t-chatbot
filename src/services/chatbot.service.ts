import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { encoding_for_model } from 'tiktoken';
import { RetrievalService } from './retrieval.service';
import { ChatResponse } from '../common/interfaces/document.interface';
import { PRIMEIV_SYSTEM_PROMPT } from '../prompts/primeiv.system';
import { FOURTRADES_SYSTEM_PROMPT } from '../prompts/fourtrades.system';
import { CRM_SYSTEM_PROMPT } from '../prompts/crm.system';
import { PrimeIVGuardrailsService } from './primeiv-guardrails.service';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private openai: OpenAI;
  private chatModel: string;

  constructor(
    private configService: ConfigService,
    private retrievalService: RetrievalService,
    private guardrailsService: PrimeIVGuardrailsService,
  ) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    this.openai = new OpenAI({ apiKey });
    this.chatModel = this.configService.get<string>('openai.chatModel') || 'gpt-4o-mini';
    
    this.logger.log(`Initialized with chat model: ${this.chatModel}`);
  }

  /**
   * Get system prompt based on business ID
   */
  private getSystemPrompt(businessId: string): string {
    switch (businessId.toLowerCase()) {
      case 'primeiv':
        return PRIMEIV_SYSTEM_PROMPT;
      case '4trades':
      case 'fourtrades':
        return FOURTRADES_SYSTEM_PROMPT;
      case 'crm':
        return CRM_SYSTEM_PROMPT;
      default:
        this.logger.warn(`Unknown businessId: ${businessId}, using default prompt`);
        return FOURTRADES_SYSTEM_PROMPT; // Default fallback
    }
  }

  /**
   * RAG: Retrieve relevant context and generate answer
   */
  async chat(
    query: string,
    businessId: string,
    collectionName: string,
    topK?: number,
  ): Promise<ChatResponse> {
    const startTime = Date.now();

    try {
      // Step 0: Apply pre-query guardrails for Prime IV
      if (businessId.toLowerCase() === 'primeiv') {
        const preGuardrails = this.guardrailsService.applyGuardrails(query, '');
        if (preGuardrails.shouldBlock && preGuardrails.modifiedResponse) {
          this.logger.log(`Pre-query guardrail triggered: ${preGuardrails.reason}`);
          return {
            answer: preGuardrails.modifiedResponse,
            sources: [],
            query,
            processingTime: Date.now() - startTime,
          };
        }
      }

      // Step 1: Retrieve relevant chunks
      const retrievalResult = await this.retrievalService.retrieveRelevantChunks(
        query,
        businessId,
        collectionName,
        topK,
      );

      this.logger.log(
        `Top chunks: ${retrievalResult.chunks.map((c) => `${c.metadata?.source || 'unknown'}(${c.score?.toFixed(3)})`).join(', ')}`,
      );

      if (retrievalResult.chunks.length === 0) {
        this.logger.warn(`No relevant chunks found for query: ${query}`);
        return {
          answer: "I couldn't find relevant information to answer your question. Please try rephrasing or ask something else about our services.",
          sources: [],
          query,
          processingTime: Date.now() - startTime,
        };
      }

      // Step 2: Build context from retrieved chunks
      const context = retrievalResult.chunks
        .slice(0, 5)
        .map((chunk, idx) => `[${idx + 1}] ${chunk.text}`)
        .join('\n\n');

      // Step 3: Get business-specific system prompt
      const systemPrompt = this.getSystemPrompt(businessId);

      // Step 4: Build user message (context + question only; system rules go in system role)
      const userMessage = `# RETRIEVED KNOWLEDGE BASE CONTEXT

${context}

# USER QUESTION

${query}`;

      // Count tokens for debugging
      try {
        const enc = encoding_for_model('gpt-4');
        const tokens = enc.encode(systemPrompt + userMessage);
        this.logger.log(`Prompt tokens: ${tokens.length}`);
        enc.free();
      } catch (e) {
        this.logger.warn(`Token counting failed: ${e.message}`);
      }

      // Step 5: Generate answer via Chat Completions
      const completion = await this.openai.chat.completions.create({
        model: this.chatModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        max_completion_tokens: 4096,
      });

      this.logger.log(`Chat Completions finish_reason: ${completion.choices[0].finish_reason}`);
      let answer = completion.choices[0].message.content || 'Unable to generate response';
      this.logger.log(`Generated answer (${answer.length} chars, ${completion.usage?.completion_tokens || 0} tokens)`);

      // Step 6: Apply post-response guardrails for Prime IV
      if (businessId.toLowerCase() === 'primeiv') {
        const postGuardrails = this.guardrailsService.applyGuardrails(query, answer);
        if (postGuardrails.shouldBlock && postGuardrails.modifiedResponse) {
          this.logger.log(`Post-response guardrail triggered: ${postGuardrails.reason}`);
          answer = postGuardrails.modifiedResponse;
        }
      }

      // Step 7: Prepare response with sources
      const sources = retrievalResult.chunks.map((chunk) => ({
        text: chunk.text.substring(0, 200) + (chunk.text.length > 200 ? '...' : ''),
        source: chunk.metadata.source || 'Unknown',
        score: chunk.score || 0,
      }));

      const processingTime = Date.now() - startTime;

      this.logger.log(`Generated response in ${processingTime}ms`);

      return {
        answer,
        sources,
        query,
        processingTime,
      };
    } catch (error) {
      this.logger.error(`Chat failed: ${error.message}`);
      throw error;
    }
  }
}
