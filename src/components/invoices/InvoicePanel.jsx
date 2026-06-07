import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { jsPDF } from "jspdf";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FileText, Download, Mail, Plus, Trash2, Loader2, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";

const brandName = import.meta.env.VITE_PUBLIC_BRAND_NAME || "Pawffeur";
const siteUrl = import.meta.env.VITE_PUBLIC_SITE_URL || "https://pawffeur.com";
const displayUrl = siteUrl.replace("https://", "");

const BASE_RATES = {
  "Vet / Daycare / Grooming (One-way)": 40,
  "Vet / Daycare / Grooming (Round-trip)": 70,
  "Airport Transport": 90,
  "Long Distance": null,
  "Emergency / Same-Day Fee": 40,
};

function buildInvoiceNumber(tripId) {
  return `INV-${tripId?.slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-4)}`;
}

function generatePDF(trip, lineItems, invoiceNumber) {
  const doc = new jsPDF();
  const green = [27, 67, 50];
  const lightGreen = [237, 247, 240];
  const gray = [107, 91, 79];

  // Header bar
  doc.setFillColor(...green);
  doc.rect(0, 0, 210, 42, "F");

  // Logo text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont("helvetica", "bold");
  doc.text(`${brandName}™`, 14, 20);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Chicago's ${brandName}™ Service`, 14, 30);
  doc.text(`${displayUrl}  ·  Chicago, IL`, 14, 38);

  // Invoice label top-right
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(255, 255, 255);
  doc.text("INVOICE", 196, 20, { align: "right" });
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(invoiceNumber, 196, 30, { align: "right" });
  doc.text(`Date: ${format(new Date(), "MMMM d, yyyy")}`, 196, 38, { align: "right" });

  // Bill To section
  doc.setTextColor(...gray);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("BILL TO", 14, 55);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(30, 30, 30);
  doc.setFontSize(11);
  doc.text(trip.owner_email || "Client", 14, 63);

  // Trip summary box
  doc.setFillColor(...lightGreen);
  doc.roundedRect(14, 72, 182, 36, 3, 3, "F");
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.setTextColor(...green);
  doc.text("TRIP DETAILS", 20, 82);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(50, 50, 50);
  doc.setFontSize(9);
  doc.text(`Pet: ${trip.pet_name || "—"}`, 20, 91);
  doc.text(`Pickup: ${trip.pickup_location || "—"}`, 20, 99);
  doc.text(`Drop-off: ${trip.dropoff_location || "—"}`, 20, 107);
  doc.text(`Date: ${trip.scheduled_date ? format(new Date(trip.scheduled_date), "MMMM d, yyyy") : "—"}${trip.scheduled_time ? " at " + trip.scheduled_time : ""}`, 110, 91);
  doc.text(`Driver: ${trip.driver_name || "—"}`, 110, 99);
  doc.text(`Status: ${trip.status || "—"}`, 110, 107);

  // Line items table header
  const tableY = 120;
  doc.setFillColor(...green);
  doc.rect(14, tableY, 182, 9, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("Description", 18, tableY + 6.5);
  doc.text("Amount", 190, tableY + 6.5, { align: "right" });

  // Line item rows
  let rowY = tableY + 9;
  let total = 0;
  lineItems.forEach((item, i) => {
    if (i % 2 === 0) {
      doc.setFillColor(249, 247, 243);
      doc.rect(14, rowY, 182, 9, "F");
    }
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(item.description, 18, rowY + 6.5);
    const amt = parseFloat(item.amount) || 0;
    total += amt;
    doc.text(`$${amt.toFixed(2)}`, 190, rowY + 6.5, { align: "right" });
    rowY += 9;
  });

  // Total row
  doc.setFillColor(...green);
  doc.rect(14, rowY, 182, 11, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("TOTAL", 18, rowY + 8);
  doc.text(`$${total.toFixed(2)}`, 190, rowY + 8, { align: "right" });

  // Payment status
  const paidY = rowY + 20;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...gray);
  doc.text(`Payment Status: ${(trip.payment_status || "unpaid").toUpperCase()}`, 14, paidY);
  if (trip.payment_method) {
    doc.text(`Payment Method: ${trip.payment_method.replace("_", " ")}`, 14, paidY + 7);
  }

  // Thank you footer
  doc.setFillColor(...lightGreen);
  doc.rect(0, 272, 210, 25, "F");
  doc.setTextColor(...green);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(`Thank you for choosing ${brandName}™!`, 105, 283, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...gray);
  doc.text(`Questions? Reach out at ${displayUrl}  ·  Chicago, IL`, 105, 291, { align: "center" });

  return doc;
}

export default function InvoicePanel({ trip }) {
  const invoiceNumber = buildInvoiceNumber(trip.id);
  const [lineItems, setLineItems] = useState(() => {
    const items = [];
    if (trip.price) {
      items.push({ description: "Trip Service", amount: String(trip.price) });
    }
    return items.length ? items : [{ description: "", amount: "" }];
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const addLine = () => setLineItems(prev => [...prev, { description: "", amount: "" }]);
  const removeLine = (i) => setLineItems(prev => prev.filter((_, idx) => idx !== i));
  const updateLine = (i, field, val) => setLineItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: val } : item));

  const total = lineItems.reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);

  const handleDownload = () => {
    const doc = generatePDF(trip, lineItems, invoiceNumber);
    doc.save(`${brandName}-${invoiceNumber}.pdf`);
  };

  const handleEmailInvoice = async () => {
    setSending(true);
    const doc = generatePDF(trip, lineItems, invoiceNumber);
    const pdfBase64 = doc.output("datauristring");

    const linesSummary = lineItems
      .filter(l => l.description)
      .map(l => `• ${l.description}: $${parseFloat(l.amount || 0).toFixed(2)}`)
      .join("\n");

    await base44.integrations.Core.SendEmail({
      to: trip.owner_email,
      from_name: `${brandName}™`,
      subject: `Your ${brandName}™ Invoice – ${invoiceNumber}`,
      body: `Hi there,\n\nThank you for using ${brandName}™! Here is a summary of your trip invoice:\n\nInvoice: ${invoiceNumber}\nPet: ${trip.pet_name || "—"}\nDate: ${trip.scheduled_date || "—"}\n\n${linesSummary}\n\nTOTAL: $${total.toFixed(2)}\nPayment Status: ${(trip.payment_status || "unpaid").toUpperCase()}\n\nPlease find your PDF invoice attached or download it from your trip page.\n\nThank you for choosing ${brandName}™!\nAlex\n${brandName}™ – Chicago's Premium Pet Transportation`,
    });

    setSent(true);
    setSending(false);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#EDF7F0] p-6 md:p-8 space-y-5">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-[#EDF7F0] flex items-center justify-center">
          <FileText className="w-5 h-5 text-[#2D6A4F]" />
        </div>
        <div>
          <h3 className="font-bold text-[#1B4332] text-lg">Invoice</h3>
          <p className="text-xs text-[#6B5B4F]/50">{invoiceNumber}</p>
        </div>
        {sent && (
          <Badge className="ml-auto bg-green-50 text-green-700 border-green-200 border">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Emailed
          </Badge>
        )}
      </div>

      {/* Quick add buttons */}
      <div className="flex flex-wrap gap-2">
        {Object.entries(BASE_RATES).map(([label, rate]) => rate && (
          <button
            key={label}
            onClick={() => setLineItems(prev => [...prev, { description: label, amount: String(rate) }])}
            className="text-xs bg-[#EDF7F0] hover:bg-[#D8F3DC] text-[#1B4332] rounded-lg px-3 py-1.5 transition-colors"
          >
            + {label} (${rate})
          </button>
        ))}
        <button
          onClick={() => setLineItems(prev => [...prev, { description: "Wait Time (extra hours)", amount: "25" }])}
          className="text-xs bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg px-3 py-1.5 transition-colors"
        >
          + Wait Time ($25/hr)
        </button>
      </div>

      {/* Line items */}
      <div className="space-y-2">
        <div className="grid grid-cols-[1fr_100px_36px] gap-2 text-xs font-medium text-[#6B5B4F]/60 px-1">
          <span>Description</span>
          <span>Amount</span>
          <span />
        </div>
        {lineItems.map((item, i) => (
          <div key={i} className="grid grid-cols-[1fr_100px_36px] gap-2 items-center">
            <Input
              value={item.description}
              onChange={e => updateLine(i, "description", e.target.value)}
              placeholder="Service description"
              className="rounded-xl border-[#D8F3DC] h-9 text-sm"
            />
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#6B5B4F]/40 text-sm">$</span>
              <Input
                type="number"
                value={item.amount}
                onChange={e => updateLine(i, "amount", e.target.value)}
                placeholder="0"
                className="pl-6 rounded-xl border-[#D8F3DC] h-9 text-sm"
              />
            </div>
            <button onClick={() => removeLine(i)} className="w-9 h-9 flex items-center justify-center text-[#6B5B4F]/40 hover:text-red-500 rounded-xl hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        <button onClick={addLine} className="flex items-center gap-1.5 text-xs text-[#2D6A4F] hover:text-[#1B4332] mt-1">
          <Plus className="w-3.5 h-3.5" /> Add line item
        </button>
      </div>

      {/* Total */}
      <div className="flex items-center justify-between bg-[#EDF7F0] rounded-2xl px-5 py-4">
        <span className="font-bold text-[#1B4332]">Total</span>
        <span className="text-2xl font-extrabold text-[#1B4332]">${total.toFixed(2)}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 rounded-xl border-[#D8F3DC] text-[#1B4332] gap-2 h-10"
        >
          <Download className="w-4 h-4" /> Download PDF
        </Button>
        <Button
          onClick={handleEmailInvoice}
          disabled={sending || sent}
          className="flex-1 rounded-xl bg-[#1B4332] hover:bg-[#2D6A4F] text-white gap-2 h-10"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
          {sent ? "Sent!" : "Email to Client"}
        </Button>
      </div>
    </div>
  );
}