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
        console.log("[base44 Mock] Creating Message:", data);
        const msg = {
          id: "msg-" + Math.random().toString(36).substring(7),
          created_date: new Date().toISOString(),
          ...data
        };
        mockMessages.push(msg);
        return msg;
      },
      filter: async (criteria = {}) => {
        let msgs = mockMessages;
        if (criteria.trip_id) {
          msgs = msgs.filter(m => m.trip_id === criteria.trip_id);
        }
        return msgs;
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
