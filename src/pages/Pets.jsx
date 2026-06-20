import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const getDocumentStatus = (doc) => {
  if (!doc) return { status: "missing", daysRemaining: null };
  if (doc.status === "rejected") {
    return { status: "rejected", reason: doc.rejection_reason || "Rejected by office dispatch" };
  }
  if (doc.status === "pending_review") {
    return { status: "pending_review" };
  }
  if (doc.status !== "approved_active" && doc.status !== "expired") {
    return { status: doc.status };
  }
  
  const expiryStr = doc.calculated_expiry_at || doc.vaccine_expiration_date;
  if (!expiryStr) return { status: "missing" };
  
  const calculatedExpiry = new Date(expiryStr);
  const today = new Date();
  today.setHours(0,0,0,0);
  calculatedExpiry.setHours(0,0,0,0);
  
  if (calculatedExpiry < today) {
    return { status: "expired", expiryDate: expiryStr.split("T")[0] };
  }
  
  const diffTime = calculatedExpiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 30) {
    return { status: "expiring_soon", daysRemaining: diffDays, expiryDate: expiryStr.split("T")[0] };
  }
  
  return { status: "valid", daysRemaining: diffDays, expiryDate: expiryStr.split("T")[0] };
};
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Plus, PawPrint, Loader2, Trash2, Edit2, ShieldAlert, Users, Send, Check, X, AlertCircle } from "lucide-react";
import PetCard from "../components/dashboard/PetCard";
import { useAuth } from "../components/auth/useAuth";

const initialFormState = {
  pet_name: "",
  species: "",
  breed: "",
  weight: "",
  age_group: "",
  temperament: "",
  escape_risk: false,
  bite_scratch_risk: false,
  medical_risk: false,
  carrier_required: false,
  emergency_contact_name: "",
  emergency_contact_phone: "",
  emergency_vet_name: "",
  emergency_vet_phone: "",
  emergency_vet_address: "",
  emergency_vet_consent: false,
  write_in_feedback: { notes: "" },
  species_specific_data: {
    harness_preference: "",
    loading_method: "",
    reactivity_class: "None",
    carrier_style: "",
    handling_tolerance: "",
    hide_light_preference: "",
    calming_permission: false
  }
};

export default function Pets() {
  const { effectiveUser } = useAuth();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(initialFormState);
  const [error, setError] = useState("");
  const queryClient = useQueryClient();

  // Co-ownership & suggestion states
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteError, setInviteError] = useState("");
  const [reviewProfile, setReviewProfile] = useState(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  // Health clearances / document upload states
  const [documentUrls, setDocumentUrls] = useState({ rabies_certificate: "", usda_health_certificate: "" });
  const [pdfIntegrityChecked, setPdfIntegrityChecked] = useState({ rabies_certificate: false, usda_health_certificate: false });
  const [showUploadForm, setShowUploadForm] = useState({ rabies_certificate: false, usda_health_certificate: false });
  const [uploadingDocType, setUploadingDocType] = useState("");
  const [uploadError, setUploadError] = useState("");

  const userEmail = effectiveUser?.email;

  // 1. Fetch Passenger Profiles
  const { data: profiles = [], isLoading } = useQuery({
    queryKey: ["my-pets", userEmail],
    queryFn: async () => {
      const res = await fetch(`/api/passenger-profile?owner_email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error("Failed to fetch passenger profiles");
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!userEmail,
  });

  const editingProfile = editingId ? profiles.find(p => p.id === editingId) : null;
  const editingClearances = editingProfile?.clearances || [];

  // Filter out archived profiles
  const activeProfiles = profiles.filter(p => p.lifecycle_state !== "Archived");

  // Determine if editing profile is co-owned
  const activeEditingProfile = editingId ? activeProfiles.find(p => p.id === editingId) : null;
  const isCoOwned = activeEditingProfile ? activeEditingProfile.owner_email !== userEmail : false;

  // 2. Fetch Co-owners for Edit dialog
  const { data: coOwnersList = [], refetch: refetchCoOwners } = useQuery({
    queryKey: ["co-owners", editingId],
    queryFn: async () => {
      const res = await fetch(`/api/passenger-profile?action=list-co-owners&passenger_profile_id=${editingId}`);
      if (!res.ok) throw new Error("Failed to fetch co-owners");
      const result = await res.json();
      return result.data || [];
    },
    enabled: !!editingId && !isCoOwned,
  });

  // 3. Mutations
  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const res = await fetch("/api/passenger-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to create profile");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
      handleClose();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/passenger-profile?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to update profile");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
      handleClose();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const suggestMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await fetch(`/api/passenger-profile?action=suggest-change`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id,
          co_owner_email: userEmail,
          suggested_data: payload
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to suggest changes");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
      handleClose();
    },
    onError: (err) => {
      setError(err.message);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      const res = await fetch(`/api/passenger-profile?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner_email: userEmail,
          lifecycle_state: "Archived"
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to archive profile");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
    }
  });

  const inviteMutation = useMutation({
    mutationFn: async (coEmail) => {
      const res = await fetch("/api/passenger-profile?action=invite-co-owner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passenger_profile_id: editingId,
          co_owner_email: coEmail,
          owner_email: userEmail
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to invite co-owner");
      return result.data;
    },
    onSuccess: () => {
      refetchCoOwners();
      setInviteEmail("");
      setInviteError("");
    },
    onError: (err) => {
      setInviteError(err.message);
    }
  });

  const reviewMutation = useMutation({
    mutationFn: async (reviewAction) => {
      const res = await fetch("/api/passenger-profile?action=review-suggestion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: reviewProfile.id,
          owner_email: userEmail,
          review_action: reviewAction
        }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to review suggestion");
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
      setReviewOpen(false);
      setReviewProfile(null);
    }
  });

  const uploadClearanceMutation = useMutation({
    mutationFn: async ({ document_type, document_url }) => {
      const payload = {
        passenger_profile_id: editingId,
        document_type,
        document_url,
        status: "pending_review",
        pdf_checksum: "checksum-" + Math.random().toString(36).substring(7)
      };
      const res = await fetch("/api/admin-document-clearance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to upload certificate");
      return result.data;
    },
    onSuccess: () => {
      toast.success("Certificate submitted successfully for office review!");
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
      // Reset form states
      setDocumentUrls(prev => ({ ...prev, [uploadingDocType]: "" }));
      setPdfIntegrityChecked(prev => ({ ...prev, [uploadingDocType]: false }));
      setShowUploadForm(prev => ({ ...prev, [uploadingDocType]: false }));
      setUploadingDocType("");
    },
    onError: (err) => {
      setUploadError(err.message);
    }
  });

  // 4. Handlers
  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(initialFormState);
    setError("");
    setOpen(true);
  };

  const handleOpenEdit = (profile) => {
    setEditingId(profile.id);
    setError("");
    setForm({
      pet_name: profile.pet_name || "",
      species: profile.species || "",
      breed: profile.breed || "",
      weight: profile.weight ? String(profile.weight) : "",
      age_group: profile.age_group || "",
      temperament: profile.temperament || "",
      escape_risk: !!profile.escape_risk,
      bite_scratch_risk: !!profile.bite_scratch_risk,
      medical_risk: !!profile.medical_risk,
      carrier_required: !!profile.carrier_required,
      emergency_contact_name: profile.emergency_contact_name || "",
      emergency_contact_phone: profile.emergency_contact_phone || "",
      emergency_vet_name: profile.emergency_vet_name || "",
      emergency_vet_phone: profile.emergency_vet_phone || "",
      emergency_vet_address: profile.emergency_vet_address || "",
      emergency_vet_consent: !!profile.emergency_vet_consent,
      write_in_feedback: { notes: profile.write_in_feedback?.notes || "" },
      species_specific_data: {
        harness_preference: profile.species_specific_data?.harness_preference || "",
        loading_method: profile.species_specific_data?.loading_method || "",
        reactivity_class: profile.species_specific_data?.reactivity_class || "None",
        carrier_style: profile.species_specific_data?.carrier_style || "",
        handling_tolerance: profile.species_specific_data?.handling_tolerance || "",
        hide_light_preference: profile.species_specific_data?.hide_light_preference || "",
        calming_permission: !!profile.species_specific_data?.calming_permission
      }
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setForm(initialFormState);
    setError("");
    setEditingId(null);
    setInviteEmail("");
    setInviteError("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");

    // Client-side validations
    if (!form.pet_name.trim()) return setError("Pet Name is required");
    if (!form.species) return setError("Species is required");
    if (!form.weight || Number(form.weight) <= 0) return setError("Weight must be greater than 0");
    if (!form.age_group) return setError("Age Group is required");
    if (!form.temperament) return setError("Temperament is required");

    if (!isCoOwned) {
      if (!form.emergency_contact_name.trim()) return setError("Emergency Contact Name is required");
      if (!form.emergency_contact_phone.trim()) return setError("Emergency Contact Phone is required");

      if (form.medical_risk) {
        if (!form.emergency_vet_consent) {
          return setError("Emergency Veterinary Consent is required when Medical Risk is enabled");
        }
        if (!form.emergency_vet_name || !form.emergency_vet_name.trim()) {
          return setError("Preferred Clinic Name is required when Medical Risk is enabled");
        }
        if (!form.emergency_vet_phone || !form.emergency_vet_phone.trim()) {
          return setError("Preferred Clinic Phone is required when Medical Risk is enabled");
        }
        if (!form.emergency_vet_address || !form.emergency_vet_address.trim()) {
          return setError("Preferred Clinic Address is required when Medical Risk is enabled");
        }
      }
    }

    if (form.write_in_feedback?.notes?.length > 1000) {
      return setError("Notes must not exceed 1000 characters");
    }

    // Build species-specific data payload
    const specData = {};
    if (form.species === "Dog") {
      if (!form.species_specific_data.harness_preference) return setError("Harness preference is required for dogs");
      if (!form.species_specific_data.loading_method) return setError("Loading method is required for dogs");
      specData.harness_preference = form.species_specific_data.harness_preference;
      specData.loading_method = form.species_specific_data.loading_method;
      specData.reactivity_class = "None";
    } else if (form.species === "Cat") {
      if (!form.species_specific_data.carrier_style) return setError("Carrier style is required for cats");
      if (!form.species_specific_data.handling_tolerance) return setError("Handling tolerance is required for cats");
      if (!form.species_specific_data.hide_light_preference) return setError("Light preference is required for cats");
      specData.carrier_style = form.species_specific_data.carrier_style;
      specData.handling_tolerance = form.species_specific_data.handling_tolerance;
      specData.hide_light_preference = form.species_specific_data.hide_light_preference;
      specData.calming_permission = !!form.species_specific_data.calming_permission;
    }

    if (isCoOwned) {
      // Co-owner suggestion payload (excludes restricted safety/contact/owner fields)
      const coPayload = {
        pet_name: form.pet_name,
        breed: form.breed || "",
        weight: Number(form.weight),
        age_group: form.age_group,
        temperament: form.temperament,
        species_specific_data: specData,
        write_in_feedback: form.write_in_feedback || {},
        species: form.species
      };
      suggestMutation.mutate({ id: editingId, payload: coPayload });
    } else {
      // Primary Owner payload
      const payload = {
        pet_name: form.pet_name,
        species: form.species,
        breed: form.breed || "",
        weight: Number(form.weight),
        age_group: form.age_group,
        temperament: form.temperament,
        escape_risk: !!form.escape_risk,
        bite_scratch_risk: !!form.bite_scratch_risk,
        medical_risk: !!form.medical_risk,
        carrier_required: !!form.carrier_required,
        emergency_contact_name: form.emergency_contact_name,
        emergency_contact_phone: form.emergency_contact_phone,
        emergency_vet_name: form.emergency_vet_name || "",
        emergency_vet_phone: form.emergency_vet_phone || "",
        emergency_vet_address: form.emergency_vet_address || "",
        emergency_vet_consent: !!form.emergency_vet_consent,
        emergency_vet_consent_timestamp: form.emergency_vet_consent ? new Date().toISOString() : null,
        emergency_vet_consent_method: form.emergency_vet_consent ? "In-App Checkbox" : null,
        species_specific_data: specData,
        write_in_feedback: form.write_in_feedback || {},
        owner_email: userEmail,
        lifecycle_state: "Active"
      };

      if (editingId) {
        updateMutation.mutate({ id: editingId, payload });
      } else {
        createMutation.mutate(payload);
      }
    }
  };

  const handleInviteCoOwner = (e) => {
    e.preventDefault();
    setInviteError("");
    if (!inviteEmail.trim()) return;
    inviteMutation.mutate(inviteEmail);
  };

  const handleOpenReview = (profile) => {
    setReviewProfile(profile);
    setReviewOpen(true);
  };

  const isPending = createMutation.isPending || updateMutation.isPending || suggestMutation.isPending;

  // Diff Builder helper
  const renderDiffTable = () => {
    if (!reviewProfile || !reviewProfile.suggested_changes) return null;
    const sug = reviewProfile.suggested_changes;
    const diffs = [];

    if (sug.pet_name !== undefined && sug.pet_name !== reviewProfile.pet_name) {
      diffs.push({ field: "Pet Name", old: reviewProfile.pet_name, new: sug.pet_name });
    }
    if (sug.breed !== undefined && sug.breed !== reviewProfile.breed) {
      diffs.push({ field: "Breed", old: reviewProfile.breed || "(empty)", new: sug.breed || "(empty)" });
    }
    if (sug.weight !== undefined && Number(sug.weight) !== Number(reviewProfile.weight)) {
      diffs.push({ field: "Weight", old: `${reviewProfile.weight} lbs`, new: `${sug.weight} lbs` });
    }
    if (sug.age_group !== undefined && sug.age_group !== reviewProfile.age_group) {
      diffs.push({ field: "Age Group", old: reviewProfile.age_group, new: sug.age_group });
    }
    if (sug.temperament !== undefined && sug.temperament !== reviewProfile.temperament) {
      diffs.push({ field: "Temperament", old: reviewProfile.temperament, new: sug.temperament });
    }

    const oldNotes = reviewProfile.write_in_feedback?.notes || "";
    const newNotes = sug.write_in_feedback?.notes || "";
    if (newNotes !== oldNotes) {
      diffs.push({ field: "Comfort Notes", old: oldNotes || "(empty)", new: newNotes || "(empty)" });
    }

    // Species specific comparison
    if (reviewProfile.species === "Dog") {
      const oldHarness = reviewProfile.species_specific_data?.harness_preference || "";
      const newHarness = sug.species_specific_data?.harness_preference || "";
      if (newHarness && newHarness !== oldHarness) {
        diffs.push({ field: "Harness Pref", old: oldHarness, new: newHarness });
      }
    } else if (reviewProfile.species === "Cat") {
      const oldCarrier = reviewProfile.species_specific_data?.carrier_style || "";
      const newCarrier = sug.species_specific_data?.carrier_style || "";
      if (newCarrier && newCarrier !== oldCarrier) {
        diffs.push({ field: "Carrier Style", old: oldCarrier, new: newCarrier });
      }
    }

    if (diffs.length === 0) {
      return <p className="text-xs text-slate-500 italic text-center py-4">No changes detected in suggestion payload.</p>;
    }

    return (
      <div className="border border-[#EDE8D9] rounded-2xl overflow-hidden text-xs">
        <div className="grid grid-cols-3 bg-[#F9F7F3] p-3 font-bold text-[#1B4332] border-b border-[#EDE8D9]">
          <span>Field</span>
          <span>Current Value</span>
          <span>Proposed Value</span>
        </div>
        <div className="divide-y divide-[#EDE8D9]">
          {diffs.map((item, idx) => (
            <div key={idx} className="grid grid-cols-3 p-3 items-center text-[#6B5B4F] bg-white">
              <span className="font-semibold text-[#1B4332]">{item.field}</span>
              <span className="line-through text-red-500 bg-red-50/50 px-1.5 py-0.5 rounded max-w-fit">{item.old}</span>
              <span className="text-green-700 bg-green-50 px-1.5 py-0.5 rounded font-bold max-w-fit">{item.new}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">My Pets</h1>
          <p className="text-[#6B5B4F]/60 mt-1">Manage pet profiles and suggestion queues</p>
        </div>
        <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
          <Button onClick={handleOpenAdd} className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl gap-2 font-semibold px-4 py-2 shadow-sm">
            <Plus className="w-4 h-4" /> Add Pet Profile
          </Button>
          <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#1B4332] text-xl font-bold">
                {isCoOwned ? "Propose Profile Changes" : editingId ? "Edit Pet Profile" : "Add Pet Profile"}
              </DialogTitle>
            </DialogHeader>
            
            {isCoOwned && (
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-start gap-2.5 text-blue-800 text-[11px] font-medium leading-relaxed">
                <Users className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <span>You are editing as a <strong>Co-Owner</strong>. Your updates will be queued as suggestions for the primary owner to review. Safety, contacts, and consent details cannot be modified by co-owners.</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5 mt-2">
              
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-600 text-xs font-semibold">
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{error}</span>
                </div>
              )}

              {/* Identity Row */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332] font-semibold text-xs">Pet Name *</Label>
                  <Input value={form.pet_name} onChange={(e) => setForm({...form, pet_name: e.target.value})} className="rounded-xl border-[#D8F3DC]" placeholder="e.g. Max" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332] font-semibold text-xs">Species *</Label>
                  <Select disabled={isCoOwned} value={form.species} onValueChange={(v) => setForm({...form, species: v})}>
                    <SelectTrigger className="rounded-xl border-[#D8F3DC]"><SelectValue placeholder="Select Species" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog 🐶</SelectItem>
                      <SelectItem value="Cat">Cat 🐱</SelectItem>
                      <SelectItem value="Other">Other household pet 🐹</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Breed & Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332] font-semibold text-xs">Breed (optional)</Label>
                  <Input value={form.breed} onChange={(e) => setForm({...form, breed: e.target.value})} className="rounded-xl border-[#D8F3DC]" placeholder="e.g. Golden Retriever" />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332] font-semibold text-xs">Weight (lbs) *</Label>
                  <Input type="number" step="any" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} className="rounded-xl border-[#D8F3DC]" placeholder="e.g. 45" />
                </div>
              </div>

              {/* Age & Temperament */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332] font-semibold text-xs">Life Stage / Age Group *</Label>
                  <Select value={form.age_group} onValueChange={(v) => setForm({...form, age_group: v})}>
                    <SelectTrigger className="rounded-xl border-[#D8F3DC]"><SelectValue placeholder="Select age group" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Puppy/Kitten">Puppy/Kitten</SelectItem>
                      <SelectItem value="Adult">Adult</SelectItem>
                      <SelectItem value="Senior">Senior</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-[#1B4332] font-semibold text-xs">General Temperament *</Label>
                  <Select value={form.temperament} onValueChange={(v) => setForm({...form, temperament: v})}>
                    <SelectTrigger className="rounded-xl border-[#D8F3DC]"><SelectValue placeholder="Select temperament" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Calm">Calm 😴</SelectItem>
                      <SelectItem value="Excited">Excited ⚡</SelectItem>
                      <SelectItem value="Anxious">Anxious 🥺</SelectItem>
                      <SelectItem value="Fearful">Fearful 🫣</SelectItem>
                      <SelectItem value="Reactive">Reactive 😠</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Dynamic Dog Section */}
              {form.species === "Dog" && (
                <div className="bg-[#EDF7F0] border border-[#B7E4C7] rounded-2xl p-4 space-y-4">
                  <h4 className="text-[#1B4332] font-bold text-xs">Dog Handling Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#1B4332] font-semibold text-xs">Harness Preference *</Label>
                      <Select value={form.species_specific_data.harness_preference} onValueChange={(v) => setForm({
                        ...form,
                        species_specific_data: { ...form.species_specific_data, harness_preference: v }
                      })}>
                        <SelectTrigger className="rounded-xl border-white bg-white"><SelectValue placeholder="Select harness" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Back-Clip">Back-Clip</SelectItem>
                          <SelectItem value="Front-Clip">Front-Clip</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-[#6B5B4F]/70">Collar-only harness preference is blocked.</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#1B4332] font-semibold text-xs">Loading Method *</Label>
                      <Select value={form.species_specific_data.loading_method} onValueChange={(v) => setForm({
                        ...form,
                        species_specific_data: { ...form.species_specific_data, loading_method: v }
                      })}>
                        <SelectTrigger className="rounded-xl border-white bg-white"><SelectValue placeholder="Select loading" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Self-Walk (Leashed)">Self-Walk (Leashed)</SelectItem>
                          <SelectItem value="Lifted by Staff">Lifted by Staff</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              )}

              {/* Dynamic Cat Section */}
              {form.species === "Cat" && (
                <div className="bg-[#EDF7F0] border border-[#B7E4C7] rounded-2xl p-4 space-y-4">
                  <h4 className="text-[#1B4332] font-bold text-xs">Cat Handling Preferences</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#1B4332] font-semibold text-xs">Carrier Style *</Label>
                      <Select value={form.species_specific_data.carrier_style} onValueChange={(v) => setForm({
                        ...form,
                        species_specific_data: { ...form.species_specific_data, carrier_style: v }
                      })}>
                        <SelectTrigger className="rounded-xl border-white bg-white"><SelectValue placeholder="Select carrier" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Soft-Sided">Soft-Sided</SelectItem>
                          <SelectItem value="Hard-Plastic">Hard-Plastic</SelectItem>
                        </SelectContent>
                      </Select>
                      <span className="text-[10px] text-[#6B5B4F]/70">Cardboard style carriers are blocked.</span>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#1B4332] font-semibold text-xs">Handling Tolerance *</Label>
                      <Select value={form.species_specific_data.handling_tolerance} onValueChange={(v) => setForm({
                        ...form,
                        species_specific_data: { ...form.species_specific_data, handling_tolerance: v }
                      })}>
                        <SelectTrigger className="rounded-xl border-white bg-white"><SelectValue placeholder="Select tolerance" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="High (allows hands-on)">High (allows hands-on)</SelectItem>
                          <SelectItem value="Moderate (cautious)">Moderate (cautious)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-[#1B4332] font-semibold text-xs">Light Preference *</Label>
                      <Select value={form.species_specific_data.hide_light_preference} onValueChange={(v) => setForm({
                        ...form,
                        species_specific_data: { ...form.species_specific_data, hide_light_preference: v }
                      })}>
                        <SelectTrigger className="rounded-xl border-white bg-white"><SelectValue placeholder="Select light" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Covered (prefers dark/towel)">Covered (prefers dark/towel)</SelectItem>
                          <SelectItem value="Open (prefers to look out)">Open (prefers to look out)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center gap-2 pt-6">
                      <Checkbox
                        id="calming_permission"
                        checked={form.species_specific_data.calming_permission}
                        onCheckedChange={(checked) => setForm({
                          ...form,
                          species_specific_data: { ...form.species_specific_data, calming_permission: !!checked }
                        })}
                        className="border-[#D8F3DC] text-[#1B4332] focus:ring-[#52B788]"
                      />
                      <Label htmlFor="calming_permission" className="text-xs text-[#6B5B4F] cursor-pointer font-semibold">
                        Permit Feliway/Calming Sprays
                      </Label>
                    </div>
                  </div>
                </div>
              )}

              {/* Emergency Contact (Restricted for Co-Owners) */}
              <div className={`bg-[#F9F7F3] border border-[#EDE8D9] rounded-2xl p-4 space-y-4 ${isCoOwned ? "opacity-60" : ""}`}>
                <h4 className="text-[#1B4332] font-bold text-xs">Emergency Care Contact</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-[#1B4332] font-semibold text-xs">Primary Contact Name *</Label>
                    <Input disabled={isCoOwned} value={form.emergency_contact_name} onChange={(e) => setForm({...form, emergency_contact_name: e.target.value})} className="rounded-xl border-white bg-white" placeholder="Jane Smith" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-[#1B4332] font-semibold text-xs">Primary Contact Phone *</Label>
                    <Input disabled={isCoOwned} value={form.emergency_contact_phone} onChange={(e) => setForm({...form, emergency_contact_phone: e.target.value})} className="rounded-xl border-white bg-white" placeholder="(555) 888-9999" />
                  </div>
                </div>
              </div>

              {/* Emergency Vet Consent (Restricted for Co-Owners) */}
              <div className={`bg-[#F9F7F3] border border-[#EDE8D9] rounded-2xl p-4 space-y-4 ${isCoOwned ? "opacity-60" : ""}`}>
                <div className="flex items-center gap-2">
                  <Checkbox
                    disabled={isCoOwned}
                    id="emergency_vet_consent"
                    checked={form.emergency_vet_consent}
                    onCheckedChange={(checked) => setForm({...form, emergency_vet_consent: !!checked})}
                    className="border-[#D8F3DC] text-[#1B4332] focus:ring-[#52B788]"
                  />
                  <Label htmlFor="emergency_vet_consent" className="text-xs text-[#1B4332] cursor-pointer font-bold flex items-center gap-1.5">
                    Emergency Veterinary Consent Authorized *
                  </Label>
                </div>
                <p className="text-[10px] text-[#6B5B4F]/85 leading-relaxed">
                  I authorize Pawffeur to transport my pet to the designated clinic below and seek emergency treatment if I cannot be reached.
                </p>

                {form.emergency_vet_consent && (
                  <div className="space-y-4 pt-2 border-t border-[#EDE8D9]">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <Label className="text-[#1B4332] font-semibold text-xs">Preferred Clinic Name</Label>
                        <Input disabled={isCoOwned} value={form.emergency_vet_name} onChange={(e) => setForm({...form, emergency_vet_name: e.target.value})} className="rounded-xl border-white bg-white" placeholder="West Loop Animal Hospital" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-[#1B4332] font-semibold text-xs">Preferred Clinic Phone</Label>
                        <Input disabled={isCoOwned} value={form.emergency_vet_phone} onChange={(e) => setForm({...form, emergency_vet_phone: e.target.value})} className="rounded-xl border-white bg-white" placeholder="(312) 555-4040" />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[#1B4332] font-semibold text-xs">Preferred Clinic Address</Label>
                      <Input disabled={isCoOwned} value={form.emergency_vet_address} onChange={(e) => setForm({...form, emergency_vet_address: e.target.value})} className="rounded-xl border-white bg-white" placeholder="815 W Randolph St, Chicago, IL" />
                    </div>
                  </div>
                )}
              </div>

              {/* Safety & Handling Flags */}
              <div className="bg-red-50/40 border border-red-100 rounded-2xl p-4 space-y-4">
                <h4 className="text-red-900 font-bold text-xs flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0" />
                  Safety & Handling Flags
                </h4>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      disabled={isCoOwned}
                      id="escape_risk"
                      checked={form.escape_risk}
                      onCheckedChange={(checked) => setForm({...form, escape_risk: !!checked})}
                      className="border-red-200 text-red-700 focus:ring-red-500 mt-1"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="escape_risk" className="text-xs text-[#1B4332] cursor-pointer font-bold">
                        Escape Risk
                      </Label>
                      <p className="text-[10px] text-[#6B5B4F]/85 leading-normal">
                        Passenger is a flight risk, slips collars, or darts out of crates.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      disabled={isCoOwned}
                      id="bite_scratch_risk"
                      checked={form.bite_scratch_risk}
                      onCheckedChange={(checked) => setForm({...form, bite_scratch_risk: !!checked})}
                      className="border-red-200 text-red-700 focus:ring-red-500 mt-1"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="bite_scratch_risk" className="text-xs text-[#1B4332] cursor-pointer font-bold">
                        Bite / Scratch Risk
                      </Label>
                      <p className="text-[10px] text-[#6B5B4F]/85 leading-normal">
                        History of nipping, scratching, or defensive biting.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      disabled={isCoOwned}
                      id="medical_risk"
                      checked={form.medical_risk}
                      onCheckedChange={(checked) => setForm({...form, medical_risk: !!checked, emergency_vet_consent: !!checked || form.emergency_vet_consent})}
                      className="border-red-200 text-red-700 focus:ring-red-500 mt-1"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="medical_risk" className="text-xs text-[#1B4332] cursor-pointer font-bold">
                        Medical Risk
                      </Label>
                      <p className="text-[10px] text-[#6B5B4F]/85 leading-normal">
                        Chronic illness, seizures, or special mobility requirements.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      disabled={isCoOwned}
                      id="carrier_required"
                      checked={form.carrier_required}
                      onCheckedChange={(checked) => setForm({...form, carrier_required: !!checked})}
                      className="border-red-200 text-red-700 focus:ring-red-500 mt-1"
                    />
                    <div className="space-y-0.5">
                      <Label htmlFor="carrier_required" className="text-xs text-[#1B4332] cursor-pointer font-bold">
                        Carrier Required
                      </Label>
                      <p className="text-[10px] text-[#6B5B4F]/85 leading-normal">
                        Must remain secured inside a carrier during transport.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Dynamic Warning Notes */}
                {(form.escape_risk || form.bite_scratch_risk || form.medical_risk) && (
                  <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3 space-y-2 mt-2">
                    <p className="text-[10px] font-bold text-amber-800 uppercase tracking-wider">⚠️ Pawffeur Safety Requirements:</p>
                    <ul className="list-disc list-inside text-[10px] text-amber-700 space-y-1">
                      {form.escape_risk && <li><strong>Escape Risk</strong>: Chauffeur must use double-leash/crate security checks during transfer.</li>}
                      {form.bite_scratch_risk && <li><strong>Bite / Scratch Risk</strong>: Chauffeur must pack heavy-duty gloves and limit direct contact.</li>}
                      {form.medical_risk && <li><strong>Medical Risk</strong>: Requires active emergency vet authorization and consent on file.</li>}
                    </ul>
                  </div>
                )}
              </div>

              {/* Freeform Notes */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label className="text-[#1B4332] font-semibold text-xs">Comfort & Care Notes (optional)</Label>
                  <span className="text-[10px] text-[#6B5B4F]/60">
                    {form.write_in_feedback?.notes?.length || 0} / 1000 chars
                  </span>
                </div>
                <Textarea
                  value={form.write_in_feedback?.notes || ""}
                  onChange={(e) => setForm({
                    ...form,
                    write_in_feedback: { notes: e.target.value }
                  })}
                  className="rounded-xl border-[#D8F3DC] resize-none"
                  rows={3}
                  placeholder="Special comfort guides, travel sickness guides, favorite treat rewards, or specific seating preferences."
                  maxLength={1000}
                />
              </div>

              {/* Co-Owner Invitation section (Only visible to Primary Owner during Edit mode) */}
              {editingId && !isCoOwned && (
                <div className="border-t border-[#EDF7F0] pt-5 space-y-3">
                  <Label className="text-[#1B4332] font-bold text-xs flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#2D6A4F]" />
                    Family & Co-owners
                  </Label>
                  
                  {/* Co-owner list */}
                  {coOwnersList.length > 0 ? (
                    <div className="space-y-2">
                      {coOwnersList.map(co => (
                        <div key={co.id} className="flex justify-between items-center bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl px-3 py-2 text-xs text-[#6B5B4F] font-medium">
                          <span>{co.co_owner_email}</span>
                          <Badge className="bg-blue-100 text-blue-800 border-none rounded-full text-[10px] font-semibold">Active Caretaker</Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#6B5B4F]/60 italic">No secondary co-owners linked to this passenger profile yet.</p>
                  )}

                  {/* Add co-owner form */}
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        type="email"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="co-owner@email.com"
                        className="rounded-xl border-[#D8F3DC] text-xs h-9"
                      />
                    </div>
                    <Button
                      onClick={handleInviteCoOwner}
                      disabled={inviteMutation.isPending || !inviteEmail}
                      className="bg-[#2D6A4F] hover:bg-[#1B4332] text-white rounded-xl px-3 text-xs h-9 flex gap-1 font-semibold"
                    >
                      {inviteMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                      Invite
                    </Button>
                  </div>
                  {inviteError && <p className="text-[10px] text-red-600 font-semibold">{inviteError}</p>}
                </div>
              )}

              {/* Past Chauffeur Observations Log History (Timeline) - Visible only during Edit mode */}
              {editingId && activeEditingProfile?.observations && (
                <div className="border-t border-[#EDF7F0] pt-5 space-y-3">
                  <Label className="text-[#1B4332] font-bold text-xs flex items-center gap-1.5">
                    📝 Driver Observations Timeline
                  </Label>
                  <div className="space-y-3">
                    {activeEditingProfile.observations.length > 0 ? (
                      <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
                        {activeEditingProfile.observations.map((obs) => (
                          <div key={obs.id} className="bg-[#F9F7F3] border border-[#EDE8D9] rounded-xl p-3 shadow-sm space-y-1.5 text-left">
                            <div className="flex justify-between items-center text-[10px]">
                              <span className="font-bold text-[#1B4332]">{obs.chauffeur_id}</span>
                              <span className="text-gray-400">{new Date(obs.created_at).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              <Badge className="bg-blue-100 text-blue-800 text-[10px] hover:bg-blue-100 font-semibold border-none px-2 py-0.5 rounded-full capitalize">
                                Behavior: {obs.behavior_summary}
                              </Badge>
                              <Badge className={`text-[10px] font-semibold border-none px-2 py-0.5 rounded-full capitalize ${
                                obs.incident_severity === "none" ? "bg-green-100 text-green-800" :
                                obs.incident_severity === "minor" ? "bg-amber-100 text-amber-800" :
                                obs.incident_severity === "moderate" ? "bg-orange-100 text-orange-800" :
                                "bg-red-100 text-red-800"
                              }`}>
                                Severity: {obs.incident_severity}
                              </Badge>
                            </div>
                            {obs.handling_outcomes && obs.handling_outcomes.length > 0 && (
                              <div className="text-[10px] text-[#6B5B4F] leading-tight">
                                <strong>Outcomes:</strong> {obs.handling_outcomes.map(o => o.replace(/_/g, " ")).join(", ")}
                              </div>
                            )}
                            {obs.notes && (
                              <p className="text-[11px] text-[#6B5B4F] italic border-l-2 border-[#D8F3DC] pl-2 py-0.5 leading-snug">
                                "{obs.notes}"
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-[11px] text-[#6B5B4F]/60 italic">No driver observations logged for this pet yet.</p>
                    )}
                  </div>
                </div>
              )}

              {/* Health Clearances / Travel Certificates remediation section */}
              {editingId && (
                <div className="border-t border-[#EDF7F0] pt-5 space-y-4 text-left">
                  <Label className="text-[#1B4332] font-bold text-xs flex items-center gap-1.5 uppercase tracking-wider">
                    🩺 Veterinary Health Certificates
                  </Label>
                  <p className="text-[11px] text-[#6B5B4F]/85 leading-relaxed">
                    Veterinary certificates must be pre-cleared by the dispatch office. You can upload replacement documents here if credentials are expired, rejected, or missing.
                  </p>
                  
                  {uploadError && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2 text-red-600 text-xs font-semibold">
                      <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{uploadError}</span>
                    </div>
                  )}

                  <div className="space-y-4">
                    {["rabies_certificate", "usda_health_certificate"].map((docType) => {
                      const doc = editingClearances.find(c => c.document_type === docType);
                      const docStatus = getDocumentStatus(doc);
                      const isRabies = docType === "rabies_certificate";
                      const docTitle = isRabies ? "Rabies Certificate" : "USDA Interstate Health Certificate";
                      
                      const showForm = showUploadForm[docType] || docStatus.status === "missing" || docStatus.status === "expired" || docStatus.status === "rejected";

                      return (
                        <div key={docType} className="border border-[#EDE8D9] rounded-2xl p-4 bg-white space-y-3.5 shadow-sm">
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="text-xs font-bold text-[#1B4332]">{docTitle}</h4>
                              <p className="text-[10px] text-gray-400 mt-0.5">Required for pet pre-clearance</p>
                            </div>
                            <Badge className={
                              docStatus.status === "valid" ? "bg-green-100 text-green-800 border-green-200" :
                              docStatus.status === "pending_review" ? "bg-amber-100 text-amber-800 border-amber-200" :
                              docStatus.status === "expiring_soon" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              "bg-red-100 text-red-800 border-red-200"
                            }>
                              {docStatus.status === "missing" ? "❌ Missing" :
                               docStatus.status === "pending_review" ? "⏳ Under Review" :
                               docStatus.status === "rejected" ? "❌ Rejected" :
                               docStatus.status === "expired" ? "❌ Expired" :
                               docStatus.status === "expiring_soon" ? `⚠️ Expiring (${docStatus.daysRemaining}d)` :
                               "✓ Active / Valid"}
                            </Badge>
                          </div>

                          {/* Existing document info */}
                          {doc && docStatus.status !== "missing" && (
                            <div className="bg-[#F9F7F3]/70 border border-[#EDE8D9]/50 rounded-xl p-3 text-[11px] text-[#6B5B4F] space-y-1.5">
                              <div className="flex justify-between">
                                <span className="font-semibold text-gray-400">Document PDF:</span>
                                <a href={doc.document_url} target="_blank" rel="noreferrer" className="text-[#2D6A4F] hover:underline font-bold">
                                  View Uploaded File
                                </a>
                              </div>
                              {doc.issue_date && (
                                <div className="flex justify-between">
                                  <span className="font-semibold text-gray-400">Issue Date:</span>
                                  <span className="font-bold text-[#1B4332]">{doc.issue_date}</span>
                                </div>
                              )}
                              {docStatus.expiryDate && (
                                <div className="flex justify-between">
                                  <span className="font-semibold text-gray-400">Calculated Expiry:</span>
                                  <span className="font-bold text-[#1B4332]">{docStatus.expiryDate}</span>
                                </div>
                              )}
                              {doc.vet_signing_name && (
                                <div className="flex justify-between">
                                  <span className="font-semibold text-gray-400">Signing Vet:</span>
                                  <span className="font-bold text-[#1B4332]">{doc.vet_signing_name}</span>
                                </div>
                              )}
                              {docStatus.status === "rejected" && doc.rejection_reason && (
                                <div className="pt-1.5 border-t border-[#EDE8D9] text-red-700">
                                  <strong>Rejection Reason:</strong> {doc.rejection_reason}
                                </div>
                              )}
                            </div>
                          )}

                          {/* Toggle form button for valid/pending review docs */}
                          {(docStatus.status === "valid" || docStatus.status === "pending_review" || docStatus.status === "expiring_soon") && (
                            <div className="flex justify-end">
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => setShowUploadForm(prev => ({ ...prev, [docType]: !prev[docType] }))}
                                className="text-xs font-bold text-[#2D6A4F] hover:text-[#1B4332] hover:bg-[#EDF7F0]/40 p-0 h-6"
                              >
                                {showUploadForm[docType] ? "Cancel Update" : "🔄 Upload Updated Certificate"}
                              </Button>
                            </div>
                          )}

                          {/* Upload form */}
                          {showForm && (
                            <div className="border-t border-dashed border-[#EDE8D9] pt-3.5 space-y-3">
                              <div className="space-y-1.5">
                                <Label className="text-[#1B4332] font-semibold text-[11px]">Certificate Document URL *</Label>
                                <Input
                                  value={documentUrls[docType]}
                                  onChange={(e) => setDocumentUrls(prev => ({ ...prev, [docType]: e.target.value }))}
                                  placeholder="https://example.com/my-pet-cert.pdf"
                                  className="rounded-xl border-[#D8F3DC] text-xs h-9 bg-white"
                                />
                              </div>

                              <div className="flex items-start gap-2 pt-1">
                                <Checkbox
                                  id={`integrity_${docType}`}
                                  checked={pdfIntegrityChecked[docType]}
                                  onCheckedChange={(checked) => setPdfIntegrityChecked(prev => ({ ...prev, [docType]: !!checked }))}
                                  className="border-[#D8F3DC] text-[#1B4332] focus:ring-[#52B788] mt-0.5"
                                />
                                <Label htmlFor={`integrity_${docType}`} className="text-[10px] text-[#6B5B4F] cursor-pointer font-medium leading-tight">
                                  I confirm this document matches the official veterinary medical record and has not been altered or tampered with.
                                </Label>
                              </div>

                              <Button
                                type="button"
                                onClick={() => {
                                  setUploadError("");
                                  if (!documentUrls[docType].trim()) {
                                    setUploadError("Please provide a certificate document URL.");
                                    return;
                                  }
                                  if (!pdfIntegrityChecked[docType]) {
                                    setUploadError("You must check the PDF Integrity verification checkbox to upload.");
                                    return;
                                  }
                                  setUploadingDocType(docType);
                                  uploadClearanceMutation.mutate({
                                    document_type: docType,
                                    document_url: documentUrls[docType]
                                  });
                                }}
                                disabled={uploadClearanceMutation.isPending && uploadingDocType === docType}
                                className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white text-xs font-bold rounded-xl py-2 px-3 w-full transition flex items-center justify-center gap-1.5 h-9 shadow-sm"
                              >
                                {uploadClearanceMutation.isPending && uploadingDocType === docType ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Send className="w-3.5 h-3.5" />
                                )}
                                Submit Document for Review
                              </Button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={isPending}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-3 h-auto font-bold flex items-center justify-center gap-2 shadow-md"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <PawPrint className="w-5 h-5" />
                )}
                <span>{isCoOwned ? "Submit Proposed Changes" : editingId ? "Save Changes" : "Save Pet and Continue"}</span>
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {/* Diff Suggestions Queue Review Modal (Only visible to Primary Owners) */}
        <Dialog open={reviewOpen} onOpenChange={(v) => { if (!v) { setReviewOpen(false); setReviewProfile(null); } }}>
          <DialogContent className="rounded-2xl max-w-lg max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-[#1B4332] text-xl font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0" />
                Review Proposed Changes
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-5 mt-2">
              <p className="text-xs text-[#6B5B4F] leading-relaxed">
                A secondary owner has suggested the following updates for <strong>{reviewProfile?.pet_name}</strong>. Approving will atomically merge all changes into the canonical profile.
              </p>

              {renderDiffTable()}

              <div className="flex gap-4 border-t border-[#EDE8D9] pt-4">
                <Button
                  onClick={() => reviewMutation.mutate("reject")}
                  disabled={reviewMutation.isPending}
                  className="flex-1 bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 border border-slate-200 rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2 h-auto"
                >
                  <X className="w-4 h-4" /> Reject Suggestions
                </Button>
                <Button
                  onClick={() => reviewMutation.mutate("approve")}
                  disabled={reviewMutation.isPending}
                  className="flex-1 bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl py-2.5 font-semibold flex items-center justify-center gap-2 h-auto shadow-sm"
                >
                  {reviewMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  Approve and Merge
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-72 rounded-2xl bg-white animate-pulse border border-[#EDF7F0]" />
          ))}
        </div>
      ) : activeProfiles.length === 0 ? (
        <div className="text-center py-20 bg-white border border-[#EDF7F0] rounded-3xl p-8 max-w-xl mx-auto shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-[#2D6A4F]/40" />
          </div>
          <h3 className="text-lg font-bold text-[#1B4332]">No passenger profiles yet</h3>
          <p className="text-sm text-[#6B5B4F]/50 mt-1 max-w-xs mx-auto">Create a secure profile for your pet to enable booking transport rides.</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {activeProfiles.map((profile, i) => {
            const hasPendingSuggestions = profile.suggested_changes && Object.keys(profile.suggested_changes).length > 0;
            const profileOwner = profile.owner_email === userEmail;

            return (
              <div key={profile.id} className="relative group h-full">
                <PetCard pet={profile} delay={i * 0.08} />
                
                {/* Actions Panel */}
                <div className="absolute bottom-3 right-3 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  
                  {/* Primary Owner Suggestion Review Queue Button */}
                  {profileOwner && hasPendingSuggestions && (
                    <Button
                      size="sm"
                      onClick={() => handleOpenReview(profile)}
                      className="bg-amber-500 hover:bg-amber-600 text-white rounded-xl h-9 px-3 border-none font-bold text-xs shadow-sm flex gap-1 items-center"
                    >
                      <AlertCircle className="w-3.5 h-3.5" />
                      Review Diff
                    </Button>
                  )}

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => handleOpenEdit(profile)}
                    className="bg-white/90 hover:bg-[#EDF7F0] text-[#1B4332] hover:text-[#2D6A4F] rounded-xl h-9 w-9 border border-[#EDF7F0] shadow-sm"
                    title={profileOwner ? "Edit Profile" : "Suggest Changes"}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  
                  {profileOwner && (
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => {
                        if (confirm("Are you sure you want to delete this pet profile?")) {
                          deleteMutation.mutate(profile.id);
                        }
                      }}
                      className="bg-white/90 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-xl h-9 w-9 border border-[#EDF7F0] shadow-sm"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}