import React, { useState } from 'react';
import { 
  Booking, 
  Guest, 
  IdType, 
  IdDocument 
} from '../types';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  FileText, 
  Eye, 
  CheckCircle2, 
  AlertTriangle, 
  Plus, 
  Phone, 
  Mail, 
  MapPin, 
  Printer, 
  X,
  Lock,
  Download
} from 'lucide-react';

interface GuestIdVaultProps {
  bookings: Booking[];
  onOpenBooking: (booking: Booking) => void;
  onNewBookingClick: () => void;
  onOpenCheckInIdModal?: (booking: Booking) => void;
}

export const GuestIdVault: React.FC<GuestIdVaultProps> = ({
  bookings,
  onOpenBooking,
  onNewBookingClick,
  onOpenCheckInIdModal
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [verifiedFilter, setVerifiedFilter] = useState<string>('all');
  const [lightboxImage, setLightboxImage] = useState<{ url: string; title: string } | null>(null);
  const [showFormCModal, setShowFormCModal] = useState<boolean>(false);

  // Extract unique guests from bookings
  const guests = bookings.map(b => ({
    ...b.guest,
    bookingRef: b.bookingCode,
    roomNumber: b.roomId,
    checkInDate: b.checkInDate,
    checkOutDate: b.checkOutDate,
    bookingObj: b
  }));

  const filteredGuests = guests.filter(g => {
    const q = searchQuery.toLowerCase();
    const matchesQuery = 
      g.fullName.toLowerCase().includes(q) ||
      g.phone.toLowerCase().includes(q) ||
      g.idDocument.idNumber.toLowerCase().includes(q) ||
      (g.city && g.city.toLowerCase().includes(q));

    if (!matchesQuery) return false;

    if (typeFilter !== 'all' && g.idDocument.idType !== typeFilter) return false;
    if (verifiedFilter === 'verified' && !g.idDocument.isVerified) return false;
    if (verifiedFilter === 'unverified' && g.idDocument.isVerified) return false;

    return true;
  });

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Customer ID &amp; Guest KYC Vault
            </h1>
            <span className="text-xs bg-teal-100 text-teal-800 font-bold px-2.5 py-0.5 rounded-full border border-teal-300 flex items-center gap-1">
              <ShieldCheck size={14} className="text-teal-700" />
              Police Form C Ready
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Encrypted repository of guest identification cards, Aadhaar biometric verification records, passports, and police submission registries
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowFormCModal(true)}
            className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-800 text-xs font-bold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Printer size={15} />
            Export Hotel Form C Register
          </button>

          <button
            onClick={onNewBookingClick}
            className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all flex items-center gap-1.5 cursor-pointer"
          >
            <Plus size={15} />
            Register New Guest ID
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[240px] max-w-md bg-slate-50 border border-slate-300 rounded-lg px-3 py-2">
          <Search size={16} className="text-slate-400 shrink-0" />
          <input
            type="text"
            placeholder="Search by Guest Name, Phone, or Aadhaar / Passport number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs md:text-sm bg-transparent border-none outline-hidden text-slate-900 placeholder:text-slate-400"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="text-slate-400 hover:text-slate-600">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold">Filter ID:</span>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="all">All Document Types</option>
            <option value="aadhaar">Aadhaar Card</option>
            <option value="passport">Passport</option>
            <option value="driving_license">Driving License</option>
            <option value="voter_id">Voter ID</option>
          </select>

          <select
            value={verifiedFilter}
            onChange={(e) => setVerifiedFilter(e.target.value)}
            className="bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 font-medium text-slate-800"
          >
            <option value="all">All Statuses</option>
            <option value="verified">Verified Only</option>
            <option value="unverified">Pending Verification</option>
          </select>
        </div>
      </div>

      {/* Guest ID Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGuests.map((g) => {
          const hasFront = Boolean(g.idDocument.frontImageUrl);
          const hasBack = Boolean(g.idDocument.backImageUrl);

          return (
            <div
              key={`${g.id}-${g.bookingRef}`}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs hover:shadow-md transition-shadow flex flex-col justify-between"
            >
              {/* Card Top: Guest Info & Verification Badge */}
              <div className="p-4 space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-teal-800 text-white font-bold flex items-center justify-center text-sm shadow-xs shrink-0">
                      {g.fullName.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">{g.fullName}</h3>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                        <span>{g.nationality}</span>
                        <span>•</span>
                        <span className="font-mono text-teal-800 font-semibold">{g.bookingRef}</span>
                      </div>
                    </div>
                  </div>

                  {g.idDocument.isVerified ? (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-300">
                      <CheckCircle2 size={11} /> Verified
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full flex items-center gap-1 border border-amber-300">
                      <AlertTriangle size={11} /> Pending
                    </span>
                  )}
                </div>

                {/* ID Type & Number Pill */}
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      {g.idDocument.idType.replace('_', ' ')}
                    </div>
                    <div className="text-xs font-mono font-bold text-slate-900 tracking-wide mt-0.5">
                      {g.idDocument.idNumber}
                    </div>
                  </div>

                  <span className="text-[10px] bg-white border border-slate-200 px-1.5 py-0.5 rounded text-slate-500 font-mono">
                    {g.idDocument.expiryDate ? `Exp: ${g.idDocument.expiryDate}` : 'Permanent'}
                  </span>
                </div>

                {/* Contact snippet */}
                <div className="space-y-1 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone size={13} className="text-slate-400 shrink-0" />
                    <span>{g.phone}</span>
                  </div>
                  {g.city && (
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      <span className="truncate">{g.city}, {g.state || 'India'}</span>
                    </div>
                  )}
                </div>

                {/* Attached Document Visual Preview */}
                <div className="pt-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    ID Document Scans / Attachments:
                  </span>

                  <div className="grid grid-cols-2 gap-2">
                    {hasFront ? (
                      <div
                        onClick={() => setLightboxImage({ url: g.idDocument.frontImageUrl!, title: `${g.fullName} - ${g.idDocument.idType.toUpperCase()} Front` })}
                        className="aspect-4/3 bg-slate-100 rounded border border-slate-200 overflow-hidden cursor-zoom-in group relative"
                        title="Click to zoom Front ID"
                      >
                        <img
                          src={g.idDocument.frontImageUrl}
                          alt="Front"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          <Eye size={12} className="mr-1" /> Zoom Front
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-4/3 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        No Front ID
                      </div>
                    )}

                    {hasBack ? (
                      <div
                        onClick={() => setLightboxImage({ url: g.idDocument.backImageUrl!, title: `${g.fullName} - ${g.idDocument.idType.toUpperCase()} Back` })}
                        className="aspect-4/3 bg-slate-100 rounded border border-slate-200 overflow-hidden cursor-zoom-in group relative"
                        title="Click to zoom Back ID"
                      >
                        <img
                          src={g.idDocument.backImageUrl}
                          alt="Back"
                          className="w-full h-full object-contain group-hover:scale-105 transition-transform"
                        />
                        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-[10px] font-bold">
                          <Eye size={12} className="mr-1" /> Zoom Back
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-4/3 bg-slate-50 rounded border border-dashed border-slate-300 flex items-center justify-center text-[10px] text-slate-400">
                        No Back ID
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Card Footer */}
              <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  Stay: {g.checkInDate} &rarr; {g.checkOutDate}
                </span>

                <div className="flex items-center gap-2">
                  {!g.idDocument.isVerified && onOpenCheckInIdModal && (
                    <button
                      onClick={() => onOpenCheckInIdModal(g.bookingObj)}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors shadow-2xs flex items-center gap-1 cursor-pointer"
                    >
                      <ShieldCheck size={13} /> Submit ID
                    </button>
                  )}
                  <button
                    onClick={() => onOpenBooking(g.bookingObj)}
                    className="px-2.5 py-1 bg-white hover:bg-slate-100 text-teal-800 font-bold rounded border border-slate-300 transition-colors shadow-2xs cursor-pointer"
                  >
                    View Details
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Lightbox Zoom Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/85 flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-2xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl p-2" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-slate-200">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                {lightboxImage.title}
              </span>
              <button
                onClick={() => setLightboxImage(null)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>
            <div className="p-4 flex items-center justify-center bg-slate-950/90 max-h-[80vh]">
              <img
                src={lightboxImage.url}
                alt="ID Document"
                className="max-h-[75vh] w-auto object-contain rounded-lg shadow-lg"
              />
            </div>
          </div>
        </div>
      )}

      {/* Hotel Form C Police Verification Register Modal */}
      {showFormCModal && (
        <div 
          className="fixed inset-0 z-60 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setShowFormCModal(false)}
        >
          <div 
            className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 p-6 space-y-4 max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Government Form C &amp; Guest Police Register (HOTEL REGISTRATION ACT)
                </h3>
                <p className="text-xs text-slate-500">
                  Official daily guest arrival register for local police station submission
                </p>
              </div>
              <button onClick={() => setShowFormCModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse border border-slate-300">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                    <th className="p-2 border border-slate-300">S.No</th>
                    <th className="p-2 border border-slate-300">Guest Name</th>
                    <th className="p-2 border border-slate-300">Nationality</th>
                    <th className="p-2 border border-slate-300">ID Proof Type</th>
                    <th className="p-2 border border-slate-300">ID Number</th>
                    <th className="p-2 border border-slate-300">Phone</th>
                    <th className="p-2 border border-slate-300">Arrival Date</th>
                    <th className="p-2 border border-slate-300">Verification</th>
                  </tr>
                </thead>
                <tbody>
                  {guests.map((g, idx) => (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="p-2 border border-slate-300 text-center">{idx + 1}</td>
                      <td className="p-2 border border-slate-300 font-bold">{g.fullName}</td>
                      <td className="p-2 border border-slate-300">{g.nationality}</td>
                      <td className="p-2 border border-slate-300 uppercase font-semibold">{g.idDocument.idType}</td>
                      <td className="p-2 border border-slate-300 font-mono">{g.idDocument.idNumber}</td>
                      <td className="p-2 border border-slate-300">{g.phone}</td>
                      <td className="p-2 border border-slate-300">{g.checkInDate}</td>
                      <td className="p-2 border border-slate-300 text-emerald-700 font-bold">
                        {g.idDocument.isVerified ? 'VERIFIED' : 'PENDING'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end gap-3 pt-3 border-t border-slate-200">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <Printer size={15} />
                Print Police Register
              </button>
              <button
                onClick={() => setShowFormCModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
