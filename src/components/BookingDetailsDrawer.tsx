import React, { useState, useMemo } from 'react';
import { 
  Booking, 
  Room, 
  BookingChannel,
  PaymentMode,
  formatIdTypeName,
  isIdVerifiedCheck,
  HotelProfile
} from '../types';
import { 
  X, 
  Link2,
  ChevronDown,
  FileText, 
  Users, 
  Bed, 
  ShieldCheck, 
  CreditCard, 
  Zap, 
  Package, 
  MessageSquare, 
  ClipboardList,
  Edit3, 
  CheckCircle2, 
  LogOut, 
  Plus, 
  Eye, 
  Printer, 
  AlertTriangle,
  Copy,
  Check,
  Phone,
  Mail,
  MapPin,
  ExternalLink,
  Car,
  Clock,
  Sparkles,
  DollarSign,
  Tag,
  Send,
  MessageCircle,
  ArrowRightLeft,
  LogIn,
  RefreshCw,
  DoorClosed
} from 'lucide-react';
import {
  formatBookingConfirmationWhatsAppMessage,
  formatInvoiceWhatsAppMessage,
  openWhatsAppMessage,
  cleanPhoneNumber
} from '../utils/whatsappHelper';

interface BookingDetailsDrawerProps {
  booking: Booking | null;
  rooms: Room[];
  bookings?: Booking[];
  isOpen: boolean;
  onClose: () => void;
  onEdit: (booking: Booking) => void;
  onStatusChange: (bookingId: string, newStatus: Booking['status']) => void;
  onPrintInvoice: (booking: Booking, type: 'invoice' | 'grc') => void;
  onAddPayment: (bookingId: string, amount: number, mode: any) => void;
  onOpenCheckInIdModal?: (booking: Booking) => void;
  onSendEmail?: (booking: Booking) => void;
  onShiftRoom?: (bookingId: string, newRoomId: string, newRoomNumber: string, reason?: string, markPreviousDirty?: boolean) => void;
  onSelectBooking?: (booking: Booking) => void;
  hotelName?: string;
  hotelProfile?: HotelProfile;
}

type ActiveTabType = 'details' | 'guests' | 'rooms' | 'documents' | 'payments' | 'commission' | 'addons' | 'comments' | 'logs';

export const BookingDetailsDrawer: React.FC<BookingDetailsDrawerProps> = ({
  booking,
  rooms,
  bookings,
  isOpen,
  onClose,
  onEdit,
  onStatusChange,
  onPrintInvoice,
  onAddPayment,
  onOpenCheckInIdModal,
  onSendEmail,
  onShiftRoom,
  onSelectBooking,
  hotelName = 'Big House Inn',
  hotelProfile
}) => {
  if (!isOpen || !booking) return null;

  const [activeTab, setActiveTab] = useState<ActiveTabType>('details');
  const [isActionsOpen, setIsActionsOpen] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  // WhatsApp quick messaging state
  const [isWhatsAppModalOpen, setIsWhatsAppModalOpen] = useState<boolean>(false);
  const [whatsAppMessageType, setWhatsAppMessageType] = useState<'confirmation' | 'invoice'>('confirmation');
  const [whatsAppRecipientPhone, setWhatsAppRecipientPhone] = useState<string>('');
  const [whatsAppSuccessToast, setWhatsAppSuccessToast] = useState<string | null>(null);
  const [whatsAppCopied, setWhatsAppCopied] = useState<boolean>(false);

  // Folio payment quick form state
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [paymentRef, setPaymentRef] = useState<string>('');
  const [showAddPaymentRow, setShowAddPaymentRow] = useState<boolean>(false);

  // Shift Room state ("action button me check in check out sift room add karo")
  const [isShiftRoomModalOpen, setIsShiftRoomModalOpen] = useState<boolean>(false);
  const [shiftSelectedRoomId, setShiftSelectedRoomId] = useState<string>('');
  const [shiftReasonCategory, setShiftReasonCategory] = useState<string>('Guest Request / Preference');
  const [shiftCustomReason, setShiftCustomReason] = useState<string>('');
  const [shiftMarkDirty, setShiftMarkDirty] = useState<boolean>(true);
  const [shiftSuccessToast, setShiftSuccessToast] = useState<string | null>(null);

  // New addon charge state
  const [newAddonTitle, setNewAddonTitle] = useState<string>('');
  const [newAddonPrice, setNewAddonPrice] = useState<number>(0);

  // Comments state
  const [newCommentText, setNewCommentText] = useState<string>('');
  const [localComments, setLocalComments] = useState<Array<{ id: string; author: string; text: string; time: string }>>([
    {
      id: 'c1',
      author: 'Front Desk Team',
      text: booking.specialRequests || 'Standard guest check-in registered. Ensure room amenities and towels are fresh.',
      time: booking.createdAt || '15 Sept 2026 12:30 PM'
    }
  ]);

  const room = rooms.find(r => r.id === booking.roomId);

  // Find other rooms in this multi-room reservation or booked under the same guest
  const linkedBookings = useMemo(() => {
    if (!bookings || !booking) return [];
    return bookings.filter(b => {
      if (b.id === booking.id) return false;
      if (booking.groupId && b.groupId === booking.groupId) return true;
      if (
        b.guest.fullName.trim().toLowerCase() === booking.guest.fullName.trim().toLowerCase() &&
        b.checkInDate === booking.checkInDate &&
        b.checkOutDate === booking.checkOutDate &&
        b.status !== 'cancelled'
      ) {
        return true;
      }
      return false;
    });
  }, [bookings, booking]);

  const totalGroupRoomsCount = 1 + linkedBookings.length;

  // Financial calculations
  const roomTotal = booking.nights * booking.roomRatePerNight;
  const discountTotal = booking.discountAmount || 0;
  const taxableRoomTotal = Math.max(0, roomTotal - discountTotal);
  const extraTotal = booking.extraCharges.reduce((acc, c) => acc + c.amount, 0);
  const subtotal = taxableRoomTotal + extraTotal;
  const isGstApplied = (booking.taxRatePercent || 0) > 0;
  const taxes = isGstApplied ? Math.round((subtotal * booking.taxRatePercent) / 100) : 0;
  const grandTotal = subtotal + taxes;
  const totalPaid = booking.payments.reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  // WhatsApp dynamic message preview and dispatch
  const whatsAppPreviewText = whatsAppMessageType === 'confirmation'
    ? formatBookingConfirmationWhatsAppMessage(booking, { hotelProfile, hotelName, room })
    : formatInvoiceWhatsAppMessage(booking, { hotelProfile, hotelName, room });

  const handleDispatchWhatsApp = () => {
    const targetPhone = whatsAppRecipientPhone || booking.guest.phone;
    openWhatsAppMessage(targetPhone, whatsAppPreviewText);
    setWhatsAppSuccessToast(`Opening WhatsApp for ${booking.guest.fullName}...`);
    setTimeout(() => {
      setWhatsAppSuccessToast(null);
      setIsWhatsAppModalOpen(false);
    }, 2000);
  };

  // Format date like: "15 Sept 2026"
  const formatTripmakerzDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const y = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      const d = parseInt(parts[2], 10);
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sept", "Oct", "Nov", "Dec"];
      return `${d} ${monthNames[m - 1] || ''} ${y}`;
    }
    return dateStr;
  };

  // Channel display name
  const getChannelDisplayName = (channel: BookingChannel) => {
    switch (channel) {
      case 'agoda': return 'Agoda';
      case 'makemytrip': return 'MakeMyTrip';
      case 'booking_com': return 'Booking.com';
      case 'oyo': return 'OYO';
      case 'cleartrip': return 'Cleartrip';
      case 'easemytrip': return 'EaseMyTrip';
      case 'airbnb': return 'Airbnb';
      case 'goibibo': return 'Goibibo';
      case 'walkin': return 'Direct Walk-in';
      default: return 'Direct / Phone';
    }
  };

  // Channel commission percentage estimation
  const getChannelCommissionPercent = (channel: BookingChannel) => {
    switch (channel) {
      case 'agoda': return 15;
      case 'makemytrip': return 18;
      case 'booking_com': return 15;
      case 'oyo': return 20;
      case 'cleartrip': return 16;
      case 'airbnb': return 14;
      default: return 0;
    }
  };

  const commissionPercent = getChannelCommissionPercent(booking.channel);
  const commissionAmount = Math.round((grandTotal * commissionPercent) / 100);
  const netHotelPayout = grandTotal - commissionAmount;

  // Copy link handler
  const handleCopyLink = () => {
    const fakeUrl = `https://app.tripmakerz.in/properties/31/bookings/${booking.bookingCode}`;
    navigator.clipboard.writeText(fakeUrl);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Add payment handler
  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paymentAmount <= 0) return;
    onAddPayment(booking.id, paymentAmount, paymentMode);
    setPaymentAmount(0);
    setPaymentRef('');
    setShowAddPaymentRow(false);
  };

  // Add comment handler
  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setLocalComments(prev => [
      ...prev,
      {
        id: `c-${Date.now()}`,
        author: 'Duty Manager',
        text: newCommentText.trim(),
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today'
      }
    ]);
    setNewCommentText('');
  };

  // Shift Room handler
  const handleOpenShiftModal = () => {
    const otherRooms = rooms.filter(r => r.id !== booking.roomId);
    if (otherRooms.length > 0) {
      setShiftSelectedRoomId(otherRooms[0].id);
    }
    setIsShiftRoomModalOpen(true);
  };

  const handleConfirmShiftRoom = () => {
    if (!shiftSelectedRoomId) return;
    const targetRoom = rooms.find(r => r.id === shiftSelectedRoomId);
    if (!targetRoom) return;

    const prevRoomNum = room?.number || booking.roomNumber;
    const finalReason = shiftCustomReason.trim()
      ? `${shiftReasonCategory}: ${shiftCustomReason.trim()}`
      : shiftReasonCategory;

    if (onShiftRoom) {
      onShiftRoom(booking.id, targetRoom.id, targetRoom.number, finalReason, shiftMarkDirty);
    }

    // Add local comment
    setLocalComments(prev => [
      {
        id: `c-shift-${Date.now()}`,
        author: 'Front Desk',
        text: `Room Shifted: Transferred from Room ${prevRoomNum} to Room ${targetRoom.number} (${targetRoom.type}). Reason: ${finalReason}. Previous Room ${prevRoomNum} ${shiftMarkDirty ? 'marked dirty for housekeeping' : 'retained'}.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ', Today'
      },
      ...prev
    ]);

    setShiftSuccessToast(`Shifted to Room ${targetRoom.number} (${targetRoom.type})`);
    setTimeout(() => {
      setShiftSuccessToast(null);
      setIsShiftRoomModalOpen(false);
      setShiftCustomReason('');
    }, 1500);
  };

  // Room assignment tag text, e.g. "204-Copule" or "101-Jambo"
  const roomAssignmentTag = room 
    ? `${room.number}-${room.type.replace(/\s+/g, '')}`
    : '204-Copule';

  const isIdVerified = isIdVerifiedCheck(booking.guest.idDocument);
  const idTypeName = formatIdTypeName(booking.guest.idDocument.idType);

  return (
    <div 
      id="tripmakerz-booking-modal-backdrop"
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
      onClick={() => {
        setIsActionsOpen(false);
        onClose();
      }}
    >
      <div 
        id="tripmakerz-booking-modal-container"
        className="w-full max-w-5xl bg-[#f8fafc] text-slate-800 rounded-xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[95vh] my-auto animate-in fade-in zoom-in-98 duration-150"
        onClick={(e) => {
          e.stopPropagation();
          setIsActionsOpen(false);
        }}
      >
        {/* Top Header Bar (matches image: Property name + ID + Copy Link + Close) */}
        <div className="bg-white border-b border-slate-200 px-6 py-3.5 flex items-center justify-between shrink-0">
          <div>
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight leading-tight">
              {hotelName}
            </h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-mono">
              {booking.bookingCode}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-medium rounded-md flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
              title="Copy booking direct link"
            >
              {isCopied ? (
                <>
                  <Check size={13} className="text-emerald-600" />
                  <span className="text-emerald-700 font-semibold">Copied!</span>
                </>
              ) : (
                <>
                  <Link2 size={13} className="text-slate-500" />
                  <span>Copy Link</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          
          {/* Top Booking Card (Matches screenshot layout) */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {booking.guest.fullName}
              </h1>
              <p className="text-xs text-slate-500 font-mono mt-0.5">
                {booking.bookingCode}
              </p>
              <p className="text-xs text-slate-600 mt-0.5">
                {formatTripmakerzDate(booking.checkInDate)} &mdash; {formatTripmakerzDate(booking.checkOutDate)}
              </p>
            </div>

            <div className="flex flex-wrap items-center sm:justify-end gap-2 shrink-0">
              {/* Status button (Green Pill: CHECK-OUT or CHECK-IN) */}
              {booking.status === 'checked_in' && (
                <button
                  onClick={() => onStatusChange(booking.id, 'checked_out')}
                  className="bg-[#1e4d38] hover:bg-[#153a2a] text-white text-xs font-bold px-3.5 sm:px-4 py-1.5 rounded-full uppercase tracking-wider transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Check-Out guest and mark room for housekeeping"
                >
                  <LogOut size={13} />
                  <span>CHECK-OUT</span>
                </button>
              )}

              {booking.status === 'confirmed' && (
                <button
                  onClick={() => {
                    if (onOpenCheckInIdModal) {
                      onOpenCheckInIdModal(booking);
                    } else {
                      onStatusChange(booking.id, 'checked_in');
                    }
                  }}
                  className="bg-[#1e4d38] hover:bg-[#153a2a] text-white text-xs font-bold px-3.5 sm:px-4 py-1.5 rounded-full uppercase tracking-wider transition-colors shadow-2xs cursor-pointer flex items-center gap-1.5"
                  title="Check-in guest and record ID proof"
                >
                  <CheckCircle2 size={13} />
                  <span>CHECK-IN</span>
                </button>
              )}

              {booking.status === 'checked_out' && (
                <span className="bg-slate-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                  CHECKED-OUT
                </span>
              )}

              {booking.status === 'cancelled' && (
                <span className="bg-rose-700 text-white text-xs font-bold px-3.5 py-1.5 rounded-full uppercase tracking-wider shadow-2xs">
                  CANCELLED
                </span>
              )}

              {/* Quick Shift Room Header Action */}
              <button
                type="button"
                id="btn-drawer-quick-shift-room"
                onClick={handleOpenShiftModal}
                className="bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Shift guest to another room"
              >
                <ArrowRightLeft size={13} className="text-teal-700" />
                <span>Shift Room</span>
              </button>

              {/* Send via WhatsApp Header Quick Action */}
              <button
                type="button"
                id="btn-drawer-send-whatsapp"
                onClick={() => {
                  setWhatsAppRecipientPhone(booking.guest.phone || '');
                  setWhatsAppMessageType('confirmation');
                  setIsWhatsAppModalOpen(true);
                }}
                className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                title="Send Booking Confirmation or Tax Invoice via WhatsApp"
              >
                <MessageCircle size={14} />
                <span className="hidden sm:inline">Send via WhatsApp</span>
                <span className="sm:hidden">WhatsApp</span>
              </button>

              {/* Actions Dropdown (Fixed alignment so it never overflows off-screen on mobile) */}
              <div className="relative">
                <button
                  type="button"
                  id="btn-drawer-actions-dropdown"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsActionsOpen(prev => !prev);
                  }}
                  className="border border-slate-300 bg-white hover:bg-slate-50 text-slate-800 text-xs font-bold px-3.5 py-1.5 rounded-md flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
                >
                  <span>Actions</span>
                  <ChevronDown size={14} className="text-slate-500" />
                </button>

                {isActionsOpen && (
                  <div 
                    className="absolute left-0 sm:left-auto sm:right-0 top-full mt-1.5 w-64 max-w-[calc(100vw-2.5rem)] bg-white border border-slate-200 rounded-xl shadow-2xl z-40 py-1 text-xs text-slate-700 animate-in fade-in-50 duration-100 divide-y divide-slate-100"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* SECTION 1: FRONT DESK & ROOM OPERATIONS */}
                    <div className="py-1">
                      <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Front Desk &amp; Room
                      </div>

                      {/* 1. CHECK-IN GUEST */}
                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          if (booking.status === 'confirmed' && onOpenCheckInIdModal) {
                            onOpenCheckInIdModal(booking);
                          } else {
                            onStatusChange(booking.id, 'checked_in');
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between cursor-pointer font-bold transition-colors ${
                          booking.status === 'checked_in'
                            ? 'bg-emerald-50/80 text-emerald-900 hover:bg-emerald-100'
                            : 'hover:bg-emerald-50 text-emerald-800'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 size={15} className="text-emerald-600 shrink-0" />
                          <div>
                            <div>Check-In Guest</div>
                            <div className="text-[10px] font-normal text-slate-500">
                              {booking.status === 'checked_in' ? 'Currently In-House' : 'Record check-in & KYC ID'}
                            </div>
                          </div>
                        </div>
                        {booking.status === 'checked_in' && (
                          <span className="text-[9px] bg-emerald-600 text-white font-bold px-1.5 py-0.5 rounded uppercase">
                            In-House
                          </span>
                        )}
                      </button>

                      {/* 2. CHECK-OUT GUEST */}
                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          if (booking.status !== 'checked_in') {
                            if (confirm(`Booking status is currently '${booking.status}'. Do you still want to proceed with Check-Out?`)) {
                              onStatusChange(booking.id, 'checked_out');
                            }
                          } else {
                            onStatusChange(booking.id, 'checked_out');
                          }
                        }}
                        className={`w-full text-left px-3.5 py-2 flex items-center justify-between cursor-pointer font-bold transition-colors ${
                          booking.status === 'checked_out'
                            ? 'bg-slate-100 text-slate-600'
                            : 'hover:bg-amber-50 text-amber-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <LogOut size={15} className="text-amber-700 shrink-0" />
                          <div>
                            <div>Check-Out Guest</div>
                            <div className="text-[10px] font-normal text-slate-500">
                              {booking.status === 'checked_out' ? 'Already Checked Out' : 'Vacate room & clean status'}
                            </div>
                          </div>
                        </div>
                        {booking.status === 'checked_out' && (
                          <span className="text-[9px] bg-slate-500 text-white font-bold px-1.5 py-0.5 rounded uppercase">
                            Done
                          </span>
                        )}
                      </button>

                      {/* 3. SHIFT ROOM (SIFT ROOM) */}
                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          handleOpenShiftModal();
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-teal-50 text-teal-900 flex items-center justify-between cursor-pointer font-bold transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <ArrowRightLeft size={15} className="text-teal-700 shrink-0" />
                          <div>
                            <div>Shift Room (कमरा बदलें)</div>
                            <div className="text-[10px] font-normal text-slate-500">
                              Move to another room / upgrade
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] font-mono bg-teal-100 text-teal-800 px-1.5 py-0.5 rounded font-bold">
                          Room {room?.number || booking.roomNumber}
                        </span>
                      </button>
                    </div>

                    {/* SECTION 2: GUEST PROFILE & KYC ID */}
                    <div className="py-1">
                      <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Guest &amp; KYC
                      </div>

                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          onEdit(booking);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Edit3 size={14} className="text-slate-500 shrink-0" />
                        <span>Edit Booking Details</span>
                      </button>

                      {onOpenCheckInIdModal && (
                        <button
                          onClick={() => {
                            setIsActionsOpen(false);
                            onOpenCheckInIdModal(booking);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-teal-50 text-teal-800 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <ShieldCheck size={14} className="text-teal-600 shrink-0" />
                          <span>{isIdVerified ? 'Update Customer ID Proof' : 'Submit Customer ID Proof'}</span>
                        </button>
                      )}
                    </div>

                    {/* SECTION 3: COMMUNICATIONS & FOLIO */}
                    <div className="py-1">
                      <div className="px-3.5 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                        Communication &amp; Folio
                      </div>

                      <button
                        id="btn-actions-send-whatsapp"
                        onClick={() => {
                          setIsActionsOpen(false);
                          setWhatsAppRecipientPhone(booking.guest.phone || '');
                          setWhatsAppMessageType('confirmation');
                          setIsWhatsAppModalOpen(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <MessageCircle size={14} className="text-emerald-600 shrink-0" />
                        <span>Send via WhatsApp</span>
                      </button>

                      {onSendEmail && (
                        <button
                          onClick={() => {
                            setIsActionsOpen(false);
                            onSendEmail(booking);
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-teal-50 text-teal-800 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <Mail size={14} className="text-teal-600 shrink-0" />
                          <span>Email Voucher via Gmail</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          onPrintInvoice(booking, 'invoice');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-emerald-50 text-emerald-800 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Send size={14} className="text-emerald-600 shrink-0" />
                        <span>Send Invoice to Guest</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          onPrintInvoice(booking, 'invoice');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <Printer size={14} className="text-slate-500 shrink-0" />
                        <span>Print Tax Invoice</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          onPrintInvoice(booking, 'grc');
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <FileText size={14} className="text-slate-500 shrink-0" />
                        <span>Print GRC (Registration)</span>
                      </button>

                      <button
                        onClick={() => {
                          setIsActionsOpen(false);
                          setActiveTab('payments');
                          setShowAddPaymentRow(true);
                        }}
                        className="w-full text-left px-3.5 py-2 hover:bg-slate-50 flex items-center gap-2 cursor-pointer font-medium"
                      >
                        <CreditCard size={14} className="text-slate-500 shrink-0" />
                        <span>Collect / Add Payment</span>
                      </button>
                    </div>

                    {/* SECTION 4: CANCEL */}
                    {booking.status !== 'cancelled' && (
                      <div className="py-1">
                        <button
                          onClick={() => {
                            setIsActionsOpen(false);
                            if (confirm('Are you sure you want to cancel this booking?')) {
                              onStatusChange(booking.id, 'cancelled');
                            }
                          }}
                          className="w-full text-left px-3.5 py-2 hover:bg-rose-50 text-rose-700 flex items-center gap-2 cursor-pointer font-medium"
                        >
                          <X size={14} className="text-rose-500 shrink-0" />
                          <span>Cancel Booking</span>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs (Exactly matching user's image) */}
          <div className="border-b border-slate-200 overflow-x-auto flex items-center gap-1 sm:gap-2 text-xs sm:text-sm font-medium no-scrollbar">
            <button
              onClick={() => setActiveTab('details')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'details'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <FileText size={16} className={activeTab === 'details' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Details</span>
            </button>

            <button
              onClick={() => setActiveTab('guests')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'guests'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Users size={16} className={activeTab === 'guests' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Guests</span>
            </button>

            <button
              onClick={() => setActiveTab('rooms')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'rooms'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Bed size={16} className={activeTab === 'rooms' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Rooms</span>
              {totalGroupRoomsCount > 1 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-100 text-teal-800 rounded-full border border-teal-300">
                  {totalGroupRoomsCount}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('documents')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'documents'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <FileText size={16} className={activeTab === 'documents' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Documents</span>
              {!isIdVerified && (
                <span className="w-2 h-2 rounded-full bg-amber-500 ml-0.5" title="Customer ID Pending" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('payments')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'payments'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <CreditCard size={16} className={activeTab === 'payments' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Payments</span>
              {balanceDue > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded-full">
                  ₹{balanceDue}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('commission')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'commission'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Zap size={16} className={activeTab === 'commission' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Commission</span>
            </button>

            <button
              onClick={() => setActiveTab('addons')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'addons'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <Package size={16} className={activeTab === 'addons' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Addons</span>
              {booking.extraCharges.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full">
                  {booking.extraCharges.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('comments')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'comments'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <MessageSquare size={16} className={activeTab === 'comments' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Comments</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 bg-slate-200 text-slate-700 rounded-full">
                {localComments.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('logs')}
              className={`px-3.5 py-2.5 flex items-center gap-1.5 transition-colors shrink-0 cursor-pointer ${
                activeTab === 'logs'
                  ? 'text-teal-700 font-bold border-b-2 border-teal-600'
                  : 'text-slate-600 hover:text-slate-900 border-b-2 border-transparent'
              }`}
            >
              <ClipboardList size={16} className={activeTab === 'logs' ? 'text-teal-700' : 'text-slate-500'} />
              <span>Logs</span>
            </button>
          </div>

          {/* Tab 1: Details (Exact match to screenshot) */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Primary Card: Booking Details */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                    Booking Details
                  </h3>
                  <button
                    onClick={() => onEdit(booking)}
                    className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer shadow-2xs"
                  >
                    Edit
                  </button>
                </div>

                {/* Grid matching user's image exactly */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-y-4 gap-x-6 text-xs sm:text-sm">
                  {/* Row 1 */}
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Check-in</span>
                    <span className="font-medium text-slate-800">{formatTripmakerzDate(booking.checkInDate)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Check-out</span>
                    <span className="font-medium text-slate-800">{formatTripmakerzDate(booking.checkOutDate)}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Guests</span>
                    <span className="font-medium text-slate-800">{booking.adults + (booking.children || 0)}</span>
                  </div>

                  {/* Row 2 */}
                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Rooms</span>
                    <span className="font-medium text-slate-800">1</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Booked By</span>
                    <span className="font-medium text-slate-800">{booking.guest.fullName || 'Md Sadik'}</span>
                  </div>

                  <div>
                    <span className="text-slate-500 block text-xs mb-1">Property</span>
                    <span className="font-medium text-slate-800">{hotelName}</span>
                  </div>

                  {/* Row 3: Room Assignments */}
                  <div className="md:col-span-3 pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-slate-500 block text-xs">Room Assignments</span>
                      <button
                        type="button"
                        onClick={handleOpenShiftModal}
                        className="flex items-center gap-1 text-xs font-bold text-teal-800 hover:text-teal-900 bg-teal-50 hover:bg-teal-100 border border-teal-200 px-2 py-0.5 rounded cursor-pointer transition-colors"
                      >
                        <ArrowRightLeft size={12} className="text-teal-700" />
                        <span>Shift / Change Room</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2.5 py-1 bg-[#1e4d38] text-white text-xs font-semibold rounded-md shadow-2xs">
                        {roomAssignmentTag}
                      </span>
                      {room && (
                        <span className="text-xs text-slate-500">
                          Floor {room.floor} &bull; Base Rate: ₹{room.baseRate}/night
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 4: References & OTA Channel */}
                  <div className="pt-1">
                    <span className="text-slate-500 block text-xs mb-1">Vendor Ref</span>
                    <span className="font-medium text-slate-800">{booking.channelRefId || 'Na'}</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 block text-xs mb-1">Booking Ref</span>
                    <span className="font-medium text-slate-800">{booking.channelRefId || 'Na'}</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 block text-xs mb-1">OTA</span>
                    <span className="font-medium text-slate-800">{getChannelDisplayName(booking.channel)}</span>
                  </div>

                  <div className="pt-1">
                    <span className="text-slate-500 block text-xs mb-1">Agent</span>
                    <span className="font-medium text-slate-800">-</span>
                  </div>
                </div>
              </div>

              {/* Sub-card: Financial Summary & Quick Payment Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <CreditCard size={15} className="text-teal-700" />
                    Billing &amp; Payment Summary
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      id="btn-financial-whatsapp"
                      onClick={() => {
                        setWhatsAppRecipientPhone(booking.guest.phone || '');
                        setWhatsAppMessageType('invoice');
                        setIsWhatsAppModalOpen(true);
                      }}
                      className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer shadow-2xs"
                      title="Send Tax Invoice to Guest via WhatsApp"
                    >
                      <MessageCircle size={12} />
                      <span>WhatsApp</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onPrintInvoice(booking, 'invoice')}
                      className="px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-md flex items-center gap-1 transition-colors cursor-pointer"
                      title="Send or Print Invoice for Guest"
                    >
                      <Send size={12} className="text-emerald-700" />
                      <span>Send Invoice</span>
                    </button>
                    <button
                      onClick={() => setActiveTab('payments')}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                    >
                      <span>View Folio</span>
                      <span>&rarr;</span>
                    </button>
                  </div>
                </div>

                <div className={`grid grid-cols-2 ${discountTotal > 0 ? 'sm:grid-cols-5' : 'sm:grid-cols-4'} gap-3 text-xs`}>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Tariff ({booking.nights}N @ ₹{booking.roomRatePerNight})</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">₹{roomTotal}</span>
                  </div>
                  {discountTotal > 0 && (
                    <div className="bg-emerald-50 p-2.5 rounded-lg border border-emerald-200">
                      <span className="text-emerald-700 block text-[11px] font-semibold">
                        Discount ({booking.discountReason || (booking.discountType === 'percentage' ? `${booking.discountValue}%` : 'Flat')})
                      </span>
                      <span className="font-bold text-sm text-emerald-800 font-mono">-₹{discountTotal}</span>
                    </div>
                  )}
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">{isGstApplied ? 'Taxes (5% GST)' : 'Taxes (0% Non-GST)'}</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">{isGstApplied ? `₹${taxes}` : '₹0'}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <span className="text-slate-500 block text-[11px]">Grand Total</span>
                    <span className="font-bold text-sm text-slate-900 font-mono">₹{grandTotal}</span>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${
                    balanceDue === 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
                  }`}>
                    <span className="text-slate-600 block text-[11px]">Balance Due</span>
                    <div className="flex items-center justify-between">
                      <span className={`font-bold text-sm font-mono ${balanceDue === 0 ? 'text-emerald-700' : 'text-amber-700'}`}>
                        {balanceDue === 0 ? '₹0 (Paid)' : `₹${balanceDue}`}
                      </span>
                      {balanceDue > 0 && (
                        <button
                          onClick={() => {
                            setActiveTab('payments');
                            setShowAddPaymentRow(true);
                          }}
                          className="text-[10px] bg-amber-600 hover:bg-amber-700 text-white font-bold px-2 py-0.5 rounded cursor-pointer"
                        >
                          Collect
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Sub-card: Customer ID & KYC Status */}
              <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-2xs">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
                  <span className="font-bold text-xs uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-teal-700" />
                    Customer Identity &amp; Form-C Compliance
                  </span>
                  <button
                    onClick={() => setActiveTab('documents')}
                    className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1 cursor-pointer"
                  >
                    <span>Manage Documents</span>
                    <span>&rarr;</span>
                  </button>
                </div>

                {isIdVerified ? (
                  <div className="bg-emerald-50/80 border border-emerald-200 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <CheckCircle2 size={18} />
                      </div>
                      <div>
                        <span className="font-bold text-emerald-900 block">
                          {idTypeName} Verified: {booking.guest.idDocument.idNumber}
                        </span>
                        <span className="text-[11px] text-emerald-700">
                          Proof uploaded and verified for guest police reporting &amp; Form C.
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('documents')}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded text-xs transition-colors cursor-pointer self-start sm:self-auto"
                    >
                      View ID Card
                    </button>
                  </div>
                ) : (
                  <div className="bg-amber-50/90 border border-amber-300 rounded-lg p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-900">
                    <div className="flex items-start gap-2.5">
                      <AlertTriangle size={18} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-extrabold text-amber-950 uppercase text-[11px] bg-amber-200/80 px-1.5 py-0.5 rounded border border-amber-300">
                            ID STATUS: PENDING
                          </span>
                          <span className="font-bold text-slate-800 text-xs">
                            Type: {idTypeName}
                          </span>
                        </div>
                        <span className="font-bold block text-amber-900">
                          Pending submit at check-in time (ADHAR / VOTER / DL / PASSPORT)
                        </span>
                        <span className="text-[11px] text-amber-800">
                          {booking.status === 'checked_in'
                            ? 'Guest is checked-in. Submit Aadhaar, Voter ID, Driving License, or Passport now.'
                            : 'Room reservation is secured. Customer ID will be recorded when guest arrives at front desk.'}
                        </span>
                      </div>
                    </div>
                    {onOpenCheckInIdModal && (
                      <button
                        onClick={() => onOpenCheckInIdModal(booking)}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded text-xs transition-colors cursor-pointer shrink-0 self-start sm:self-auto flex items-center gap-1.5"
                      >
                        <ShieldCheck size={14} /> Submit ID Proof Now
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab 2: Guests */}
          {activeTab === 'guests' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Users size={18} className="text-teal-700" />
                  Guest Details &amp; Contact
                </h3>
                <button
                  onClick={() => onEdit(booking)}
                  className="px-3 py-1 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-md transition-colors cursor-pointer"
                >
                  Edit Guest
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
                <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Primary Guest Information</span>
                  <div>
                    <span className="text-slate-500 block text-xs">Full Name</span>
                    <span className="font-bold text-slate-900 text-base">{booking.guest.fullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Phone Number</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <Phone size={13} className="text-slate-400" />
                      {booking.guest.phone || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Email Address</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <Mail size={13} className="text-slate-400" />
                      {booking.guest.email || 'Not provided'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Address</span>
                    <span className="font-medium text-slate-800 flex items-center gap-1.5">
                      <MapPin size={13} className="text-slate-400 shrink-0" />
                      {booking.guest.address || 'Standard Guest City'}, {booking.guest.city || ''} {booking.guest.state || ''}
                    </span>
                  </div>
                </div>

                <div className="space-y-3 bg-slate-50/70 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500 block">Stay &amp; Identity Profile</span>
                  <div>
                    <span className="text-slate-500 block text-xs">Purpose of Visit</span>
                    <span className="font-medium text-slate-800">{booking.guest.purposeOfVisit || 'Tourism / Leisure'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Nationality</span>
                    <span className="font-medium text-slate-800">{booking.guest.nationality || 'Indian'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Vehicle Number</span>
                    <span className="font-mono font-medium text-slate-800 flex items-center gap-1.5">
                      <Car size={13} className="text-slate-400" />
                      {booking.guest.vehicleNumber || 'None (Arrived by cab / public transport)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-xs">Emergency Contact</span>
                    <span className="font-medium text-slate-800">{booking.guest.emergencyContact || 'Not provided'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 3: Rooms */}
          {activeTab === 'rooms' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <Bed size={18} className="text-teal-700" />
                  Allocated Room &amp; Inventory Details
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleOpenShiftModal}
                    className="flex items-center gap-1.5 px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    <ArrowRightLeft size={13} />
                    <span>Shift / Change Room</span>
                  </button>
                  <span className="text-xs font-bold px-2.5 py-1 bg-teal-50 text-teal-800 border border-teal-200 rounded-md">
                    {totalGroupRoomsCount} {totalGroupRoomsCount > 1 ? 'Rooms Allocated (Multi-Room)' : '1 Room Allocated'}
                  </span>
                </div>
              </div>

              {/* Multi-Room Group Notice Banner */}
              {totalGroupRoomsCount > 1 && (
                <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-teal-700 text-white rounded font-bold text-[10px] uppercase">
                      Multi-Room Stay
                    </span>
                    <span className="font-semibold text-teal-950">
                      Total {totalGroupRoomsCount} rooms reserved under {booking.guest.fullName}
                    </span>
                  </div>
                  <span className="text-teal-800 text-[11px] font-medium">
                    {booking.checkInDate} to {booking.checkOutDate} ({booking.nights}N)
                  </span>
                </div>
              )}

              {/* Current Active Room Details */}
              <div className="space-y-1">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {totalGroupRoomsCount > 1 ? 'Current Viewed Room' : 'Assigned Room'}
                </span>
                {room ? (
                  <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-xs text-slate-500 block">Room Number</span>
                        <span className="text-xl font-black text-slate-900 font-mono">Room {room.number}</span>
                      </div>
                      <span className="px-3 py-1 bg-[#1e4d38] text-white text-xs font-bold rounded-md uppercase">
                        {room.type}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-2 border-t border-slate-200">
                      <div>
                        <span className="text-slate-500 block">Floor</span>
                        <span className="font-bold text-slate-800">Floor {room.floor}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Occupancy</span>
                        <span className="font-bold text-slate-800">Max {room.maxOccupancy} Guests</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Base Tariff</span>
                        <span className="font-bold text-slate-800 font-mono">₹{room.baseRate}/night</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Cleanliness</span>
                        <span className="font-bold capitalize text-emerald-700">{room.status}</span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-amber-50 rounded-lg text-xs text-amber-800">
                    Room unassigned. Please edit booking to assign a specific room.
                  </div>
                )}
              </div>

              {/* Other Rooms in this Multi-Room Group */}
              {linkedBookings.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Other Linked Rooms for {booking.guest.fullName} ({linkedBookings.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Click to switch and view room folio
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {linkedBookings.map((lb) => {
                      const lbRoom = rooms.find(r => r.id === lb.roomId);
                      return (
                        <div
                          key={lb.id}
                          className="p-3.5 bg-white border border-slate-200 hover:border-teal-400 rounded-xl transition-all shadow-2xs space-y-2"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-900 text-sm flex items-center gap-1.5">
                              <Bed size={15} className="text-teal-700" />
                              Room {lbRoom?.number || lb.roomId}
                            </span>
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              lb.status === 'checked_in'
                                ? 'bg-emerald-100 text-emerald-800'
                                : lb.status === 'confirmed'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-700'
                            }`}>
                              {lb.status}
                            </span>
                          </div>

                          <div className="text-xs text-slate-600 flex items-center justify-between">
                            <span>{lbRoom?.type || 'Room'} • Floor {lbRoom?.floor || 1}</span>
                            <span className="font-mono font-semibold text-slate-800">₹{lb.roomRatePerNight}/N</span>
                          </div>

                          {onSelectBooking && (
                            <button
                              type="button"
                              onClick={() => onSelectBooking(lb)}
                              className="w-full py-1.5 px-2.5 bg-slate-50 hover:bg-teal-50 text-teal-800 hover:text-teal-900 border border-slate-200 hover:border-teal-300 rounded-lg text-xs font-bold transition-colors cursor-pointer text-center"
                            >
                              Switch to Room {lbRoom?.number || lb.roomId} &rarr;
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Tab 4: Documents (Crucial Customer ID KYC Section) */}
          {activeTab === 'documents' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <ShieldCheck size={18} className="text-teal-700" />
                    Customer ID &amp; KYC Verification Documents
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Aadhaar, Passport, Voter ID, or Driving License proofs saved for guest check-in
                  </p>
                </div>

                {onOpenCheckInIdModal && (
                  <button
                    onClick={() => onOpenCheckInIdModal(booking)}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-md text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <ShieldCheck size={14} />
                    <span>{isIdVerified ? 'Update / Re-submit ID' : 'Submit ID Proof Now'}</span>
                  </button>
                )}
              </div>

              {/* ID Summary Table */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Document Type</span>
                  <span className="font-bold text-sm text-slate-900 uppercase">
                    {idTypeName}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    ADHAR / VOTER / DL / PASSPORT
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">Document Number</span>
                  <span className="font-bold text-sm text-slate-900 font-mono">
                    {isIdVerified ? booking.guest.idDocument.idNumber : 'Pending at Check-in'}
                  </span>
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {isIdVerified ? 'Original Verified' : 'Submit at Check-in Time'}
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block mb-0.5">ID Verification Status</span>
                  {isIdVerified ? (
                    <span className="inline-flex items-center gap-1 font-bold text-emerald-700">
                      <CheckCircle2 size={14} /> Verified for Form-C
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 font-bold text-amber-800 bg-amber-100/90 px-1.5 py-0.5 rounded border border-amber-300">
                      <AlertTriangle size={13} className="text-amber-700" /> PENDING - SUBMIT AT CHECK IN TIME
                    </span>
                  )}
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    {isIdVerified ? 'Ready for police registration' : 'KYC due upon guest arrival'}
                  </span>
                </div>
              </div>

              {/* Photo Proof Previews */}
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-2">
                  ID Proof Scans &amp; Photos
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Front Image */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Front Document Scan</span>
                      {booking.guest.idDocument.frontImageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(booking.guest.idDocument.frontImageUrl || null)}
                          className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> View Full
                        </button>
                      )}
                    </div>
                    {booking.guest.idDocument.frontImageUrl ? (
                      <div 
                        className="h-44 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setLightboxImage(booking.guest.idDocument.frontImageUrl || null)}
                      >
                        <img
                          src={booking.guest.idDocument.frontImageUrl}
                          alt="Customer ID Front"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-slate-100/80 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center text-xs text-slate-400">
                        <FileText size={24} className="mb-1 text-slate-300" />
                        <span>No front photo uploaded</span>
                        <span className="text-[10px] text-slate-400 mt-1">Submitted upon arrival at check-in</span>
                      </div>
                    )}
                  </div>

                  {/* Back Image */}
                  <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/50">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-slate-700">Back Document Scan</span>
                      {booking.guest.idDocument.backImageUrl && (
                        <button
                          type="button"
                          onClick={() => setLightboxImage(booking.guest.idDocument.backImageUrl || null)}
                          className="text-xs text-teal-700 hover:text-teal-900 font-bold flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> View Full
                        </button>
                      )}
                    </div>
                    {booking.guest.idDocument.backImageUrl ? (
                      <div 
                        className="h-44 bg-white rounded-lg border border-slate-200 overflow-hidden flex items-center justify-center cursor-pointer hover:opacity-95 transition-opacity"
                        onClick={() => setLightboxImage(booking.guest.idDocument.backImageUrl || null)}
                      >
                        <img
                          src={booking.guest.idDocument.backImageUrl}
                          alt="Customer ID Back"
                          className="max-h-full max-w-full object-contain"
                        />
                      </div>
                    ) : (
                      <div className="h-44 bg-slate-100/80 rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-4 text-center text-xs text-slate-400">
                        <FileText size={24} className="mb-1 text-slate-300" />
                        <span>No back photo uploaded</span>
                        <span className="text-[10px] text-slate-400 mt-1">Optional address proof</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Tab 5: Payments */}
          {activeTab === 'payments' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <CreditCard size={18} className="text-teal-700" />
                    Guest Folio &amp; Payment Transactions
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Record advance, card, UPI, cash, or OTA VCC payments
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    id="btn-payments-send-whatsapp"
                    onClick={() => {
                      setWhatsAppRecipientPhone(booking.guest.phone || '');
                      setWhatsAppMessageType('invoice');
                      setIsWhatsAppModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-md text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5"
                    title="Send Invoice to Guest via WhatsApp"
                  >
                    <MessageCircle size={13} />
                    <span>Send via WhatsApp</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onPrintInvoice(booking, 'invoice')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-md text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1.5 border border-slate-300"
                    title="Print or Dispatch Invoice"
                  >
                    <Send size={13} className="text-slate-600" />
                    <span>Send / Print Invoice</span>
                  </button>

                  <button
                    onClick={() => setShowAddPaymentRow(prev => !prev)}
                    className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white font-bold rounded-md text-xs transition-colors cursor-pointer shadow-2xs flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>Record Payment</span>
                  </button>
                </div>
              </div>

              {/* Folio Billing Summary Bar with Discount & 5% GST */}
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="font-bold text-slate-800 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Tag size={13} className="text-teal-700" />
                    Guest Folio Billing Summary
                  </span>
                  <button
                    type="button"
                    onClick={() => onEdit(booking)}
                    className="text-[11px] font-bold text-teal-700 hover:text-teal-900 flex items-center gap-1 hover:underline cursor-pointer"
                  >
                    <Edit3 size={11} />
                    <span>Edit Tariff / Discount</span>
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Room Tariff:</span>
                    <span className="font-semibold text-slate-900 font-mono">₹{roomTotal.toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Discount Concession:</span>
                    <span className={`font-semibold font-mono ${discountTotal > 0 ? 'text-emerald-700 font-bold' : 'text-slate-400'}`}>
                      {discountTotal > 0 ? `-₹${discountTotal.toLocaleString()}` : '₹0 (None)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">GST:</span>
                    <span className="font-semibold text-slate-900 font-mono">
                      {isGstApplied ? `₹${taxes.toLocaleString()} (5%)` : '₹0 (0% Optional)'}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Folio Net Total:</span>
                    <span className="font-bold text-slate-950 font-mono">₹{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Record Payment Inline Form */}
              {showAddPaymentRow && (
                <form onSubmit={handleRecordPaymentSubmit} className="p-4 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
                  <span className="text-xs font-bold text-teal-900 block">Add Payment to Booking Folio</span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Amount (₹) *</label>
                      <input
                        type="number"
                        min="1"
                        max={balanceDue > 0 ? balanceDue : 50000}
                        value={paymentAmount || ''}
                        onChange={(e) => setPaymentAmount(Number(e.target.value))}
                        placeholder={`Balance: ₹${balanceDue}`}
                        className="w-full text-xs font-bold font-mono bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Payment Method</label>
                      <select
                        value={paymentMode}
                        onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                        className="w-full text-xs font-medium bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="upi">UPI / QR Code</option>
                        <option value="cash">Cash at Front Desk</option>
                        <option value="card">Credit / Debit Card</option>
                        <option value="ota_virtual_card">OTA Virtual Card (VCC)</option>
                        <option value="bank_transfer">Bank NEFT / IMPS</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Transaction Ref / Note</label>
                      <input
                        type="text"
                        value={paymentRef}
                        onChange={(e) => setPaymentRef(e.target.value)}
                        placeholder="e.g. UPI-982138"
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowAddPaymentRow(false)}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 text-xs font-semibold rounded-md cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-md cursor-pointer"
                    >
                      Save Payment
                    </button>
                  </div>
                </form>
              )}

              {/* Transactions list */}
              <div className="border border-slate-200 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100/75 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Date &amp; Time</th>
                      <th className="p-3">Mode</th>
                      <th className="p-3">Reference</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {booking.payments.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-slate-400 italic">
                          No payments recorded yet. Balance is pending.
                        </td>
                      </tr>
                    ) : (
                      booking.payments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50">
                          <td className="p-3 text-slate-700">{p.date}</td>
                          <td className="p-3 font-semibold uppercase text-slate-800">{p.mode.replace(/_/g, ' ')}</td>
                          <td className="p-3 text-slate-500 font-mono">{p.reference || '-'}</td>
                          <td className="p-3 text-right font-mono font-bold text-emerald-700">₹{p.amount}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot className="bg-slate-50 border-t border-slate-200 font-bold">
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-700">Total Collected</td>
                      <td className="p-3 text-right font-mono text-emerald-800">₹{totalPaid}</td>
                    </tr>
                    <tr>
                      <td colSpan={3} className="p-3 text-slate-700">Outstanding Balance Due</td>
                      <td className={`p-3 text-right font-mono ${balanceDue > 0 ? 'text-amber-700' : 'text-slate-500'}`}>
                        ₹{balanceDue}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}

          {/* Tab 6: Commission (OTA Channel breakdown) */}
          {activeTab === 'commission' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Zap size={18} className="text-teal-700" />
                    OTA Channel Commission &amp; Net Payout
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Automated revenue split for channel distribution
                  </p>
                </div>
                <span className="px-3 py-1 bg-slate-100 text-slate-800 font-bold text-xs rounded-md uppercase">
                  {getChannelDisplayName(booking.channel)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block mb-1">Gross Booking Amount</span>
                  <span className="text-lg font-black text-slate-900 font-mono">₹{grandTotal}</span>
                  <span className="text-[10px] text-slate-400 block mt-1">Paid by guest via {getChannelDisplayName(booking.channel)}</span>
                </div>

                <div className="p-4 bg-rose-50 rounded-xl border border-rose-200">
                  <span className="text-rose-700 block mb-1">Channel Commission ({commissionPercent}%)</span>
                  <span className="text-lg font-black text-rose-700 font-mono">-₹{commissionAmount}</span>
                  <span className="text-[10px] text-rose-600 block mt-1">Agreed contract commission rate</span>
                </div>

                <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-200">
                  <span className="text-emerald-700 block mb-1">Net Payable to Hotel</span>
                  <span className="text-lg font-black text-emerald-800 font-mono">₹{netHotelPayout}</span>
                  <span className="text-[10px] text-emerald-600 block mt-1">Direct remittance / VCC payment</span>
                </div>
              </div>
            </div>
          )}

          {/* Tab 7: Addons (Extra services & food) */}
          {activeTab === 'addons' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                    <Package size={18} className="text-teal-700" />
                    Addons, Meals &amp; Room Services
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Extra charges added to guest folio during stay
                  </p>
                </div>
              </div>

              {booking.extraCharges.length === 0 ? (
                <div className="p-6 text-center text-slate-400 text-xs italic bg-slate-50 rounded-xl border border-slate-200">
                  No extra services or addons billed yet.
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {booking.extraCharges.map((charge) => (
                    <div key={charge.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50">
                      <div>
                        <span className="font-bold text-slate-900 block">{charge.title}</span>
                        <span className="text-[11px] text-slate-500">{charge.date}</span>
                      </div>
                      <span className="font-mono font-bold text-slate-800">₹{charge.amount}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Tab 8: Comments (Staff Notes & Guest Requests) */}
          {activeTab === 'comments' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <MessageSquare size={18} className="text-teal-700" />
                  Staff Internal Comments &amp; Guest Requests
                </h3>
              </div>

              {/* Comments list */}
              <div className="space-y-3">
                {localComments.map((c) => (
                  <div key={c.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-slate-900">{c.author}</span>
                      <span className="text-[11px] text-slate-400 flex items-center gap-1">
                        <Clock size={11} /> {c.time}
                      </span>
                    </div>
                    <p className="text-slate-700 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              </div>

              {/* Add comment form */}
              <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Type an internal note for front desk or housekeeping..."
                  className="flex-1 text-xs bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-teal-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white font-bold text-xs rounded-lg transition-colors cursor-pointer shrink-0"
                >
                  Post Note
                </button>
              </form>
            </div>
          )}

          {/* Tab 9: Logs (Audit trail & events) */}
          {activeTab === 'logs' && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 shadow-2xs space-y-4">
              <div className="border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                  <ClipboardList size={18} className="text-teal-700" />
                  System Logs &amp; Audit Trail
                </h3>
              </div>

              <div className="space-y-2 text-xs">
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Booking Created &amp; Confirmed</span>
                    <span className="text-[11px] text-slate-500">Source: {getChannelDisplayName(booking.channel)} Engine</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{booking.createdAt}</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Customer ID KYC Status</span>
                    <span className="text-[11px] text-slate-500">
                      {isIdVerified ? 'Document verified for Form C police reporting' : 'Customer ID pending submission at check-in'}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">
                    {booking.guest.idDocument.uploadedAt || 'Check-in'}
                  </span>
                </div>

                {booking.payments.map((p) => (
                  <div key={p.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-start justify-between">
                    <div>
                      <span className="font-bold text-emerald-800 block">Payment Received: ₹{p.amount}</span>
                      <span className="text-[11px] text-slate-500">Mode: {p.mode.toUpperCase()} &bull; Ref: {p.reference || 'N/A'}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">{p.date}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* WhatsApp Quick Dispatch Modal */}
      {isWhatsAppModalOpen && (
        <div 
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
          onClick={() => setIsWhatsAppModalOpen(false)}
        >
          <div 
            className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-800 to-teal-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
                  <MessageCircle size={20} className="text-emerald-300" />
                </div>
                <div>
                  <h4 className="font-bold text-sm tracking-tight">Send via WhatsApp</h4>
                  <p className="text-[11px] text-emerald-200">Message guest booking confirmation or tax invoice</p>
                </div>
              </div>
              <button 
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="text-white/70 hover:text-white text-xs bg-white/10 hover:bg-white/20 p-1.5 rounded-lg transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              {whatsAppSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 font-semibold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{whatsAppSuccessToast}</span>
                </div>
              )}

              {/* Message Type Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Select WhatsApp Message Type:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWhatsAppMessageType('confirmation')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      whatsAppMessageType === 'confirmation'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <FileText size={16} className={whatsAppMessageType === 'confirmation' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div>
                      <div className="text-xs">Booking Voucher</div>
                      <div className="text-[10px] text-slate-500 font-normal">Check-in, room &amp; payment</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWhatsAppMessageType('invoice')}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                      whatsAppMessageType === 'invoice'
                        ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 text-emerald-950 font-bold'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <CreditCard size={16} className={whatsAppMessageType === 'invoice' ? 'text-emerald-700' : 'text-slate-400'} />
                    <div>
                      <div className="text-xs">Tax Invoice / Folio</div>
                      <div className="text-[10px] text-slate-500 font-normal">GST breakdown &amp; balance</div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Guest Phone Field */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Guest WhatsApp Mobile Number:</span>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                    Auto-Formatted
                  </span>
                </label>
                <div className="relative">
                  <Phone size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    type="tel"
                    value={whatsAppRecipientPhone}
                    onChange={(e) => setWhatsAppRecipientPhone(e.target.value)}
                    placeholder="+91 96481 33671"
                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono font-medium focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-hidden"
                  />
                </div>
              </div>

              {/* Live Preview of formatted message */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-bold text-slate-700">Live WhatsApp Message Preview:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(whatsAppPreviewText);
                      setWhatsAppCopied(true);
                      setTimeout(() => setWhatsAppCopied(false), 2000);
                    }}
                    className="text-[11px] text-emerald-700 hover:text-emerald-800 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    {whatsAppCopied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                    <span>{whatsAppCopied ? 'Copied!' : 'Copy Text'}</span>
                  </button>
                </div>
                <div className="bg-slate-900 text-slate-100 p-3 rounded-xl font-mono text-[11px] leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto border border-slate-800 select-text">
                  {whatsAppPreviewText}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsWhatsAppModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-send-whatsapp"
                type="button"
                onClick={handleDispatchWhatsApp}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <MessageCircle size={15} />
                <span>Open in WhatsApp &amp; Send</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Shift Room Interactive Modal ("action button me check in check out sift room add karo") */}
      {isShiftRoomModalOpen && (
        <div 
          className="fixed inset-0 z-60 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          onClick={() => setIsShiftRoomModalOpen(false)}
        >
          <div 
            className="relative w-full max-w-xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-900 to-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-600/30 border border-teal-400/30 flex items-center justify-center text-teal-300">
                  <ArrowRightLeft size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-base sm:text-lg tracking-tight flex items-center gap-2">
                    Shift Room / Transfer
                    <span className="text-xs bg-teal-700/80 text-teal-200 px-2 py-0.5 rounded-full font-normal">
                      कमरा बदलें
                    </span>
                  </h3>
                  <p className="text-xs text-slate-300 mt-0.5">
                    Move <strong className="text-white">{booking.guest.fullName}</strong> to another room
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsShiftRoomModalOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 max-h-[75vh] overflow-y-auto">
              {shiftSuccessToast && (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center gap-2 text-xs font-bold text-emerald-900 animate-in fade-in-50">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>{shiftSuccessToast}</span>
                </div>
              )}

              {/* Current Room Summary */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400 block">
                    Current Allocated Room
                  </span>
                  <div className="text-base font-black text-slate-900 font-mono mt-0.5">
                    Room {room?.number || booking.roomNumber}
                    <span className="text-xs font-semibold text-slate-600 font-sans ml-2">
                      ({room?.type || 'Standard'}, Floor {room?.floor || 1})
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    {formatTripmakerzDate(booking.checkInDate)} &rarr; {formatTripmakerzDate(booking.checkOutDate)} ({booking.nights} Nights) &bull; ₹{booking.roomRatePerNight}/night
                  </div>
                </div>

                <div className="shrink-0 text-right">
                  <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-200 text-slate-700">
                    Current
                  </span>
                </div>
              </div>

              {/* Available Target Rooms Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Select Destination Room:</span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    {rooms.filter(r => r.id !== booking.roomId).length} other rooms available
                  </span>
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
                  {rooms
                    .filter(r => r.id !== booking.roomId)
                    .map((targetR) => {
                      const isSelected = shiftSelectedRoomId === targetR.id;
                      const rateDiff = targetR.baseRate - booking.roomRatePerNight;

                      return (
                        <div
                          key={targetR.id}
                          onClick={() => setShiftSelectedRoomId(targetR.id)}
                          className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                            isSelected
                              ? 'bg-teal-50/80 border-teal-600 ring-2 ring-teal-500/20 shadow-xs'
                              : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-black text-sm text-slate-900">
                                Room {targetR.number}
                              </span>
                              <span className="text-[10px] text-slate-500 font-medium">
                                (Fl {targetR.floor})
                              </span>
                            </div>

                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded ${
                              targetR.status === 'clean' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : targetR.status === 'dirty' 
                                  ? 'bg-amber-100 text-amber-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {targetR.status}
                            </span>
                          </div>

                          <div className="text-xs font-medium text-slate-700 mt-1 truncate" title={targetR.type}>
                            {targetR.type}
                          </div>

                          <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-100 text-[11px]">
                            <span className="font-bold text-slate-900 font-mono">₹{targetR.baseRate}/n</span>
                            <span className={`text-[10px] font-semibold ${
                              rateDiff === 0 
                                ? 'text-slate-500' 
                                : rateDiff > 0 
                                  ? 'text-emerald-700 font-bold' 
                                  : 'text-blue-700'
                            }`}>
                              {rateDiff === 0 
                                ? 'Same tariff' 
                                : rateDiff > 0 
                                  ? `+₹${rateDiff}/n Upgrade` 
                                  : `-₹${Math.abs(rateDiff)}/n`}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {/* Reason for Shift */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Reason for Room Shift / Transfer:
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    'Guest Request / Room Upgrade',
                    'AC / Maintenance Issue',
                    'Quiet Room / Floor Preference',
                    'Cleanliness / Hygiene',
                    'Front Desk Operational Shift',
                    'Extended Stay Transfer'
                  ].map((reason) => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setShiftReasonCategory(reason)}
                      className={`px-2.5 py-1 text-xs rounded-lg border transition-all cursor-pointer font-medium ${
                        shiftReasonCategory === reason
                          ? 'bg-teal-800 text-white border-teal-800 font-bold shadow-2xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      {reason}
                    </button>
                  ))}
                </div>

                <input
                  type="text"
                  placeholder="Optional remarks (e.g., Guest requested sea/garden view on 2nd floor)..."
                  value={shiftCustomReason}
                  onChange={(e) => setShiftCustomReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs focus:bg-white focus:ring-2 focus:ring-teal-500 outline-hidden"
                />
              </div>

              {/* Housekeeping Checkbox */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl">
                <label className="flex items-start gap-2 text-xs text-amber-950 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={shiftMarkDirty}
                    onChange={(e) => setShiftMarkDirty(e.target.checked)}
                    className="mt-0.5 rounded text-teal-800 focus:ring-teal-500 cursor-pointer"
                  />
                  <span>
                    <strong>Mark previous room ({room?.number || booking.roomNumber}) as Dirty:</strong> Schedule immediate housekeeping sanitize so front desk knows room requires cleaning.
                  </span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsShiftRoomModalOpen(false)}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>

              <button
                id="btn-confirm-shift-room"
                type="button"
                onClick={handleConfirmShiftRoom}
                disabled={!shiftSelectedRoomId}
                className="px-5 py-2.5 bg-teal-800 hover:bg-teal-900 disabled:opacity-50 text-white rounded-lg text-xs font-bold shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer"
              >
                <ArrowRightLeft size={14} />
                <span>Confirm Room Shift (कमरा बदलें)</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lightbox for Document Previews */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setLightboxImage(null)}
        >
          <div 
            className="relative max-w-2xl w-full bg-white rounded-2xl p-2 shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setLightboxImage(null)}
              className="absolute top-4 right-4 p-2 bg-slate-900/70 hover:bg-slate-900 text-white rounded-full transition-colors cursor-pointer"
            >
              <X size={18} />
            </button>
            <img 
              src={lightboxImage} 
              alt="Document Full View" 
              className="w-full h-auto max-h-[80vh] object-contain rounded-xl"
            />
          </div>
        </div>
      )}
    </div>
  );
};
