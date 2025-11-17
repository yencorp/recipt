import { Injectable } from "@nestjs/common";
import { join, dirname } from "path";
import { existsSync, mkdirSync } from "fs";
import * as sharp from "sharp";

@Injectable()
export class ThumbnailService {
  private readonly thumbnailSizes = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 },
  };

  // 썸네일 생성
  async generateThumbnail(
    imagePath: string,
    size: "small" | "medium" | "large" = "medium"
  ): Promise<string> {
    const { width, height } = this.thumbnailSizes[size];

    // 썸네일 저장 경로
    const thumbnailDir = join(dirname(imagePath), "thumbnails");
    if (!existsSync(thumbnailDir)) {
      mkdirSync(thumbnailDir, { recursive: true });
    }

    const filename = imagePath.split("/").pop();
    const thumbnailPath = join(
      thumbnailDir,
      `${size}_${filename.replace(/\.[^.]+$/, ".jpg")}`
    );

    try {
      // Sharp를 사용한 썸네일 생성
      await sharp(imagePath)
        .resize(width, height, {
          fit: "inside",
          withoutEnlargement: true,
        })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);

      console.log(`Thumbnail generated: ${thumbnailPath}`);
      return thumbnailPath;
    } catch (error) {
      console.error("Thumbnail generation failed:", error);
      throw new Error(`썸네일 생성 실패: ${error.message}`);
    }
  }

  // 다중 크기 썸네일 생성
  async generateAllThumbnails(imagePath: string): Promise<{
    small: string;
    medium: string;
    large: string;
  }> {
    const [small, medium, large] = await Promise.all([
      this.generateThumbnail(imagePath, "small"),
      this.generateThumbnail(imagePath, "medium"),
      this.generateThumbnail(imagePath, "large"),
    ]);

    return { small, medium, large };
  }

  // 이미지 정보 추출
  async getImageMetadata(imagePath: string) {
    try {
      const metadata = await sharp(imagePath).metadata();

      return {
        width: metadata.width,
        height: metadata.height,
        format: metadata.format,
        size: metadata.size,
        hasAlpha: metadata.hasAlpha,
      };
    } catch (error) {
      console.error("Failed to get image metadata:", error);
      throw new Error(`이미지 메타데이터 추출 실패: ${error.message}`);
    }
  }
}
