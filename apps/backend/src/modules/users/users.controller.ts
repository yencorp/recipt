import { Controller, Get, Put, Body, Param, UseGuards } from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from "@nestjs/swagger";
import { UsersService } from "./users.service";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { UpdateUserDto } from "./dto/update-user.dto";
import { ChangePasswordDto } from "./dto/change-password.dto";

@ApiTags("Users")
@Controller("users")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth("JWT")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: "사용자 목록 조회" })
  @ApiResponse({ status: 200, description: "사용자 목록 조회 성공" })
  async findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "사용자 상세 조회" })
  @ApiResponse({ status: 200, description: "사용자 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Put(":id")
  @ApiOperation({ summary: "사용자 정보 수정" })
  @ApiResponse({ status: 200, description: "사용자 정보 수정 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async update(@Param("id") id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(id, updateUserDto);
  }

  @Put(":id/password")
  @ApiOperation({ summary: "비밀번호 변경" })
  @ApiResponse({ status: 200, description: "비밀번호 변경 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청 (비밀번호 불일치)" })
  @ApiResponse({ status: 401, description: "현재 비밀번호가 올바르지 않음" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async changePassword(
    @Param("id") id: string,
    @Body() changePasswordDto: ChangePasswordDto
  ) {
    return this.usersService.changePassword(id, changePasswordDto);
  }

  @Get(":id/organizations")
  @ApiOperation({ summary: "사용자 소속 단체 조회" })
  @ApiResponse({ status: 200, description: "소속 단체 조회 성공" })
  @ApiResponse({ status: 404, description: "사용자를 찾을 수 없음" })
  async getUserOrganizations(@Param("id") id: string) {
    return this.usersService.getUserOrganizations(id);
  }
}
