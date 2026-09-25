import { Booking, Room, HotelProfile } from '../types';

/**
 * Sanitizes phone number for WhatsApp API link.
 * Cleans non-digits and standardizes 10-digit numbers to include India country code (91).
 */
export const cleanPhoneNumber = (phone?: string): string => {
  if (!phone) return '';
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  if (!digitsOnly) return '';

  // If 10 digits (standard Indian mobile without country code), prepend 91
  if (digitsOnly.length === 10) {
    return `91${digitsOnly}`;
  }

  // If 11 digits starting with 0, replace leading 0 with 91
  if (digitsOnly.length === 11 && digitsOnly.startsWith('0')) {
    return `91${digitsOnly.slice(1)}`;
  }

  return digitsOnly;
};

export interface WhatsAppFormatOptions {
  hotelProfile?: Partial<HotelProfile>;
  hotelName?: string;
  room?: Room;
  roomType?: string;
}

/**
 * Formats a comprehensive, branded booking confirmation voucher message for WhatsApp.
 */
export const formatBookingConfirmationWhatsAppMessage = (
  booking: Booking,
  options?: WhatsAppFormatOptions
): string => {
  const hotelName = options?.hotelProfile?.name || options?.hotelName || 'Hotel';
  const hotelAddress = [options?.hotelProfile?.address, options?.hotelProfile?.city].filter(Boolean).join(', ') || options?.hotelName || 'Hotel Front Desk';
  const hotelPhone = options?.hotelProfile?.phone || '';
  const roomLabel = options?.room 
    ? `${options.room.name} (${options.room.type})` 
    : options?.roomType || 'Standard / Executive Room';

  const roomTotal = booking.nights * booking.roomRatePerNight;
  const discountTotal = booking.discountAmount || 0;
  const taxableRoomTotal = Math.max(0, roomTotal - discountTotal);
  const extraTotal = (booking.extraCharges || []).reduce((acc, c) => acc + c.amount, 0);
  const subtotal = taxableRoomTotal + extraTotal;
  const gstRate = booking.taxRatePercent !== undefined ? booking.taxRatePercent : 5;
  const isGstApplied = gstRate > 0;
  const taxes = isGstApplied ? Math.round((subtotal * gstRate) / 100) : 0;
  const grandTotal = subtotal + taxes;
  const totalPaid = (booking.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const checkInTime = options?.hotelProfile?.checkInTime || '12:00 PM';
  const checkOutTime = options?.hotelProfile?.checkOutTime || '11:00 AM';

  const discountText = discountTotal > 0
    ? `• Discount Applied: -₹${discountTotal.toLocaleString()} (${booking.discountReason || (booking.discountType === 'percentage' ? `${booking.discountValue}% Off` : 'Special Concession')})\n`
    : '';

  const gstText = isGstApplied
    ? `• GST (5%): ₹${taxes.toLocaleString()}\n`
    : '• GST: ₹0 (Non-GST / Exempt)\n';

  return (
`🏨 *${hotelName.toUpperCase()} - OFFICIAL BOOKING CONFIRMATION*
------------------------------------------------
Dear *${booking.guest.fullName}*,
Greetings from *${hotelName}*! Your reservation has been successfully confirmed.

🔖 *Booking Reference:* #${booking.bookingCode}
📅 *Check-In:* ${booking.checkInDate} (From ${checkInTime})
📅 *Check-Out:* ${booking.checkOutDate} (By ${checkOutTime})
⏳ *Duration:* ${booking.nights} Night${booking.nights > 1 ? 's' : ''}
🛏️ *Reserved Room:* ${roomLabel}
👥 *Guests:* ${booking.adults} Adults${booking.children ? `, ${booking.children} Children` : ''}

💰 *PAYMENT & TARIFF SUMMARY:*
• Accommodation Tariff: ₹${roomTotal.toLocaleString()}
${discountText}${gstText}• Total Booking Amount: ₹${grandTotal.toLocaleString()}
• Advance Received: ₹${totalPaid.toLocaleString()}
• Balance at Check-In: ₹${balanceDue.toLocaleString()} ${balanceDue === 0 ? '✅ (Fully Paid)' : ''}

📍 *Hotel Location:* ${hotelAddress}
📞 *Front Desk / Reception:* ${hotelPhone}

_Please carry a valid Government Photo ID (Aadhaar / Voter ID / Passport / DL) for all staying guests during check-in._

Thank you for choosing *${hotelName}*! We look forward to welcoming you.`
  );
};

/**
 * Formats a complete Tax Invoice & Guest Folio breakdown for WhatsApp.
 */
export const formatInvoiceWhatsAppMessage = (
  booking: Booking,
  options?: WhatsAppFormatOptions
): string => {
  const hotelName = options?.hotelProfile?.name || options?.hotelName || 'Hotel';
  const hotelAddress = [options?.hotelProfile?.address, options?.hotelProfile?.city].filter(Boolean).join(', ') || options?.hotelName || 'Hotel Front Desk';
  const hotelPhone = options?.hotelProfile?.phone || '';
  const gstin = options?.hotelProfile?.gstin ? ` | GSTIN: ${options.hotelProfile.gstin}` : '';
  const roomLabel = options?.room 
    ? `${options.room.name} (${options.room.type})` 
    : options?.roomType || 'Standard Room';

  const roomTotal = booking.nights * booking.roomRatePerNight;
  const discountTotal = booking.discountAmount || 0;
  const taxableRoomTotal = Math.max(0, roomTotal - discountTotal);
  const extraTotal = (booking.extraCharges || []).reduce((acc, c) => acc + c.amount, 0);
  const subtotal = taxableRoomTotal + extraTotal;
  const gstRate = booking.taxRatePercent !== undefined ? booking.taxRatePercent : 5;
  const isGstApplied = gstRate > 0;
  const taxes = isGstApplied ? Math.round((subtotal * gstRate) / 100) : 0;
  const grandTotal = subtotal + taxes;
  const totalPaid = (booking.payments || []).reduce((acc, p) => acc + p.amount, 0);
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const discountText = discountTotal > 0
    ? `• Less Discount: -₹${discountTotal.toLocaleString()} (${booking.discountReason || (booking.discountType === 'percentage' ? `${booking.discountValue}% Off` : 'Special Concession')})\n`
    : '';

  const extraChargesText = (booking.extraCharges || []).length > 0
    ? booking.extraCharges.map(c => `• ${c.description || 'Addon Charge'}: ₹${c.amount.toLocaleString()}`).join('\n')
    : null;

  const gstLine = isGstApplied
    ? `• GST (5% - 2.5% CGST + 2.5% SGST): ₹${taxes.toLocaleString()}`
    : '• GST: ₹0 (Non-GST / Exempt)';

  return (
`🧾 *TAX INVOICE & FOLIO SUMMARY*
*${hotelName.toUpperCase()}*
${hotelAddress}
Phone: ${hotelPhone}${gstin}
------------------------------------------------
*Guest Name:* ${booking.guest.fullName}
*Invoice / Booking Ref:* #${booking.bookingCode}
*Stay Dates:* ${booking.checkInDate} to ${booking.checkOutDate} (${booking.nights} Night${booking.nights > 1 ? 's' : ''})
*Room Category:* ${roomLabel}

💳 *CHARGES BREAKDOWN:*
• Room Tariff (${booking.nights}N @ ₹${booking.roomRatePerNight.toLocaleString()}): ₹${roomTotal.toLocaleString()}
${discountText}${extraChargesText ? `${extraChargesText}\n` : ''}${gstLine}
------------------------------------------------
*Grand Total:* ₹${grandTotal.toLocaleString()}
*Total Amount Paid:* ₹${totalPaid.toLocaleString()}
*Balance Due:* ₹${balanceDue.toLocaleString()} ${balanceDue === 0 ? '✅ (Paid in Full)' : '⚠️ (Pending)'}
------------------------------------------------
_Thank you for staying at ${hotelName}! For any billing inquiries or assistance, please contact ${hotelPhone}._`
  );
};

/**
 * Generates an official WhatsApp API link with pre-filled text and destination phone number.
 */
export const generateWhatsAppApiLink = (phone?: string, message?: string): string => {
  const cleanPhone = cleanPhoneNumber(phone);
  const encodedText = encodeURIComponent(message || '');

  if (cleanPhone) {
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedText}`;
  }
  return `https://api.whatsapp.com/send?text=${encodedText}`;
};

/**
 * Helper to directly trigger WhatsApp dispatch in a new browser tab/app window.
 */
export const openWhatsAppMessage = (phone?: string, message?: string): void => {
  const link = generateWhatsAppApiLink(phone, message);
  window.open(link, '_blank');
};
