import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  UseInterceptors,
  UploadedFile,
  UploadedFiles,
  UseGuards,
  Request,
  BadRequestException,
} from "@nestjs/common";
import {
  FileInterceptor,
  FilesInterceptor,
} from "@nestjs/platform-express";
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes } from "@nestjs/swagger";
import { FilesService } from "./files.service";
import { FileUploadMiddleware } from "../../common/middlewares/file-upload.middleware";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";

@ApiTags("Files")
@Controller("files")
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("upload")
  @ApiOperation({ summary: "단일 파일 업로드" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "파일 업로드 성공" })
  @ApiResponse({ status: 400, description: "잘못된 파일 형식 또는 크기 초과" })
  @UseInterceptors(
    FileInterceptor("file", FileUploadMiddleware.getMulterOptions())
  )
  async uploadFile(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException("파일이 업로드되지 않았습니다.");
    }

    const metadata = await this.filesService.saveFileMetadata(
      file,
      req.user.id
    );

    return {
      message: "파일이 성공적으로 업로드되었습니다.",
      file: metadata,
    };
  }

  @Post("upload/multiple")
  @ApiOperation({ summary: "다중 파일 업로드 (최대 10개)" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "파일 업로드 성공" })
  @ApiResponse({ status: 400, description: "잘못된 파일 형식 또는 크기 초과" })
  @UseInterceptors(
    FilesInterceptor("files", 10, FileUploadMiddleware.getMulterOptions())
  )
  async uploadMultipleFiles(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("파일이 업로드되지 않았습니다.");
    }

    const uploadedFiles = await Promise.all(
      files.map((file) =>
        this.filesService.saveFileMetadata(file, req.user.id)
      )
    );

    return {
      message: `${uploadedFiles.length}개의 파일이 성공적으로 업로드되었습니다.`,
      files: uploadedFiles,
    };
  }

  @Get()
  @ApiOperation({ summary: "내 업로드 파일 목록 조회" })
  @ApiResponse({ status: 200, description: "파일 목록 조회 성공" })
  async getUserFiles(@Request() req) {
    const files = await this.filesService.getUserFiles(req.user.id);
    return { files };
  }

  @Get("stats")
  @ApiOperation({ summary: "내 파일 통계 조회" })
  @ApiResponse({ status: 200, description: "파일 통계 조회 성공" })
  async getFileStats(@Request() req) {
    return this.filesService.getFileStats(req.user.id);
  }

  @Get(":id")
  @ApiOperation({ summary: "파일 메타데이터 조회" })
  @ApiResponse({ status: 200, description: "파일 메타데이터 조회 성공" })
  @ApiResponse({ status: 404, description: "파일을 찾을 수 없음" })
  async getFileMetadata(@Param("id") id: string) {
    return this.filesService.getFileMetadata(id);
  }

  @Delete(":id")
  @ApiOperation({ summary: "파일 삭제" })
  @ApiResponse({ status: 200, description: "파일 삭제 성공" })
  @ApiResponse({ status: 404, description: "파일을 찾을 수 없음" })
  async deleteFile(@Param("id") id: string, @Request() req) {
    await this.filesService.deleteFile(id, req.user.id);
    return { message: "파일이 삭제되었습니다.", id };
  }
}
