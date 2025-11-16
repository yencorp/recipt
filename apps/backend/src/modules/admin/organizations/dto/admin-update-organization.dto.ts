import { PartialType } from "@nestjs/swagger";
import { AdminCreateOrganizationDto } from "./admin-create-organization.dto";

export class AdminUpdateOrganizationDto extends PartialType(
  AdminCreateOrganizationDto
) {}
