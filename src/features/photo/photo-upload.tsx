"use client";

import { Camera, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function PhotoUpload({ kind, label }: { kind: "avatar" | "battle"; label: string }) {
  const input = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [uploading, setUploading] = useState(false);

  async function upload(file?: File) {
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData(); form.set("file", file); form.set("kind", kind);
      const response = await fetch("/api/photos", { method: "POST", body: form });
      if (!response.ok) { toast.error((await response.json()).error ?? "Upload failed"); return; }
      toast.success(kind === "avatar" ? "Avatar updated" : "Battle photo is active"); router.refresh();
    } catch { toast.error("Network error"); }
    finally { setUploading(false); }
  }
  return <><input ref={input} className="hidden" type="file" accept="image/jpeg,image/png,image/webp" onChange={(e) => upload(e.target.files?.[0])} /><Button variant="secondary" size="sm" disabled={uploading} onClick={() => input.current?.click()}>{kind === "avatar" ? <Camera className="h-4 w-4" /> : <Upload className="h-4 w-4" />}{uploading ? "Uploading..." : label}</Button></>;
}
