import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { readStored } from "@/lib/storage";

export const dynamic = "force-dynamic";

// Serves a stored attachment file. Requires an authenticated session.
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const { id } = await params;
  const att = await prisma.attachment.findUnique({ where: { id } });
  if (!att || !att.storedName) return new NextResponse("Not found", { status: 404 });

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
