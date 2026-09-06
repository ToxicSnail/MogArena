"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export function EditProfile({ bio }: { bio: string | null }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [about, setAbout] = useState(bio ?? "");

  async function save() {
    setSaving(true);
    try {
      const response = await fetch("/api/users/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bio: about || null }) });
      if (!response.ok) { toast.error((await response.json()).error ?? "Update failed"); return; }
      toast.success("Profile updated"); setOpen(false); router.refresh();
    } catch { toast.error("Network error"); }
    finally { setSaving(false); }
  }

  if (!open) return <Button variant="secondary" onClick={() => setOpen(true)}>Edit profile</Button>;
  return <div className="mt-5 space-y-3 rounded-xl border p-4 text-left"><label className="block"><span className="mb-1 block text-sm font-bold">Bio</span><textarea maxLength={500} rows={4} value={about} onChange={(e) => setAbout(e.target.value)} className="w-full resize-none rounded-lg border bg-transparent p-3" /></label><div className="flex gap-2"><Button disabled={saving} onClick={save}>{saving ? "Saving..." : "Save"}</Button><Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button></div></div>;
}
