import React, { useState, useEffect } from "react";
import { 
  Dog, CheckCircle2, AlertTriangle, Loader2, Plus, 
  Trash2, Edit, Check, X, ShieldAlert 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

export default function PetCareNoteManager({ booking }) {
  if (!booking) return null;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState([]);
  const [conflict, setConflict] = useState(false);
  const [error, setError] = useState("");
  const [editMode, setEditMode] = useState(false);

  // Editable pet name state to allow manual entry or corrections
  const [tempPetName, setTempPetName] = useState("");

  const [form, setForm] = useState({
    care_note_raw: "",
    driver_instruction: ""
  });

  // Extract initial pet name from booking or fallback to parsing notes
  useEffect(() => {
    let name = booking.pet_name || "";
    
    // Fallback: If pet_name is not direct but we have dog_sizes / notes, try to guess or leave empty for staff
    if (!name && booking.notes) {
      // Regex check for common pet name formats (e.g. "Bella is", "for Cooper")
      const match = booking.notes.match(/(?:pet|dog|cat)\s+named\s+([a-zA-Z]+)/i) || 
                    booking.notes.match(/(?:for)\s+([a-zA-Z]+)\b/i);
      if (match && match[1]) {
        name = match[1];
      }
    }
    
    setTempPetName(name);
    setNotes([]);
    setEditMode(false);
    setConflict(false);
    setError("");

    if (name) {
      fetchNotes(name);
    }
  }, [booking]);

  const fetchNotes = async (nameToQuery) => {
    if (!nameToQuery || !nameToQuery.trim()) return;
    setLoading(true);
    setConflict(false);
    setError("");
    try {
      const token = sessionStorage.getItem("dc_admin_token");
      const phone = booking.phone || "";
      const email = booking.email || "";

      const queryParams = new URLSearchParams({
        phone,
        email,
        pet_name: nameToQuery.trim()
      });

      const res = await fetch(`/api/pet-care-note?${queryParams.toString()}`, {
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });

      if (res.status === 409) {
        setConflict(true);
        const data = await res.json().catch(() => ({}));
        setNotes(data.data || []);
        return;
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to fetch care notes");
      }

      const data = await res.json();
      const fetchedNotes = data.data || [];
      setNotes(fetchedNotes);
      
      if (fetchedNotes.length > 1) {
        setConflict(true);
      }
    } catch (err) {
      console.error("Error fetching notes:", err);
      setError(err.message || "Failed to query care notes");
      toast.error(err.message || "Error loading pet care notes");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!tempPetName || !tempPetName.trim()) {
      toast.error("Pet's name is required to save care notes");
      return;
    }

    try {
      setSaving(true);
      const token = sessionStorage.getItem("dc_admin_token");
      
      const isUUID = (str) => typeof str === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
      const uuidLeadId = isUUID(booking.lead_id) ? booking.lead_id : (isUUID(booking.id) ? booking.id : null);

      const payload = {
        lead_id: uuidLeadId,
        phone: booking.phone,
        email: booking.email || null,
        pet_name: tempPetName.trim(),
        care_note_raw: form.care_note_raw.trim() || null,
        driver_instruction: form.driver_instruction.trim() || null,
        created_by: booking.assigned_to || "Alexander"
      };

      const res = await fetch("/api/pet-care-note", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to store care note");
      }

      toast.success(notes.length > 0 ? "Care note successfully updated!" : "Care note successfully created!");
      setEditMode(false);
      await fetchNotes(tempPetName);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleConfirm = async () => {
    if (notes.length === 0) return;
    try {
      setSaving(true);
      const token = sessionStorage.getItem("dc_admin_token");
      const res = await fetch("/api/pet-care-note", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: notes[0].id,
          action: "confirm",
          created_by: booking.assigned_to || "Alexander"
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to confirm care note");
      }

      toast.success("Care note confirmed as accurate!");
      await fetchNotes(tempPetName);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleArchive = async (idToArchive = null) => {
    const noteId = idToArchive || (notes[0] ? notes[0].id : null);
    if (!noteId) return;

    if (!window.confirm("Are you sure you want to archive this care note? It will no longer resurface for future bookings.")) {
      return;
    }

    try {
      setSaving(true);
      const token = sessionStorage.getItem("dc_admin_token");
      const res = await fetch("/api/pet-care-note", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          id: noteId,
          action: "archive",
          created_by: booking.assigned_to || "Alexander"
        })
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to archive care note");
      }

      toast.success("Care note archived successfully!");
      setEditMode(false);
      await fetchNotes(tempPetName);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = () => {
    setForm({
      care_note_raw: notes[0]?.care_note_raw || "",
      driver_instruction: notes[0]?.driver_instruction || ""
    });
    setEditMode(true);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (tempPetName.trim()) {
      fetchNotes(tempPetName);
    }
  };

  return (
    <div className="space-y-4 border-t border-[#EDF7F0] pt-6 mt-6">
      <div className="flex items-center justify-between">
        <h4 className="text-xs uppercase tracking-wider text-[#1B4332] font-bold flex items-center gap-1.5">
          <Dog className="w-4 h-4" /> Pet Care Notes
        </h4>
        {notes.length > 0 && !editMode && !conflict && (
          <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 text-[10px] font-bold uppercase py-0.5 px-2">
            Active Note
          </Badge>
        )}
      </div>

      {/* Pet Name input selector for indexing/matching */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1">
          <Label htmlFor="petNameManager" className="sr-only">Pet Name</Label>
          <Input
            id="petNameManager"
            type="text"
            placeholder="Enter pet's name to search/create notes..."
            value={tempPetName}
            onChange={(e) => setTempPetName(e.target.value)}
            className="h-9 rounded-xl border-[#D8F3DC] text-xs font-semibold text-gray-700"
          />
        </div>
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={loading || !tempPetName.trim()}
          className="rounded-xl border-[#D8F3DC] text-[#1B4332] hover:bg-[#EDF7F0] h-9 text-xs font-semibold"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Verify"}
        </Button>
      </form>

      {/* Loading state spinner */}
      {loading && (
        <div className="py-6 flex items-center justify-center text-[#6B5B4F]/60 text-xs font-semibold">
          <Loader2 className="w-5 h-5 animate-spin text-[#1B4332] mr-2" />
          Checking historical database...
        </div>
      )}

      {/* Error View */}
      {error && !loading && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 text-rose-800 text-xs">
          {error}
        </div>
      )}

      {/* NO NOTES FOUND STATE */}
      {!loading && !conflict && notes.length === 0 && tempPetName.trim() && !editMode && (
        <Card className="border border-dashed border-[#B7E4C7] bg-[#EDF7F0]/30 rounded-2xl overflow-hidden shadow-none">
          <CardContent className="p-4 space-y-3">
            <div className="flex gap-2.5 items-start text-xs text-[#2D6A4F] bg-[#EDF7F0] p-3 rounded-xl border border-[#B7E4C7] font-semibold leading-relaxed">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-[#2D6A4F]" />
              <div>
                <p className="font-bold text-[#1B4332]">No prior note found for {tempPetName}.</p>
                <p className="mt-0.5 text-[#2D6A4F]/90 font-medium">
                  Ask customer: &ldquo;Tell us anything that helps us care for your pet during the ride.&rdquo;
                </p>
              </div>
            </div>
            
            <Button
              onClick={() => {
                setForm({ care_note_raw: "", driver_instruction: "" });
                setEditMode(true);
              }}
              className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-9 text-xs font-bold"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Care Note for {tempPetName}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* CONFLICT WARNING STATE (Multiple active records found) */}
      {!loading && conflict && (
        <Card className="border border-amber-300 bg-amber-50/30 rounded-2xl overflow-hidden shadow-none">
          <CardContent className="p-4 space-y-4">
            <div className="flex gap-2 items-start text-xs text-amber-800 bg-amber-50 p-3 rounded-xl border border-amber-200 font-semibold leading-relaxed">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-bold text-amber-950">Manual Review Required</p>
                <p className="mt-0.5 text-amber-800/90">
                  Multiple active care notes were found matching this profile and the pet name &ldquo;{tempPetName}&rdquo;.
                </p>
              </div>
            </div>

            <div className="space-y-3.5 max-h-60 overflow-y-auto pr-1">
              {notes.map((note, index) => (
                <div key={note.id} className="p-3 bg-white border border-amber-100 rounded-xl space-y-2 relative shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded font-bold uppercase">
                      Record #{index + 1}
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled={saving}
                      onClick={() => handleArchive(note.id)}
                      className="h-6 px-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg text-[10px] font-bold"
                    >
                      <Trash2 className="w-3 h-3 mr-1" /> Archive This
                    </Button>
                  </div>
                  <div className="text-xs text-gray-700 space-y-1">
                    <p><strong>Raw Note:</strong> {note.care_note_raw || "—"}</p>
                    <p><strong>Instruction:</strong> {note.driver_instruction || "—"}</p>
                    <p className="text-[10px] text-gray-400 font-medium">
                      Saved: {new Date(note.created_at).toLocaleDateString()} by {note.created_by}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* ACTIVE NOTE DISPLAY STATE */}
      {!loading && !conflict && notes.length === 1 && !editMode && (
        <Card className="border border-[#EDF7F0] bg-white rounded-2xl overflow-hidden shadow-sm">
          <CardContent className="p-4 space-y-4">
            <div className="text-xs font-semibold text-[#1B4332]">
              Previous Pet Care Note found.
            </div>

            <div className="space-y-3">
              <div className="space-y-1 bg-[#F9F7F3] border border-[#EDF7F0] p-3 rounded-xl">
                <span className="text-[10px] text-[#6B5B4F]/80 uppercase tracking-wider font-bold">Owner Care Notes</span>
                <p className="text-xs text-gray-700 leading-relaxed font-medium">
                  {notes[0].care_note_raw || "No owner-provided notes."}
                </p>
              </div>

              <div className="space-y-1 bg-[#EDF7F0]/60 border border-[#D8F3DC] p-3 rounded-xl">
                <span className="text-[10px] text-[#2D6A4F] uppercase tracking-wider font-bold">Driver Instructions (Internal)</span>
                <p className="text-xs text-gray-800 leading-relaxed font-bold">
                  {notes[0].driver_instruction || "No internal instructions specified."}
                </p>
              </div>

              <div className="text-[10px] text-gray-400 font-bold flex justify-between">
                <span>Last Verified: {new Date(notes[0].last_confirmed_at).toLocaleDateString()}</span>
                <span>By: {notes[0].created_by}</span>
              </div>
            </div>

            <div className="border-t border-[#EDF7F0] pt-3 flex flex-col gap-2">
              <p className="text-[10px] text-[#6B5B4F]/90 font-bold text-center">Is this still accurate?</p>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  size="sm"
                  disabled={saving}
                  onClick={handleConfirm}
                  className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-8 text-[11px] font-bold shadow-sm flex items-center justify-center"
                >
                  {saving ? <Loader2 className="w-3 animate-spin" /> : <><Check className="w-3 h-3 mr-1" /> Confirm</>}
                </Button>
                
                <Button
                  size="sm"
                  variant="outline"
                  disabled={saving}
                  onClick={startEdit}
                  className="border-[#D8F3DC] text-[#1B4332] hover:bg-[#EDF7F0] rounded-xl h-8 text-[11px] font-bold flex items-center justify-center"
                >
                  <Edit className="w-3 h-3 mr-1" /> Update
                </Button>

                <Button
                  size="sm"
                  variant="ghost"
                  disabled={saving}
                  onClick={() => handleArchive()}
                  className="text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-xl h-8 text-[11px] font-bold flex items-center justify-center"
                >
                  <Trash2 className="w-3 h-3 mr-1" /> Archive
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* NOTE CREATION / EDITING FORM STATE */}
      {editMode && (
        <form onSubmit={handleSave} className="space-y-4 bg-[#EDF7F0]/30 border border-[#B7E4C7] p-4 rounded-2xl">
          <div className="space-y-1 text-center sm:text-left">
            <h5 className="text-xs font-bold text-[#1B4332]">
              {notes.length > 0 ? `Update Care Note for ${tempPetName}` : `New Care Note for ${tempPetName}`}
            </h5>
            <p className="text-[10px] text-[#6B5B4F]/80 font-medium">
              Ensure notes are concise, operational, and intended for internal driver coordination.
            </p>
          </div>

          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="careNoteInput" className="text-[10px] text-[#2D6A4F] font-bold">Owner Care Notes / Behaviors</Label>
              <Textarea
                id="careNoteInput"
                placeholder="Owner says: Bella anxious at loading, prefers reward treats..."
                value={form.care_note_raw}
                onChange={(e) => setForm(prev => ({ ...prev, care_note_raw: e.target.value }))}
                className="rounded-xl border-[#D8F3DC] text-xs h-20 focus-visible:ring-[#2D6A4F] bg-white"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="driverInstructionInput" className="text-[10px] text-[#2D6A4F] font-bold">Driver Instructions (Internal Only)</Label>
              <Textarea
                id="driverInstructionInput"
                placeholder="Allow sniff time. Calm voice. Do not rush entry."
                value={form.driver_instruction}
                onChange={(e) => setForm(prev => ({ ...prev, driver_instruction: e.target.value }))}
                className="rounded-xl border-[#D8F3DC] text-xs h-20 focus-visible:ring-[#2D6A4F] bg-white font-semibold"
              />
            </div>
          </div>

          <div className="flex gap-2 justify-end border-t border-[#B7E4C7] pt-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={saving}
              onClick={() => setEditMode(false)}
              className="border-[#D8F3DC] text-[#1B4332] hover:bg-[#EDF7F0] rounded-xl h-8 text-xs font-bold"
            >
              Cancel
            </Button>
            
            <Button
              type="submit"
              size="sm"
              disabled={saving || (!form.care_note_raw.trim() && !form.driver_instruction.trim())}
              className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-8 text-xs font-bold shadow-sm flex items-center"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" /> : <Check className="w-3.5 h-3.5 mr-1" />}
              Save Note
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
