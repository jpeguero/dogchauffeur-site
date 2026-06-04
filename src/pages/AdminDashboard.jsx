import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Search, Lock, LogOut, Clock, CheckCircle2, AlertCircle, 
  Calendar, User, MapPin, Dog, Loader2, RefreshCw, Phone, Mail, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

export default function AdminDashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [driverInputs, setDriverInputs] = useState({}); // Stores temporary driver text inputs per booking ID

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

  // Filter and Search bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      (b.bookingId || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.full_name || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (b.phone || "").toLowerCase().includes(searchQuery.toLowerCase());
      
    if (statusFilter === "All") return matchesSearch;
    
    // Normalize status names for filtering
    const cleanStatus = (b.status || "").toLowerCase().replace("_", " ");
    const cleanFilter = statusFilter.toLowerCase();
    
    if (cleanFilter === "pending review") {
      return matchesSearch && (cleanStatus.includes("pending") || cleanStatus.includes("review"));
    }
    return matchesSearch && cleanStatus === cleanFilter;
  });

  // Calculate status counters
  const totalCount = bookings.length;
  const pendingCount = bookings.filter(b => {
    const s = (b.status || "Pending Review").toLowerCase();
    return s.includes("pending") || s.includes("review");
  }).length;
  const confirmedCount = bookings.filter(b => (b.status || "").toLowerCase() === "confirmed").length;
  const completedCount = bookings.filter(b => (b.status || "").toLowerCase() === "completed").length;

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

  // ─── Render Main Operational Dashboard ──────────────────────────────────────
  return (
    <main className="min-h-screen bg-[#F9F7F3] font-sans pb-12">
      {/* Top Bar */}
      <nav className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#D8F3DC]/60 px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl forest-gradient flex items-center justify-center shadow-md">
              <Dog className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-[#1B4332] text-lg tracking-tight">DogChauffeur</span>
              <span className="ml-2 text-xs bg-[#EDF7F0] text-[#2D6A4F] font-bold px-2 py-0.5 rounded-full border border-[#D8F3DC]">ADMIN</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchBookings()}
              disabled={loadingBookings}
              className="border-[#D8F3DC] text-[#1B4332] rounded-xl"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingBookings ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-[#6B5B4F] hover:text-red-600 hover:bg-red-50 rounded-xl"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 mt-8 space-y-8">
        {/* Header Title */}
        <div>
          <h1 className="text-3xl font-extrabold text-[#1B4332] tracking-tight">Control Tower 🗼</h1>
          <p className="text-[#6B5B4F]/80 mt-1 font-medium">Manage and dispatch dog transportation requests</p>
        </div>

        {/* Stats Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-[#EDF7F0] text-[#1B4332] rounded-xl flex items-center justify-center shrink-0">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#6B5B4F]/70 font-semibold uppercase tracking-wider">Total Requests</p>
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
                <p className="text-xs text-[#6B5B4F]/70 font-semibold uppercase tracking-wider">Pending Review</p>
                <h3 className="text-2xl font-bold text-amber-600 mt-0.5">{pendingCount}</h3>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-[#EDF7F0] rounded-2xl shadow-sm overflow-hidden">
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-xl flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-[#6B5B4F]/70 font-semibold uppercase tracking-wider">Confirmed Rides</p>
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
                <p className="text-xs text-[#6B5B4F]/70 font-semibold uppercase tracking-wider">Completed</p>
                <h3 className="text-2xl font-bold text-sky-600 mt-0.5">{completedCount}</h3>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search Bar */}
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

        {/* Bookings Data Grid/Table */}
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
                          <div className="flex items-center gap-2">
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
                          </div>
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

      {/* Slide-out Sheet details drawer */}
      {selectedBooking && (
        <Sheet open={!!selectedBooking} onOpenChange={(open) => { if (!open) setSelectedBooking(null); }}>
          <SheetContent className="sm:max-w-md border-l border-[#D8F3DC]/60 overflow-y-auto bg-white font-sans p-6 rounded-l-3xl">
            <SheetHeader className="pb-6 border-b border-[#EDF7F0]">
              <SheetTitle className="text-2xl font-extrabold text-[#1B4332] flex items-center gap-2">
                Booking Information
              </SheetTitle>
              <SheetDescription className="text-sm font-semibold text-[#6B5B4F]/80">
                Created: {selectedBooking.createdAt}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-6 py-6">
              {/* Core Status Card */}
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

              {/* Customer details */}
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

              {/* Ride details */}
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
                    <span className="text-[#6B5B4F] font-semibold text-xs text-[#1B4332] flex items-center gap-1">📍 Pickup Address:</span>
                    <span className="font-medium text-gray-700 mt-0.5 leading-snug">{selectedBooking.pickup_address}</span>
                  </div>
                  <div className="flex flex-col text-sm pt-1">
                    <span className="text-[#6B5B4F] font-semibold text-xs text-[#1B4332] flex items-center gap-1">🏁 Drop-off Destination:</span>
                    <span className="font-medium text-gray-700 mt-0.5 leading-snug">{selectedBooking.dropoff_address}</span>
                  </div>
                </div>
              </div>

              {/* Pet Details */}
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

              {/* Notes */}
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
    </main>
  );
}
