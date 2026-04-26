import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { PawPrint, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function PageNotFound() {
  return (
    <div className="min-h-screen bg-[#F9F7F3] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <div className="w-20 h-20 rounded-3xl bg-[#EDF7F0] flex items-center justify-center mx-auto mb-6">
          <PawPrint className="w-10 h-10 text-[#2D6A4F]/40" />
        </div>
        <h1 className="text-4xl font-bold text-[#1B4332] mb-3">Lost on the Trail</h1>
        <p className="text-[#6B5B4F]/60 mb-8">
          We couldn't find the page you're looking for. Let's get you back on track.
        </p>
        <Link to={createPageUrl("Dashboard")}>
          <Button className="bg-[#1B4332] hover:bg-[#2D6A4F] text-white rounded-xl gap-2 px-6">
            <ArrowLeft className="w-4 h-4" /> Back to Dashboard
          </Button>
        </Link>
      </div>
    </div>
  );
}