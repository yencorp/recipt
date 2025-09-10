import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
} from "@nestjs/common";
import { ApiTags, ApiOperation, ApiResponse } from "@nestjs/swagger";
import { EventsService } from "./events.service";

@ApiTags("Events")
@Controller("events")
export class EventsController {
  constructor(private readonly eventsService: EventsService) {}

  @Get()
  @ApiOperation({ summary: "행사 목록 조회" })
  @ApiResponse({ status: 200, description: "행사 목록 조회 성공" })
  async findAll() {
    return this.eventsService.findAll();
  }

  @Get(":id")
  @ApiOperation({ summary: "행사 상세 조회" })
  @ApiResponse({ status: 200, description: "행사 상세 조회 성공" })
  @ApiResponse({ status: 404, description: "행사를 찾을 수 없음" })
  async findOne(@Param("id") id: string) {
    return this.eventsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: "행사 생성" })
  @ApiResponse({ status: 201, description: "행사 생성 성공" })
  @ApiResponse({ status: 400, description: "잘못된 요청" })
  async create(@Body() createEventDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.eventsService.create(createEventDto);
  }

  @Put(":id")
  @ApiOperation({ summary: "행사 정보 수정" })
  @ApiResponse({ status: 200, description: "행사 정보 수정 성공" })
  @ApiResponse({ status: 404, description: "행사를 찾을 수 없음" })
  async update(@Param("id") id: string, @Body() updateEventDto: any) {
    // TODO: DTO 클래스 구현 필요
    return this.eventsService.update(id, updateEventDto);
  }

  @Delete(":id")
  @ApiOperation({ summary: "행사 삭제" })
  @ApiResponse({ status: 200, description: "행사 삭제 성공" })
  @ApiResponse({ status: 404, description: "행사를 찾을 수 없음" })
  async remove(@Param("id") id: string) {
    return this.eventsService.remove(id);
  }
}
