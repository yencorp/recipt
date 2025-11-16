import { PartialType } from "@nestjs/mapped-types";
import { CreateEventDto } from "./create-event.dto";
import { IsOptional, IsBoolean, IsString } from "class-validator";

export class UpdateEventDto extends PartialType(CreateEventDto) {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsBoolean()
  isCancelled?: boolean;

  @IsOptional()
  @IsString()
  cancellationReason?: string;
}
