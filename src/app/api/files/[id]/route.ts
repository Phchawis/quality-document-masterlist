import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { readStored } from "@/lib/storage";
import { can } from "@/lib/reference";

export const dynamic = "force-dynamic";

// Serves a stored attachment file. Requires an authenticated session and document-level permission.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const att = await prisma.attachment.findUnique({
    where: { id },
    include: { document: true },
  });
  if (!att || !att.storedName || !att.document) return new NextResponse("Not found", { status: 404 });

  // Enforce access control for non-active documents (Drafts, In Review, Obsolete)
  const doc = att.document;
  if (doc.status !== "ACTIVE") {
    const isOwner = doc.ownerId === user.id;
    const hasWritePerm = can(user.role, "register") || can(user.role, "publish");
    if (!isOwner && !hasWritePerm) {
      return new NextResponse("Forbidden", { status: 403 });
    }
  }

  const file = await readStored(att.storedName);
  if (!file) return new NextResponse("File missing", { status: 404 });

  const disposition = req.nextUrl.searchParams.get("download") === "1" ? "attachment" : "inline";
  const encoded = encodeURIComponent(att.filename);

  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      "Content-Type": att.mime || "application/octet-stream",
      "Content-Length": String(file.size),
      "Content-Disposition": `${disposition}; filename*=UTF-8''${encoded}`,
      "Cache-Control": "private, no-store",
    },
  });
}
