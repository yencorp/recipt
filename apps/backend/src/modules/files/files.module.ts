import { Module } from "@nestjs/common";
import { MulterModule } from "@nestjs/platform-express";
import { FilesController } from "./files.controller";
import { FilesService } from "./files.service";
import { FileUploadMiddleware } from "../../common/middlewares/file-upload.middleware";

@Module({
  imports: [
    MulterModule.register(FileUploadMiddleware.getMulterOptions()),
  ],
  controllers: [FilesController],
  providers: [FilesService],
  exports: [FilesService],
})
export class FilesModule {}
