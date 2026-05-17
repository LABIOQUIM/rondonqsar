import { BullMQAdapter } from "@bull-board/api/bullMQAdapter";
import { BullBoardModule } from "@bull-board/nestjs";
import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";

import { LeishConsumer } from "./leish.consumer.js";
import { LeishController } from "./leish.controller.js";
import { LeishService } from "./leish.service.js";
import { LEISH_QUEUE } from "./leish.types.js";

@Module({
  imports: [
    BullModule.registerQueue({ name: LEISH_QUEUE }),
    BullBoardModule.forFeature({
      adapter: BullMQAdapter,
      name: LEISH_QUEUE,
      options: {
        description: "The Leish queue runs leishmania QSAR calculations.",
      },
    }),
  ],
  controllers: [LeishController],
  providers: [LeishService, LeishConsumer],
})
export class LeishModule {}
