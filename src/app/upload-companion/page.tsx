"use client";

import { useState, useEffect, useRef, Suspense, ChangeEvent } from "react";
import { useSearchParams } from "next/navigation";
import {
  Camera,
  Upload,
  CheckCircle2,
  Trash2,
  Loader2,
  Smartphone,
  AlertCircle,
  ImageIcon,
  Sparkles,
  Bug,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  SwitchCamera,
  X,
  Aperture,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

interface CapturedPhoto {
  id: string;
  dataUrl: string; // Base64 data URL
  name: string;
  sizeKb: string;
  file?: File;
}

interface DebugLog {
  timestamp: string;
  message: string;
  type: "info" | "success" | "warn" | "error";
}

// Convert base64 data URL to native File object for FormData upload
function dataURLtoFile(dataurl: string, filename: string): File {
  const arr = dataurl.split(",");
  const mime = arr[0].match(/:(.*?);/)?.[1] || "image/jpeg";
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
}

// Read and optimize image via canvas
async function processFile(
  file: File,
  logFn?: (msg: string, type?: "info" | "success" | "warn" | "error") => void
): Promise<{ dataUrl: string; sizeKb: string }> {
  return new Promise((resolve) => {
    logFn?.(`Processing ${file.name} (${(file.size / 1024).toFixed(0)} KB, type: ${file.type || "unknown"})`);
    const reader = new FileReader();

    reader.onload = (e) => {
      const rawDataUrl = e.target?.result as string;
      if (!rawDataUrl) {
        logFn?.("FileReader gave empty result, using object URL", "warn");
        resolve({
          dataUrl: URL.createObjectURL(file),
          sizeKb: (file.size / 1024).toFixed(0) + " KB",
        });
        return;
      }

      const img = new Image();
      img.onload = () => {
        try {
          const maxDim = 1200;
          let w = img.width;
          let h = img.height;

          logFn?.(`Image decoded: ${w}x${h} px`);

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = Math.round((h * maxDim) / w);
              w = maxDim;
            } else {
              w = Math.round((w * maxDim) / h);
              h = maxDim;
            }
          }

          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");

          if (ctx) {
            ctx.drawImage(img, 0, 0, w, h);
            const optimizedDataUrl = canvas.toDataURL("image/jpeg", 0.88);
            const approxBytes = Math.round((optimizedDataUrl.length * 3) / 4);
            logFn?.(`Canvas optimized to ${w}x${h} (~${(approxBytes / 1024).toFixed(0)} KB)`, "success");
            resolve({
              dataUrl: optimizedDataUrl,
              sizeKb: (approxBytes / 1024).toFixed(0) + " KB",
            });
            return;
          }
        } catch (canvasErr) {
          logFn?.(`Canvas resize warning: ${String(canvasErr)}`, "warn");
        }

        resolve({
          dataUrl: rawDataUrl,
          sizeKb: (file.size / 1024).toFixed(0) + " KB",
        });
      };

      img.onerror = (imgErr) => {
        logFn?.(`Image load error: ${String(imgErr)}`, "warn");
        resolve({
          dataUrl: rawDataUrl,
          sizeKb: (file.size / 1024).toFixed(0) + " KB",
        });
      };

      img.src = rawDataUrl;
    };

    reader.onerror = (rErr) => {
      logFn?.(`FileReader error: ${String(rErr)}`, "error");
      resolve({
        dataUrl: URL.createObjectURL(file),
        sizeKb: (file.size / 1024).toFixed(0) + " KB",
      });
    };

    reader.readAsDataURL(file);
  });
}

function CompanionUploadContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session");

  const [photos, setPhotos] = useState<CapturedPhoto[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inputKey, setInputKey] = useState(0);

  // Live In-Browser Viewfinder Camera State
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [isLiveCameraActive, setIsLiveCameraActive] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [cameraFacing, setCameraFacing] = useState<"environment" | "user">("environment");
  const [shutterFlash, setShutterFlash] = useState(false);

  // Live Debug Console State
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [showDebug, setShowDebug] = useState(false);
  const [copiedLogs, setCopiedLogs] = useState(false);

  const addLog = (message: string, type: "info" | "success" | "warn" | "error" = "info") => {
    const time = new Date().toLocaleTimeString();
    console.log(`[Companion ${type.toUpperCase()}] ${message}`);
    setLogs((prev) => [...prev, { timestamp: time, message, type }]);
  };

  useEffect(() => {
    addLog(`Companion loaded on ${navigator.userAgent.slice(0, 50)}...`);
    addLog(`Session ID: ${sessionId || "MISSING"}`);
    if (!sessionId) {
      addLog("Error: Missing session ID parameter in URL query", "error");
      setShowDebug(true);
    }
  }, [sessionId]);

  // Clean up media stream on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Restore photos from sessionStorage if mobile browser tab was killed/reloaded by OS
  useEffect(() => {
    if (!sessionId || typeof window === "undefined") return;
    try {
      const saved = sessionStorage.getItem(`crm_companion_${sessionId}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setPhotos(parsed);
          addLog(`Restored ${parsed.length} photo(s) from session cache`, "info");
        }
      }
    } catch (e) {
      console.warn("Could not load saved session photos", e);
    }
  }, [sessionId]);

  // Persist photos to sessionStorage whenever changed
  useEffect(() => {
    if (!sessionId || typeof window === "undefined") return;
    try {
      if (photos.length > 0) {
        const storable = photos.map(({ id, dataUrl, name, sizeKb }) => ({
          id,
          dataUrl,
          name,
          sizeKb,
        }));
        sessionStorage.setItem(`crm_companion_${sessionId}`, JSON.stringify(storable));
      } else {
        sessionStorage.removeItem(`crm_companion_${sessionId}`);
      }
    } catch (e) {
      console.warn("Could not save photos to sessionStorage", e);
    }
  }, [photos, sessionId]);

  // ==========================================
  // LIVE IN-BROWSER CAMERA CONTROLLER
  // ==========================================
  const startLiveCamera = async (facing: "environment" | "user" = cameraFacing) => {
    stopLiveCamera();
    setIsStartingCamera(true);
    setError(null);
    addLog(`Requesting in-browser camera stream (facingMode: ${facing})...`);

    try {
      if (!navigator?.mediaDevices?.getUserMedia) {
        throw new Error(
          "In-browser camera requires HTTPS or is not supported. Use the 'Select Photos / Camera' option below."
        );
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1920 },
          height: { ideal: 1080 },
        },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setIsLiveCameraActive(true);
      addLog("Live Viewfinder active! Tab suspension bypassed.", "success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Could not open live stream: ${msg}. Showing fallback picker.`, "warn");
      setError("Camera permission needed or blocked. You can use 'Select from Phone Gallery' below.");
      setIsLiveCameraActive(false);
    } finally {
      setIsStartingCamera(false);
    }
  };

  const stopLiveCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsLiveCameraActive(false);
  };

  const flipCamera = async () => {
    const nextFacing = cameraFacing === "environment" ? "user" : "environment";
    setCameraFacing(nextFacing);
    await startLiveCamera(nextFacing);
  };

  const snapLivePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const w = video.videoWidth || 1280;
    const h = video.videoHeight || 720;

    // Trigger visual shutter flash
    setShutterFlash(true);
    setTimeout(() => setShutterFlash(false), 150);

    // Haptic vibration
    if (typeof navigator !== "undefined" && navigator.vibrate) {
      try {
        navigator.vibrate(40);
      } catch {}
    }

    try {
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(video, 0, 0, w, h);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.90);
      const approxBytes = Math.round((dataUrl.length * 3) / 4);
      const sizeKb = (approxBytes / 1024).toFixed(0) + " KB";

      const newPhoto: CapturedPhoto = {
        id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        dataUrl,
        name: `intake_snap_${photos.length + 1}.jpg`,
        sizeKb,
      };

      setPhotos((prev) => [...prev, newPhoto]);
      addLog(`Photo #${photos.length + 1} captured in-browser (${sizeKb})`, "success");
    } catch (snapErr) {
      addLog(`Failed to capture video frame: ${String(snapErr)}`, "error");
    }
  };

  // ==========================================
  // FALLBACK CLEAN FILE PICKER (NO CAPTURE BUG)
  // ==========================================
  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>, source: string) => {
    const target = e.target;
    const fileList = target.files;

    addLog(`File input changed via [${source}], files: ${fileList?.length || 0}`);

    if (!fileList || fileList.length === 0) {
      addLog("No files returned (cancelled or permission denied)", "warn");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const newItems: CapturedPhoto[] = [];

      for (let i = 0; i < fileList.length; i++) {
        const file = fileList[i];
        const { dataUrl, sizeKb } = await processFile(file, addLog);

        newItems.push({
          id: `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
          dataUrl,
          file,
          name: file.name || `photo_${photos.length + i + 1}.jpg`,
          sizeKb,
        });
      }

      setPhotos((prev) => {
        const total = [...prev, ...newItems];
        addLog(`Total photos ready: ${total.length}`, "success");
        return total;
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      addLog(`Process error: ${msg}`, "error");
      setError("Could not process photo. Please try again.");
      setShowDebug(true);
    } finally {
      setIsProcessing(false);
      target.value = "";
      setInputKey((k) => k + 1);
    }
  };

  const handleRemove = (id: string) => {
    setPhotos((prev) => {
      const updated = prev.filter((item) => item.id !== id);
      addLog(`Removed photo, remaining: ${updated.length}`);
      return updated;
    });
  };

  // ==========================================
  // SUBMIT TO COMPUTER (DIRECT SUPABASE CLOUD)
  // ==========================================
  const handleSubmit = async () => {
    if (!sessionId) {
      const msg = "Session ID missing. Please rescan QR code from your computer.";
      setError(msg);
      addLog(msg, "error");
      setShowDebug(true);
      return;
    }

    if (photos.length === 0) {
      const msg = "Please take at least 1 photo first.";
      setError(msg);
      addLog(msg, "warn");
      return;
    }

    // Stop live camera to conserve power
    stopLiveCamera();

    setUploading(true);
    setError(null);
    addLog(`Initiating transfer of ${photos.length} photo(s) to computer...`);

    let supabaseUploadSuccess = false;
    const uploadedPhotosList: { name: string; url: string; base64: string }[] = [];

    // STEP 1: Direct Cloud Upload to Supabase Storage (Bypasses LAN/Firewall)
    try {
      const supabase = createClient();
      addLog("Connecting directly to Supabase Cloud Storage (device-attachments)...");

      for (let i = 0; i < photos.length; i++) {
        const item = photos[i];
        const fileToSend =
          item.file || dataURLtoFile(item.dataUrl, item.name || `photo_${i + 1}.jpg`);
        const filePath = `intake_temp/${sessionId}/${Date.now()}_${i + 1}.jpg`;

        addLog(`Uploading #${i + 1} to Supabase Storage (${filePath})...`);

        const { error: sErr } = await supabase.storage
          .from("device-attachments")
          .upload(filePath, fileToSend, {
            contentType: fileToSend.type || "image/jpeg",
            upsert: true,
          });

        if (!sErr) {
          const { data: pUrl } = supabase.storage
            .from("device-attachments")
            .getPublicUrl(filePath);

          uploadedPhotosList.push({
            name: fileToSend.name,
            url: pUrl.publicUrl,
            base64: item.dataUrl,
          });
          addLog(`Supabase uploaded #${i + 1} successfully!`, "success");
        } else {
          addLog(`Supabase upload note: ${sErr.message}`, "warn");
        }
      }

      if (uploadedPhotosList.length > 0) {
        supabaseUploadSuccess = true;
        addLog("Broadcasting photos via Supabase Realtime Channel...");
        const channel = supabase.channel(`intake_${sessionId}`);
        channel.subscribe(async (status: any) => {
          if (status === "SUBSCRIBED") {
            await channel.send({
              type: "broadcast",
              event: "photos_ready",
              payload: { sessionId, photos: uploadedPhotosList },
            });
            addLog("Realtime WebSocket broadcast sent to computer!", "success");
          }
        });
      }
    } catch (sbErr) {
      addLog(`Supabase cloud attempt note: ${String(sbErr)}`, "warn");
    }

    // STEP 2: Secondary backup via local API
    try {
      addLog("Sending secondary backup payload to local computer API...");
      const formData = new FormData();
      formData.append("sessionId", sessionId);

      photos.forEach((item, index) => {
        const fileToSend =
          item.file || dataURLtoFile(item.dataUrl, item.name || `photo_${index + 1}.jpg`);
        formData.append("photos", fileToSend);
      });

      const res = await fetch("/api/companion-upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (res.ok && json.success) {
        addLog("Local API acknowledged photos successfully!", "success");
      }
    } catch (apiErr) {
      addLog(`Local API note: ${String(apiErr)}`, "warn");
    }

    if (supabaseUploadSuccess || uploadedPhotosList.length > 0) {
      addLog("SUCCESS! Photos transferred to computer screen.", "success");
      if (typeof window !== "undefined") {
        sessionStorage.removeItem(`crm_companion_${sessionId}`);
      }
      setUploaded(true);
    } else {
      const failMsg = "Failed to send photos. Please check internet connection and try again.";
      setError(failMsg);
      addLog(failMsg, "error");
      setShowDebug(true);
    }

    setUploading(false);
  };

  const handleCopyLogs = () => {
    const text = logs
      .map((l) => `[${l.timestamp}] [${l.type.toUpperCase()}] ${l.message}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopiedLogs(true);
    setTimeout(() => setCopiedLogs(false), 2000);
  };

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
        <h1 className="text-xl font-bold">Invalid QR Code Session</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">
          Please scan the QR code displayed on your computer screen to start an intake photo session.
        </p>
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 ring-8 ring-emerald-500/10">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-bold">Photos Transferred!</h1>
        <p className="text-sm text-slate-400 mt-2 max-w-xs">
          {photos.length} {photos.length === 1 ? "photo has" : "photos have"} been transferred to
          your computer screen.
        </p>
        <span className="inline-block mt-4 px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-300 text-xs font-semibold border border-emerald-800">
          Check laptop screen now
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col pb-28">
      {/* Top Sticky Header */}
      <header className="p-4 border-b border-slate-800 bg-slate-900/95 backdrop-blur-md sticky top-0 z-30 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Smartphone className="w-5 h-5 text-[#009688]" />
          <div>
            <h1 className="text-sm font-bold tracking-tight">Robuzta CRM Intake</h1>
            <p className="text-[11px] text-teal-400 font-medium">● Connected: {sessionId.substring(0, 10)}...</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Debug toggle pill */}
          <button
            type="button"
            onClick={() => setShowDebug(!showDebug)}
            className="flex items-center gap-1 text-[11px] font-mono px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
          >
            <Bug className="w-3.5 h-3.5 text-amber-400" />
            <span>{logs.length}</span>
            {showDebug ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>

          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded-full bg-slate-800 text-teal-300 border border-slate-700">
            {photos.length} {photos.length === 1 ? "Photo" : "Photos"}
          </span>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 p-4 max-w-md mx-auto w-full space-y-4">
        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* Processing Indicator */}
        {isProcessing && (
          <div className="p-3.5 rounded-xl bg-teal-500/20 border border-teal-500/40 text-teal-200 text-xs flex items-center gap-2.5">
            <Loader2 className="w-4 h-4 shrink-0 animate-spin text-teal-400" />
            <span className="font-medium">Reading captured photo from phone...</span>
          </div>
        )}

        {/* Debug Log Panel */}
        {showDebug && (
          <div className="rounded-xl border border-amber-500/40 bg-slate-900/95 overflow-hidden text-xs shadow-2xl">
            <div className="p-2.5 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
              <span className="font-bold text-amber-400 flex items-center gap-1.5 font-mono text-[11px]">
                <Bug className="w-3.5 h-3.5" />
                Live Debug Diagnostics ({logs.length} events)
              </span>
              <button
                type="button"
                onClick={handleCopyLogs}
                className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-800 hover:bg-slate-700 text-amber-300 border border-amber-500/30 flex items-center gap-1"
              >
                {copiedLogs ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copiedLogs ? "Copied" : "Copy Logs"}
              </button>
            </div>
            <div className="p-2.5 max-h-52 overflow-y-auto font-mono text-[11px] space-y-1 bg-black/60">
              {logs.length === 0 ? (
                <div className="text-slate-500 italic">No events logged yet.</div>
              ) : (
                logs.map((log, idx) => (
                  <div
                    key={idx}
                    className={`leading-tight ${
                      log.type === "error"
                        ? "text-rose-400 font-bold"
                        : log.type === "warn"
                        ? "text-amber-300"
                        : log.type === "success"
                        ? "text-emerald-400 font-semibold"
                        : "text-slate-300"
                    }`}
                  >
                    <span className="text-slate-500 mr-1.5">[{log.timestamp}]</span>
                    {log.message}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 
          =======================================================
          LIVE IN-BROWSER CAMERA VIEWFINDER (NO OS PROCESS KILL)
          =======================================================
        */}
        {isLiveCameraActive ? (
          <div className="relative rounded-2xl overflow-hidden bg-black border-2 border-teal-500 shadow-2xl space-y-2">
            <div className="relative aspect-[3/4] w-full overflow-hidden bg-black flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
              />

              {/* Shutter flash overlay */}
              {shutterFlash && (
                <div className="absolute inset-0 bg-white transition-opacity duration-150 pointer-events-none" />
              )}

              {/* Top Controls: Close & Flip */}
              <div className="absolute top-3 inset-x-3 flex items-center justify-between z-20">
                <button
                  type="button"
                  onClick={stopLiveCamera}
                  className="p-2 rounded-full bg-black/60 text-white hover:bg-black/80 backdrop-blur-md cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={flipCamera}
                  className="p-2 rounded-full bg-black/60 text-teal-300 hover:bg-black/80 backdrop-blur-md cursor-pointer flex items-center gap-1.5 text-xs font-semibold px-3"
                >
                  <SwitchCamera className="w-4 h-4" />
                  <span>Flip</span>
                </button>
              </div>

              {/* Bottom Shutter Action Bar */}
              <div className="absolute bottom-4 inset-x-0 flex items-center justify-center z-20">
                <button
                  type="button"
                  onClick={snapLivePhoto}
                  className="w-18 h-18 rounded-full border-4 border-white bg-teal-500 active:scale-90 active:bg-teal-400 transition-all flex items-center justify-center shadow-2xl cursor-pointer"
                >
                  <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                    <Camera className="w-7 h-7 text-teal-600" />
                  </div>
                </button>
              </div>
            </div>

            <p className="text-center text-[11px] text-teal-400 font-mono py-1.5">
              ● Live Viewfinder Active — Tap button to snap
            </p>
          </div>
        ) : (
          /* 
            =======================================================
            CAMERA TRIGGER BUTTONS
            =======================================================
          */
          <div className="space-y-3">
            {/* Primary Option: Open In-Browser Live Camera */}
            <button
              type="button"
              disabled={isStartingCamera}
              onClick={() => startLiveCamera("environment")}
              className="w-full relative overflow-hidden rounded-2xl border-2 border-[#009688] bg-[#009688]/15 hover:bg-[#009688]/25 active:bg-[#009688]/30 transition-all p-6 text-center cursor-pointer shadow-lg shadow-teal-950/40"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#009688]/25 border border-[#009688]/50 flex items-center justify-center mx-auto mb-2.5 text-[#009688]">
                {isStartingCamera ? (
                  <Loader2 className="w-7 h-7 animate-spin text-teal-400" />
                ) : (
                  <Aperture className="w-8 h-8 text-teal-400" />
                )}
              </div>
              <span className="text-base font-bold text-white block">
                {isStartingCamera ? "Starting Camera..." : "Open Live In-Browser Camera"}
              </span>
              <span className="text-xs text-slate-300 mt-1 block max-w-xs mx-auto">
                Opens camera directly inside this page without app reload
              </span>
            </button>

            {/* Secondary Option: Clean File/Gallery Picker (Zero capture bug!) */}
            <div className="relative overflow-hidden rounded-xl bg-slate-900 border border-slate-800 py-3 px-4 text-center cursor-pointer active:bg-slate-800 transition-colors">
              <input
                key={`gal_${inputKey}`}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => handleFileChange(e, "Standard Picker")}
                className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
              />
              <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-300">
                <ImageIcon className="w-4 h-4 text-teal-400" />
                <span>Or Choose from Phone Gallery / Files</span>
              </div>
            </div>
          </div>
        )}

        {/* 
          =======================================================
          CAPTURED PHOTOS PREVIEW GRID (DISPLAYED PROMINENTLY)
          =======================================================
        */}
        {photos.length > 0 && (
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between bg-teal-950/60 border border-teal-800/80 px-3.5 py-2 rounded-xl text-xs">
              <span className="font-semibold text-teal-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                {photos.length} {photos.length === 1 ? "Photo" : "Photos"} Captured & Ready
              </span>
              <span className="text-[11px] text-slate-400">Tap below to send</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {photos.map((item, i) => (
                <div
                  key={item.id}
                  className="relative w-full rounded-2xl overflow-hidden border-2 border-slate-700 bg-slate-900 shadow-xl group"
                  style={{ minHeight: "160px", height: "160px" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.dataUrl}
                    alt={`Intake photo ${i + 1}`}
                    loading="eager"
                    className="w-full h-full object-cover block"
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-black/30 pointer-events-none" />

                  <button
                    type="button"
                    onClick={() => handleRemove(item.id)}
                    className="absolute top-2 right-2 p-1.5 rounded-full bg-slate-950/90 text-rose-400 hover:text-white hover:bg-rose-600 transition-colors shadow-lg z-20 cursor-pointer"
                    aria-label="Remove photo"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md text-[10px] font-mono bg-slate-950/90 text-slate-200 border border-slate-700/60 z-20">
                    #{i + 1} • {item.sizeKb}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Sticky Send Button */}
      {photos.length > 0 && (
        <footer className="fixed bottom-0 inset-x-0 p-4 border-t border-slate-800 bg-slate-950/95 backdrop-blur-md z-30 max-w-md mx-auto">
          <button
            type="button"
            disabled={uploading || isProcessing}
            onClick={handleSubmit}
            className="w-full py-4 px-5 rounded-xl font-bold text-sm bg-[#009688] hover:bg-[#00796b] active:scale-[0.99] text-white flex items-center justify-center gap-2.5 shadow-xl shadow-teal-900/40 disabled:opacity-50 transition-all cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Sending {photos.length} photos to computer...</span>
              </>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>
                  Send {photos.length} {photos.length === 1 ? "Photo" : "Photos"} to Computer
                </span>
              </>
            )}
          </button>
        </footer>
      )}
    </div>
  );
}

export default function CompanionUploadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center text-teal-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      }
    >
      <CompanionUploadContent />
    </Suspense>
  );
}
