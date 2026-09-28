import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";

/**
 * Document storage abstraction (§23).
 *
 * Private by construction: nothing is ever written to a public folder and a
 * storage path is never returned to a browser. Downloads go through an
 * authenticated route handler that checks ownership first.
 */
export interface StoredObject {
  storageProvider: string;
  storagePath: string;
  checksum: string;
  sizeBytes: number;
}

export interface StorageProvider {
  readonly name: string;
  put(params: { key: string; bytes: Buffer; mimeType: string }): Promise<StoredObject>;
  get(storagePath: string): Promise<Buffer>;
  exists(storagePath: string): Promise<boolean>;
}

export function sha256(bytes: Buffer | string): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Development/default provider: filesystem outside the web root. */
export class LocalFileStorageProvider implements StorageProvider {
  readonly name = "local";
  private readonly root: string;

  constructor(root = process.env.DOCUMENT_STORAGE_DIR?.trim() || ".data/documents") {
    this.root = path.isAbsolute(root) ? root : path.join(process.cwd(), root);
  }

  private absolute(storagePath: string): string {
    const target = path.resolve(this.root, storagePath);
    if (!target.startsWith(path.resolve(this.root))) throw new Error("INVALID_STORAGE_PATH");
    return target;
  }

  async put(params: { key: string; bytes: Buffer; mimeType: string }): Promise<StoredObject> {
    const target = this.absolute(params.key);
    await fs.mkdir(path.dirname(target), { recursive: true });
    await fs.writeFile(target, params.bytes);
    return {
      storageProvider: this.name,
      storagePath: params.key,
      checksum: sha256(params.bytes),
      sizeBytes: params.bytes.byteLength,
    };
  }

  async get(storagePath: string): Promise<Buffer> {
    return fs.readFile(this.absolute(storagePath));
  }

  async exists(storagePath: string): Promise<boolean> {
    try {
      await fs.access(this.absolute(storagePath));
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Supabase Storage provider — enabled automatically when a service-role key is
 * configured. The bucket is private; access is brokered by the server only.
 */
export class SupabaseStorageProvider implements StorageProvider {
  readonly name = "supabase";
  private readonly bucket: string;

  constructor(
    private readonly url: string,
    private readonly serviceRoleKey: string,
    bucket = process.env.SUPABASE_STORAGE_BUCKET?.trim() || "legal-documents",
  ) {
    this.bucket = bucket;
  }

  private async client() {
    const { createClient } = await import("@supabase/supabase-js");
    return createClient(this.url, this.serviceRoleKey, { auth: { persistSession: false } });
  }

  async put(params: { key: string; bytes: Buffer; mimeType: string }): Promise<StoredObject> {
    const supabase = await this.client();
    const { error } = await supabase.storage
      .from(this.bucket)
      .upload(params.key, params.bytes, { contentType: params.mimeType, upsert: false });
    if (error) throw new Error(`SUPABASE_UPLOAD_FAILED: ${error.message}`);
    return {
      storageProvider: this.name,
      storagePath: params.key,
      checksum: sha256(params.bytes),
      sizeBytes: params.bytes.byteLength,
    };
  }

  async get(storagePath: string): Promise<Buffer> {
    const supabase = await this.client();
    const { data, error } = await supabase.storage.from(this.bucket).download(storagePath);
    if (error || !data) throw new Error(`SUPABASE_DOWNLOAD_FAILED: ${error?.message ?? "unknown"}`);
    return Buffer.from(await data.arrayBuffer());
  }

  async exists(storagePath: string): Promise<boolean> {
    const supabase = await this.client();
    const folder = storagePath.includes("/") ? storagePath.slice(0, storagePath.lastIndexOf("/")) : "";
    const filename = storagePath.slice(storagePath.lastIndexOf("/") + 1);
    const { data } = await supabase.storage.from(this.bucket).list(folder, { search: filename });
    return Boolean(data?.some((entry) => entry.name === filename));
  }
}

let cached: StorageProvider | null = null;

export function getStorageProvider(): StorageProvider {
  if (cached) return cached;
  const mode = (process.env.DOCUMENT_STORAGE ?? "local").toLowerCase();
  const url = process.env.SUPABASE_URL?.trim();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  cached = mode === "supabase" && url && key ? new SupabaseStorageProvider(url, key) : new LocalFileStorageProvider();
  return cached;
}

export function setStorageProviderForTesting(provider: StorageProvider | null): void {
  cached = provider;
}

/** Storage key layout: contracts/<contractId>/<documentId>-<filename>. */
export function buildStorageKey(contractId: string, documentId: string, filename: string): string {
  const safe = filename.replace(/[^a-zA-Z0-9._\u0600-\u06FF-]/g, "_").slice(0, 120);
  return `contracts/${contractId}/${documentId}-${safe}`;
}
