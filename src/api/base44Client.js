// Stub client to decouple from @base44/sdk and prevent build failures
let mockMessages = [
  {
    id: "msg-1",
    trip_id: "TRIP-MOCK-1",
    sender_email: "preview-customer@dev.local",
    sender_name: "Jane Doe (Owner)",
    sender_role: "owner",
    content: "Hi! Just checking in if everything is ready for Rocky's ride tomorrow?",
    created_date: "2026-06-19T18:30:00.000Z"
  },
  {
    id: "msg-2",
    trip_id: "TRIP-MOCK-1",
    sender_email: "preview-driver@dev.local",
    sender_name: "Alex Chauffeur",
    sender_role: "driver",
    content: "Hi Jane! Yes, all set. I have his safety card reviewed and harness preferences ready.",
    created_date: "2026-06-19T18:35:00.000Z"
  }
];

export const base44 = {
  auth: {
    me: async () => null,
    logout: async () => {},
    redirectToLogin: () => {},
    updateMe: async () => ({}),
  },
  entities: {
    Lead: {
      create: async (data) => {
        console.log("[base44 Mock] Creating Lead:", data);
        return { success: true, id: "mock-lead-id" };
      },
      list: async () => [],
      filter: async () => [],
    },
    Pet: {
      filter: async () => [],
      create: async (data) => data,
      delete: async () => {},
    },
    Booking: {
      create: async (data) => {
        console.log("[base44 Mock] Creating Booking:", data);
        return { success: true, id: "mock-booking-id" };
      },
    },
    Trip: {
      list: async () => [],
      filter: async (criteria = {}) => {
        const mockTrips = [
          {
            id: "TRIP-MOCK-1",
            pet_name: "Rocky",
            scheduled_date: "2026-06-20",
            scheduled_time: "10:00 AM",
            status: "confirmed",
            pickup_location: "1200 S Michigan Ave, Chicago, IL",
            dropoff_location: "2400 N Sheffield Ave, Chicago, IL",
            owner_phone: "555-789-0123",
            owner_email: "preview-customer@dev.local",
            driver_email: "preview-driver@dev.local",
            driver_name: "Alex Chauffeur",
            notes: "Prefers soft treats, standard leashed walk loading.",
            passenger_profile_id: "mock-rocky-id"
          },
          {
            id: "TRIP-MOCK-2",
            pet_name: "Luna",
            scheduled_date: "2026-06-21",
            scheduled_time: "2:00 PM",
            status: "completed",
            pickup_location: "500 W Madison St, Chicago, IL",
            dropoff_location: "1500 N Wells St, Chicago, IL",
            owner_phone: "555-999-8888",
            owner_email: "preview-customer@dev.local",
            driver_email: "preview-driver@dev.local",
            driver_name: "Alex Chauffeur",
            notes: "No profile linked test.",
            passenger_profile_id: null
          }
        ];

        if (criteria.driver_email) {
          return mockTrips.filter(t => t.driver_email.toLowerCase() === criteria.driver_email.toLowerCase());
        }
        if (criteria.owner_email) {
          return mockTrips.filter(t => t.owner_email.toLowerCase() === criteria.owner_email.toLowerCase());
        }
        if (criteria.id) {
          return mockTrips.filter(t => t.id === criteria.id);
        }
        return mockTrips;
      },
      create: async (data) => data,
      update: async () => {},
      subscribe: () => () => {},
    },
    TripUpdate: {
      filter: async () => [],
      subscribe: () => () => {},
    },
    Message: {
      create: async (data) => {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token") || "";
        const role = sessionStorage.getItem("dc_preview_role") || "customer";

        let driverEmail = "";
        if (role === "driver") {
          driverEmail = "preview-driver@dev.local";
        }

        const payload = {
          tripId: data.trip_id || null,
          content: data.content,
          sender_role: role === "super_admin" || role === "admin" ? "admin" : role === "driver" ? "driver" : "owner",
          sender_name: data.sender_name || (role === "admin" ? "Admin Dispatch" : role === "driver" ? "Alex Chauffeur" : "Pet Owner")
        };

        const headers = {
          "Content-Type": "application/json",
          "X-Preview-Role": role
        };

        if (token) {
          headers["X-Owner-Token"] = token;
        }
        if (driverEmail) {
          headers["X-Driver-Email"] = driverEmail;
        }
        if (role === "super_admin" || role === "admin") {
          headers["Authorization"] = "Bearer super_admin_token";
        }

        const res = await fetch("/api/ride-messages", {
          method: "POST",
          headers,
          body: JSON.stringify(payload)
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to send message");
        }

        return {
          id: json.data.id,
          trip_id: data.trip_id,
          sender_email: data.sender_email,
          sender_name: json.data.sender_display_name,
          sender_role: json.data.sender_role,
          content: json.data.message_body,
          created_date: json.data.created_at
        };
      },
      filter: async (criteria = {}) => {
        const searchParams = new URLSearchParams(window.location.search);
        const token = searchParams.get("token") || "";
        const role = sessionStorage.getItem("dc_preview_role") || "customer";

        let driverEmail = "";
        if (role === "driver") {
          driverEmail = "preview-driver@dev.local";
        }

        const headers = {
          "X-Preview-Role": role
        };

        if (token) {
          headers["X-Owner-Token"] = token;
        }
        if (driverEmail) {
          headers["X-Driver-Email"] = driverEmail;
        }
        if (role === "super_admin" || role === "admin") {
          headers["Authorization"] = "Bearer super_admin_token";
        }

        const tripId = criteria.trip_id || "";
        const res = await fetch(`/api/ride-messages?tripId=${tripId}`, {
          method: "GET",
          headers
        });

        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.error || "Failed to fetch messages");
        }

        return (json.data || []).map(msg => ({
          id: msg.id,
          trip_id: tripId,
          sender_email: msg.sender_role === "admin" ? "admin@pawffeur.com" : msg.sender_role === "driver" ? "preview-driver@dev.local" : "preview-customer@dev.local",
          sender_name: msg.sender_display_name,
          sender_role: msg.sender_role,
          content: msg.message_body,
          created_date: msg.created_at
        }));
      },
    },
    User: {
      filter: async () => [],
    },
  },
  functions: {
    invoke: async (name, payload) => {
      console.log(`[base44 Mock] Invoking function ${name}:`, payload);
      return { data: {} };
    },
  },
  integrations: {
    Core: {
      SendEmail: async (options) => {
        console.log("[base44 Mock] Sending email:", options);
        return { success: true };
      },
    },
  },
};
