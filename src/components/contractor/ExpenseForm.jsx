import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, Upload, X, Loader2 } from "lucide-react";

const CATEGORIES = [
  { id: "fuel", label: "⛽ Fuel" },
  { id: "tolls", label: "🛣️ Tolls" },
  { id: "parking", label: "🅿️ Parking" },
  { id: "cleaning_supplies", label: "🧹 Cleaning Supplies" },
  { id: "pet_equipment", label: "🐾 Pet Equipment" },
  { id: "insurance", label: "🛡️ Insurance" },
  { id: "phone_software", label: "📱 Phone / Software" },
  { id: "maintenance", label: "🔧 Maintenance" },
  { id: "other", label: "📦 Other" },
];

export default function ExpenseForm({ driverEmail, onSaved }) {
  const today = new Date().toISOString().split("T")[0];
  const [form, setForm] = useState({ date: today, category: "", amount: "", notes: "" });
  const [receiptUrl, setReceiptUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleReceiptUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const res = await base44.integrations.Core.UploadFile({ file });
    setReceiptUrl(res.file_url);
    setUploading(false);
  };

  const handleSave = async () => {
    if (!form.category || !form.amount) return;
    setSaving(true);
    await base44.entities.ContractorExpense.create({
      driver_email: driverEmail,
      date: form.date,
      category: form.category,
      amount: Number(form.amount),
      notes: form.notes,
      receipt_url: receiptUrl || undefined,
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      setForm({ date: today, category: "", amount: "", notes: "" });
      setReceiptUrl(null);
      onSaved?.();
    }, 1200);
  };

  if (saved) {
    return (
      <div className="bg-[#EDF7F0] border border-[#52B788] rounded-2xl p-5 flex items-center gap-3">
        <CheckCircle2 className="w-5 h-5 text-[#40916C]" />
        <p className="text-sm font-semibold text-[#1B4332]">Expense saved!</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-[#EDF7F0] p-5 space-y-4">
      <h3 className="font-bold text-[#1B4332]">Add Expense</h3>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#1B4332]">Date *</Label>
          <Input type="date" value={form.date} onChange={e => set("date", e.target.value)}
            className="rounded-xl border-[#D8F3DC] h-10 text-sm" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs font-semibold text-[#1B4332]">Amount ($) *</Label>
          <Input type="number" min="0" step="0.01" value={form.amount}
            onChange={e => set("amount", e.target.value)}
            placeholder="0.00" className="rounded-xl border-[#D8F3DC] h-10 text-sm" />
        </div>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold text-[#1B4332]">Category *</Label>
        <Select value={form.category} onValueChange={v => set("category", v)}>
          <SelectTrigger className="rounded-xl border-[#D8F3DC] h-10 text-sm">
            <SelectValue placeholder="Select category…" />
          </SelectTrigger>
          <SelectContent>
            {CATEGORIES.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1">
        <Label className="text-xs font-semibold text-[#1B4332]">Notes (optional)</Label>
        <Textarea value={form.notes} onChange={e => set("notes", e.target.value)}
          placeholder="Description or vendor name…" rows={2}
          className="rounded-xl border-[#D8F3DC] text-sm resize-none" />
      </div>

      {/* Receipt upload */}
      <div className="space-y-1">
        <Label className="text-xs font-semibold text-[#1B4332]">Receipt Photo (optional)</Label>
        {receiptUrl ? (
          <div className="flex items-center gap-2 bg-[#EDF7F0] rounded-xl px-3 py-2">
            <img src={receiptUrl} alt="receipt" className="w-10 h-10 object-cover rounded-lg" />
            <span className="text-xs text-[#2D6A4F] flex-1">Receipt uploaded</span>
            <button onClick={() => setReceiptUrl(null)}><X className="w-4 h-4 text-[#6B5B4F]" /></button>
          </div>
        ) : (
          <label className="flex items-center gap-2 border border-dashed border-[#D8F3DC] rounded-xl px-4 py-3 cursor-pointer hover:bg-[#F9F7F3] transition">
            {uploading ? <Loader2 className="w-4 h-4 animate-spin text-[#52B788]" /> : <Upload className="w-4 h-4 text-[#52B788]" />}
            <span className="text-xs text-[#6B5B4F]">{uploading ? "Uploading…" : "Tap to upload receipt"}</span>
            <input type="file" accept="image/*" className="hidden" onChange={handleReceiptUpload} />
          </label>
        )}
      </div>

      <Button onClick={handleSave} disabled={saving || !form.category || !form.amount}
        className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-11 font-semibold">
        {saving ? "Saving…" : "Save Expense"}
      </Button>
    </div>
  );
}