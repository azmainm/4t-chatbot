import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatbotController } from './controllers/chatbot.controller';
import { EmbeddingsService } from './services/embeddings.service';
import { RetrievalService } from './services/retrieval.service';
import { ChatbotService } from './services/chatbot.service';
import { PrimeIVGuardrailsService } from './services/primeiv-guardrails.service';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
  ],
  controllers: [AppController, ChatbotController],
  providers: [
    AppService,
    EmbeddingsService,
    RetrievalService,
    ChatbotService,
    PrimeIVGuardrailsService,
  ],
})
export class AppModule {}
