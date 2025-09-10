import { Controller, Get, Put, Body, Param } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { UsersService } from "./users.service";

@ApiTags("Users")
@Controller("users")
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
  async update(@Param("id") id: string, @Body() updateUserDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.usersService.update(id, updateUserDto);
  }
}
