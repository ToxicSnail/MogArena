export interface ParsedExternalProfile {
  externalId: string;
  displayName?: string;
  photoUrl?: string;
}

export interface FetchResult {
  status: number;
  url: string;
  contentType?: string;
  body: Buffer;
}

export interface ProfilePageFetcher {
  fetch(externalId: string): Promise<FetchResult>;
}

export interface ProfilePhotoFetcher {
  fetch(url: string): Promise<FetchResult>;
}

export type PhotoClassification = "REAL_PHOTO" | "PLACEHOLDER" | "INVALID_IMAGE";
