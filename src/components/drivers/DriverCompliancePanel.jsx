import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQueryClient } from "@tanstack/react-query";
import { Shield, Upload, CheckCircle2, AlertTriangle, XCircle, Car, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";

export function getInsuranceStatus(driver) {
  if (!driver.insurance_expiration_date || !driver.insurance_verified) {
    return { status: "missing", label: "Not Verified", color: "bg-red-100 text-red-700 border-red-200" };
  }
  const exp = new Date(driver.insurance_expiration_date);
  const now = new Date();
  const daysLeft = Math.floor((exp - now) / 86400000);
  if (daysLeft < 0) return { status: "expired", label: "Expired", color: "bg-red-100 text-red-700 border-red-200", daysLeft };
  if (daysLeft <= 30) return { status: "expiring", label: `Expiring in ${daysLeft}d`, color: "bg-amber-100 text-amber-700 border-amber-200", daysLeft };
  return { status: "valid", label: "Verified", color: "bg-green-100 text-green-700 border-green-200", daysLeft };
}

export function isDriverAssignable(driver) {
  const { status } = getInsuranceStatus(driver);
  return status === "valid";
}

export default function DriverCompliancePanel({ driver, isAdmin = false }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState({
    vehicle_type: driver.vehicle_type || "",
    vehicle_make: driver.vehicle_make || "",
    vehicle_model: driver.vehicle_model || "",
    vehicle_year: driver.vehicle_year || "",
    insurance_company: driver.insurance_company || "",
    insurance_policy_number: driver.insurance_policy_number || "",
    insurance_expiration_date: driver.insurance_expiration_date || "",
    insurance_card_url: driver.insurance_card_url || "",
    insurance_verified: driver.insurance_verified || false,
  });

  const insuranceStatus = getInsuranceStatus({ ...driver, ...form });

  async function handleUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const { file_url } = await base44.integrations.Core.UploadFile({ file });
    setForm(f => ({ ...f, insurance_card_url: file_url }));
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    await base44.entities.User.update(driver.id, form);
    queryClient.invalidateQueries({ queryKey: ["driver", driver.id] });
    queryClient.invalidateQueries({ queryKey: ["drivers"] });
    queryClient.invalidateQueries({ queryKey: ["drivers-list"] });
    setSaving(false);
    setEditing(false);
  }

  const StatusIcon = insuranceStatus.status === "valid" ? CheckCircle2
    : insuranceStatus.status === "expiring" ? AlertTriangle : XCircle;

  return (
    <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-[#2D6A4F]" />
          <h2 className="text-lg font-bold text-[#1B4332]">Driver Compliance</h2>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={`border text-xs ${insuranceStatus.color}`}>
            <StatusIcon className="w-3 h-3 mr-1" />
            {insuranceStatus.label}
          </Badge>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setEditing(!editing)}
            className="h-8 text-xs border-[#D8F3DC] text-[#1B4332] rounded-lg"
          >
            {editing ? "Cancel" : "Edit"}
          </Button>
        </div>
      </div>

      {editing ? (
        <div className="space-y-6">
          {/* Vehicle Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Car className="w-4 h-4 text-[#2D6A4F]" />
              <h3 className="text-sm font-bold text-[#1B4332]">Vehicle Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Vehicle Type</Label>
                <Select value={form.vehicle_type} onValueChange={v => setForm(f => ({ ...f, vehicle_type: v }))}>
                  <SelectTrigger className="border-[#D8F3DC] rounded-xl text-sm">
                    <SelectValue placeholder="Select type…" />
                  </SelectTrigger>
                  <SelectContent>
                    {["Sedan", "SUV", "Van", "Truck", "Other"].map(t => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Make</Label>
                <Input value={form.vehicle_make} onChange={e => setForm(f => ({ ...f, vehicle_make: e.target.value }))} placeholder="Toyota" className="border-[#D8F3DC] rounded-xl text-sm" />
              </div>
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Model</Label>
                <Input value={form.vehicle_model} onChange={e => setForm(f => ({ ...f, vehicle_model: e.target.value }))} placeholder="Sienna" className="border-[#D8F3DC] rounded-xl text-sm" />
              </div>
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Year</Label>
                <Input value={form.vehicle_year} onChange={e => setForm(f => ({ ...f, vehicle_year: e.target.value }))} placeholder="2022" className="border-[#D8F3DC] rounded-xl text-sm" />
              </div>
            </div>
          </div>

          {/* Insurance Info */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <FileText className="w-4 h-4 text-[#2D6A4F]" />
              <h3 className="text-sm font-bold text-[#1B4332]">Insurance Information</h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Insurance Company</Label>
                <Input value={form.insurance_company} onChange={e => setForm(f => ({ ...f, insurance_company: e.target.value }))} placeholder="State Farm" className="border-[#D8F3DC] rounded-xl text-sm" />
              </div>
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Policy Number</Label>
                <Input value={form.insurance_policy_number} onChange={e => setForm(f => ({ ...f, insurance_policy_number: e.target.value }))} placeholder="SF-123456" className="border-[#D8F3DC] rounded-xl text-sm" />
              </div>
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Expiration Date</Label>
                <Input type="date" value={form.insurance_expiration_date} onChange={e => setForm(f => ({ ...f, insurance_expiration_date: e.target.value }))} className="border-[#D8F3DC] rounded-xl text-sm" />
              </div>
              <div>
                <Label className="text-xs text-[#6B5B4F]/70 mb-1 block">Insurance Card</Label>
                <label className="flex items-center gap-2 cursor-pointer border border-dashed border-[#D8F3DC] rounded-xl px-3 py-2 hover:bg-[#EDF7F0] transition-colors">
                  <Upload className="w-3.5 h-3.5 text-[#2D6A4F]" />
                  <span className="text-xs text-[#2D6A4F]">{uploading ? "Uploading…" : form.insurance_card_url ? "Replace file" : "Upload file"}</span>
                  <input type="file" accept="image/*,.pdf" className="hidden" onChange={handleUpload} disabled={uploading} />
                </label>
                {form.insurance_card_url && (
                  <a href={form.insurance_card_url} target="_blank" rel="noreferrer" className="text-xs text-[#2D6A4F] underline mt-1 block">View uploaded file</a>
                )}
              </div>
            </div>
          </div>

          {/* Verified toggle — admin only */}
          {isAdmin && (
            <div className="flex items-center justify-between bg-[#EDF7F0] rounded-xl px-4 py-3">
              <div>
                <p className="text-sm font-medium text-[#1B4332]">Insurance Verified</p>
                <p className="text-xs text-[#6B5B4F]/60">Mark as verified after reviewing insurance card</p>
              </div>
              <Switch checked={form.insurance_verified} onCheckedChange={v => setForm(f => ({ ...f, insurance_verified: v }))} />
            </div>
          )}

          <Button onClick={handleSave} disabled={saving} className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl w-full">
            {saving ? "Saving…" : "Save Compliance Info"}
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Vehicle display */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Car className="w-4 h-4 text-[#2D6A4F]" />
              <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Vehicle</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-[#6B5B4F]/50 text-xs">Type</span><p className="font-medium text-[#1B4332]">{driver.vehicle_type || "—"}</p></div>
              <div><span className="text-[#6B5B4F]/50 text-xs">Year</span><p className="font-medium text-[#1B4332]">{driver.vehicle_year || "—"}</p></div>
              <div><span className="text-[#6B5B4F]/50 text-xs">Make</span><p className="font-medium text-[#1B4332]">{driver.vehicle_make || "—"}</p></div>
              <div><span className="text-[#6B5B4F]/50 text-xs">Model</span><p className="font-medium text-[#1B4332]">{driver.vehicle_model || "—"}</p></div>
            </div>
          </div>

          {/* Insurance display */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileText className="w-4 h-4 text-[#2D6A4F]" />
              <h3 className="text-xs font-bold text-[#1B4332] uppercase tracking-wide">Insurance</h3>
            </div>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div><span className="text-[#6B5B4F]/50 text-xs">Company</span><p className="font-medium text-[#1B4332]">{driver.insurance_company || "—"}</p></div>
              <div><span className="text-[#6B5B4F]/50 text-xs">Policy #</span><p className="font-medium text-[#1B4332]">{driver.insurance_policy_number || "—"}</p></div>
              <div>
                <span className="text-[#6B5B4F]/50 text-xs">Expires</span>
                <p className="font-medium text-[#1B4332]">{driver.insurance_expiration_date || "—"}</p>
              </div>
              <div>
                <span className="text-[#6B5B4F]/50 text-xs">Verified</span>
                <p className={`font-medium ${driver.insurance_verified ? "text-green-600" : "text-red-500"}`}>
                  {driver.insurance_verified ? "Yes" : "No"}
                </p>
              </div>
            </div>
            {driver.insurance_card_url && (
              <a href={driver.insurance_card_url} target="_blank" rel="noreferrer" className="text-xs text-[#2D6A4F] underline mt-2 block">View Insurance Card</a>
            )}
          </div>

          {/* Warning banners */}
          {(insuranceStatus.status === "expiring" || insuranceStatus.status === "expired") && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs text-amber-700 font-medium">
                {insuranceStatus.status === "expired"
                  ? "Insurance has expired. This driver cannot be assigned to trips."
                  : `Insurance expires in ${insuranceStatus.daysLeft} days. Please renew soon.`}
              </p>
            </div>
          )}
          {!driver.insurance_verified && (
            <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
              <XCircle className="w-4 h-4 text-red-500 shrink-0" />
              <p className="text-xs text-red-600 font-medium">Insurance not yet verified. This driver cannot be assigned to trips.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}