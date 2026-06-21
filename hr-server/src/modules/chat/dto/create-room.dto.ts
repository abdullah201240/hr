import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUUID, MaxLength } from 'class-validator';

// ─── REST DTOs ──────────────────────────────────────────────────────────────

export class CreateChannelDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name!: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsBoolean()
  isPrivate!: boolean;
}

export class CreateDirectRoomDto {
  @IsUUID()
  @IsNotEmpty()
  recipientId!: string;
}

export class AddMemberDto {
  @IsUUID()
  @IsNotEmpty()
  employeeId!: string;
}

// ─── WebSocket Event DTOs ───────────────────────────────────────────────────

export class WSMessageDto {
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;

  @IsString()
  @IsOptional()
  clientMessageId?: string;
}

export class WSTypingDto {
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;

  @IsBoolean()
  isTyping!: boolean;
}

export class WSReadReceiptDto {
  @IsUUID()
  @IsNotEmpty()
  roomId!: string;
}

export class WSEditMessageDto {
  @IsUUID()
  @IsNotEmpty()
  messageId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  content!: string;
}

export class WSDeleteMessageDto {
  @IsUUID()
  @IsNotEmpty()
  messageId!: string;
}
