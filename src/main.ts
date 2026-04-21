import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Raise body size limit to handle full KB reindex payloads (~300+ chunks)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  // Enable CORS for frontend integration
  app.enableCors({
    origin: [
      'http://localhost:3001', // 4trades website local dev
      'http://localhost:4000', // CRM backend local dev
      'https://www.4trades.ai', // Production website
      'https://4trades.ai', // Production website (without www)
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });
  
  const port = process.env.PORT || 3000;
  await app.listen(port);
  
  console.log(`🚀 4T Chatbot RAG System running on http://localhost:${port}`);
  console.log(`📡 API Health: http://localhost:${port}/api/health`);
}
bootstrap();
