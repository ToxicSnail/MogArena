import { LocalStorageProvider } from "@/server/storage/local-storage-provider";

export function getStorageProvider() {
  const provider = process.env.STORAGE_PROVIDER ?? "local";
  if (provider !== "local") throw new Error(`Unsupported storage provider: ${provider}`);
  return new LocalStorageProvider();
}
