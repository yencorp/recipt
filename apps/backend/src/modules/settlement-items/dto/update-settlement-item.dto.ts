import { PartialType } from "@nestjs/mapped-types";
import { CreateSettlementItemDto } from "./create-settlement-item.dto";

export class UpdateSettlementItemDto extends PartialType(
  CreateSettlementItemDto
) {}
