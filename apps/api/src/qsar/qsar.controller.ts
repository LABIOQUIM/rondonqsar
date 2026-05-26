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
import { Roles, Session } from "@thallesp/nestjs-better-auth";

import { auth } from "../lib/auth.js";
import multerConfig from "../multer.config.js";
import { QsarService } from "./qsar.service.js";

@Controller("qsar")
export class QsarController {
  constructor(private qsarService: QsarService) {}

  @Get("current-user")
  findCurrentUser(
    @Query("pageSize") pageSize: string | undefined,
    @Query("page") page: string | undefined,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    return this.qsarService.findCurrentUser(session.user.id, {
      pageSize: pageSize === undefined ? undefined : Number(pageSize),
      page: page === undefined ? undefined : Number(page),
    });
  }

  @Get("current-user/:submissionId")
  findCurrentUserSubmission(
    @Param("submissionId") submissionId: string,
    @Session() session: typeof auth.$Infer.Session,
  ) {
    if (!session?.user?.id) {
      throw new UnauthorizedException();
    }

    return this.qsarService.findCurrentUserSubmission(session.user.id, submissionId);
  }

  @Roles(["admin"])
  @Get("admin")
  findAdmin(
    @Query("pageSize") pageSize: string | undefined,
    @Query("page") page: string | undefined,
  ) {
    return this.qsarService.findAdmin({
      pageSize: pageSize === undefined ? undefined : Number(pageSize),
      page: page === undefined ? undefined : Number(page),
    });
  }

  @Roles(["admin"])
  @Get("admin/queue")
  getQueueDiagnostics() {
    return this.qsarService.getQueueDiagnostics();
  }

  @Roles(["admin"])
  @Post("admin/:submissionId/requeue")
  requeueAdminSubmission(
    @Param("submissionId") submissionId: string,
  ) {
    return this.qsarService.requeueAdminSubmission(submissionId);
  }

  @Roles(["admin"])
  @Get("admin/:submissionId")
  findAdminSubmission(
    @Param("submissionId") submissionId: string,
  ) {
    return this.qsarService.findAdminSubmission(submissionId);
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

    return this.qsarService.submit(file, {
      id: session.user.id,
      username: session.user.username,
    });
  }
}
