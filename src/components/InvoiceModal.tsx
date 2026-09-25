import React, { useState } from 'react';
import { Booking, Room, HotelProfile, formatIdTypeName, isIdVerifiedCheck } from '../types';
import { 
  X, 
  Printer, 
  ShieldCheck, 
  Download, 
  Building2, 
  CheckCircle2,
  Share2,
  Send,
  Mail,
  MessageCircle,
  Copy,
  Check,
  Phone,
  Calendar,
  Layers
} from 'lucide-react';
import { openWhatsAppMessage } from '../utils/whatsappHelper';

interface InvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  rooms: Room[];
  hotelProfile: HotelProfile;
  mode: 'invoice' | 'grc';
}

export const InvoiceModal: React.FC<InvoiceModalProps> = ({
  isOpen,
  onClose,
  booking,
  rooms,
  hotelProfile,
  mode
}) => {
  if (!isOpen || !booking) return null;

  const [showSendDrawer, setShowSendDrawer] = useState<boolean>(false);
  const [recipientPhone, setRecipientPhone] = useState<string>(booking.guest.phone || '');
  const [recipientEmail, setRecipientEmail] = useState<string>(booking.guest.email || '');
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [sentSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);

  const room = rooms.find(r => r.id === booking.roomId);

  // Financial calculations
  const roomTotal = booking.nights * booking.roomRatePerNight;
  const discountTotal = booking.discountAmount || 0;
  const taxableRoomTotal = Math.max(0, roomTotal - discountTotal);
  const extraTotal = booking.extraCharges.reduce((acc, c) => acc + c.amount, 0);
  const subtotal = taxableRoomTotal + extraTotal;
  const gstRate = booking.taxRatePercent !== undefined ? booking.taxRatePercent : 5;
  const isGstApplied = gstRate > 0;
  const taxes = isGstApplied ? Math.round((subtotal * gstRate) / 100) : 0;
  const cgst = Math.round(taxes / 2);
  const sgst = taxes - cgst;
  const grandTotal = subtotal + taxes;
  const totalPaid = booking.payments.reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = Math.max(0, grandTotal - totalPaid);
  const isIdVerified = isIdVerifiedCheck(booking.guest.idDocument);
  const idTypeName = formatIdTypeName(booking.guest.idDocument.idType);

  const handlePrint = () => {
    window.print();
  };

  // Generate plain-text invoice message for WhatsApp / Email / SMS (NO ROOM NUMBER - strictly count of rooms only)
  const generateInvoiceText = () => {
    const roomCategory = room?.type || 'Deluxe Room';
    const hotelFullAddress = [hotelProfile.address, hotelProfile.city].filter(Boolean).join(', ');
    return (
`*HOTEL TAX INVOICE & RESERVATION CONFIRMATION*
*${hotelProfile.name}*
${hotelFullAddress}
Phone: ${hotelProfile.phone} | GSTIN: ${hotelProfile.gstin}
------------------------------------------------
*Guest Name:* ${booking.guest.fullName}
*Booking Ref:* #${booking.bookingCode}
*Dates:* ${booking.checkInDate} to ${booking.checkOutDate} (${booking.nights} Night${booking.nights > 1 ? 's' : ''})
*Total Rooms:* 1 Room (${roomCategory})
*Guests:* ${booking.adults} Adults${booking.children ? `, ${booking.children} Children` : ''}
*ID Type:* ${idTypeName}
*ID Status:* ${isIdVerified ? `VERIFIED (#${booking.guest.idDocument.idNumber})` : 'PENDING - SUBMIT AT CHECK IN TIME'}

*BILLING BREAKDOWN:*
• Accommodation (${booking.nights}N @ ₹${booking.roomRatePerNight}): ₹${roomTotal.toLocaleString()}
${discountTotal > 0 ? `• Discount Applied: -₹${discountTotal.toLocaleString()} (${booking.discountReason || 'Special Concession'})\n` : ''}${(booking.extraCharges || []).map(c => `• ${c.description || (c as any).title || 'Charge'}: ₹${c.amount.toLocaleString()}`).join('\n')}${booking.extraCharges.length > 0 ? '\n' : ''}${isGstApplied ? `• GST (5% - 2.5% CGST + 2.5% SGST): ₹${taxes.toLocaleString()}` : '• GST: ₹0 (Non-GST / Exempt)'}
------------------------------------------------
*Grand Total:* ₹${grandTotal.toLocaleString()}
*Amount Paid:* ₹${totalPaid.toLocaleString()}
*Balance Due:* ₹${balanceDue.toLocaleString()} ${balanceDue === 0 ? '(Fully Paid)' : ''}
------------------------------------------------
Thank you for staying with us! For assistance, contact ${hotelProfile.phone}.`
    );
  };

  // Send via WhatsApp
  const handleSendWhatsApp = () => {
    const text = generateInvoiceText();
    openWhatsAppMessage(recipientPhone, text);
    setSentSuccessMsg(`Invoice dispatched to WhatsApp (${recipientPhone || 'Guest'})`);
    setTimeout(() => setSentSuccessMsg(null), 4000);
  };

  // Send via Email
  const handleSendEmail = () => {
    const subject = encodeURIComponent(`Tax Invoice #${booking.bookingCode} - ${hotelProfile.name}`);
    const body = encodeURIComponent(generateInvoiceText());
    const mailtoUrl = `mailto:${recipientEmail || ''}?subject=${subject}&body=${body}`;
    window.open(mailtoUrl, '_blank');
    setSentSuccessMsg(`Email client opened for ${recipientEmail || booking.guest.fullName}`);
    setTimeout(() => setSentSuccessMsg(null), 4000);
  };

  // Copy Invoice summary
  const handleCopyInvoice = () => {
    const text = generateInvoiceText();
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setSentSuccessMsg('Invoice summary copied to clipboard!');
    setTimeout(() => {
      setIsCopied(false);
      setSentSuccessMsg(null);
    }, 3000);
  };

  return (
    <div className="fixed inset-0 z-60 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto print:p-0 print:bg-white">
      <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:rounded-none">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="bg-slate-900 text-white px-5 py-3 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase tracking-wider bg-teal-500/20 text-teal-300 px-2.5 py-1 rounded">
              {mode === 'grc' ? 'Guest Registration Card (GRC)' : 'GST Tax Invoice & Folio'}
            </span>
            <span className="text-xs text-slate-400 font-mono">#{booking.bookingCode}</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Send to Guest Toggle */}
            <button
              type="button"
              onClick={() => setShowSendDrawer(prev => !prev)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer ${
                showSendDrawer
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-800 hover:bg-slate-700 text-emerald-400 border border-emerald-500/40'
              }`}
              title="Send Invoice to Guest via WhatsApp or Email"
            >
              <Send size={14} />
              <span>Send to Guest</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
            >
              <Printer size={15} /> Print / PDF
            </button>

            {/* Close */}
            <button 
              onClick={onClose} 
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Send to Guest Control Drawer / Bar */}
        {showSendDrawer && (
          <div className="bg-emerald-950 text-white px-5 py-3.5 border-b border-emerald-800 animate-in slide-in-from-top-2 duration-150 shrink-0 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-2">
              <div className="flex items-center gap-2">
                <Send size={16} className="text-emerald-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-300">
                  Send Invoice Directly to Guest
                </span>
                <span className="text-[11px] text-emerald-200/80">
                  (Includes room count, stay dates &amp; billing — room number is excluded)
                </span>
              </div>
              <button
                onClick={() => setShowSendDrawer(false)}
                className="text-xs text-emerald-300 hover:text-white underline cursor-pointer"
              >
                Hide Panel
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-emerald-200 font-semibold mb-1">
                  Guest WhatsApp / Mobile
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    placeholder="+91 96481 33671"
                    className="w-full text-xs bg-emerald-900/80 border border-emerald-700 rounded-lg px-2.5 py-1.5 text-white placeholder-emerald-400/60 focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleSendWhatsApp}
                    className="px-3 py-1.5 bg-[#25D366] hover:bg-[#1EBE5D] text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-xs"
                    title="Send via WhatsApp"
                  >
                    <MessageCircle size={14} />
                    <span>WhatsApp</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-emerald-200 font-semibold mb-1">
                  Guest Email Address
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="guest@example.com"
                    className="w-full text-xs bg-emerald-900/80 border border-emerald-700 rounded-lg px-2.5 py-1.5 text-white placeholder-emerald-400/60 focus:outline-hidden focus:ring-1 focus:ring-emerald-400"
                  />
                  <button
                    onClick={handleSendEmail}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg flex items-center gap-1 shrink-0 transition-colors cursor-pointer shadow-xs"
                    title="Send via Email"
                  >
                    <Mail size={14} />
                    <span>Email</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col justify-end">
                <label className="block text-[11px] text-emerald-200 font-semibold mb-1">
                  Copy Summary &amp; SMS
                </label>
                <button
                  onClick={handleCopyInvoice}
                  className="w-full px-3 py-1.5 bg-emerald-800 hover:bg-emerald-700 border border-emerald-600 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {isCopied ? <Check size={14} className="text-emerald-300" /> : <Copy size={14} />}
                  <span>{isCopied ? 'Copied to Clipboard!' : 'Copy Invoice Text'}</span>
                </button>
              </div>
            </div>

            {sentSuccessMsg && (
              <div className="mt-2.5 p-2 bg-emerald-900/90 border border-emerald-500 rounded-lg text-xs text-emerald-200 flex items-center gap-2 animate-in fade-in duration-100">
                <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                <span>{sentSuccessMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Printable Document Body */}
        <div className="p-8 space-y-6 overflow-y-auto text-slate-800 text-xs">
          {/* Hotel Letterhead */}
          <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight">{hotelProfile.name}</h1>
              <p className="text-xs text-slate-500 font-medium italic">{hotelProfile.tagline}</p>
              <p className="text-xs text-slate-600 mt-1">{[hotelProfile.address, hotelProfile.city].filter(Boolean).join(', ')}</p>
              <p className="text-xs text-slate-600">Phone: {hotelProfile.phone} • Email: {hotelProfile.email}</p>
              <p className="text-xs font-mono font-bold text-slate-800 mt-1">GSTIN: {hotelProfile.gstin}</p>
            </div>

            <div className="text-right">
              <div className="text-sm font-black uppercase tracking-wider text-slate-900">
                {mode === 'grc' ? 'GUEST REGISTRATION CARD' : 'ORIGINAL TAX INVOICE'}
              </div>
              <div className="font-mono text-xs text-slate-500 mt-1">
                Ref No: {booking.bookingCode}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">
                Date: {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
              </div>
              <div className="text-xs font-semibold text-teal-800 mt-1 uppercase">
                Channel: {booking.channel.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Guest & ID Details Grid */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guest Information</span>
              <div className="text-sm font-bold text-slate-900">{booking.guest.fullName}</div>
              <div className="text-slate-600">Phone: {booking.guest.phone || 'N/A'}</div>
              {booking.guest.email && <div className="text-slate-600">Email: {booking.guest.email}</div>}
              {booking.guest.address && <div className="text-slate-600">Address: {booking.guest.address}</div>}
              <div className="text-slate-600">Nationality: {booking.guest.nationality}</div>
            </div>

            {/* Crucial ID Section on the Document */}
            <div className="space-y-1.5 border-l border-slate-200 pl-4">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <ShieldCheck size={12} className={isIdVerified ? "text-emerald-700" : "text-amber-600"} />
                  Customer KYC &amp; ID Proof Details
                </span>
                {isIdVerified ? (
                  <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 border border-emerald-300 px-1.5 py-0.5 rounded">
                    VERIFIED
                  </span>
                ) : (
                  <span className="text-[10px] font-extrabold text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded tracking-tight">
                    PENDING AT CHECK-IN
                  </span>
                )}
              </div>
              <div className="font-semibold text-slate-900 text-xs">
                ID Type: <span className="uppercase font-bold text-slate-900">{idTypeName}</span>
              </div>
              {isIdVerified ? (
                <>
                  <div className="font-mono font-bold text-teal-900 text-xs">
                    ID No: {booking.guest.idDocument.idNumber}
                  </div>
                  <div className="text-[11px] text-emerald-700 font-medium">
                    ID Status: KYC Verified
                  </div>
                </>
              ) : (
                <div className="p-2 bg-amber-50 border border-amber-200 rounded-md text-[11px] space-y-0.5">
                  <div className="font-bold text-amber-900">
                    ID STATUS: PENDING
                  </div>
                  <div className="text-amber-800 font-medium">
                    Submit at check-in time (Aadhaar / Voter ID / DL / Passport)
                  </div>
                </div>
              )}
              {booking.guest.vehicleNumber && (
                <div className="text-slate-600">Vehicle No: {booking.guest.vehicleNumber}</div>
              )}
              {booking.guest.purposeOfVisit && (
                <div className="text-slate-600">Visit Purpose: {booking.guest.purposeOfVisit}</div>
              )}
            </div>
          </div>

          {/* Stay Specifics (ROOM NUMBER STRICTLY REMOVED - ONLY ROOM COUNT & CATEGORY SHOWN) */}
          <div className="grid grid-cols-4 gap-2 text-center p-3 border border-slate-200 rounded-lg bg-white">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Total Rooms</span>
              <div className="font-bold text-slate-900 text-xs mt-0.5">
                1 Room
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                {room?.type || 'Deluxe Room'}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Check-In</span>
              <div className="font-bold text-slate-900 text-xs mt-0.5">{booking.checkInDate}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Check-Out</span>
              <div className="font-bold text-slate-900 text-xs mt-0.5">{booking.checkOutDate}</div>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold">Occupants</span>
              <div className="font-bold text-slate-900 text-xs mt-0.5">
                {booking.adults} Adults {booking.children ? `• ${booking.children} Ch` : ''} • {booking.nights}N
              </div>
            </div>
          </div>

          {/* Charges Table (NO ROOM NUMBER - ONLY ROOM COUNT) */}
          <table className="w-full text-left border-collapse border border-slate-200">
            <thead>
              <tr className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold uppercase text-slate-600">
                <th className="p-2.5 border-r border-slate-200">Description</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Rooms</th>
                <th className="p-2.5 border-r border-slate-200 text-center">Nights</th>
                <th className="p-2.5 border-r border-slate-200 text-right">Tariff / Night</th>
                <th className="p-2.5 text-right">Total (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              <tr>
                <td className="p-2.5 border-r border-slate-200 font-semibold">
                  {room?.type || 'Standard Room'} Accommodation
                </td>
                <td className="p-2.5 border-r border-slate-200 text-center font-bold text-slate-900">
                  1
                </td>
                <td className="p-2.5 border-r border-slate-200 text-center">{booking.nights}</td>
                <td className="p-2.5 border-r border-slate-200 text-right">₹{booking.roomRatePerNight}</td>
                <td className="p-2.5 text-right font-semibold">₹{roomTotal.toLocaleString()}</td>
              </tr>
              {(booking.extraCharges || []).map(c => (
                <tr key={c.id}>
                  <td className="p-2.5 border-r border-slate-200">{c.description || (c as any).title || 'Addon Charge'}</td>
                  <td className="p-2.5 border-r border-slate-200 text-center text-slate-400">-</td>
                  <td className="p-2.5 border-r border-slate-200 text-center">1</td>
                  <td className="p-2.5 border-r border-slate-200 text-right">₹{c.amount}</td>
                  <td className="p-2.5 text-right font-semibold">₹{c.amount.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="border-t border-slate-200">
                <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">Gross Tariff:</td>
                <td className="p-2 text-right font-bold">₹{roomTotal.toLocaleString()}</td>
              </tr>
              {discountTotal > 0 && (
                <tr className="text-emerald-800 bg-emerald-50/50">
                  <td colSpan={4} className="p-2 text-right font-semibold">
                    Less: Discount ({booking.discountReason || (booking.discountType === 'percentage' ? `${booking.discountValue}% Off` : 'Special Concession')}):
                  </td>
                  <td className="p-2 text-right font-bold font-mono">- ₹{discountTotal.toLocaleString()}</td>
                </tr>
              )}
              {extraTotal > 0 && (
                <tr>
                  <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">Extra Services / Addons:</td>
                  <td className="p-2 text-right font-bold">₹{extraTotal.toLocaleString()}</td>
                </tr>
              )}
              <tr className="bg-slate-50 font-semibold text-slate-700">
                <td colSpan={4} className="p-2 text-right">Net Taxable Amount:</td>
                <td className="p-2 text-right font-bold">₹{subtotal.toLocaleString()}</td>
              </tr>
              {isGstApplied ? (
                <>
                  <tr>
                    <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">
                      CGST (2.5%):
                    </td>
                    <td className="p-2 text-right font-semibold">₹{cgst.toLocaleString()}</td>
                  </tr>
                  <tr>
                    <td colSpan={4} className="p-2 text-right font-semibold text-slate-600">
                      SGST (2.5%):
                    </td>
                    <td className="p-2 text-right font-semibold">₹{sgst.toLocaleString()}</td>
                  </tr>
                  <tr className="border-b border-slate-200">
                    <td colSpan={4} className="p-2 text-right font-bold text-slate-800">
                      Total GST (5% Only):
                    </td>
                    <td className="p-2 text-right font-bold">₹{taxes.toLocaleString()}</td>
                  </tr>
                </>
              ) : (
                <tr className="border-b border-slate-200">
                  <td colSpan={4} className="p-2 text-right font-medium text-slate-500">
                    GST (0% / Non-GST Bill):
                  </td>
                  <td className="p-2 text-right font-semibold text-slate-500 font-mono">₹0</td>
                </tr>
              )}
              <tr className="bg-slate-50 text-sm font-black border-t-2 border-slate-900">
                <td colSpan={4} className="p-2.5 text-right uppercase">Net Total Payable:</td>
                <td className="p-2.5 text-right text-teal-900">₹{grandTotal.toLocaleString()}</td>
              </tr>
              <tr className="text-emerald-800 font-semibold">
                <td colSpan={4} className="p-2 text-right">Amount Received:</td>
                <td className="p-2 text-right">- ₹{totalPaid.toLocaleString()}</td>
              </tr>
              <tr className="font-bold text-sm">
                <td colSpan={4} className="p-2 text-right">Balance Due:</td>
                <td className="p-2 text-right text-amber-900">₹{balanceDue.toLocaleString()}</td>
              </tr>
            </tfoot>
          </table>

          {/* Signature and Declaration Spot */}
          <div className="pt-6 grid grid-cols-2 gap-8 border-t border-slate-300 mt-6">
            <div className="space-y-4">
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Guest Declaration: I hereby confirm that the ID proof details provided are authentic. I agree to abide by the hotel house rules and local hospitality regulations.
              </p>
              <div className="pt-8 border-b border-slate-400 w-48"></div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Guest Signature</span>
            </div>

            <div className="text-right space-y-4">
              <p className="text-[10px] text-slate-500">
                For <strong>{hotelProfile.name}</strong>
              </p>
              <div className="pt-8 border-b border-slate-400 w-48 ml-auto"></div>
              <span className="text-[10px] text-slate-500 uppercase font-bold">Authorized Signatory / Reception</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
