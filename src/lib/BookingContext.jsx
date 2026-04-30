import React, { createContext, useContext, useState, useCallback } from "react";

const BookingContext = createContext(null);

const initialBookingState = {
  serviceType: null, // "standard" | "premium"
  dogBehavior: null, // "calm" | "slightly_anxious" | "reactive"
  recommendedPremium: false, // true if user came from bridge click
  customerName: "",
  phone: "",
  email: "",
  pickupAddress: "",
  dropoffAddress: "",
  date: "",
  time: "",
  petName: "",
  petBreed: "",
  petWeight: "",
  notes: "",
};

export function BookingProvider({ children }) {
  const [bookingState, setBookingState] = useState(initialBookingState);

  const updateBooking = useCallback((updates) => {
    setBookingState((prev) => ({ ...prev, ...updates }));
  }, []);

  const setServiceType = useCallback((type, fromBridge = false) => {
    setBookingState((prev) => ({
      ...prev,
      serviceType: type,
      recommendedPremium: fromBridge || (type === "premium" && prev.recommendedPremium),
    }));
  }, []);

  const setDogBehavior = useCallback((behavior) => {
    setBookingState((prev) => {
      // Auto-recommend premium for anxious or reactive dogs
      const shouldRecommendPremium = behavior === "slightly_anxious" || behavior === "reactive";
      return {
        ...prev,
        dogBehavior: behavior,
        serviceType: shouldRecommendPremium ? "premium" : prev.serviceType,
        recommendedPremium: shouldRecommendPremium || prev.recommendedPremium,
      };
    });
  }, []);

  const resetBooking = useCallback(() => {
    setBookingState(initialBookingState);
  }, []);

  const value = {
    bookingState,
    updateBooking,
    setServiceType,
    setDogBehavior,
    resetBooking,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}

export default BookingContext;
