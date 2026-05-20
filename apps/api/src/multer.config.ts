import type { Request } from "express";

import { randomUUID } from "crypto";
import * as fs from "fs";
import { diskStorage } from "multer";
import * as path from "path";

const ALLOWED_EXTENSIONS = new Set([".sdf"]);
type UploadCalculationType = "qsar";
type SessionRequest = Request & {
  session?: {
    user?: {
      username?: string | null;
    };
  };
};

function getCalculationType(req: Request): UploadCalculationType | null {
  const sourceUrl = req.originalUrl ?? req.url;
  const segments = sourceUrl.split("?")[0]?.split("/").filter(Boolean) ?? [];
  const calculation = segments.find(
    (segment): segment is UploadCalculationType => segment === "qsar",
  );

  return calculation ?? null;
}

const multerConfig = {
  limits: {
    fileSize: 8000000, // Compliant: 8MB
  },
  storage: diskStorage({
    destination: (req: SessionRequest, file, cb) => {
      const extension = path.parse(file.originalname).ext.toLowerCase();

      if (!req.session?.user?.username) {
        return cb(new Error("Unauthorized"), "");
      }

      const calculation = getCalculationType(req);

      if (!calculation) {
        return cb(new Error("Unsupported calculation type"), "");
      }

      if (!ALLOWED_EXTENSIONS.has(extension)) {
        return cb(new Error(`File type not allowed: ${extension}`), "");
      }

      const uploadDir = path.join("/files", req.session.user.username, calculation);

      fs.mkdirSync(uploadDir, { recursive: true });

      cb(null, uploadDir);
    },
    filename: (req: SessionRequest, file, cb) => {
      const extension = path.parse(file.originalname).ext.toLowerCase();

      if (!req.session?.user?.username) {
        return cb(new Error("Unauthorized"), "");
      }

      if (!getCalculationType(req)) {
        return cb(new Error("Unsupported calculation type"), "");
      }

      if (!ALLOWED_EXTENSIONS.has(extension)) {
        return cb(new Error(`File type not allowed: ${extension}`), "");
      }

      cb(null, `input_${randomUUID()}${extension}`);
    },
  }),
};

export default multerConfig;
