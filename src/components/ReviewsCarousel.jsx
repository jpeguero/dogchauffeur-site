import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const REVIEWS = [
  {
    name: "Sarah M.",
    pet: "Max (Golden Retriever)",
    rating: 5,
    text: "Pawffeur is absolutely amazing! Max used to get super anxious going to the vet, but the driver was so calm and professional. He arrived happy and relaxed. I won't use anyone else!",
    location: "Lincoln Park",
  },
  {
    name: "James T.",
    pet: "Luna (Husky Mix)",
    rating: 5,
    text: "I was nervous about sending Luna alone but they sent me updates at pickup AND delivery. The driver clearly knew how to handle an energetic dog. Highly recommend for anyone in Chicago.",
    location: "Lakeview",
  },
  {
    name: "Priya K.",
    pet: "Cleo (Tabby Cat)",
    rating: 5,
    text: "They transported my cat to the vet while I was at work. The communication was incredible — I knew exactly what was happening the whole time. Cleo was calm when I got home, which never happens after vet visits!",
    location: "Wicker Park",
  },
  {
    name: "Marcus D.",
    pet: "Bruno (French Bulldog)",
    rating: 5,
    text: "Bruno has breathing issues so I was very cautious. The driver knew exactly how to keep him comfortable and cool. They went above and beyond. Worth every penny.",
    location: "West Loop",
  },
  {
    name: "Tanya R.",
    pet: "Daisy (Labrador)",
    rating: 5,
    text: "Used them for daycare pickup twice a week now. Daisy literally jumps with excitement when the driver arrives. That says it all — she loves it!",
    location: "Logan Square",
  },
];

function StarRating({ rating }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={`w-4 h-4 ${s <= rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  );
}

export default function ReviewsCarousel() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  const prev = () => {
    setDirection(-1);
    setCurrent((c) => (c === 0 ? REVIEWS.length - 1 : c - 1));
  };

  const next = () => {
    setDirection(1);
    setCurrent((c) => (c === REVIEWS.length - 1 ? 0 : c + 1));
  };

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, []);

  const review = REVIEWS[current];

  return (
    <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-10 overflow-hidden">
      <div className="text-center mb-8">
        <h2 className="text-3xl md:text-4xl font-bold text-[#1B4332] mb-2">What Pet Owners Say</h2>
        <p className="text-[#6B5B4F]/70">Real reviews from Chicago pet families</p>
      </div>

      <div className="relative min-h-[220px] flex items-center">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            initial={{ opacity: 0, x: direction * 60 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: direction * -60 }}
            transition={{ duration: 0.35 }}
            className="w-full"
          >
            <div className="bg-[#F9F7F3] rounded-2xl p-6 md:p-8 text-center max-w-2xl mx-auto">
              <StarRating rating={review.rating} />
              <p className="mt-4 text-[#3D2C1E] text-base md:text-lg leading-relaxed italic">
                "{review.text}"
              </p>
              <div className="mt-5">
                <p className="font-bold text-[#1B4332]">{review.name}</p>
                <p className="text-sm text-[#6B5B4F]/70">{review.pet} · {review.location}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-center gap-4 mt-6">
        <button
          onClick={prev}
          className="w-9 h-9 rounded-full border border-[#D8F3DC] bg-white flex items-center justify-center hover:bg-[#EDF7F0] transition"
        >
          <ChevronLeft className="w-4 h-4 text-[#1B4332]" />
        </button>

        <div className="flex gap-2">
          {REVIEWS.map((_, i) => (
            <button
              key={i}
              onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
              className={`w-2 h-2 rounded-full transition-all ${i === current ? "bg-[#1B4332] w-5" : "bg-[#D8F3DC]"}`}
            />
          ))}
        </div>

        <button
          onClick={next}
          className="w-9 h-9 rounded-full border border-[#D8F3DC] bg-white flex items-center justify-center hover:bg-[#EDF7F0] transition"
        >
          <ChevronRight className="w-4 h-4 text-[#1B4332]" />
        </button>
      </div>
    </div>
  );
}