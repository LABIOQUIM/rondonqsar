import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { PrismaService } from "../prisma.service.js";
import { PlasmoConsumer } from "./plasmo.consumer.js";
import { PlasmoController } from "./plasmo.controller.js";
import { PlasmoService } from "./plasmo.service.js";
import { PLASMO_QUEUE } from "./plasmo.types.js";

@Module({
  imports: [
    BullModule.registerQueue({ name: PLASMO_QUEUE }),
    BullBoardModule.forFeature({
      adapter: BullMQAdapter,
      name: PLASMO_QUEUE,
      options: {
        description: "The Plasmo queue runs plasmodium QSAR calculations.",
      },
    }),
  ],
  controllers: [PlasmoController],
  providers: [PlasmoService, PlasmoConsumer, PrismaService],
})
export class PlasmoModule {}
