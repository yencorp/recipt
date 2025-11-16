import { IsOptional, IsEnum, IsDate, IsString } from "class-validator";
import { Type } from "class-transformer";
import {
  EventType,
  EventStatus,
  EventVisibility,
} from "../../../entities/event.entity";

export class EventFilterDto {
  @IsOptional()
  @IsString()
  organizationId?: string;

  @IsOptional()
  @IsEnum(EventType)
  type?: EventType;

  @IsOptional()
  @IsEnum(EventStatus)
  status?: EventStatus;

  @IsOptional()
  @IsEnum(EventVisibility)
  visibility?: EventVisibility;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateFrom?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDateTo?: Date;

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  page?: number = 1;

  @IsOptional()
  @Type(() => Number)
  limit?: number = 20;
}
