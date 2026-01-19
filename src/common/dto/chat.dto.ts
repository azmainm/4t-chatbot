import { IsString, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';

export class ChatQueryDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(10)
  topK?: number;

  @IsOptional()
  @IsString()
  collectionName?: string;
}

export class RetrieveDto {
  @IsString()
  @IsNotEmpty()
  query: string;

  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(20)
  topK?: number;

  @IsOptional()
  @IsString()
  collectionName?: string;
}
