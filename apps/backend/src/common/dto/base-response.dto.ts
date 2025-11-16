import { ApiProperty } from "@nestjs/swagger";

/**
 * API 성공 응답 기본 형식
 */
export class BaseResponseDto<T> {
  @ApiProperty({ example: true, description: "요청 성공 여부" })
  success: boolean;

  @ApiProperty({ description: "응답 데이터" })
  data: T;

  @ApiProperty({ example: "2025-11-17T12:00:00.000Z", description: "응답 시각" })
  timestamp: string;

  @ApiProperty({ example: "/api/events", description: "요청 경로" })
  path: string;

  constructor(data: T, path: string) {
    this.success = true;
    this.data = data;
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}

/**
 * API 에러 응답 형식
 */
export class ErrorResponseDto {
  @ApiProperty({ example: false, description: "요청 실패" })
  success: boolean;

  @ApiProperty({ example: 400, description: "HTTP 상태 코드" })
  statusCode: number;

  @ApiProperty({
    example: ["이메일 형식이 올바르지 않습니다."],
    description: "에러 메시지 배열",
  })
  message: string[];

  @ApiProperty({ example: "Bad Request", description: "에러 타입" })
  error: string;

  @ApiProperty({ example: "2025-11-17T12:00:00.000Z", description: "에러 발생 시각" })
  timestamp: string;

  @ApiProperty({ example: "/api/events", description: "요청 경로" })
  path: string;

  @ApiProperty({ example: "POST", description: "HTTP 메서드" })
  method: string;
}

/**
 * 페이지네이션 응답 형식
 */
export class PaginatedResponseDto<T> {
  @ApiProperty({ example: true, description: "요청 성공 여부" })
  success: boolean;

  @ApiProperty({ isArray: true, description: "데이터 배열" })
  items: T[];

  @ApiProperty({ example: 100, description: "전체 항목 수" })
  total: number;

  @ApiProperty({ example: 1, description: "현재 페이지 번호" })
  page: number;

  @ApiProperty({ example: 20, description: "페이지당 항목 수" })
  limit: number;

  @ApiProperty({ example: 5, description: "전체 페이지 수" })
  totalPages: number;

  @ApiProperty({ example: "2025-11-17T12:00:00.000Z", description: "응답 시각" })
  timestamp: string;

  @ApiProperty({ example: "/api/events", description: "요청 경로" })
  path: string;

  constructor(
    items: T[],
    total: number,
    page: number,
    limit: number,
    path: string
  ) {
    this.success = true;
    this.items = items;
    this.total = total;
    this.page = page;
    this.limit = limit;
    this.totalPages = Math.ceil(total / limit);
    this.timestamp = new Date().toISOString();
    this.path = path;
  }
}
