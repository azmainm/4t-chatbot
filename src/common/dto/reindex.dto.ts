import {
  IsString,
  IsNotEmpty,
  IsArray,
  ValidateNested,
  IsOptional,
  IsObject,
} from 'class-validator';
import { Type } from 'class-transformer';

export class ReindexDocumentDto {
  @IsString()
  @IsNotEmpty()
  text: string;

  @IsObject()
  @IsOptional()
  metadata?: Record<string, any>;
}

export class ReindexDto {
  @IsString()
  @IsNotEmpty()
  businessId: string;

  @IsString()
  @IsNotEmpty()
  collectionName: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ReindexDocumentDto)
  documents: ReindexDocumentDto[];

  @IsString()
  @IsOptional()
  apiKey?: string;
}
