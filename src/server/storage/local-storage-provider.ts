import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { StorageProvider } from "@/server/storage/storage-provider";
import { AppError } from "@/server/errors";

export class LocalStorageProvider implements StorageProvider {
  constructor(private readonly root = path.resolve(/* turbopackIgnore: true */ process.env.LOCAL_STORAGE_PATH ?? "./storage")) {}

  private resolveKey(key: string) {
    if (!/^[a-z0-9-]+\/[a-f0-9-]+\.(webp|jpg|png)$/i.test(key)) {
      throw new AppError("INVALID_STORAGE_KEY", "Invalid file key", 400);
    }
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(`${this.root}${path.sep}`)) throw new AppError("INVALID_STORAGE_KEY", "Invalid file key", 400);
    return resolved;
  }

  async put(data: Buffer, options: { extension: string; namespace: string }) {
    if (!/^[a-z0-9-]+$/i.test(options.namespace) || !/^(webp|jpg|png)$/.test(options.extension)) {
      throw new AppError("INVALID_STORAGE_OPTIONS", "Invalid storage options", 400);
    }
    const key = `${options.namespace}/${randomUUID()}.${options.extension}`;
    const destination = this.resolveKey(key);
    await mkdir(path.dirname(destination), { recursive: true });
    await writeFile(destination, data, { flag: "wx" });
    return { key, url: `/api/media/${key}` };
  }

  read(key: string) {
    return readFile(this.resolveKey(key));
  }

  async delete(key: string) {
    await rm(this.resolveKey(key), { force: true });
  }
}
