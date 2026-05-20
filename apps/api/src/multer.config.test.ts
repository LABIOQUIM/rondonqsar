import { beforeEach, describe, expect, it, vi } from "vitest";

const mkdirSync = vi.fn();
const randomUUID = vi.fn();
const diskStorage = vi.fn((options) => options);

vi.mock("fs", () => ({
  default: {
    mkdirSync,
  },
  mkdirSync,
}));

vi.mock("crypto", () => ({
  randomUUID,
}));

vi.mock("multer", () => ({
  diskStorage,
}));

describe("multerConfig", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    randomUUID.mockReturnValue("uuid-123");
  });

  async function getStorage() {
    const { default: multerConfig } = await import("./multer.config.js");
    return multerConfig.storage as any;
  }

  it("rejects requests without a session user", async () => {
    const storage = await getStorage();
    const cb = vi.fn();

    storage.destination({ originalUrl: "/v1/qsar/submit" }, { originalname: "molecule.sdf" }, cb);

    expect(cb).toHaveBeenCalledWith(expect.any(Error), "");
    expect(cb.mock.calls[0][0]?.message).toBe("Unauthorized");
  });

  it("rejects unsupported route paths", async () => {
    const storage = await getStorage();
    const cb = vi.fn();

    storage.destination(
      {
        session: { user: { username: "owner" } },
        originalUrl: "/v1/simulation/submit",
      },
      { originalname: "molecule.sdf" },
      cb,
    );

    expect(cb).toHaveBeenCalledWith(expect.any(Error), "");
    expect(cb.mock.calls[0][0]?.message).toBe("Unsupported calculation type");
  });

  it("rejects unsupported extensions", async () => {
    const storage = await getStorage();
    const cb = vi.fn();

    storage.destination(
      {
        session: { user: { username: "owner" } },
        originalUrl: "/v1/qsar/submit",
      },
      { originalname: "file.txt" },
      cb,
    );

    expect(cb).toHaveBeenCalledWith(expect.any(Error), "");
    expect(cb.mock.calls[0][0]?.message).toBe("File type not allowed: .txt");
  });

  it("stores qsar uploads under the user's qsar folder", async () => {
    const storage = await getStorage();
    const cb = vi.fn();

    storage.destination(
      {
        session: { user: { username: "owner" } },
        originalUrl: "/v1/qsar/submit",
      },
      { originalname: "molecule.sdf" },
      cb,
    );

    expect(mkdirSync).toHaveBeenCalledWith("/files/owner/qsar", {
      recursive: true,
    });
    expect(cb).toHaveBeenCalledWith(null, "/files/owner/qsar");
  });

  it("uses generated SDF filenames", async () => {
    const storage = await getStorage();
    const cb = vi.fn();

    storage.filename(
      {
        session: { user: { username: "owner" } },
        originalUrl: "/v1/qsar/submit",
      },
      { originalname: "molecule.SDF" },
      cb,
    );

    expect(randomUUID).toHaveBeenCalled();
    expect(cb).toHaveBeenCalledWith(null, "input_uuid-123.sdf");
  });
});
