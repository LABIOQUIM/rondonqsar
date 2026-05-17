import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import multerConfig from "../multer.config.js";
import { LeishService } from "./leish.service.js";

@Controller("leish")
export class LeishController {
  constructor(private leishService: LeishService) {}

  @Post("submit")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  submit(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("SDF file is required");
    }

    return this.leishService.submit(file);
  }
}
