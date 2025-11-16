import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { unlink } from "fs/promises";
import { existsSync } from "fs";

export interface FileMetadata {
  id: string;
  originalName: string;
  filename: string;
  path: string;
  mimetype: string;
  size: number;
  uploadedBy: string;
  createdAt: Date;
}

@Injectable()
export class FilesService {
  private fileMetadataStore: Map<string, FileMetadata> = new Map();

  // 파일 메타데이터 저장
  async saveFileMetadata(
    file: Express.Multer.File,
    userId: string
  ): Promise<FileMetadata> {
    const metadata: FileMetadata = {
      id: `file_${Date.now()}_${Math.random().toString(36).substring(7)}`,
      originalName: file.originalname,
      filename: file.filename,
      path: file.path,
      mimetype: file.mimetype,
      size: file.size,
      uploadedBy: userId,
      createdAt: new Date(),
    };

    this.fileMetadataStore.set(metadata.id, metadata);
    console.log(`File uploaded: ${metadata.id} by user ${userId}`);

    return metadata;
  }

  // 파일 메타데이터 조회
  async getFileMetadata(fileId: string): Promise<FileMetadata> {
    const metadata = this.fileMetadataStore.get(fileId);

    if (!metadata) {
      throw new NotFoundException("파일을 찾을 수 없습니다.");
    }

    return metadata;
  }

  // 사용자별 업로드 파일 목록
  async getUserFiles(userId: string): Promise<FileMetadata[]> {
    const userFiles = Array.from(this.fileMetadataStore.values()).filter(
      (file) => file.uploadedBy === userId
    );

    return userFiles.sort(
      (a, b) => b.createdAt.getTime() - a.createdAt.getTime()
    );
  }

  // 파일 삭제
  async deleteFile(fileId: string, userId: string): Promise<void> {
    const metadata = await this.getFileMetadata(fileId);

    // 권한 확인
    if (metadata.uploadedBy !== userId) {
      throw new NotFoundException("파일을 삭제할 권한이 없습니다.");
    }

    // 물리적 파일 삭제
    if (existsSync(metadata.path)) {
      await unlink(metadata.path);
      console.log(`File deleted from disk: ${metadata.path}`);
    }

    // 메타데이터 삭제
    this.fileMetadataStore.delete(fileId);
    console.log(`File metadata deleted: ${fileId}`);
  }

  // 파일 통계
  async getFileStats(userId?: string) {
    const allFiles = Array.from(this.fileMetadataStore.values());
    const userFiles = userId
      ? allFiles.filter((f) => f.uploadedBy === userId)
      : allFiles;

    const totalSize = userFiles.reduce((sum, f) => sum + f.size, 0);
    const byMimeType = userFiles.reduce(
      (acc, f) => {
        acc[f.mimetype] = (acc[f.mimetype] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalFiles: userFiles.length,
      totalSize,
      totalSizeMB: Math.round((totalSize / 1024 / 1024) * 100) / 100,
      byMimeType,
    };
  }
}
