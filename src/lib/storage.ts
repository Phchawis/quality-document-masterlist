import { randomUUID } from "crypto";
import { mkdir, writeFile, unlink, readFile, stat } from "fs/promises";
import path from "path";

const UPLOAD_DIR = process.env.UPLOAD_DIR || "./uploads";

export function uploadRoot(): string {
  return path.isAbsolute(UPLOAD_DIR) ? UPLOAD_DIR : path.join(process.cwd(), UPLOAD_DIR);
}

const ALLOWED: Record<string, { kind: "PDF" | "WORD" | "EXCEL"; mime: string }> = {
  pdf: { kind: "PDF", mime: "application/pdf" },
  doc: { kind: "WORD", mime: "application/msword" },
  docx: { kind: "WORD", mime: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" },
  xls: { kind: "EXCEL", mime: "application/vnd.ms-excel" },
  xlsx: { kind: "EXCEL", mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" },
};

export function kindForExt(ext: string) {
  return ALLOWED[ext.toLowerCase().replace(/^\./, "")] ?? null;
}

export async function saveUpload(file: File): Promise<{ storedName: string; size: number; mime: string; kind: "PDF" | "WORD" | "EXCEL"; ext: string } | null> {
  const ext = (file.name.split(".").pop() || "").toLowerCase();
  const meta = kindForExt(ext);
  if (!meta) return null;

  const root = uploadRoot();
  await mkdir(root, { recursive: true });
  const storedName = `${randomUUID()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await writeFile(path.join(root, storedName), buf);
  return { storedName, size: buf.length, mime: meta.mime, kind: meta.kind, ext };
}

export async function readStored(storedName: string): Promise<{ data: Buffer; size: number } | null> {
  // Guard against path traversal — only a bare filename is allowed.
  if (storedName.includes("/") || storedName.includes("\\") || storedName.includes("..")) return null;
  const full = path.join(uploadRoot(), storedName);
  try {
    const s = await stat(full);
    const data = await readFile(full);
    return { data, size: s.size };
  } catch {
    return null;
  }
}

export async function deleteStored(storedName: string): Promise<void> {
  if (storedName.includes("/") || storedName.includes("\\") || storedName.includes("..")) return;
  try {
    await unlink(path.join(uploadRoot(), storedName));
  } catch {
    /* ignore */
  }
}
