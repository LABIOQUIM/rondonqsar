import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { MailerConsumer } from "./mailer.consumer.js";
import { MailerController } from "./mailer.controller.js";
import { MailerService } from "./mailer.service.js";

const bullBoardEnabled =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_BULL_BOARD === "true";

const bullBoardImports: DynamicModule[] = bullBoardEnabled
  ? [
      BullBoardModule.forFeature({
        adapter: BullMQAdapter,
        name: "mailer",
        options: {
          description: "The Mailer Queue runs all the email sending tasks.",
        },
      }),
    ]
  : [];

@Module({
  imports: [
    BullModule.registerQueue({
      name: "mailer",
    }),
    ...bullBoardImports,
  ],
  controllers: [MailerController],
  providers: [MailerService, MailerConsumer, PrismaService],
})
export class MailerModule {}
