"use client";
// Tax exemption document upload (MVP story 8). Once an admin approves it,
// wholesale orders and accepted quotes are charged without GST.
import { useCallback, useEffect, useState } from "react";
import { Panel, inputStyle, buttonStyle } from "@/app/portal-ui/PortalUI";
import { shortDate } from "@/app/portal-ui/usePortalData";
import { TAX_DOC_MAX_BYTES, TAX_DOC_TYPES } from "@/lib/wholesale/quotes";

type Exemption = { status: "pending" | "approved" | "denied"; fileName: string; certificateNumber: string; expiresOn: string | null; uploadedAt: string; note?: string };

const STATUS: Record<Exemption["status"], { text: string; cls: string }> = {
  pending: { text: "Waiting for review", cls: "border-amber-300 bg-amber-50 text-[#735413]" },
  approved: { text: "Approved: orders are GST exempt", cls: "border-green-300 bg-green-50 text-green-800" },
  denied: { text: "Not approved", cls: "border-red-200 bg-red-50 text-red-800" },
};

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Couldn't read the file."));
    reader.readAsDataURL(file);
  });
}

export default function TaxExemptionPanel() {
  const [current, setCurrent] = useState<Exemption | null | undefined>(undefined);
  const [file, setFile] = useState<File | null>(null);
  const [certificateNumber, setCertificateNumber] = useState("");
  const [expiresOn, setExpiresOn] = useState("");
  const [sending, setSending] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/wholesale/tax-exemption", { credentials: "include", cache: "no-store" });
    const data = await res.json().catch(() => ({}));
    setCurrent(res.ok ? data.taxExemption : null);
  }, []);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load once
    void load();
  }, [load]);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setMessage({ ok: false, text: "Choose the document to upload." });
    if (file.size > TAX_DOC_MAX_BYTES) return setMessage({ ok: false, text: "That file is too big. Please keep it under 700 KB." });
    setSending(true);
    setMessage(null);
    try {
      const data = await toBase64(file);
      const res = await fetch("/api/wholesale/tax-exemption", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileName: file.name, contentType: file.type, data, certificateNumber, expiresOn }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? "Upload failed.");
      setMessage({ ok: true, text: "Uploaded. We'll review it and update the status here." });
      setFile(null);
      await load();
    } catch (err) {
      setMessage({ ok: false, text: (err as Error).message });
    } finally {
      setSending(false);
    }
  }

  return (
    <Panel title="Tax exemption">
      <p className="text-sm text-zinc-600">If your business is exempt from GST, upload your exemption certificate. Once approved, your orders are charged without GST.</p>
      {current && (
        <div className={`mt-4 rounded-lg border p-3 text-sm ${STATUS[current.status].cls}`}>
          <p className="font-semibold">{STATUS[current.status].text}</p>
          <p className="mt-1">
            <a className="underline" href="/api/wholesale/tax-exemption?file=me" target="_blank" rel="noreferrer">{current.fileName}</a>
            {" "}· No. {current.certificateNumber} · uploaded {shortDate(current.uploadedAt)}{current.expiresOn ? ` · expires ${shortDate(current.expiresOn)}` : ""}
          </p>
          {current.note && <p className="mt-1">Note: {current.note}</p>}
        </div>
      )}
      <form onSubmit={upload} className="mt-4 space-y-3">
        <label className="block text-xs font-medium text-zinc-600">Document (PDF, JPG or PNG, up to 700 KB)
          <input type="file" accept={TAX_DOC_TYPES.join(",")} className={`${inputStyle} mt-1`} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-xs font-medium text-zinc-600">Exemption / certificate number
            <input required minLength={3} className={`${inputStyle} mt-1`} value={certificateNumber} onChange={(e) => setCertificateNumber(e.target.value)} />
          </label>
          <label className="block text-xs font-medium text-zinc-600">Expires on (optional)
            <input type="date" className={`${inputStyle} mt-1`} value={expiresOn} onChange={(e) => setExpiresOn(e.target.value)} />
          </label>
        </div>
        <button type="submit" disabled={sending} className={`${buttonStyle} disabled:bg-zinc-300`}>{sending ? "Uploading…" : current ? "Upload a new document" : "Upload document"}</button>
        {message && <p role="status" className={`text-sm ${message.ok ? "text-green-700" : "text-red-700"}`}>{message.text}</p>}
      </form>
    </Panel>
  );
}
