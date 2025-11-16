import { Injectable, BadRequestException } from "@nestjs/common";
import { MulterModuleOptions } from "@nestjs/platform-express";
import { diskStorage } from "multer";
import { extname } from "path";
import { existsSync, mkdirSync } from "fs";

@Injectable()
export class FileUploadMiddleware {
  static getMulterOptions(): MulterModuleOptions {
    return {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = "./uploads";

          // 파일 타입에 따라 하위 디렉토리 분류
          let subPath = "others";
          if (file.mimetype.startsWith("image/")) {
            subPath = "images";
          } else if (file.mimetype === "application/pdf") {
            subPath = "documents";
          }

          const fullPath = `${uploadPath}/${subPath}`;

          // 디렉토리가 없으면 생성
          if (!existsSync(fullPath)) {
            mkdirSync(fullPath, { recursive: true });
          }

          cb(null, fullPath);
        },
        filename: (req, file, cb) => {
          // 파일명: timestamp_randomstring.확장자
          const randomName = Array(32)
            .fill(null)
            .map(() => Math.round(Math.random() * 16).toString(16))
            .join("");
          const timestamp = Date.now();
          const ext = extname(file.originalname);
          cb(null, `${timestamp}_${randomName}${ext}`);
        },
      }),
      fileFilter: (req, file, cb) => {
        // 허용된 파일 타입 검증
        const allowedMimeTypes = [
          "image/jpeg",
          "image/jpg",
          "image/png",
          "image/gif",
          "image/webp",
          "application/pdf",
        ];

        if (allowedMimeTypes.includes(file.mimetype)) {
          cb(null, true);
        } else {
          cb(
            new BadRequestException(
              `지원하지 않는 파일 형식입니다. 허용 형식: ${allowedMimeTypes.join(", ")}`
            ),
            false
          );
        }
      },
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
        files: 10, // 최대 10개 파일 동시 업로드
      },
    };
  }
}
