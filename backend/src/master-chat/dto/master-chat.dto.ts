import { IsString, MinLength } from 'class-validator';

export class SendMasterChatDto {
  @IsString()
  @MinLength(1)
  content!: string;
}
