import React, { useState, useEffect } from "react";
import { 
  Search, Lock, LogOut, Clock, CheckCircle2, AlertCircle, 
  Calendar, User, MapPin, Dog, Loader2, RefreshCw, Phone, Mail, FileText,
  RotateCcw, Check, CheckSquare, ClipboardList, ShieldAlert
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

// ─── Pre-loaded B2B Partners Template Data ──────────────────────────────────
const initialPartners = [
  { id: 1, name: "Lincoln Park Animal Hospital", type: "Vet Clinic", neighborhood: "Lincoln Park", contact: "(312) 555-0190", isKnown: "Yes", status: "Not Contacted", notes: "Alexander knows the practice manager here." },
  { id: 2, name: "Wicker Park Veterinary Clinic", type: "Vet Clinic", neighborhood: "Wicker Park", contact: "(773) 555-0210", isKnown: "No", status: "Not Contacted", notes: "High volume clinic. Priority prospect." },
  { id: 3, name: "Andersonville Cat Clinic", type: "Vet Clinic", neighborhood: "Andersonville", contact: "(773) 555-0340", isKnown: "No", status: "Not Contacted", notes: "Focus on cat boarding and transport referral." },
  { id: 4, name: "MedVet Chicago", type: "Emergency Clinic", neighborhood: "Avondale", contact: "(773) 555-0450", isKnown: "Yes", status: "Contacted", notes: "Alexander dropped off a test ride here. Active contact." },
  { id: 5, name: "Lakeview Animal Hospital", type: "Vet Clinic", neighborhood: "Lakeview", contact: "(773) 555-0560", isKnown: "No", status: "Not Contacted", notes: "Good location. Needs outreach package." },
  { id: 6, name: "Bucktown Animal Hospital", type: "Vet Clinic", neighborhood: "Bucktown", contact: "(773) 555-0670", isKnown: "No", status: "Not Contacted", notes: "" }
];

// ─── Pre-loaded SOP Checklists Template Data ─────────────────────────────────
const initialMorningChecklist = [
  { id: "m1", label: "Vehicle walkaround & tire pressure inspection", checked: false },
  { id: "m2", label: "Crate lock security & alignment checks", checked: false },
  { id: "m3", label: "Sanitization supplies restocked (wipes, spray, towels)", checked: false },
  { id: "m4", label: "Leashes, harness sizes, and reward treats present", checked: false },
  { id: "m5", label: "Emergency phone card and vehicle papers present", checked: false }
];

const initialEveningChecklist = [
  { id: "e1", label: "Log odometer mileage in Google Sheets database", checked: false },
  { id: "e2", label: "Crate interiors wiped down and sanitized", checked: false },
  { id: "e3", label: "Fuel level check (fill up if under 1/4 tank)", checked: false },
  { id: "e4", label: "Send schedule text to tomorrow's client list", checked: false }
];

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("bookings"); // "bookings" | "checklists" | "partners"
  
  // Bookings state (central API query)
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [driverInputs, setDriverInputs] = useState({});

  // Checklists local state
  const [morningChecklist, setMorningChecklist] = useState(initialMorningChecklist);
  const [eveningChecklist, setEveningChecklist] = useState(initialEveningChecklist);

  // B2B Partners local state
  const [partners, setPartners] = useState(initialPartners);
  const [partnersSearchQuery, setPartnersSearchQuery] = useState("");

  // Check auth state from sessionStorage on load
  useEffect(() => {
    const token = sessionStorage.getItem("dc_admin_token");
    if (token) {
      setIsAuthenticated(true);
      fetchBookings(token);
    }
  }, []);

  // Fetch bookings list from backend Vercel endpoint
  const fetchBookings = async (token) => {
    setLoadingBookings(true);
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "GET",
        headers: {
          "Authorization": token || sessionStorage.getItem("dc_admin_token")
        }
      });
      const data = await response.json().catch(() => ({}));
      if (response.ok && data.success) {
        setBookings(data.bookings || []);
        
        // Initialize driver inputs
        const initialDrivers = {};
        (data.bookings || []).forEach(b => {
          initialDrivers[b.bookingId] = b.driver || "Unassigned";
        });
        setDriverInputs(initialDrivers);
      } else {
        throw new Error(data.error || "Failed to load bookings");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.message || "Error loading bookings data");
    } finally {
      setLoadingBookings(false);
    }
  };

  // Authenticate Admin
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoadingAuth(true);
    try {
      const response = await fetch("/api/admin/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        sessionStorage.setItem("dc_admin_token", data.token);
        setIsAuthenticated(true);
        toast.success("Welcome to Control Tower!");
        fetchBookings(data.token);
      } else {
        throw new Error(data.error || "Authentication failed");
      }
    } catch (err) {
      toast.error(err.message || "Invalid password");
    } finally {
      setLoadingAuth(false);
    }
  };

  // Sign out Admin
  const handleLogout = () => {
    sessionStorage.removeItem("dc_admin_token");
    setIsAuthenticated(false);
    setBookings([]);
    setPassword("");
    toast.success("Logged out successfully");
  };

  // Update Booking Status or Driver Assignment
  const handleUpdate = async (bookingId, updatedFields) => {
    setUpdatingId(bookingId);
    const token = sessionStorage.getItem("dc_admin_token");
    try {
      const response = await fetch("/api/admin/bookings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": token
        },
        body: JSON.stringify({
          action: "update",
          bookingId,
          ...updatedFields
        })
      });
      const data = await response.json().catch(() => ({}));
      
      if (response.ok && data.success) {
        toast.success(
          updatedFields.status 
            ? `Status updated to '${updatedFields.status}'` 
            : "Driver assigned successfully"
        );
        
        // Update local state row
        setBookings(prev => prev.map(b => 
          b.bookingId === bookingId 
            ? { ...b, ...updatedFields } 
            : b
        ));
      } else {
        throw new Error(data.error || "Update failed");
      }
    } catch (err) {
      toast.error(err.message || "Failed to update booking");
    } finally {
      setUpdatingId(null);
    }
  };

  // Handle local driver input change
  const handleDriverInputChange = (bookingId, val) => {
    setDriverInputs(prev => ({ ...prev, [bookingId]: val }));
  };

  // ─── Tab 2: Checklist Handlers ──────────────────────────────────────────────
  const toggleMorningItem = (id) => {
    setMorningChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const toggleEveningItem = (id) => {
    setEveningChecklist(prev => prev.map(item => 
      item.id === id ? { ...item, checked: !item.checked } : item
    ));
  };

  const handleResetChecklists = () => {
    setMorningChecklist(prev => prev.map(item => ({ ...item, checked: false })));
    setEveningChecklist(prev => prev.map(item => ({ ...item, checked: false })));
    toast.success("Shift checklists have been reset!");
  };

  // ─── Tab 3: Partners Handlers ───────────────────────────────────────────────
  const handlePartnerStatusChange = (id, newStatus) => {
    setPartners(prev => prev.map(p => 
      p.id === id ? { ...p, status: newStatus } : p
    ));
    toast.success("Partner pipeline status updated");
  };

  const handlePartnerNotesChange = (id, newNotes) => {
    setPartners(prev => prev.map(p => 
      p.id === id ? { ...p, notes: newNotes } : p
    ));
  };

  // ─── Filter Bookings ────────────────────────────────────────────────────────
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      (b.bookingId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    if (statusFilter === "All") return matchesSearch;
    
    const cleanStatus = (b.status || "").toLowerCase().replace("_", " ");
    const cleanFilter = statusFilter.toLowerCase();
    
    if (cleanFilter === "pending review") {
      return matchesSearch && (cleanStatus.includes("pending") || cleanStatus.includes("review"));
    }
    return matchesSearch && cleanStatus === cleanFilter;
  });

  const filteredPartners = partners.filter(p => 
    p.name.toLowerCase().includes(partnersSearchQuery.toLowerCase()) ||
    p.neighborhood.toLowerCase().includes(partnersSearchQuery.toLowerCase()) ||
    p.type.toLowerCase().includes(partnersSearchQuery.toLowerCase())
  );

  // Calculate stats
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => {
    const s = (b.status || "Pending Review").toLowerCase();
    return s.includes("pending") || s.includes("review");
  }).length;
  const confirmedCount = bookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length;
  const completedCount = bookings.filter(b => (b.status || "").toLowerCase() === "completed").length;

  // ─── RENDERS ────────────────────────────────────────────────────────────────
  
  // Tab 1: Bookings Content View
  const renderBookingsTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1B4332] tracking-tight">Rides Control Tower</h2>
        <p className="text-[#6B5B4F]/80 mt-1 font-medium">Manage fleet dispatch, bookings, and carrier triggers</p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-[#EDF7F0] text-[#1B4332] rounded-xl flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B5B4F]/70 font-bold uppercase tracking-wider">Total Requests</p>
              <h3 className="text-2xl font-bold text-[#1B4332] mt-0.5">{totalCount}</h3>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B5B4F]/70 font-bold uppercase tracking-wider">Pending Review</p>
              <h3 className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
              <CheckSquare className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B5B4F]/70 font-bold uppercase tracking-wider">Confirmed</p>
              <h3 className="text-2xl font-bold text-emerald-600 mt-0.5">{confirmedCount}</h3>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="w-10 h-10 bg-sky-50 text-sky-600 rounded-xl flex items-center justify-center shrink-0">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] text-[#6B5B4F]/70 font-bold uppercase tracking-wider">Completed</p>
              <h3 className="text-2xl font-bold text-sky-600 mt-0.5">{completedCount}</h3>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white border border-[#EDF7F0] p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B4F]/60" />
          <Input
            type="text"
            placeholder="Search by ID, name, phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-[#D8F3DC]"
          />
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          {["All", "Pending Review", "Confirmed", "Completed", "Cancelled"].map(tab => (
            <Button
              key={tab}
              variant={statusFilter === tab ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(tab)}
              className={`rounded-xl h-9 text-xs font-semibold ${
                statusFilter === tab 
                  ? "bg-[#1B4332] hover:bg-[#2D6A4F] text-white" 
                  : "border-[#D8F3DC] text-[#6B5B4F] hover:bg-[#EDF7F0]"
              }`}
            >
              {tab}
            </Button>
          ))}
        </div>
      </div>

      {/* Table grid */}
      <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
        {loadingBookings ? (
          <div className="py-20 flex flex-col items-center justify-center text-[#6B5B4F]/60">
            <Loader2 className="w-10 h-10 animate-spin text-[#1B4332] mb-3" />
            <p className="font-semibold text-sm">Querying Google Sheets database...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="py-20 text-center text-[#6B5B4F]/60">
            <AlertCircle className="w-10 h-10 mx-auto text-[#6B5B4F]/40 mb-3" />
            <p className="font-semibold text-sm">No bookings found matching filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-[#EDF7F0]/40">
                <TableRow className="border-b border-[#EDF7F0]">
                  <TableHead className="text-[#1B4332] font-bold">Booking ID</TableHead>
                  <TableHead className="text-[#1B4332] font-bold">Customer</TableHead>
                  <TableHead className="text-[#1B4332] font-bold">Trip Details</TableHead>
                  <TableHead className="text-[#1B4332] font-bold">Date & Time</TableHead>
                  <TableHead className="text-[#1B4332] font-bold">Status</TableHead>
                  <TableHead className="text-[#1B4332] font-bold">Driver Assigned</TableHead>
                  <TableHead className="text-[#1B4332] font-bold text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.map((b) => {
                  const isUrgent = b.is_urgent === "YES" || b.is_urgent === true;
                  const cleanStatus = b.status || "Pending Review";
                  return (
                    <TableRow 
                      key={b.bookingId} 
                      className={`border-b border-[#EDF7F0]/60 transition-colors ${
                        isUrgent ? "bg-[#FEF3C7]/20 hover:bg-[#FEF3C7]/30" : "hover:bg-[#EDF7F0]/10"
                      }`}
                    >
                      <TableCell className="font-bold text-[#1B4332]">
                        <div className="flex flex-col">
                          <span>{b.bookingId}</span>
                          {isUrgent && (
                            <Badge className="bg-red-100 text-red-700 hover:bg-red-100 border border-red-200 text-[10px] py-0 px-1.5 w-max font-extrabold mt-1">
                              🚨 URGENT
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-semibold text-gray-800">{b.full_name}</div>
                        <div className="text-xs text-[#6B5B4F]/80 flex items-center gap-1.5 mt-0.5">
                          <Phone className="w-3.5 h-3.5" /> {b.phone}
                        </div>
                      </TableCell>
                      <TableCell className="max-w-xs">
                        <div className="text-xs font-semibold text-gray-700 truncate">
                          <span className="text-[#1B4332] font-bold">From: </span>{b.pickup_address}
                        </div>
                        <div className="text-xs text-[#6B5B4F] truncate mt-0.5">
                          <span className="text-[#1B4332] font-bold">To: </span>{b.dropoff_address}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs font-bold text-gray-700">{b.preferred_date}</div>
                        <div className="text-xs text-[#6B5B4F] mt-0.5">{b.preferred_time_window || "All day"}</div>
                      </TableCell>
                      <TableCell>
                        {updatingId === b.bookingId ? (
                          <Loader2 className="w-5 h-5 animate-spin text-[#1B4332]" />
                        ) : (
                          <Select 
                            value={cleanStatus} 
                            onValueChange={(val) => handleUpdate(b.bookingId, { status: val })}
                          >
                            <SelectTrigger className={`w-36 h-9 rounded-xl font-bold border-0 text-xs shadow-none text-white ${
                              cleanStatus === "Confirmed" ? "bg-emerald-600 hover:bg-emerald-700" :
                              cleanStatus === "Completed" ? "bg-sky-600 hover:bg-sky-700" :
                              cleanStatus === "Cancelled" ? "bg-rose-600 hover:bg-rose-700" :
                              "bg-[#6C757D] hover:bg-[#5A6268]"
                            }`}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl border-[#D8F3DC]">
                              <SelectItem value="Pending Review">Pending Review</SelectItem>
                              <SelectItem value="Confirmed">Confirmed</SelectItem>
                              <SelectItem value="Completed">Completed</SelectItem>
                              <SelectItem value="Cancelled">Cancelled</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      </TableCell>
                      <TableCell>
                        <Input
                          type="text"
                          value={driverInputs[b.bookingId] || ""}
                          onChange={(e) => handleDriverInputChange(b.bookingId, e.target.value)}
                          onBlur={() => {
                            if (driverInputs[b.bookingId] !== b.driver) {
                              handleUpdate(b.bookingId, { driver: driverInputs[b.bookingId] });
                            }
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && driverInputs[b.bookingId] !== b.driver) {
                              handleUpdate(b.bookingId, { driver: driverInputs[b.bookingId] });
                            }
                          }}
                          className="w-36 h-9 rounded-xl border-[#D8F3DC] text-xs font-semibold text-gray-700"
                          placeholder="Type driver name..."
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedBooking(b)}
                          className="rounded-xl border-[#D8F3DC] text-[#1B4332] hover:bg-[#EDF7F0] h-9"
                        >
                          View Card
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </Card>
    </div>
  );

  // Tab 2: Checklists Content View
  const renderChecklistsTab = () => (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-[#1B4332] tracking-tight">Daily Readiness Checklist</h2>
          <p className="text-[#6B5B4F]/80 mt-1 font-medium">Standard vehicle safety and sanitization audits</p>
        </div>
        <Button
          onClick={handleResetChecklists}
          variant="outline"
          className="border-amber-200 text-amber-800 bg-amber-50/50 hover:bg-amber-50 rounded-xl font-bold shrink-0 self-start sm:self-center"
        >
          <RotateCcw className="w-4 h-4 mr-2" />
          Reset checklists
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Morning Checklist Card */}
        <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#1B4332] p-5 text-white flex items-center gap-3">
            <Calendar className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-base">Morning Shift Prep</h3>
              <p className="text-xs text-white/70">Execute before departing for first pickup</p>
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            {morningChecklist.map(item => (
              <label 
                key={item.id} 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  item.checked 
                    ? "bg-[#EDF7F0]/40 border-[#D8F3DC] text-[#6B5B4F]/60 line-through" 
                    : "bg-white border-[#EDF7F0] text-gray-800 hover:bg-[#EDF7F0]/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleMorningItem(item.id)}
                  className="mt-1 w-4 h-4 accent-[#1B4332] cursor-pointer"
                />
                <span className="text-sm font-semibold leading-relaxed">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>

        {/* Evening Checklist Card */}
        <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
          <div className="bg-[#2D6A4F] p-5 text-white flex items-center gap-3">
            <ClipboardList className="w-5 h-5" />
            <div>
              <h3 className="font-bold text-base">Evening Shift Wrap-up</h3>
              <p className="text-xs text-white/70">Execute upon parking vehicle for the night</p>
            </div>
          </div>
          <CardContent className="p-6 space-y-4">
            {eveningChecklist.map(item => (
              <label 
                key={item.id} 
                className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition-colors ${
                  item.checked 
                    ? "bg-[#EDF7F0]/40 border-[#D8F3DC] text-[#6B5B4F]/60 line-through" 
                    : "bg-white border-[#EDF7F0] text-gray-800 hover:bg-[#EDF7F0]/10"
                }`}
              >
                <input
                  type="checkbox"
                  checked={item.checked}
                  onChange={() => toggleEveningItem(item.id)}
                  className="mt-1 w-4 h-4 accent-[#1B4332] cursor-pointer"
                />
                <span className="text-sm font-semibold leading-relaxed">{item.label}</span>
              </label>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="bg-[#F9F7F3] border border-[#EDF7F0] rounded-2xl p-5 flex items-start gap-4">
        <ShieldAlert className="w-5 h-5 text-[#2D6A4F] shrink-0 mt-0.5" />
        <div className="space-y-1">
          <h4 className="text-sm font-bold text-[#1B4332]">SOP Safety Note</h4>
          <p className="text-xs text-[#6B5B4F] leading-relaxed">
            Standard checks protect the animal, the driver, and the brand. Never bypass tire inspections or leash integrity verifications. Sanitization check blocks potential cross-contamination between clients.
          </p>
        </div>
      </div>
    </div>
  );

  // Tab 3: B2B Partnerships view
  const renderPartnersTab = () => (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-extrabold text-[#1B4332] tracking-tight">Partnerships Pipeline</h2>
        <p className="text-[#6B5B4F]/80 mt-1 font-medium">B2B client referral clinics, groomers, and pipeline logs</p>
      </div>

      {/* Search Bar */}
      <div className="bg-white border border-[#EDF7F0] p-4 rounded-2xl shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B5B4F]/60" />
          <Input
            type="text"
            placeholder="Search prospects by clinic, area..."
            value={partnersSearchQuery}
            onChange={(e) => setPartnersSearchQuery(e.target.value)}
            className="pl-10 rounded-xl border-[#D8F3DC]"
          />
        </div>
      </div>

      {/* Partners Grid */}
      <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-[#EDF7F0]/40">
              <TableRow className="border-b border-[#EDF7F0]">
                <TableHead className="text-[#1B4332] font-bold">Business Name</TableHead>
                <TableHead className="text-[#1B4332] font-bold">Neighborhood</TableHead>
                <TableHead className="text-[#1B4332] font-bold">Type</TableHead>
                <TableHead className="text-[#1B4332] font-bold">Contact Phone</TableHead>
                <TableHead className="text-[#1B4332] font-bold">Known By Alex</TableHead>
                <TableHead className="text-[#1B4332] font-bold">Outreach Status</TableHead>
                <TableHead className="text-[#1B4332] font-bold">Outreach Notes / Logs</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPartners.map(p => (
                <TableRow key={p.id} className="border-b border-[#EDF7F0]/60 hover:bg-[#EDF7F0]/10">
                  <TableCell className="font-bold text-[#1B4332]">{p.name}</TableCell>
                  <TableCell className="font-semibold text-gray-800">{p.neighborhood}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="bg-[#EDF7F0]/20 text-[#2D6A4F] border-[#D8F3DC] font-bold text-[10px]">
                      {p.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-600 font-semibold">{p.contact}</TableCell>
                  <TableCell>
                    <Badge className={`text-[10px] font-extrabold ${p.isKnown === "Yes" ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"}`}>
                      {p.isKnown}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Select 
                      value={p.status} 
                      onValueChange={(val) => handlePartnerStatusChange(p.id, val)}
                    >
                      <SelectTrigger className={`w-36 h-9 rounded-xl font-bold border-0 text-xs text-white ${
                        p.status === "Active Partner" ? "bg-emerald-600" :
                        p.status === "Meeting Scheduled" ? "bg-sky-600" :
                        p.status === "Contacted" ? "bg-amber-600" :
                        p.status === "Needs Follow-Up" ? "bg-rose-600" :
                        "bg-[#6C757D]"
                      }`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-[#D8F3DC]">
                        <SelectItem value="Not Contacted">Not Contacted</SelectItem>
                        <SelectItem value="Contacted">Contacted</SelectItem>
                        <SelectItem value="Meeting Scheduled">Meeting Scheduled</SelectItem>
                        <SelectItem value="Active Partner">Active Partner</SelectItem>
                        <SelectItem value="Needs Follow-Up">Needs Follow-Up</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="text"
                      value={p.notes}
                      onChange={(e) => handlePartnerNotesChange(p.id, e.target.value)}
                      className="w-56 h-9 rounded-xl border-[#D8F3DC] text-xs font-semibold text-gray-700"
                      placeholder="Add logging notes here..."
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );

  // ─── Render Authentication Page ─────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <main className="min-h-screen bg-[#F9F7F3] flex items-center justify-center p-6 font-sans">
        <Card className="w-full max-w-md bg-white border border-[#EDF7F0] shadow-2xl rounded-3xl overflow-hidden">
          <div className="forest-gradient p-8 text-center text-white relative">
            <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,white_0%,transparent_60%)]" />
            <div className="w-14 h-14 bg-white/15 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4 border border-white/10">
              <Lock className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">Control Tower 🗼</h1>
            <p className="text-white/80 text-sm mt-1">DogChauffeur Fleet Operations</p>
          </div>
          
          <CardContent className="p-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#1B4332] font-semibold">Admin Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border-[#D8F3DC] focus-visible:ring-[#2D6A4F] h-11"
                  required
                />
              </div>
              
              <Button
                type="submit"
                disabled={loadingAuth}
                className="w-full bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl h-11 text-base font-semibold"
              >
                {loadingAuth ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Authenticating...
                  </>
                ) : (
                  "Log In"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    );
  }

  // ─── Render Main Layout Panel Shell ─────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#F9F7F3] flex flex-col md:flex-row font-sans">
      {/* Sidebar - Visible on Desktop */}
      <aside className="w-full md:w-64 bg-[#1B4332] text-white flex flex-col border-r border-[#2D6A4F]/20 md:min-h-screen shrink-0">
        {/* Brand */}
        <div className="px-6 py-6 border-b border-[#2D6A4F]/30 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
            <Dog className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-base tracking-tight leading-tight">DogChauffeur</h1>
            <p className="text-[9px] text-emerald-400 font-bold uppercase tracking-wider">Control Tower</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          <button
            onClick={() => setActiveTab("bookings")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "bookings"
                ? "bg-white text-[#1B4332] shadow-lg"
                : "text-white/80 hover:bg-[#2D6A4F]/30 hover:text-white"
            }`}
          >
            <RefreshCw className="w-4 h-4 shrink-0" />
            <span>Bookings Tower</span>
          </button>
          
          <button
            onClick={() => setActiveTab("checklists")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "checklists"
                ? "bg-white text-[#1B4332] shadow-lg"
                : "text-white/80 hover:bg-[#2D6A4F]/30 hover:text-white"
            }`}
          >
            <CheckSquare className="w-4 h-4 shrink-0" />
            <span>Daily Checklists</span>
          </button>

          <button
            onClick={() => setActiveTab("partners")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-xs font-bold transition-all ${
              activeTab === "partners"
                ? "bg-white text-[#1B4332] shadow-lg"
                : "text-white/80 hover:bg-[#2D6A4F]/30 hover:text-white"
            }`}
          >
            <User className="w-4 h-4 shrink-0" />
            <span>Partners Pipeline</span>
          </button>
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-[#2D6A4F]/30 space-y-2">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
              <User className="w-4 h-4 text-emerald-300" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">Alexander P.</p>
              <p className="text-[9px] text-emerald-400 font-bold uppercase">Technician</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={handleLogout}
            className="w-full text-white/70 hover:text-white hover:bg-red-950/20 rounded-xl justify-start h-9 text-xs px-3"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen">
        {/* Mobile Nav Header */}
        <header className="md:hidden bg-[#1B4332] text-white px-6 py-4 flex items-center justify-between border-b border-[#2D6A4F]/30">
          <div className="flex items-center gap-3">
            <Dog className="w-5 h-5" />
            <span className="font-bold text-base">DogChauffeur</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBookings()}
              disabled={loadingBookings}
              className="border-white/20 bg-white/10 text-white hover:bg-white/20 h-8"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingBookings ? "animate-spin" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-white/80 hover:text-white h-8"
            >
              <LogOut className="w-3.5 h-3.5" />
            </Button>
          </div>
        </header>

        {/* Mobile Tab selectors */}
        <div className="md:hidden bg-white border-b border-[#EDF7F0] p-2 flex justify-around">
          {["bookings", "checklists", "partners"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`text-xs font-bold px-3 py-1.5 rounded-lg capitalize ${
                activeTab === tab 
                  ? "bg-[#EDF7F0] text-[#1B4332]" 
                  : "text-[#6B5B4F]"
              }`}
            >
              {tab === "partners" ? "Partners" : tab === "checklists" ? "Checklists" : "Bookings"}
            </button>
          ))}
        </div>

        {/* Dynamic content rendering */}
        <div className="p-6 md:p-8 flex-1 max-w-6xl w-full mx-auto">
          {activeTab === "bookings" && renderBookingsTab()}
          {activeTab === "checklists" && renderChecklistsTab()}
          {activeTab === "partners" && renderPartnersTab()}
        </div>
      </div>

      {/* Details Slide Drawer */}
      {selectedBooking && (
        <Sheet open={!!selectedBooking} onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}>
          <SheetContent className="sm:max-w-md border-l border-[#D8F3DC]/60 overflow-y-auto bg-white font-sans p-6 rounded-l-3xl">
            <SheetHeader className="pb-6 border-b border-[#EDF7F0]">
              <SheetTitle className="text-2xl font-extrabold text-[#1B4332]">
                Booking Information
              </SheetTitle>
              <SheetDescription className="text-xs font-semibold text-[#6B5B4F]/80">
                Created: {selectedBooking.createdAt}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              <div className="bg-[#EDF7F0] border border-[#B7E4C7] rounded-2xl p-4 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-[#2D6A4F] uppercase font-bold tracking-wider">Booking ID</p>
                  <p className="text-lg font-extrabold text-[#1B4332]">{selectedBooking.bookingId}</p>
                </div>
                <div className="text-right">
                  <Badge className={`text-white text-xs font-bold px-3 py-1 rounded-full ${
                    selectedBooking.status === "Confirmed" ? "bg-emerald-600" :
                    selectedBooking.status === "Completed" ? "bg-sky-600" :
                    selectedBooking.status === "Cancelled" ? "bg-rose-600" :
                    "bg-[#6C757D]"
                  }`}>
                    {selectedBooking.status || "Pending Review"}
                  </Badge>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[#1B4332] font-bold border-b border-[#EDF7F0] pb-1 flex items-center gap-1.5">
                  <User className="w-4 h-4" /> Customer Contact
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Name:</span>
                    <span className="font-bold text-gray-800">{selectedBooking.full_name}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Phone:</span>
                    <a href={`tel:${selectedBooking.phone}`} className="font-bold text-[#1B4332] hover:underline flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {selectedBooking.phone}
                    </a>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Email:</span>
                    <span className="font-semibold text-gray-700 flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {selectedBooking.email || "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[#1B4332] font-bold border-b border-[#EDF7F0] pb-1 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" /> Trip Details
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Ride Type:</span>
                    <span className="font-bold text-gray-800">{selectedBooking.ride_type}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Urgent:</span>
                    <span className="font-bold text-gray-800">{selectedBooking.is_urgent}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Date:</span>
                    <span className="font-bold text-gray-800 flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5" /> {selectedBooking.preferred_date}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Time Window:</span>
                    <span className="font-bold text-gray-800">{selectedBooking.preferred_time_window || "All day"}</span>
                  </div>
                  <div className="flex flex-col text-sm pt-1">
                    <span className="text-xs text-[#1B4332] font-bold flex items-center gap-1">📍 Pickup Address:</span>
                    <span className="font-medium text-gray-700 mt-0.5 leading-snug">{selectedBooking.pickup_address}</span>
                  </div>
                  <div className="flex flex-col text-sm pt-1">
                    <span className="text-xs text-[#1B4332] font-bold flex items-center gap-1">🏁 Drop-off Destination:</span>
                    <span className="font-medium text-gray-700 mt-0.5 leading-snug">{selectedBooking.dropoff_address}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[#1B4332] font-bold border-b border-[#EDF7F0] pb-1 flex items-center gap-1.5">
                  <Dog className="w-4 h-4" /> Pet Specifications
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Number of Dogs:</span>
                    <span className="font-bold text-gray-800">{selectedBooking.number_of_dogs}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-[#6B5B4F] font-medium">Size(s):</span>
                    <span className="font-bold text-gray-800">{selectedBooking.dog_sizes}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="text-xs uppercase tracking-wider text-[#1B4332] font-bold border-b border-[#EDF7F0] pb-1">
                  Additional Notes
                </h4>
                <div className="bg-[#F9F7F3] border border-[#EDF7F0] rounded-xl p-3 text-sm text-[#6B5B4F] leading-relaxed max-h-36 overflow-y-auto font-medium">
                  {selectedBooking.notes || "No notes or instructions provided."}
                </div>
              </div>
            </div>
            
            <div className="pt-4 border-t border-[#EDF7F0] flex justify-end">
              <Button
                onClick={() => setSelectedBooking(null)}
                className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl"
              >
                Close Card
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}
