import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import type { DynamicModule } from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { QsarQueueBootstrapService } from "./qsar-queue-bootstrap.service.js";
import { QsarConsumer } from "./qsar.consumer.js";
import { QsarController } from "./qsar.controller.js";
import { QsarService } from "./qsar.service.js";
import { QSAR_QUEUE } from "./qsar.types.js";

const bullBoardEnabled =
  process.env.NODE_ENV !== "production" || process.env.ENABLE_BULL_BOARD === "true";

const bullBoardImports: DynamicModule[] = bullBoardEnabled
  ? [
      BullBoardModule.forFeature({
        adapter: BullMQAdapter,
        name: QSAR_QUEUE,
        options: {
          description: "The QSAR queue runs PlasmoQSAR and LeishQSAR calculations.",
        },
      }),
    ]
  : [];

@Module({
  imports: [
    BullModule.registerQueue({
      name: QSAR_QUEUE,
      defaultJobOptions: {
        removeOnComplete: false,
        removeOnFail: false,
      },
    }),
    ...bullBoardImports,
  ],
  controllers: [QsarController],
  providers: [QsarService, QsarConsumer, QsarQueueBootstrapService, PrismaService],
})
export class QsarModule {}
