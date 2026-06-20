import React, { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Shield, FileText, CheckCircle2, AlertTriangle, Clock, Search, HelpCircle, Loader2 } from "lucide-react";

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState("clearance"); // 'clearance', 'override', 'policy'
  const [userRole, setUserRole] = useState("super_admin"); // 'admin' or 'super_admin'

  // Document clearance form states
  const [profileId, setProfileId] = useState("mock-rocky-id");
  const [docType, setDocType] = useState("rabies_certificate");
  const [docUrl, setDocUrl] = useState("https://pawffeur-docs.s3.amazonaws.com/cert-rocky.pdf");
  const [status, setStatus] = useState("pending_review");
  const [vetName, setVetName] = useState("");
  const [vetLicense, setVetLicense] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [clinicPhone, setClinicPhone] = useState("");
  const [vaccineManufacturer, setVaccineManufacturer] = useState("");
  const [vaccineLot, setVaccineLot] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [pdfIntegrity, setPdfIntegrity] = useState(false);
  const [pdfChecksum, setPdfChecksum] = useState("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  const [rejectionReason, setRejectionReason] = useState("");
  const [savingClearance, setSavingClearance] = useState(false);

  // Super-Admin Override states
  const [overrideTripId, setOverrideTripId] = useState("TRIP-MOCK-1");
  const [overrideProfileId, setOverrideProfileId] = useState("mock-rocky-id");
  const [overrideCategory, setOverrideCategory] = useState("medical_emergency");
  const [overrideNotes, setOverrideNotes] = useState("");
  const [bypassHours, setBypassHours] = useState("12");
  const [savingOverride, setSavingOverride] = useState(false);

  // Expiry states
  const [issueDate, setIssueDate] = useState("");
  const [policyRabiesMaxAge, setPolicyRabiesMaxAge] = useState(1095);
  const [policyUsdaMaxAge, setPolicyUsdaMaxAge] = useState(30);
  const [policyDocExpiryWarning, setPolicyDocExpiryWarning] = useState(30);
  const [localRabiesMaxAge, setLocalRabiesMaxAge] = useState(1095);
  const [localUsdaMaxAge, setLocalUsdaMaxAge] = useState(30);
  const [localDocExpiryWarning, setLocalDocExpiryWarning] = useState(30);
  const [allClearances, setAllClearances] = useState([]);
  const [loadingAllClearances, setLoadingAllClearances] = useState(false);
  const [triggeringCron, setTriggeringCron] = useState(false);
  const [cronLogs, setCronLogs] = useState([]);

  // Policies configuration states
  const [policies, setPolicies] = useState([]);
  const [loadingPolicies, setLoadingPolicies] = useState(false);
  const [updatingPolicyKey, setUpdatingPolicyKey] = useState("");
  const [localMaxHours, setLocalMaxHours] = useState(12);
  const [localMinChars, setLocalMinChars] = useState(50);
  const [policyMaxHours, setPolicyMaxHours] = useState(12);
  const [policyMinChars, setPolicyMinChars] = useState(50);

  // Fetch clearances for currently selected profile
  const { data: clearanceRecords = [], refetch: refetchClearances, isLoading: loadingClearances } = useQuery({
    queryKey: ["admin-clearances", profileId],
    queryFn: async () => {
      const res = await fetch(`/api/admin-document-clearance?passenger_profile_id=${profileId}`);
      if (!res.ok) throw new Error("Failed to load clearance records");
      const json = await res.json();
      return json.data;
    },
    enabled: !!profileId,
  });

  // Pre-fill fields when selecting an existing record
  const handleSelectRecord = (rec) => {
    setDocType(rec.document_type);
    setDocUrl(rec.document_url);
    setStatus(rec.status);
    setVetName(rec.vet_signing_name || "");
    setVetLicense(rec.vet_license_number || "");
    setClinicName(rec.clinic_name || "");
    setClinicPhone(rec.clinic_phone || "");
    setVaccineManufacturer(rec.vaccine_manufacturer || "");
    setVaccineLot(rec.vaccine_lot_number || "");
    setExpirationDate(rec.vaccine_expiration_date || "");
    setIssueDate(rec.issue_date || "");
    setPdfIntegrity(!!rec.pdf_integrity_checked);
    setPdfChecksum(rec.pdf_checksum || "");
    setRejectionReason(rec.rejection_reason || "");
  };

  async function handleSaveClearance() {
    if (status === "approved_active") {
      if (!vetName || !vetLicense || !clinicName || !vaccineLot || !expirationDate || !issueDate) {
        toast.error("Please fill in all mandatory QA fields to approve the document (including Issue Date).");
        return;
      }
      if (!pdfIntegrity) {
        toast.error("Please check the PDF Integrity Checklist checkbox before approving.");
        return;
      }
    }
    if (status === "rejected" && !rejectionReason.trim()) {
      toast.error("Please enter a rejection reason.");
      return;
    }

    setSavingClearance(true);
    try {
      const res = await fetch("/api/admin-document-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passenger_profile_id: profileId,
          document_type: docType,
          document_url: docUrl,
          status,
          vet_signing_name: vetName || null,
          vet_license_number: vetLicense || null,
          clinic_name: clinicName || null,
          clinic_phone: clinicPhone || null,
          vaccine_manufacturer: vaccineManufacturer || null,
          vaccine_lot_number: vaccineLot || null,
          vaccine_expiration_date: expirationDate || null,
          issue_date: issueDate || null,
          pdf_integrity_checked: pdfIntegrity,
          pdf_checksum: pdfChecksum || null,
          rejection_reason: status === "rejected" ? rejectionReason : null,
          reviewed_by: "office-admin@pawffeur.com"
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save clearance");
      }

      toast.success("Document clearance record updated successfully!");
      refetchClearances();
      fetchAllClearances();
    } catch (e) {
      toast.error(e.message || "Failed to update record");
    } finally {
      setSavingClearance(false);
    }
  }

  const fetchPolicies = async () => {
    setLoadingPolicies(true);
    try {
      const res = await fetch(`/api/admin-policy-config?role=${userRole}`);
      if (!res.ok) {
        throw new Error("Failed to retrieve system policies");
      }
      const json = await res.json();
      const loadedPolicies = json.data || [];
      setPolicies(loadedPolicies);
      const maxHoursPol = loadedPolicies.find(p => p.policy_key === "override_max_hours");
      if (maxHoursPol) {
        setLocalMaxHours(maxHoursPol.value_number);
        setPolicyMaxHours(maxHoursPol.value_number);
      }
      const minCharsPol = loadedPolicies.find(p => p.policy_key === "override_min_audit_chars");
      if (minCharsPol) {
        setLocalMinChars(minCharsPol.value_number);
        setPolicyMinChars(minCharsPol.value_number);
      }
      const rabiesMaxAgePol = loadedPolicies.find(p => p.policy_key === "rabies_max_age_days");
      if (rabiesMaxAgePol) {
        setLocalRabiesMaxAge(rabiesMaxAgePol.value_number);
        setPolicyRabiesMaxAge(rabiesMaxAgePol.value_number);
      }
      const usdaMaxAgePol = loadedPolicies.find(p => p.policy_key === "usda_max_age_days");
      if (usdaMaxAgePol) {
        setLocalUsdaMaxAge(usdaMaxAgePol.value_number);
        setPolicyUsdaMaxAge(usdaMaxAgePol.value_number);
      }
      const docExpiryWarningPol = loadedPolicies.find(p => p.policy_key === "doc_expiry_warning_days");
      if (docExpiryWarningPol) {
        setLocalDocExpiryWarning(docExpiryWarningPol.value_number);
        setPolicyDocExpiryWarning(docExpiryWarningPol.value_number);
      }
    } catch (err) {
      console.warn("Failed to load policies:", err);
    } finally {
      setLoadingPolicies(false);
    }
  };

  const fetchAllClearances = async () => {
    setLoadingAllClearances(true);
    try {
      const res = await fetch(`/api/admin-document-clearance?all=true&role=${userRole}`);
      if (!res.ok) throw new Error("Failed to load warnings console");
      const json = await res.json();
      setAllClearances(json.data || []);
    } catch (e) {
      console.warn("Failed to fetch clearances for warnings panel:", e);
    } finally {
      setLoadingAllClearances(false);
    }
  };

  useEffect(() => {
    if (userRole === "super_admin") {
      fetchPolicies();
    } else {
      setPolicyMaxHours(12);
      setPolicyMinChars(50);
      setPolicyRabiesMaxAge(1095);
      setPolicyUsdaMaxAge(30);
      setPolicyDocExpiryWarning(30);
    }

    if (userRole === "super_admin" || userRole === "admin") {
      fetchAllClearances();
    }
  }, [userRole]);

  useEffect(() => {
    if (activeTab === "policy" && userRole === "super_admin") {
      fetchPolicies();
    }
  }, [activeTab]);

  useEffect(() => {
    if (parseInt(bypassHours, 10) > policyMaxHours) {
      setBypassHours(String(policyMaxHours));
    }
  }, [policyMaxHours]);

  const handleUpdatePolicy = async (key, val) => {
    setUpdatingPolicyKey(key);
    try {
      const res = await fetch("/api/admin-policy-config", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          policy_key: key,
          value_number: val,
          role: userRole,
          updated_by: "super-admin@pawffeur.com"
        })
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to update policy");
      }
      toast.success(json.message || `Policy ${key} updated successfully!`);
      await fetchPolicies();
      fetchAllClearances();
    } catch (err) {
      toast.error(err.message || "Failed to save policy changes");
    } finally {
      setUpdatingPolicyKey("");
    }
  };

  const getDocumentStatus = (doc) => {
    if (doc.status !== "approved_active") {
      return { status: doc.status, daysRemaining: null };
    }
    
    let maxAgeDays = doc.document_type === "rabies_certificate" ? policyRabiesMaxAge : policyUsdaMaxAge;
    let calculatedExpiry;
    
    if (doc.issue_date) {
      const issDate = new Date(doc.issue_date);
      const maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
      const policyExpiry = new Date(issDate.getTime() + maxAgeMs);
      
      if (doc.document_type === "rabies_certificate" && doc.vaccine_expiration_date) {
        const vetExpDate = new Date(doc.vaccine_expiration_date);
        calculatedExpiry = policyExpiry < vetExpDate ? policyExpiry : vetExpDate;
      } else {
        calculatedExpiry = policyExpiry;
      }
    } else {
      calculatedExpiry = doc.calculated_expiry_at ? new Date(doc.calculated_expiry_at) : new Date(doc.vaccine_expiration_date);
    }
    
    const today = new Date();
    today.setHours(0,0,0,0);
    calculatedExpiry.setHours(0,0,0,0);
    
    if (calculatedExpiry < today) {
      return { status: "expired", daysRemaining: 0, expiryDate: calculatedExpiry.toISOString().split("T")[0] };
    }
    
    const diffTime = calculatedExpiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= policyDocExpiryWarning) {
      return { status: "expiring_soon", daysRemaining: diffDays, expiryDate: calculatedExpiry.toISOString().split("T")[0] };
    }
    
    return { status: "valid", daysRemaining: diffDays, expiryDate: calculatedExpiry.toISOString().split("T")[0] };
  };

  async function handleSaveOverride() {
    if (!overrideNotes || overrideNotes.trim().length < policyMinChars) {
      toast.error(`Audit requirement: Notes must explain the emergency in detail (min ${policyMinChars} chars).`);
      return;
    }

    setSavingOverride(true);
    try {
      const expDate = new Date(Date.now() + parseInt(bypassHours, 10) * 60 * 60 * 1000);
      const res = await fetch("/api/super-admin-override", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          trip_id: overrideTripId,
          passenger_profile_id: overrideProfileId,
          reason_category: overrideCategory,
          override_notes: overrideNotes,
          bypass_expires_at: expDate.toISOString(),
          role: userRole,
          overridden_by: "super-admin@pawffeur.com"
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to log override");
      }

      toast.success("Super-Admin emergency bypass granted!");
      setOverrideNotes("");
    } catch (e) {
      toast.error(e.message || "Override failed");
    } finally {
      setSavingOverride(false);
    }
  }

  const handleTriggerCron = async () => {
    setTriggeringCron(true);
    setCronLogs([]);
    try {
      const res = await fetch("/api/admin-expiry-notifications", {
        method: "POST"
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to trigger notifications cron");
      }
      toast.success(`Cron executed! Notified ${json.notified_count} passengers.`);
      if (json.logs && json.logs.length > 0) {
        setCronLogs(json.logs);
      } else {
        setCronLogs(["Cron run completed successfully. No new passenger warnings met the notification criteria."]);
      }
      fetchAllClearances();
    } catch (err) {
      toast.error(err.message || "Failed to execute cron");
    } finally {
      setTriggeringCron(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 p-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EDF7F0] pb-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1B4332] flex items-center gap-2">
            <Shield className="w-6 h-6 text-[#52B788]" />
            Admin Dispatch & Clearance
          </h1>
          <p className="text-xs text-[#6B5B4F]/70 mt-1">
            Pre-verify passenger veterinary health records or manage emergency dispatch exceptions.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-[#EDF7F0]/80 rounded-xl px-2.5 py-1.5 border border-[#D8F3DC]">
            <span className="text-[10px] uppercase font-bold text-[#6B5B4F]/80">Role Context:</span>
            <select
              value={userRole}
              onChange={(e) => {
                setUserRole(e.target.value);
                if (e.target.value !== "super_admin" && activeTab === "policy") {
                  setActiveTab("clearance");
                }
              }}
              className="bg-transparent text-xs font-bold text-[#1B4332] outline-none cursor-pointer border-none p-0 focus:ring-0"
            >
              <option value="admin">Office Admin</option>
              <option value="super_admin">Super Admin</option>
            </select>
          </div>
          <Badge className="bg-[#1B4332] text-white py-1 px-3 rounded-full font-bold text-xs shadow-sm">
            Office Console
          </Badge>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 bg-[#EDF7F0]/60 rounded-xl p-1 max-w-lg">
        <button
          onClick={() => setActiveTab("clearance")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
            activeTab === "clearance" ? "bg-[#1B4332] text-white shadow-sm" : "text-[#6B5B4F] hover:text-[#1B4332]"
          }`}
        >
          🩺 Health Clearance
        </button>
        <button
          onClick={() => setActiveTab("override")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
            activeTab === "override" ? "bg-[#1B4332] text-white shadow-sm" : "text-[#6B5B4F] hover:text-[#1B4332]"
          }`}
        >
          🚨 Emergency Override
        </button>
        {userRole === "super_admin" && (
          <button
            onClick={() => setActiveTab("policy")}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-semibold transition ${
              activeTab === "policy" ? "bg-[#1B4332] text-white shadow-sm" : "text-[#6B5B4F] hover:text-[#1B4332]"
            }`}
          >
            ⚙️ Policy Config
          </button>
        )}
      </div>

      {/* Tab Content: Clearance */}
      {activeTab === "clearance" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left panel: Profiles & Existing Records */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-white border border-[#EDF7F0] rounded-2xl p-4 shadow-sm space-y-4">
              <div>
                <Label className="text-xs font-bold text-[#1B4332] uppercase">Select Profile</Label>
                <select
                  value={profileId}
                  onChange={(e) => setProfileId(e.target.value)}
                  className="w-full rounded-xl border border-gray-200 bg-white p-2.5 text-xs font-medium focus:ring-[#52B788] outline-none mt-1"
                >
                  <option value="mock-rocky-id">Rocky (Dog - Golden Retriever)</option>
                  <option value="mock-luna-id">Luna (Cat - Siamese)</option>
                  <option value="new-profile">Test Profile ID (Lookup)</option>
                </select>
              </div>

              {profileId === "new-profile" && (
                <div>
                  <Label className="text-xs font-bold text-[#1B4332] uppercase">Write-in Profile ID</Label>
                  <input
                    type="text"
                    value={profileId === "new-profile" ? "" : profileId}
                    onChange={(e) => setProfileId(e.target.value)}
                    placeholder="Enter UUID..."
                    className="w-full rounded-xl border border-gray-200 p-2 text-xs outline-none mt-1"
                  />
                </div>
              )}

              <div className="border-t border-[#EDF7F0] pt-3">
                <p className="text-xs font-bold text-[#1B4332] uppercase mb-2">Stored Documents</p>
                {loadingClearances ? (
                  <div className="flex justify-center py-4">
                    <Loader2 className="w-5 h-5 animate-spin text-[#52B788]" />
                  </div>
                ) : clearanceRecords.length === 0 ? (
                  <p className="text-[11px] text-[#6B5B4F]/60 italic py-2">No documents cleared or reviewed yet.</p>
                ) : (
                  <div className="space-y-2">
                    {clearanceRecords.map((rec) => (
                      <button
                        key={rec.id}
                        onClick={() => handleSelectRecord(rec)}
                        className="w-full text-left p-2.5 rounded-xl border border-gray-150 hover:bg-[#EDF7F0]/20 transition flex items-center justify-between text-xs"
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#1B4332] capitalize">
                            {rec.document_type.replace(/_/g, " ")}
                          </p>
                          <p className="text-[10px] text-gray-400">Exp: {rec.vaccine_expiration_date || "N/A"}</p>
                        </div>
                        {(() => {
                          const docStatus = getDocumentStatus(rec);
                          if (docStatus.status === "expired") {
                            return (
                              <Badge className="bg-red-100 text-red-800 border border-red-200 font-bold text-[10px] animate-pulse">
                                ❌ Expired
                              </Badge>
                            );
                          }
                          if (docStatus.status === "expiring_soon") {
                            return (
                              <Badge className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px]">
                                ⚠️ Expiring in {docStatus.daysRemaining}d
                              </Badge>
                            );
                          }
                          return (
                            <Badge
                              variant="outline"
                              className={
                                rec.status === "approved_active"
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : rec.status === "rejected"
                                  ? "bg-red-50 text-red-700 border-red-200"
                                  : "bg-amber-50 text-amber-700 border-amber-200"
                              }
                            >
                              {rec.status.replace(/_/g, " ")}
                            </Badge>
                          );
                        })()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right panel: Clearance Review Form */}
          <div className="md:col-span-2 space-y-4">
            <div className="bg-white border border-[#EDF7F0] rounded-2xl p-5 shadow-sm space-y-4">
              <h2 className="text-sm font-bold text-[#1B4332] uppercase tracking-wide flex items-center gap-1.5 border-b border-[#EDF7F0] pb-2">
                <FileText className="w-4 h-4 text-[#52B788]" />
                Document Review Form
              </h2>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-[#1B4332]">Document Type</Label>
                  <select
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                    className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-xs outline-none mt-1"
                  >
                    <option value="rabies_certificate">Rabies Certificate</option>
                    <option value="usda_health_certificate">USDA/APHIS Health Cert</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#1B4332]">Document URL</Label>
                  <input
                    type="text"
                    value={docUrl}
                    onChange={(e) => setDocUrl(e.target.value)}
                    className="w-full rounded-xl border border-gray-250 p-2 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-semibold text-[#1B4332]">Verification Status</Label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-xs outline-none mt-1"
                  >
                    <option value="pending_review">Pending Review</option>
                    <option value="approved_active">Approved / Active</option>
                    <option value="rejected">Rejected (Flag Problem)</option>
                    <option value="expired">Expired</option>
                  </select>
                </div>
                <div>
                  <Label className="text-xs font-semibold text-[#1B4332]">PDF Checksum (SHA256)</Label>
                  <input
                    type="text"
                    value={pdfChecksum}
                    onChange={(e) => setPdfChecksum(e.target.value)}
                    placeholder="Auto-hashed or input string"
                    className="w-full rounded-xl border border-gray-250 p-2 text-xs mt-1"
                  />
                </div>
              </div>

              {/* QA & Verification Fields (Visible for all, mandatory for approved) */}
              <div className="bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-4 space-y-3">
                <p className="text-xs font-bold text-[#1B4332] uppercase tracking-wider border-b border-[#EDF7F0] pb-1 flex items-center gap-1.5">
                  🛡️ QA Validation & Anti-Fraud Checklist
                </p>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Vet Signing Name *</Label>
                    <input
                      type="text"
                      value={vetName}
                      onChange={(e) => setVetName(e.target.value)}
                      placeholder="e.g. Dr. Sarah Jenkins"
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Vet License Number *</Label>
                    <input
                      type="text"
                      value={vetLicense}
                      onChange={(e) => setVetLicense(e.target.value)}
                      placeholder="e.g. CA-99120"
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Clinic Name *</Label>
                    <input
                      type="text"
                      value={clinicName}
                      onChange={(e) => setClinicName(e.target.value)}
                      placeholder="e.g. Green Lake Animal Hospital"
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Clinic Phone (Optional)</Label>
                    <input
                      type="text"
                      value={clinicPhone}
                      onChange={(e) => setClinicPhone(e.target.value)}
                      placeholder="e.g. 555-019-2831"
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Lot Number *</Label>
                    <input
                      type="text"
                      value={vaccineLot}
                      onChange={(e) => setVaccineLot(e.target.value)}
                      placeholder="e.g. LOT-AB910"
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Manufacturer (Optional)</Label>
                    <input
                      type="text"
                      value={vaccineManufacturer}
                      onChange={(e) => setVaccineManufacturer(e.target.value)}
                      placeholder="e.g. Zoetis"
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Issue Date *</Label>
                    <input
                      type="date"
                      value={issueDate}
                      onChange={(e) => setIssueDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold text-[#1B4332]">Expiration Date *</Label>
                    <input
                      type="date"
                      value={expirationDate}
                      onChange={(e) => setExpirationDate(e.target.value)}
                      className="w-full rounded-xl border border-gray-200 p-2 text-xs bg-white mt-1"
                    />
                  </div>
                </div>

                <div className="flex items-start gap-2.5 pt-1.5 border-t border-[#EDF7F0] mt-1.5">
                  <Checkbox
                    id="pdfIntegrity"
                    checked={pdfIntegrity}
                    onCheckedChange={(checked) => setPdfIntegrity(!!checked)}
                    className="border-amber-250 text-[#1B4332] mt-0.5"
                  />
                  <Label htmlFor="pdfIntegrity" className="text-[11px] text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                    <strong>PDF Integrity Check Completed</strong>: I have verified this PDF file shows no indications of digital alterations, font refitting, or modified dates.
                  </Label>
                </div>
              </div>

              {/* Rejection Reason (Conditional) */}
              {status === "rejected" && (
                <div className="space-y-1.5">
                  <Label className="text-xs font-semibold text-red-700">Rejection Reason *</Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="rounded-xl border-red-250 text-xs focus:ring-red-500"
                    rows={2}
                    placeholder="Specify why the certificate was rejected (e.g. blurry scan, expired lot number, incorrect clinic credential)..."
                  />
                </div>
              )}

              {/* Actions */}
              <Button
                onClick={handleSaveClearance}
                disabled={savingClearance}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2.5 font-bold transition flex items-center justify-center shadow-sm"
              >
                {savingClearance ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                )}
                Save Clearance Record
              </Button>
            </div>
          </div>
        </div>

        {/* Expiry & Warnings Console */}
        <div className="bg-white border border-[#EDF7F0] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-[#EDF7F0] pb-4 gap-4">
            <div>
              <h3 className="text-lg font-bold text-[#1B4332] flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Passenger Document Expiry & Warnings Console
              </h3>
              <p className="text-xs text-[#6B5B4F]/70 mt-0.5">
                Real-time status overview of passenger medical/travel documents and proactive alert triggering.
              </p>
            </div>
            <Button
              onClick={handleTriggerCron}
              disabled={triggeringCron}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold py-2 px-4 rounded-xl transition flex items-center gap-2 shadow-sm self-start sm:self-center animate-pulse"
            >
              {triggeringCron ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Clock className="w-3.5 h-3.5" />
              )}
              Run Expiry Notifications Cron
            </Button>
          </div>

          {/* Metrics cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-red-50/50 border border-red-100 rounded-xl p-4 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-red-700 tracking-wider">Expired Documents</span>
              <span className="text-2xl font-extrabold text-red-800 mt-1">
                {allClearances.filter(c => getDocumentStatus(c).status === "expired").length}
              </span>
            </div>
            <div className="bg-amber-50/50 border border-amber-100 rounded-xl p-4 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-amber-700 tracking-wider">Expiring Soon (In {policyDocExpiryWarning} Days)</span>
              <span className="text-2xl font-extrabold text-amber-800 mt-1">
                {allClearances.filter(c => getDocumentStatus(c).status === "expiring_soon").length}
              </span>
            </div>
            <div className="bg-green-50/50 border border-green-100 rounded-xl p-4 flex flex-col">
              <span className="text-[10px] uppercase font-bold text-green-700 tracking-wider">Valid Documents</span>
              <span className="text-2xl font-extrabold text-green-800 mt-1">
                {allClearances.filter(c => getDocumentStatus(c).status === "valid").length}
              </span>
            </div>
          </div>

          {/* Cron logs console */}
          {cronLogs.length > 0 && (
            <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 space-y-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Cron Execution Logs</p>
              <div className="text-[11px] font-mono text-green-400 max-h-32 overflow-y-auto space-y-1">
                {cronLogs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed">{`> ${log}`}</div>
                ))}
              </div>
            </div>
          )}

          {/* Details Table */}
          <div className="space-y-3">
            <h4 className="text-xs uppercase font-bold text-[#1B4332] tracking-wider">All Stored Document Clearances</h4>
            {loadingAllClearances ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-[#52B788]" />
              </div>
            ) : allClearances.length === 0 ? (
              <p className="text-xs text-[#6B5B4F]/60 italic py-4 border border-dashed border-[#EDF7F0] rounded-xl text-center">
                No records stored in system_policies or clearances.
              </p>
            ) : (
              <div className="border border-[#EDF7F0] rounded-xl overflow-hidden">
                <div className="max-h-60 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="bg-[#EDF7F0]/40 text-[#1B4332] font-bold border-b border-[#EDF7F0] sticky top-0 bg-white">
                      <tr>
                        <th className="p-3">Passenger ID</th>
                        <th className="p-3">Doc Type</th>
                        <th className="p-3">Issue Date</th>
                        <th className="p-3">Calculated Expiry</th>
                        <th className="p-3 text-right">Status / Warning</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#EDF7F0]">
                      {allClearances.map((clearance) => {
                        const docStatus = getDocumentStatus(clearance);
                        return (
                          <tr key={clearance.id} className="hover:bg-[#EDF7F0]/10 transition">
                            <td className="p-3 font-mono text-[10px] text-gray-500">
                              {clearance.passenger_profile_id.substring(0, 8)}...
                            </td>
                            <td className="p-3 capitalize font-semibold text-gray-700">
                              {clearance.document_type.replace(/_/g, " ")}
                            </td>
                            <td className="p-3 text-gray-600 font-medium">
                              {clearance.issue_date || "N/A"}
                            </td>
                            <td className="p-3 text-gray-600 font-medium">
                              {docStatus.expiryDate || clearance.vaccine_expiration_date || "N/A"}
                            </td>
                            <td className="p-3 text-right">
                              {docStatus.status === "expired" && (
                                <Badge className="bg-red-100 text-red-800 border border-red-200 font-bold text-[10px]">
                                  ❌ Expired
                                </Badge>
                              )}
                              {docStatus.status === "expiring_soon" && (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-200 font-bold text-[10px]">
                                  ⚠️ {docStatus.daysRemaining} days left
                                </Badge>
                              )}
                              {docStatus.status === "valid" && (
                                <Badge className="bg-green-100 text-green-800 border border-green-200 font-bold text-[10px]">
                                  ✓ Active / Valid
                                </Badge>
                              )}
                              {docStatus.status !== "expired" && docStatus.status !== "expiring_soon" && docStatus.status !== "valid" && (
                                <Badge variant="outline" className="capitalize">
                                  {clearance.status.replace(/_/g, " ")}
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )}

      {/* Tab Content: Override */}
      {activeTab === "override" && (
        <div className="max-w-xl mx-auto bg-white border border-[#EDF7F0] rounded-2xl p-6 shadow-sm space-y-5">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm text-amber-950">
            <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 shrink-0 animate-pulse" />
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-amber-800">
                🚨 Super-Admin Dispatch Override Tool
              </p>
              <p className="text-[11px] text-amber-700 leading-relaxed font-semibold">
                This tool grants an emergency bypass for a specific trip, allowing dispatch progression past launch gates even if passenger document clearances are missing or expired. Bypasses are logged to an immutable audit trail.
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-[#1B4332]">Target Trip ID</Label>
                <select
                  value={overrideTripId}
                  onChange={(e) => setOverrideTripId(e.target.value)}
                  className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-xs outline-none mt-1"
                >
                  <option value="TRIP-MOCK-1">TRIP-MOCK-1 (Rocky)</option>
                  <option value="TRIP-9-1">TRIP-9-1 (Test Rocky)</option>
                  <option value="other-trip">Other Trip ID (Manual)</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#1B4332]">Passenger Profile ID</Label>
                <input
                  type="text"
                  value={overrideProfileId}
                  onChange={(e) => setOverrideProfileId(e.target.value)}
                  placeholder="Enter Profile UUID..."
                  className="w-full rounded-xl border border-gray-250 p-2.5 text-xs mt-1"
                />
              </div>
            </div>

            {overrideTripId === "other-trip" && (
              <div>
                <Label className="text-xs font-semibold text-[#1B4332]">Write-in Trip ID</Label>
                <input
                  type="text"
                  value={overrideTripId === "other-trip" ? "" : overrideTripId}
                  onChange={(e) => setOverrideTripId(e.target.value)}
                  placeholder="Enter Trip ID string..."
                  className="w-full rounded-xl border border-gray-250 p-2.5 text-xs mt-1"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-semibold text-[#1B4332]">Override Category</Label>
                <select
                  value={overrideCategory}
                  onChange={(e) => setOverrideCategory(e.target.value)}
                  className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-xs outline-none mt-1"
                >
                  <option value="medical_emergency">Medical Emergency</option>
                  <option value="vet_direct_confirmation">Vet Direct-Phone Confirmation</option>
                  <option value="clerical_exception">Clerical Exception / Correction</option>
                </select>
              </div>
              <div>
                <Label className="text-xs font-semibold text-[#1B4332]">Bypass Expiration Time</Label>
                <select
                  value={bypassHours}
                  onChange={(e) => setBypassHours(e.target.value)}
                  className="w-full rounded-xl border border-gray-250 bg-white p-2.5 text-xs outline-none mt-1"
                >
                  {[1, 2, 6, 12, 18, 24].filter(h => h <= policyMaxHours).map(h => (
                    <option key={h} value={h}>{h} Hour{h > 1 ? "s" : ""}{h === policyMaxHours ? " (Max limit)" : ""}</option>
                  ))}
                  {![1, 2, 6, 12, 18, 24].includes(policyMaxHours) && (
                    <option value={policyMaxHours}>{policyMaxHours} Hours (Max limit)</option>
                  )}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label className="text-xs font-semibold text-[#1B4332]">Audit Notes (Mandatory - min {policyMinChars} chars) *</Label>
                <span className={`text-[10px] ${overrideNotes.length < policyMinChars ? "text-amber-600 font-bold" : "text-gray-400"}`}>
                  {overrideNotes.length} / {policyMinChars} characters minimum
                </span>
              </div>
              <Textarea
                value={overrideNotes}
                onChange={(e) => setOverrideNotes(e.target.value)}
                className="rounded-xl border-gray-250 text-xs focus:ring-[#52B788]"
                rows={4}
                placeholder="Explain the critical necessity for this override, the verbal confirmation details, and why document clearance checks are bypassed for this trip..."
              />
            </div>

            <Button
              onClick={handleSaveOverride}
              disabled={savingOverride || overrideNotes.trim().length < policyMinChars || userRole !== "super_admin"}
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2.5 font-bold transition flex items-center justify-center shadow-sm"
            >
              {savingOverride ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <Clock className="w-4 h-4 mr-2" />
              )}
              {userRole !== "super_admin" ? "Super-Admin Authorization Required" : (savingOverride ? "Issuing Bypass..." : "Authorize Emergency Bypass (Immutable Log)")}
            </Button>
          </div>
        </div>
      )}

      {/* Tab Content: Policy Config */}
      {activeTab === "policy" && userRole === "super_admin" && (
        <div className="max-w-xl mx-auto bg-white border border-[#EDF7F0] rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-[#EDF7F0] pb-3">
            <h2 className="text-lg font-bold text-[#1B4332] flex items-center gap-2">
              <Shield className="w-5 h-5 text-[#52B788]" />
              System Policy & Configuration Tooling
            </h2>
            <p className="text-xs text-[#6B5B4F]/70 mt-1">
              Configure system-wide limits and emergency override criteria. Changes affect future requests only.
            </p>
          </div>

          {loadingPolicies ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-[#52B788]" />
              <p className="text-xs text-[#6B5B4F]/60">Loading system policies...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {policies.map((policy) => {
                const key = policy.policy_key;
                let minVal = 30;
                let maxVal = 1460;
                let unit = "days";
                let localVal = 30;
                let setLocalVal = () => {};

                if (key === "override_max_hours") {
                  minVal = 1;
                  maxVal = 24;
                  unit = "hours";
                  localVal = localMaxHours;
                  setLocalVal = setLocalMaxHours;
                } else if (key === "override_min_audit_chars") {
                  minVal = 20;
                  maxVal = 200;
                  unit = "chars";
                  localVal = localMinChars;
                  setLocalVal = setLocalMinChars;
                } else if (key === "rabies_max_age_days") {
                  localVal = localRabiesMaxAge;
                  setLocalVal = setLocalRabiesMaxAge;
                } else if (key === "usda_max_age_days") {
                  localVal = localUsdaMaxAge;
                  setLocalVal = setLocalUsdaMaxAge;
                } else if (key === "doc_expiry_warning_days") {
                  localVal = localDocExpiryWarning;
                  setLocalVal = setLocalDocExpiryWarning;
                }

                const stepVal = 1;

                return (
                  <div key={policy.id} className="border border-[#EDF7F0] bg-[#F9F7F3]/40 rounded-xl p-4 space-y-3.5 hover:shadow-md transition">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-sm font-bold text-[#1B4332] font-mono">
                          {policy.policy_key}
                        </h3>
                        <p className="text-xs text-[#6B5B4F] mt-0.5">
                          {policy.description}
                        </p>
                      </div>
                      <Badge className="bg-[#52B788]/20 text-[#1B4332] text-[10px] hover:bg-[#52B788]/20 animate-pulse">
                        {policy.value_number} {unit}
                      </Badge>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-[11px] text-[#6B5B4F] font-semibold">
                        <span>Min: {minVal} {unit}</span>
                        <span className="text-[#1B4332] font-bold">Value: {localVal} {unit}</span>
                        <span>Max: {maxVal} {unit}</span>
                      </div>
                      <input
                        type="range"
                        min={minVal}
                        max={maxVal}
                        step={stepVal}
                        value={localVal}
                        onChange={(e) => setLocalVal(Number(e.target.value))}
                        className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-[#52B788] transition-all hover:bg-gray-300"
                      />
                    </div>

                    <div className="flex justify-between items-center border-t border-[#EDF7F0] pt-2 text-[10px] text-[#6B5B4F]/70">
                      <div>
                        <span>Last updated by: </span>
                        <span className="font-semibold text-[#1B4332]">{policy.updated_by || "system"}</span>
                        <span> on </span>
                        <span className="font-semibold">{policy.updated_at ? new Date(policy.updated_at).toLocaleString() : "N/A"}</span>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleUpdatePolicy(policy.policy_key, localVal)}
                        disabled={updatingPolicyKey === policy.policy_key || localVal === policy.value_number}
                        className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white py-1 px-3 rounded-lg text-[10px] font-bold h-7 transition"
                      >
                        {updatingPolicyKey === policy.policy_key ? (
                          <Loader2 className="w-3 h-3 animate-spin mr-1" />
                        ) : null}
                        Apply
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
