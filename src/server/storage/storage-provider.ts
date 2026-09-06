export interface StoredObject {
  key: string;
  url: string;
}

export interface StorageProvider {
  put(data: Buffer, options: { extension: string; namespace: string }): Promise<StoredObject>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}
