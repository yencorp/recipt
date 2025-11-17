import {
  Controller,
  Post,
  Get,
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
import { ReceiptsService } from "./receipts.service";
import { ThumbnailService } from "./services/thumbnail.service";
import { OcrJobsService } from "../ocr/ocr-jobs.service";
import { FileUploadMiddleware } from "../../common/middlewares/file-upload.middleware";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../auth/roles.guard";

@ApiTags("Receipts - Upload")
@Controller("receipts/upload")
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReceiptUploadController {
  constructor(
    private readonly receiptsService: ReceiptsService,
    private readonly thumbnailService: ThumbnailService,
    private readonly ocrJobsService: OcrJobsService
  ) {}

  @Post()
  @ApiOperation({ summary: "영수증 이미지 단일 업로드" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "영수증 업로드 성공" })
  @ApiResponse({ status: 400, description: "잘못된 파일 형식" })
  @UseInterceptors(
    FileInterceptor("receipt", FileUploadMiddleware.getMulterOptions())
  )
  async uploadReceipt(
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException("파일이 업로드되지 않았습니다.");
    }

    if (!file.mimetype.startsWith("image/")) {
      throw new BadRequestException("이미지 파일만 업로드 가능합니다.");
    }

    // 썸네일 생성
    const thumbnails = await this.thumbnailService.generateAllThumbnails(
      file.path
    );

    // 이미지 메타데이터 추출
    const metadata = await this.thumbnailService.getImageMetadata(file.path);

    // 영수증 레코드 생성
    const receipt = await this.receiptsService.uploadReceipt({
      uploadedBy: req.user?.id || 'system',
      organizationId: req.body?.organizationId || 'default-org',
      imagePath: file.path,
      originalFilename: file.originalname,
      thumbnailPath: thumbnails.medium,
    });

    // OCR 작업 생성
    const ocrJob = await this.ocrJobsService.createJob(receipt.id);

    return {
      message: "영수증이 성공적으로 업로드되었습니다.",
      receipt: {
        id: receipt.id,
        imagePath: file.path,
        thumbnails,
        metadata,
        uploadStatus: receipt.uploadStatus,
      },
      ocrJob: {
        id: ocrJob.id,
        status: ocrJob.status,
      },
    };
  }

  @Post("batch")
  @ApiOperation({ summary: "영수증 이미지 일괄 업로드 (최대 100개, TSD 명세)" })
  @ApiConsumes("multipart/form-data")
  @ApiResponse({ status: 201, description: "영수증 일괄 업로드 성공" })
  @ApiResponse({ status: 400, description: "잘못된 파일 형식" })
  @UseInterceptors(
    FilesInterceptor("receipts", 100, FileUploadMiddleware.getMulterOptions())
  )
  async uploadReceiptsBatch(
    @UploadedFiles() files: Express.Multer.File[],
    @Request() req
  ) {
    if (!files || files.length === 0) {
      throw new BadRequestException("파일이 업로드되지 않았습니다.");
    }

    if (files.length > 100) {
      throw new BadRequestException("최대 100개 파일까지 업로드 가능합니다.");
    }

    // 이미지 파일만 필터링
    const imageFiles = files.filter((file) =>
      file.mimetype.startsWith("image/")
    );

    if (imageFiles.length === 0) {
      throw new BadRequestException("이미지 파일이 없습니다.");
    }

    // 모든 파일의 썸네일 생성 및 영수증 레코드 생성
    const receiptIds: string[] = [];
    const uploadedReceipts = await Promise.all(
      imageFiles.map(async (file) => {
        // 썸네일 생성
        const thumbnails = await this.thumbnailService.generateAllThumbnails(
          file.path
        );

        // 영수증 레코드 생성
        const receipt = await this.receiptsService.uploadReceipt({
          uploadedBy: req.user?.id || "system",
          organizationId: req.body?.organizationId || "default-org",
          imagePath: file.path,
          originalFilename: file.originalname,
          thumbnailPath: thumbnails.medium,
        });

        receiptIds.push(receipt.id);

        return {
          id: receipt.id,
          imagePath: file.path,
          thumbnailPath: thumbnails.medium,
          uploadStatus: receipt.uploadStatus,
        };
      })
    );

    // 모든 영수증을 하나의 배치 OCR 작업으로 처리 (TSD 명세)
    const ocrJob = await this.ocrJobsService.createBatchJob(receiptIds);

    return {
      message: `${uploadedReceipts.length}개의 영수증이 성공적으로 업로드되었습니다.`,
      receipts: uploadedReceipts,
      ocrJob: {
        id: ocrJob.id,
        status: ocrJob.status,
        totalFiles: ocrJob.totalFiles,
        processedFiles: ocrJob.processedFiles,
      },
    };
  }

  @Get("ocr/:jobId")
  @ApiOperation({ summary: "OCR 작업 상태 조회" })
  @ApiResponse({ status: 200, description: "OCR 작업 상태 조회 성공" })
  async getOcrJobStatus(@Param("jobId") jobId: string) {
    const job = await this.ocrJobsService.getJobStatus(jobId);
    return { job };
  }

  @Get("ocr/stats/all")
  @ApiOperation({ summary: "OCR 작업 통계 조회" })
  @ApiResponse({ status: 200, description: "OCR 작업 통계 조회 성공" })
  async getOcrJobStats() {
    return this.ocrJobsService.getJobStats();
  }
}
