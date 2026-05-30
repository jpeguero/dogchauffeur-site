// Stub client to decouple from @base44/sdk and prevent build failures
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
      filter: async () => [],
      create: async (data) => data,
      update: async () => {},
      subscribe: () => () => {},
    },
    TripUpdate: {
      filter: async () => [],
      subscribe: () => () => {},
    },
    Message: {
      filter: async () => [],
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
