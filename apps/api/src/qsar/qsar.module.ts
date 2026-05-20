import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { QsarConsumer } from "./qsar.consumer.js";
import { QsarController } from "./qsar.controller.js";
import { QsarService } from "./qsar.service.js";
import { QSAR_QUEUE } from "./qsar.types.js";

@Module({
  imports: [
    BullModule.registerQueue({ name: QSAR_QUEUE }),
    BullBoardModule.forFeature({
      adapter: BullMQAdapter,
      name: QSAR_QUEUE,
      options: {
        description: "The QSAR queue runs PlasmoQSAR and LeishQSAR calculations.",
      },
    }),
  ],
  controllers: [QsarController],
  providers: [QsarService, QsarConsumer, PrismaService],
})
export class QsarModule {}
