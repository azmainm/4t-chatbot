import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OpenAI } from 'openai';
import { encoding_for_model } from 'tiktoken';
import { RetrievalService } from './retrieval.service';
import { ChatResponse } from '../common/interfaces/document.interface';

@Injectable()
export class ChatbotService {
  private readonly logger = new Logger(ChatbotService.name);
  private openai: OpenAI;
  private chatModel: string;

  constructor(
    private configService: ConfigService,
    private retrievalService: RetrievalService,
  ) {
    const apiKey = this.configService.get<string>('openai.apiKey');
    this.openai = new OpenAI({ apiKey });
    this.chatModel = this.configService.get<string>('openai.chatModel') || 'gpt-4o-mini';
    
    this.logger.log(`Initialized with chat model: ${this.chatModel}`);
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
      // Step 1: Retrieve relevant chunks
      const retrievalResult = await this.retrievalService.retrieveRelevantChunks(
        query,
        businessId,
        collectionName,
        topK,
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

      // Step 2: Build context for GPT-5-nano (Responses API can handle more)
      const context = retrievalResult.chunks
        .slice(0, 3)
        .map((chunk, idx) => `[${idx + 1}] ${chunk.text.substring(0, 200)}`)
        .join('\n\n');

      // Step 3: Build proper prompt for Responses API
      const userPrompt = `You are Doug's assistant for 4Trades.ai. Answer the question using ONLY the information provided below. If the information doesn't contain the answer, say "I don't have that information in my knowledge base."

Information:
${context}

Question: ${query}

Answer:`;

      // Count tokens for debugging
      try {
        const enc = encoding_for_model('gpt-4'); // Use gpt-4 encoding as proxy
        const tokens = enc.encode(userPrompt);
        this.logger.log(`Prompt tokens: ${tokens.length}`);
        enc.free();
      } catch (e) {
        this.logger.warn(`Token counting failed: ${e.message}`);
      }

      // Step 4: Try OpenAI Responses API (new GPT-5 format)
      let completion;
      try {
        // Try new Responses API format
        completion = await (this.openai as any).responses.create({
          model: this.chatModel,
          input: [
            { role: 'user', content: userPrompt },
          ],
        });
        this.logger.log(`Used Responses API`);
      } catch (e) {
        this.logger.warn(`Responses API failed: ${e.message}, falling back to Chat Completions`);
        // Fallback to chat completions
        completion = await this.openai.chat.completions.create({
          model: this.chatModel,
          messages: [
            { role: 'user', content: userPrompt },
          ],
          max_completion_tokens: 30,
        });
      }

      // Extract answer from Responses API format
      let answer = 'Unable to generate response';
      
      if (completion.output) {
        // Find the message output (not reasoning)
        const messageOutput = completion.output.find(o => o.type === 'message');
        if (messageOutput && messageOutput.content) {
          const textContent = messageOutput.content.find(c => c.type === 'output_text');
          answer = textContent?.text || 'Unable to generate response';
          this.logger.log(`Generated answer (${answer.length} chars, ${completion.usage?.output_tokens || 0} tokens)`);
        }
      } else if (completion.choices) {
        // Fallback to Chat Completions format
        this.logger.log(`Using Chat Completions API (finish_reason: ${completion.choices[0].finish_reason})`);
        answer = completion.choices[0].message.content || 'Unable to generate response';
      }

      // Step 5: Prepare response with sources
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
