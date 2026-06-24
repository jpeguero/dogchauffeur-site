import React from 'react';
import { motion } from 'framer-motion';

const fade = (delay = 0) => ({
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.5, delay },
});

const HowItWorks = () => {
  const steps = [
    {
      number: 1,
      time: '2:00 PM',
      title: 'Pet Owner Books a Ride',
      description: 'You open the Pawffeur app and enter your pet\'s details, pickup location, and destination.',
      perspective: 'Owner Perspective',
      quote: '"I need to get Rocky to his vet appointment safely."',
      image: '/assets/howitworks_step1_booking.png',
    },
    {
      number: 2,
      time: '2:01 PM',
      title: 'Admin Receives & Dispatches',
      description: 'Our dispatch team receives your request, verifies driver availability, and optimizes the route.',
      perspective: 'Admin Perspective',
      quote: '"Request received. Driver Alexander available in 10 minutes. Route optimized."',
      image: '/assets/howitworks_step2_admin.png',
    },
    {
      number: 3,
      time: '2:02 PM',
      title: 'Driver Gets Assignment',
      description: 'Your assigned driver receives the ride details and heads to pickup your pet.',
      perspective: 'Driver Perspective',
      quote: '"New ride: Golden Retriever named Rocky. I\'m 8 minutes away."',
      image: '/assets/alexander_driver_uniform.png',
      isAlexander: true,
    },
    {
      number: 4,
      time: '2:10 PM',
      title: 'Driver Picks Up Rocky',
      description: 'Your driver arrives, greets your pet warmly, and settles them into the climate-controlled compartment.',
      perspective: 'Driver Perspective',
      quote: '"Rocky is calm and comfortable. Owner seems relieved."',
      image: '/assets/howitworks_step4_pickup.png',
    },
    {
      number: 5,
      time: '2:10-2:22 PM',
      title: 'Real-Time Tracking & Updates',
      description: 'You receive live updates: "Picked up", "En route", "Arriving in 2 minutes" with real-time location tracking.',
      perspective: 'Owner Perspective',
      quote: '"I can see Rocky\'s location on the map. I feel completely in control."',
      image: '/assets/howitworks_step5_tracking.png',
    },
    {
      number: 6,
      time: '2:22 PM',
      title: 'Safe Arrival at Destination',
      description: 'Your pet arrives safely at the vet. Driver confirms handoff and sends you a photo.',
      perspective: 'Driver Perspective',
      quote: '"Rocky is safely at the vet. Ride completed successfully."',
      image: '/assets/howitworks_step6_arrival.png',
    },
    {
      number: 7,
      time: '2:22 PM',
      title: 'Confirmation & Peace of Mind',
      description: 'You receive a confirmation notification with a photo of Rocky safely at the vet.',
      perspective: 'Owner Perspective',
      quote: '"Rocky is safe. I can focus on work knowing he\'s taken care of."',
      image: '/assets/howitworks_step7_confirmation.png',
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        {/* Section Header */}
        <motion.div {...fade(0)} className="text-center mb-20">
          <h2 className="text-5xl md:text-6xl font-bold text-[#1B4332] mb-4">
            How It Works
          </h2>
          <p className="text-xl text-[#6B5B4F] max-w-2xl mx-auto">
            See how Pawffeur brings peace of mind to pet owners. Follow ROCKY's journey from booking to safe arrival.
          </p>
        </motion.div>

        {/* Timeline */}
        <div className="relative">
          {/* Vertical line (desktop only) */}
          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-1 h-full bg-gradient-to-b from-[#D4A574] to-[#E8D4C4]"></div>

          {/* Steps */}
          <div className="space-y-12 md:space-y-16">
            {steps.map((step, index) => (
              <motion.div key={step.number} {...fade(index * 0.1)} className="relative">
                {/* Desktop Layout: Alternating left/right */}
                <div className={`hidden md:grid grid-cols-2 gap-8 items-center ${index % 2 === 0 ? '' : 'md:grid-cols-2'}`}>
                  {/* Content */}
                  <div className={index % 2 === 0 ? 'text-right pr-8' : 'order-2 text-left pl-8'}>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-[#D4A574] uppercase tracking-wide">
                        {step.time}
                      </div>
                      <h3 className="text-2xl font-bold text-[#1B4332]">
                        {step.title}
                      </h3>
                      <p className="text-[#6B5B4F] text-base leading-relaxed">
                        {step.description}
                      </p>
                      <div className="pt-2">
                        <p className="text-sm text-[#6B5B4F]/60 italic font-medium">
                          {step.perspective}
                        </p>
                        <p className="text-[#1B4332] italic mt-1">
                          {step.quote}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Image or Step Number Circle */}
                  <div className={`flex justify-center ${index % 2 === 0 ? 'order-2' : 'order-1'}`}>
                    {step.image ? (
                      <img 
                        src={step.image} 
                        alt={step.title}
                        className="w-full max-w-sm h-auto rounded-lg shadow-lg object-cover"
                      />
                    ) : (
                      <div className="relative z-10 flex items-center justify-center w-16 h-16 bg-white border-4 border-[#D4A574] rounded-full shadow-lg">
                        <span className="text-2xl font-bold text-[#D4A574]">
                          {step.number}
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Mobile Layout: Stacked */}
                <div className="md:hidden">
                  <div className="flex gap-6">
                    {/* Step Number */}
                    <div className="flex flex-col items-center">
                      <div className="flex items-center justify-center w-14 h-14 bg-white border-4 border-[#D4A574] rounded-full shadow-lg">
                        <span className="text-xl font-bold text-[#D4A574]">
                          {step.number}
                        </span>
                      </div>
                      {index !== steps.length - 1 && (
                        <div className="w-1 h-12 bg-[#E8D4C4] mt-2"></div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="pb-8 flex-1">
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-[#D4A574] uppercase tracking-wide">
                          {step.time}
                        </div>
                        <h3 className="text-lg font-bold text-[#1B4332]">
                          {step.title}
                        </h3>
                        <p className="text-[#6B5B4F] text-sm leading-relaxed">
                          {step.description}
                        </p>
                        <div className="pt-2">
                          <p className="text-xs text-[#6B5B4F]/60 italic font-medium">
                            {step.perspective}
                          </p>
                          <p className="text-[#1B4332] italic text-sm mt-1">
                            {step.quote}
                          </p>
                        </div>
                        {step.image && (
                          <img 
                            src={step.image} 
                            alt={step.title}
                            className="w-full h-auto rounded-lg shadow-lg mt-4 object-cover"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
