import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as fs from "fs/promises";
import { setTimeout as delay } from "timers/promises";

import { AppModule } from "./app.module.js";

const DEV_SERVER_PID_FILE = "/tmp/rondonqsar-api-dev.pid";

async function readDevServerPid(): Promise<number | null> {
  try {
    const value = await fs.readFile(DEV_SERVER_PID_FILE, "utf8");
    const pid = Number(value.trim());

    return Number.isInteger(pid) && pid > 0 ? pid : null;
  } catch {
    return null;
  }
}

function isProcessAlive(pid: number): boolean {
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

async function waitForProcessExit(pid: number): Promise<boolean> {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    if (!isProcessAlive(pid)) {
      return true;
    }

    await delay(100);
  }

  return !isProcessAlive(pid);
}

async function releasePreviousDevServer(logger: Logger): Promise<void> {
  if (process.env.NODE_ENV === "production") {
    return;
  }

  const previousPid = await readDevServerPid();

  if (!previousPid || previousPid === process.pid) {
    return;
  }

  if (!isProcessAlive(previousPid)) {
    await fs.rm(DEV_SERVER_PID_FILE, { force: true });
    return;
  }

  logger.warn(`Stopping previous API dev process ${previousPid}.`);
  process.kill(previousPid, "SIGTERM");

  if (await waitForProcessExit(previousPid)) {
    logger.log(`Previous API dev process ${previousPid} stopped.`);
    return;
  }

  logger.error(`Force killing previous API dev process ${previousPid}.`);
  process.kill(previousPid, "SIGKILL");
  await waitForProcessExit(previousPid);
}

async function writeDevServerPid(): Promise<void> {
  if (process.env.NODE_ENV !== "production") {
    await fs.writeFile(DEV_SERVER_PID_FILE, String(process.pid));
  }
}

async function clearDevServerPid(): Promise<void> {
  const pid = await readDevServerPid();

  if (pid === process.pid) {
    await fs.rm(DEV_SERVER_PID_FILE, { force: true });
  }
}

async function bootstrap(): Promise<void> {
  const logger = new Logger("NestApplication");
  const port = Number(process.env.PORT ?? 3000);

  await releasePreviousDevServer(logger);

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    cors: {
      credentials: true,
      origin: process.env.APP_URL ?? "http://localhost:3000",
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS",
      allowedHeaders: "Content-Type, Authorization, Accept",
      exposedHeaders: "Content-Length",
    },
  });
  app.setGlobalPrefix("v1");

  const config = new DocumentBuilder()
    .setTitle("RondonQSAR API")
    .setDescription("The RondonQSAR API Documentation")
    .setVersion("0.1")
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("docs", app, document);
  app.enableShutdownHooks();

  let isShuttingDown = false;
  const shutdown = async (signal: NodeJS.Signals) => {
    if (isShuttingDown) {
      return;
    }

    isShuttingDown = true;
    logger.log(`Received ${signal}. Closing API before restart.`);

    const forceExit = setTimeout(() => {
      logger.error("Forced API shutdown after timeout.");
      process.exit(1);
    }, 5000);

    try {
      await app.close();
      await clearDevServerPid();
      logger.log("API closed cleanly.");
      process.exit(0);
    } catch (error) {
      logger.error("API shutdown failed.", error);
      process.exit(1);
    } finally {
      clearTimeout(forceExit);
    }
  };

  process.once("SIGTERM", shutdown);
  process.once("SIGINT", shutdown);
  process.once("SIGUSR2", shutdown);

  await app.listen(port);
  await writeDevServerPid();

  logger.debug(`API is running on http://localhost:${port}`);
}

bootstrap();
