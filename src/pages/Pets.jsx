import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, PawPrint, Loader2, Trash2 } from "lucide-react";
import PetCard from "../components/dashboard/PetCard";

export default function Pets() {
  const [user, setUser] = useState(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ name: "", pet_type: "", breed: "", age: "", weight: "", notes: "" });
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: pets = [], isLoading } = useQuery({
    queryKey: ["my-pets", user?.email],
    queryFn: () => base44.entities.Pet.filter({ owner_email: user.email }),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.Pet.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-pets"] });
      setOpen(false);
      setForm({ name: "", pet_type: "", breed: "", age: "", weight: "", notes: "" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Pet.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["my-pets"] }),
  });

  const handleSubmit = () => {
    createMutation.mutate({
      ...form,
      age: form.age ? Number(form.age) : undefined,
      weight: form.weight ? Number(form.weight) : undefined,
      special_care_instructions: form.notes || undefined,
      owner_email: user.email,
    });
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">My Pets</h1>
          <p className="text-[#6B5B4F]/60 mt-1">Manage your pet profiles</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Add Pet
            </Button>
          </DialogTrigger>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle className="text-[#1B4332]">Add a Pet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1B4332]">Pet Name *</Label>
                  <Input value={form.name} onChange={(e) => setForm({...form, name: e.target.value})} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-[#1B4332]">Pet Type *</Label>
                  <Select value={form.pet_type} onValueChange={(v) => setForm({...form, pet_type: v})}>
                    <SelectTrigger className="rounded-xl mt-1"><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Dog">Dog</SelectItem>
                      <SelectItem value="Cat">Cat</SelectItem>
                      <SelectItem value="Other household pet">Other household pet</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label className="text-[#1B4332]">Breed (optional)</Label>
                <Input value={form.breed} onChange={(e) => setForm({...form, breed: e.target.value})} className="rounded-xl mt-1" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1B4332]">Age (years, optional)</Label>
                  <Input type="number" value={form.age} onChange={(e) => setForm({...form, age: e.target.value})} className="rounded-xl mt-1" />
                </div>
                <div>
                  <Label className="text-[#1B4332]">Weight (lbs, optional)</Label>
                  <Input type="number" value={form.weight} onChange={(e) => setForm({...form, weight: e.target.value})} className="rounded-xl mt-1" />
                </div>
              </div>
              <div>
                <Label className="text-[#1B4332]">Important Notes (optional)</Label>
                <Textarea
                  value={form.notes}
                  onChange={(e) => setForm({...form, notes: e.target.value})}
                  className="rounded-xl mt-1 resize-none"
                  rows={3}
                  placeholder="Medications, anxiety triggers, crate needs, allergies, or other instructions"
                />
              </div>
              <Button
                onClick={handleSubmit}
                disabled={!form.name || !form.pet_type || createMutation.isPending}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <PawPrint className="w-4 h-4 mr-2" />}
                Save Pet and Continue
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 rounded-2xl bg-white animate-pulse border border-[#EDF7F0]" />
          ))}
        </div>
      ) : pets.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <PawPrint className="w-8 h-8 text-[#2D6A4F]/40" />
          </div>
          <h3 className="text-lg font-semibold text-[#1B4332]">No pets yet</h3>
          <p className="text-sm text-[#6B5B4F]/50 mt-1">Add your first pet to get started</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map((pet, i) => (
            <div key={pet.id} className="relative group">
              <PetCard pet={pet} delay={i * 0.08} />
              <Button
                size="icon"
                variant="ghost"
                onClick={() => deleteMutation.mutate(pet.id)}
                className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-red-50 hover:text-red-500 rounded-xl h-8 w-8"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}