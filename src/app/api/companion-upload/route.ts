import { NextRequest, NextResponse } from "next/server";
import os from "os";

// In-memory store for active companion upload sessions
// Stored on globalThis to survive Next.js Turbopack HMR and module re-evaluations
interface UploadSession {
  sessionId: string;
  createdAt: number;
  photos: {
    name: string;
    type: string;
    base64: string;
  }[];
  consumed: boolean;
}

declare global {
  // eslint-disable-next-line no-var
  var __companionUploadSessions: Map<string, UploadSession> | undefined;
}

const activeSessions: Map<string, UploadSession> =
  globalThis.__companionUploadSessions || new Map<string, UploadSession>();

globalThis.__companionUploadSessions = activeSessions;

// Cleanup expired sessions periodically
function cleanExpiredSessions() {
  const now = Date.now();
  for (const [id, session] of activeSessions.entries()) {
    if (now - session.createdAt > 30 * 60 * 1000) {
      activeSessions.delete(id);
    }
  }
}

function getLocalIpAddress(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    const ifaceList = interfaces[name];
    if (!ifaceList) continue;
    for (const iface of ifaceList) {
      // Look for IPv4 and non-internal (not 127.0.0.1)
      if (iface.family === "IPv4" && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  cleanExpiredSessions();

  const { searchParams } = new URL(req.url);
  const action = searchParams.get("action");
  const sessionId = searchParams.get("sessionId");

  // 1. Create a new upload session
  if (action === "create-session") {
    const newSessionId = "sess_" + Math.random().toString(36).substring(2, 10);
    activeSessions.set(newSessionId, {
      sessionId: newSessionId,
      createdAt: Date.now(),
      photos: [],
      consumed: false,
    });

    const reqHost = req.headers.get("host") || "localhost:3000";
    const isLocalhost = reqHost.includes("localhost") || reqHost.includes("127.0.0.1");

    let finalHost = reqHost;
    if (isLocalhost) {
      const lanIp = getLocalIpAddress();
      if (lanIp) {
        const port = reqHost.split(":")[1] || "3000";
        finalHost = `${lanIp}:${port}`;
      }
    }

    const protocol = req.headers.get("x-forwarded-proto") || (isLocalhost ? "http" : "https");
    const uploadUrl = `${protocol}://${finalHost}/upload-companion?session=${newSessionId}`;

    console.log(`[Companion API] Created session: ${newSessionId} -> ${uploadUrl}`);

    return NextResponse.json({
      success: true,
      sessionId: newSessionId,
      uploadUrl,
    });
  }

  // 2. Poll session status from the laptop
  if (action === "poll" && sessionId) {
    const session = activeSessions.get(sessionId);
    if (!session) {
      return NextResponse.json({
        success: false,
        message: `Session '${sessionId}' not found in active sessions (${activeSessions.size} active)`,
      });
    }

    if (session.photos.length > 0 && !session.consumed) {
      console.log(`[Companion API] Delivering ${session.photos.length} photos for session: ${sessionId}`);
      session.consumed = true;
      return NextResponse.json({
        success: true,
        ready: true,
        count: session.photos.length,
        photos: session.photos,
      });
    }

    return NextResponse.json({
      success: true,
      ready: false,
      count: session.photos.length,
    });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  cleanExpiredSessions();

  try {
    const formData = await req.formData();
    const sessionId = formData.get("sessionId") as string;

    console.log(`[Companion API POST] Received upload for session: ${sessionId}`);

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId in upload form" }, { status: 400 });
    }

    let session = activeSessions.get(sessionId);
    if (!session) {
      // Auto-recover session if it was dropped during HMR reload
      console.warn(`[Companion API POST] Session ${sessionId} missing, auto-creating session to accept upload.`);
      session = {
        sessionId,
        createdAt: Date.now(),
        photos: [],
        consumed: false,
      };
      activeSessions.set(sessionId, session);
    }

    const files = formData.getAll("photos") as File[];
    console.log(`[Companion API POST] Received ${files.length} file(s) for session: ${sessionId}`);

    if (!files || files.length === 0) {
      return NextResponse.json({ error: "No photos attached in payload" }, { status: 400 });
    }

    // Convert each file to base64 Data URL
    for (const file of files) {
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);
      const base64 = `data:${file.type || "image/jpeg"};base64,${buffer.toString("base64")}`;

      session.photos.push({
        name: file.name || `photo_${Date.now()}.jpg`,
        type: file.type || "image/jpeg",
        base64,
      });
    }

    console.log(`[Companion API POST] Successfully stored ${session.photos.length} total photo(s) for session: ${sessionId}`);

    return NextResponse.json({
      success: true,
      count: session.photos.length,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    console.error(`[Companion API POST] Upload error:`, err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
