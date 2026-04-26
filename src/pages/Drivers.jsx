import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Users, UserPlus, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DriverCard from "../components/drivers/DriverCard";
import { Skeleton } from "@/components/ui/skeleton";

export default function Drivers() {
  const [user, setUser] = useState(null);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const isAdmin = user?.role === "admin";

  const { data: drivers = [], isLoading } = useQuery({
    queryKey: ["drivers"],
    queryFn: () => base44.entities.User.filter({ role: "driver" }),
    enabled: !!user,
  });

  const { data: trips = [] } = useQuery({
    queryKey: ["all-trips"],
    queryFn: () => base44.entities.Trip.list("-created_date", 200),
    enabled: !!user,
  });

  const handleInvite = async () => {
    if (!email) return;
    setInviting(true);
    setInviteMsg("");
    await base44.users.inviteUser(email, "driver");
    setInviteMsg(`Invitation sent to ${email}!`);
    setEmail("");
    setInviting(false);
    setTimeout(() => {
      setInviteOpen(false);
      setInviteMsg("");
      queryClient.invalidateQueries({ queryKey: ["drivers"] });
    }, 2000);
  };

  const getDriverTrips = (driverEmail) =>
    trips.filter((t) => t.driver_email === driverEmail);

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-[#1B4332]">Drivers</h1>
          <p className="text-[#6B5B4F]/60 mt-1">Manage your transport team</p>
        </div>
        {isAdmin && (
          <Button
            onClick={() => setInviteOpen(true)}
            className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Invite Driver
          </Button>
        )}
      </div>

      {/* Driver grid */}
      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : drivers.length === 0 ? (
        <div className="text-center py-20">
          <div className="w-16 h-16 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-4">
            <Users className="w-8 h-8 text-[#2D6A4F]/40" />
          </div>
          <h3 className="text-lg font-semibold text-[#1B4332]">No drivers yet</h3>
          <p className="text-sm text-[#6B5B4F]/50 mt-1">Invite a driver to get started.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {drivers.map((driver, i) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              trips={getDriverTrips(driver.email)}
              delay={i * 0.08}
            />
          ))}
        </div>
      )}

      {/* Invite dialog */}
      <Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#1B4332]">Invite a Driver</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B4F]/40" />
                <Input
                  placeholder="driver@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9 rounded-xl border-[#D8F3DC]"
                  onKeyDown={(e) => e.key === "Enter" && handleInvite()}
                />
              </div>
              <Button
                onClick={handleInvite}
                disabled={inviting || !email}
                className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl"
              >
                {inviting ? "Sending…" : "Send Invite"}
              </Button>
            </div>
            {inviteMsg && (
              <p className="text-sm text-[#2D6A4F] font-medium">{inviteMsg}</p>
            )}
            <p className="text-xs text-[#6B5B4F]/50">
              The driver will receive an email to join the platform with the "driver" role.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}