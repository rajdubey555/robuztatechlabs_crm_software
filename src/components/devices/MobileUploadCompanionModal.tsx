"use client";

import { useState, useEffect, useRef } from "react";
import QRCode from "qrcode";
import { Modal, Button } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import {
  Smartphone,
  CheckCircle2,
  Loader2,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export interface MobileUploadCompanionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPhotosReceived: (files: File[]) => void;
}

export function MobileUploadCompanionModal({
  isOpen,
  onClose,
  onPhotosReceived,
}: MobileUploadCompanionModalProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [uploadUrl, setUploadUrl] = useState<string>("");
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");
  const [copiedLink, setCopiedLink] = useState(false);
  const [receivedCount, setReceivedCount] = useState<number | null>(null);

  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Helper to convert base64 data URL to File object
  const dataURLtoFile = (dataurl: string, filename: string): File => {
    const arr = dataurl.split(",");
    const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
      u8arr[n] = bstr.charCodeAt(n);
    }
    return new File([u8arr], filename, { type: mime });
  };

  const startSession = async () => {
    setLoading(true);
    setError(null);
    setReceivedCount(null);

    try {
      const res = await fetch("/api/companion-upload?action=create-session");
      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || "Failed to create QR session");
      }

      setSessionId(json.sessionId);
      setUploadUrl(json.uploadUrl);

      // Generate QR Code Data URL locally using qrcode package
      const qrData = await QRCode.toDataURL(json.uploadUrl, {
        width: 260,
        margin: 2,
        color: {
          dark: "#0f172a",
          light: "#ffffff",
        },
      });

      setQrCodeDataUrl(qrData);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Could not create session.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      startSession();
    } else {
      // Clear polling if modal closed
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    }
  }, [isOpen]);

  // Listen via Supabase Realtime WebSocket + Fallback Cloud Storage & Local API Polling
  useEffect(() => {
    if (!sessionId || !isOpen || receivedCount !== null) return;

    let isHandled = false;
    const supabase = createClient();

    const deliverFiles = async (files: File[]) => {
      if (isHandled || files.length === 0) return;
      isHandled = true;
      setReceivedCount(files.length);
      onPhotosReceived(files);

      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }

      setTimeout(() => {
        onClose();
      }, 1500);
    };

    // 1. Supabase Realtime WebSocket Channel (Instant delivery)
    const channel = supabase.channel(`intake_${sessionId}`);
    channel
      .on("broadcast", { event: "photos_ready" }, async ({ payload }) => {
        if (payload?.photos && Array.isArray(payload.photos) && payload.photos.length > 0) {
          console.log("[Modal] Received photos via Supabase Realtime broadcast!", payload.photos);
          const convertedFiles: File[] = [];
          for (let i = 0; i < payload.photos.length; i++) {
            const p = payload.photos[i];
            if (p.base64) {
              convertedFiles.push(dataURLtoFile(p.base64, p.name || `photo_${i + 1}.jpg`));
            } else if (p.url) {
              try {
                const res = await fetch(p.url);
                const blob = await res.blob();
                convertedFiles.push(
                  new File([blob], p.name || `photo_${i + 1}.jpg`, { type: blob.type || "image/jpeg" })
                );
              } catch (e) {
                console.warn("Could not download Supabase photo:", e);
              }
            }
          }
          if (convertedFiles.length > 0) {
            await deliverFiles(convertedFiles);
          }
        }
      })
      .subscribe();

    // 2. Fallback Polling (Supabase Storage list + Local API)
    pollIntervalRef.current = setInterval(async () => {
      if (isHandled) return;

      // 2A. Check Supabase Storage bucket directly
      try {
        const { data: storageFiles } = await supabase.storage
          .from("device-attachments")
          .list(`intake_temp/${sessionId}`);

        if (storageFiles && storageFiles.length > 0) {
          console.log(`[Modal] Detected ${storageFiles.length} photos in Supabase Storage!`);
          const convertedFiles: File[] = [];

          for (const sFile of storageFiles) {
            const { data: pUrl } = supabase.storage
              .from("device-attachments")
              .getPublicUrl(`intake_temp/${sessionId}/${sFile.name}`);

            try {
              const res = await fetch(pUrl.publicUrl);
              const blob = await res.blob();
              convertedFiles.push(
                new File([blob], sFile.name, { type: blob.type || "image/jpeg" })
              );
            } catch (err) {
              console.warn("Fetch storage file warning:", err);
            }
          }

          if (convertedFiles.length > 0) {
            await deliverFiles(convertedFiles);
            return;
          }
        }
      } catch (sbStorageErr) {
        console.warn("Supabase storage list poll error:", sbStorageErr);
      }

      // 2B. Check Local API route
      try {
        const res = await fetch(`/api/companion-upload?action=poll&sessionId=${sessionId}`);
        const json = await res.json();

        if (json.success && json.ready && Array.isArray(json.photos)) {
          const receivedFiles = json.photos.map(
            (p: { name: string; base64: string }, index: number) =>
              dataURLtoFile(p.base64, p.name || `mobile_intake_${index + 1}.jpg`)
          );

          if (receivedFiles.length > 0) {
            await deliverFiles(receivedFiles);
          }
        }
      } catch (e) {
        console.warn("Local API polling error:", e);
      }
    }, 1800);

    return () => {
      supabase.removeChannel(channel);
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [sessionId, isOpen, receivedCount, onPhotosReceived, onClose]);

  const handleCopyLink = () => {
    if (!uploadUrl) return;
    navigator.clipboard.writeText(uploadUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 1800);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Scan QR Code with Phone Camera"
      maxWidth="md"
    >
      <div className="p-6 text-center space-y-5">
        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#009688]" />
            <p className="text-xs text-slate-500">Generating live QR code...</p>
          </div>
        ) : error ? (
          <div className="py-8 space-y-3 text-center">
            <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
            <p className="text-xs text-rose-600 font-medium">{error}</p>
            <Button variant="outline" size="sm" onClick={startSession}>
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Try Again
            </Button>
          </div>
        ) : receivedCount !== null ? (
          <div className="py-8 space-y-3 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h3 className="font-sans text-lg font-bold text-slate-900 dark:text-white">
              {receivedCount} {receivedCount === 1 ? "Photo" : "Photos"} Received!
            </h3>
            <p className="text-xs text-slate-500">
              Photos have been transferred and added to the device form.
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-1">
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Point your phone camera at this QR code. Take intake photos of scratches, physical condition, or serial number.
              </p>
            </div>

            {/* QR Code Container */}
            <div className="p-4 bg-white rounded-2xl border-2 border-slate-200 dark:border-slate-700 shadow-sm inline-block mx-auto">
              {qrCodeDataUrl ? (
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code for Mobile Camera Upload"
                  className="w-56 h-56 mx-auto rounded-lg"
                />
              ) : (
                <div className="w-56 h-56 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-[#009688]" />
                </div>
              )}
            </div>

            {/* Waiting Pulse Status */}
            <div className="flex items-center justify-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#009688]"></span>
              </span>
              <span>Waiting for photos from your mobile phone...</span>
            </div>

            {/* Alternative Copy Link */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[220px] font-mono text-[11px] text-slate-400">
                {uploadUrl}
              </span>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-medium transition-colors"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Link
                    </>
                  )}
                </button>

                <a
                  href={uploadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1 rounded-md text-slate-400 hover:text-slate-600"
                  title="Open in new tab"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
