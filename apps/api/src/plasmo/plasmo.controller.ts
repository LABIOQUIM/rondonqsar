import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UnauthorizedException,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { Session } from "@thallesp/nestjs-better-auth";

import { auth } from "../lib/auth.js";
import multerConfig from "../multer.config.js";
import { PlasmoService } from "./plasmo.service.js";

@Controller("plasmo")
export class PlasmoController {
  constructor(private plasmoService: PlasmoService) {}

  @Get("current-user")
  findCurrentUser(
    @Query("pageSize") pageSize: string | undefined,
    @Query("page") page: string | undefined,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    return this.plasmoService.findCurrentUser(session.user.id, {
      pageSize: pageSize === undefined ? undefined : Number(pageSize),
      page: page === undefined ? undefined : Number(page),
    });
  }

  @Get("current-user/:taskId")
  findCurrentUserTask(
    @Param("taskId") taskId: string,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    return this.plasmoService.findCurrentUserTask(session.user.id, taskId);
  }

  @Post("submit")
  @UseInterceptors(FileInterceptor("file", multerConfig))
  submit(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    if (!file) {
      throw new BadRequestException("SDF file is required");
    }

    if (!session?.user?.id || !session.user.username) {
      throw new UnauthorizedException();
    }

    return this.plasmoService.submit(file, {
      id: session.user.id,
      username: session.user.username,
    });
  }
}
