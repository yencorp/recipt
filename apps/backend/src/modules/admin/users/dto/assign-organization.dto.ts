import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsUUID } from "class-validator";
import { OrganizationRole } from "../../../../entities/user-organization.entity";

export class AssignOrganizationDto {
  @ApiProperty({
    description: "단체 ID",
    example: "org-uuid",
  })
  @IsUUID()
  @IsNotEmpty()
  organizationId: string;

  @ApiProperty({
    description: "단체 내 역할",
    enum: OrganizationRole,
    example: OrganizationRole.MEMBER,
  })
  @IsEnum(OrganizationRole)
  @IsNotEmpty()
  role: OrganizationRole;
}
