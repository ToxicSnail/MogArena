"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Summary = { processed:number;imported:number;placeholder:number;noPhoto:number;notFound:number;cached:number;errors:number };

export function ImportPanel() {
  const [text,setText]=useState("99999999999999999991\n99999999999999999992\n99999999999999999993"); const [force,setForce]=useState(false); const [loading,setLoading]=useState(false); const [summary,setSummary]=useState<Summary|null>(null);
  async function run() { let ids:string[];try{const trimmed=text.trim();if(trimmed.startsWith("[")){const parsed:unknown=JSON.parse(trimmed);if(!Array.isArray(parsed))throw new Error();ids=parsed.map((item)=>typeof item==="string"?item:typeof item==="object"&&item&&"externalId" in item?String(item.externalId):"").filter(Boolean);}else ids=text.split(/\r?\n/).map((id)=>id.trim()).filter(Boolean);}catch{toast.error("Invalid JSON input");return;}setLoading(true);try{const response=await fetch("/api/admin/import",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({ids,force})});const body=await response.json();if(!response.ok){toast.error(body.error??"Import failed");return;}setSummary(body.summary);toast.success("Import completed");}catch{toast.error("Network error");}finally{setLoading(false);} }
  async function loadFile(file?:File){if(file)setText(await file.text());}
  return <div className="space-y-5"><Card className="p-6"><label className="font-bold">Profile IDs, one per line</label><textarea value={text} onChange={(e)=>setText(e.target.value)} rows={9} className="mt-2 w-full rounded-xl border bg-transparent p-3 font-mono text-sm" /><div className="mt-3 flex flex-wrap items-center gap-3"><input type="file" accept=".txt,.json" onChange={(e)=>loadFile(e.target.files?.[0])} /><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={force} onChange={(e)=>setForce(e.target.checked)} /> Force refresh cached profiles</label></div><Button className="mt-5" disabled={loading} onClick={run}>{loading?"Importing...":"Run importer"}</Button></Card>{summary&&<Card className="p-6"><h2 className="mb-4 text-xl font-black">Import stats</h2><div className="grid grid-cols-2 gap-3 sm:grid-cols-4">{Object.entries(summary).map(([key,value])=><div className="rounded-xl bg-[var(--background)] p-3" key={key}><span className="block text-xs capitalize text-[var(--muted)]">{key}</span><b className="text-xl">{value}</b></div>)}</div></Card>}</div>;
}
