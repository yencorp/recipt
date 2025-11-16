import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ReceiptScan } from "../../entities/receipt-scan.entity";
import { UploadReceiptDto } from "./dto/upload-receipt.dto";

@Injectable()
export class ReceiptsService {
  constructor(
    @InjectRepository(ReceiptScan)
    private readonly receiptScanRepository: Repository<ReceiptScan>
  ) {}

  async findAll(organizationId?: string) {
    const query = this.receiptScanRepository
      .createQueryBuilder("receiptScan")
      .leftJoinAndSelect("receiptScan.ocrResult", "ocrResult")
      .orderBy("receiptScan.createdAt", "DESC");

    if (organizationId) {
      query.where("receiptScan.organizationId = :organizationId", {
        organizationId,
      });
    }

    return query.getMany();
  }

  async findOne(id: string) {
    const receipt = await this.receiptScanRepository.findOne({
      where: { id },
      relations: ["ocrResult", "settlement"],
    });

    if (!receipt) {
      throw new NotFoundException("영수증을 찾을 수 없습니다.");
    }

    return receipt;
  }

  async uploadReceipt(uploadDto: UploadReceiptDto) {
    // TODO: 실제 파일 업로드 및 저장 로직 구현
    // 현재는 메타데이터만 저장하는 준비 단계

    const receipt = this.receiptScanRepository.create({
      ...uploadDto,
      uploadStatus: "UPLOADED",
      // 실제 파일 정보는 multer 통합 후 추가
    });

    return this.receiptScanRepository.save(receipt);
  }

  async requestOcrProcessing(id: string) {
    // TODO: OCR 서비스 연동 구현
    // 현재는 상태만 업데이트

    await this.receiptScanRepository.update(id, {
      uploadStatus: "PROCESSING",
    });

    return {
      message: "OCR 처리 요청이 접수되었습니다. (OCR 서비스 구현 후 활성화)",
      id,
    };
  }

  async remove(id: string) {
    const receipt = await this.findOne(id);
    await this.receiptScanRepository.softRemove(receipt);
    return { message: "영수증이 삭제되었습니다.", id };
  }
}
