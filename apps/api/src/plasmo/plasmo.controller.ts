import {
  BadRequestException,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";

import multerConfig from "../multer.config.js";
import { PlasmoService } from "./plasmo.service.js";

@Controller("plasmo")
export class PlasmoController {
  constructor(private plasmoService: PlasmoService) {}

  @Post("submit")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  submit(@UploadedFile() file?: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException("SDF file is required");
    }

    return this.plasmoService.submit(file);
  }
}
