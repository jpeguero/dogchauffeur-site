import React from "react";
import { motion } from "framer-motion";

export default function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="bg-white rounded-2xl p-6 border border-[#EDF7F0] card-hover"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6B5B4F]/70 font-medium">{label}</p>
          <p className="text-3xl font-bold text-[#1B4332] mt-1">{value}</p>
        </div>
        <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
    </motion.div>
  );
}