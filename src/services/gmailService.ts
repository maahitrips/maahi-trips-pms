import { Booking, HotelProfile, Room } from '../types';

export interface GmailMessageSummary {
  id: string;
  threadId: string;
  snippet: string;
  subject: string;
  from: string;
  fromName: string;
  fromEmail: string;
  to: string;
  date: string;
  labelIds: string[];
  isUnread: boolean;
  isImportant?: boolean;
}

export interface EmailPayload {
  to: string;
  subject: string;
  bodyText: string;
  bodyHtml?: string;
}

// Fetch list of Gmail messages for the hotel account
export const fetchGmailMessages = async (
  accessToken: string,
  maxResults: number = 25,
  query: string = ''
): Promise<GmailMessageSummary[]> => {
  const qParam = query ? `&q=${encodeURIComponent(query)}` : '';
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?maxResults=${maxResults}${qParam}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gmail API error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  if (!data.messages || !Array.isArray(data.messages)) {
    return [];
  }

  // Fetch metadata details for the messages in parallel (chunked)
  const detailPromises = data.messages.slice(0, 15).map(async (msg: { id: string; threadId: string }) => {
    try {
      const detailRes = await fetch(
        `https://gmail.googleapis.com/gmail/v1/users/me/messages/${msg.id}?format=metadata&metadataHeaders=Subject&metadataHeaders=From&metadataHeaders=To&metadataHeaders=Date`,
        {
          headers: { Authorization: `Bearer ${accessToken}` }
        }
      );
      if (!detailRes.ok) return null;
      const detail = await detailRes.json();

      const headers = detail.payload?.headers || [];
      const getHeader = (name: string) => {
        const found = headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase());
        return found ? found.value : '';
      };

      const rawFrom = getHeader('From');
      let fromName = rawFrom;
      let fromEmail = rawFrom;
      const match = rawFrom.match(/(.*)<(.+)>/);
      if (match) {
        fromName = match[1].trim().replace(/^"|"$/g, '');
        fromEmail = match[2].trim();
      }

      return {
        id: detail.id,
        threadId: detail.threadId,
        snippet: detail.snippet || '',
        subject: getHeader('Subject') || '(No Subject)',
        from: rawFrom,
        fromName: fromName || rawFrom,
        fromEmail: fromEmail || rawFrom,
        to: getHeader('To'),
        date: getHeader('Date'),
        labelIds: detail.labelIds || [],
        isUnread: (detail.labelIds || []).includes('UNREAD'),
        isImportant: (detail.labelIds || []).includes('IMPORTANT')
      } as GmailMessageSummary;
    } catch (e) {
      console.warn(`Error fetching details for msg ${msg.id}:`, e);
      return null;
    }
  });

  const results = await Promise.all(detailPromises);
  return results.filter((item): item is GmailMessageSummary => item !== null);
};

// Send email via Gmail API
export const sendGmailEmail = async (
  accessToken: string,
  payload: EmailPayload
): Promise<{ id: string; threadId: string }> => {
  // Construct RFC 2822 MIME message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(payload.subject)))}?=`;
  const messageParts = [
    `To: ${payload.to}`,
    `Subject: ${utf8Subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=utf-8',
    '',
    payload.bodyHtml || payload.bodyText.replace(/\n/g, '<br/>')
  ];

  const rawMessage = messageParts.join('\r\n');
  
  // Safe Base64URL encoding (RFC 4648)
  const encodedEmail = btoa(unescape(encodeURIComponent(rawMessage)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      raw: encodedEmail
    })
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error?.message || `Failed to send email (${response.status})`);
  }

  return await response.json();
};

// Hotel Email Template Generators
export const generateBookingConfirmationEmail = (
  booking: Booking,
  hotel: HotelProfile,
  room?: Room
): { subject: string; bodyHtml: string; bodyText: string } => {
  const roomName = room ? `${room.name} (${room.type})` : 'Deluxe Room';
  const roomTariff = booking.nights * booking.roomRatePerNight;
  const discountTotal = booking.discountAmount || 0;
  const taxableRoomTariff = Math.max(0, roomTariff - discountTotal);
  const extraChargesTotal = booking.extraCharges.reduce((a, b) => a + b.amount, 0);
  const totalTaxable = taxableRoomTariff + extraChargesTotal;
  const taxes = Math.round((totalTaxable * (booking.taxRatePercent || 0)) / 100);
  const netAmount = totalTaxable + taxes;
  const paidAmount = booking.payments.reduce((a, b) => a + b.amount, 0);
  const balance = Math.max(0, netAmount - paidAmount);

  const subject = `Booking Confirmation #${booking.bookingCode} - ${hotel.name}`;

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0d9488; color: #ffffff; padding: 24px; text-align: center;">
        <h1 style="margin: 0 0 6px 0; font-size: 24px; font-weight: bold; letter-spacing: -0.5px;">${hotel.name}</h1>
        <p style="margin: 0; font-size: 14px; opacity: 0.95;">Official Reservation Confirmation Voucher</p>
      </div>

      <div style="padding: 24px;">
        <p style="font-size: 16px; margin: 0 0 16px 0;">Dear <strong>${booking.guest.fullName}</strong>,</p>
        <p style="font-size: 14px; line-height: 1.6; color: #475569; margin: 0 0 20px 0;">
          Thank you for choosing <strong>${hotel.name}</strong>. We are pleased to confirm your reservation details below:
        </p>

        <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px;">
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Booking Reference:</td>
              <td style="padding: 6px 0; font-weight: bold; font-family: monospace; color: #0d9488;">#${booking.bookingCode}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Check-In Date:</td>
              <td style="padding: 6px 0; font-weight: bold;">${booking.checkInDate} (From 12:00 PM)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Check-Out Date:</td>
              <td style="padding: 6px 0; font-weight: bold;">${booking.checkOutDate} (Till 11:00 AM)</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Room Assigned:</td>
              <td style="padding: 6px 0; font-weight: bold;">${roomName}</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Duration:</td>
              <td style="padding: 6px 0; font-weight: bold;">${booking.nights} Night(s) • ${booking.adults} Adults</td>
            </tr>
            <tr>
              <td style="padding: 6px 0; color: #64748b;">Channel / Source:</td>
              <td style="padding: 6px 0; text-transform: capitalize;">${booking.channel}</td>
            </tr>
          </table>
        </div>

        <h3 style="font-size: 15px; margin: 0 0 10px 0; color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 6px;">Payment Summary</h3>
        <table style="width: 100%; border-collapse: collapse; font-size: 14px; margin-bottom: 24px;">
          <tr>
            <td style="padding: 6px 0; color: #64748b;">Total Amount:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold;">₹${netAmount.toLocaleString()}</td>
          </tr>
          <tr>
            <td style="padding: 6px 0; color: #16a34a;">Advance Received:</td>
            <td style="padding: 6px 0; text-align: right; font-weight: bold; color: #16a34a;">₹${paidAmount.toLocaleString()}</td>
          </tr>
          <tr style="border-top: 1px dashed #cbd5e1;">
            <td style="padding: 8px 0; font-weight: bold; color: #0f172a;">Balance Payable at Check-in:</td>
            <td style="padding: 8px 0; text-align: right; font-weight: bold; font-size: 16px; color: ${balance > 0 ? '#b45309' : '#16a34a'};">
              ₹${balance.toLocaleString()} ${balance === 0 ? '(Fully Paid)' : ''}
            </td>
          </tr>
        </table>

        <div style="background-color: #f1f5f9; border-left: 4px solid #0d9488; padding: 14px; border-radius: 4px; font-size: 13px; color: #334155; margin-bottom: 24px;">
          <strong>Important Check-in Instructions:</strong><br/>
          • Please carry a government-issued photo ID (Aadhaar, Passport, Voter ID or Driving License) for all adult guests.<br/>
          • Need assistance finding the property? Call our 24/7 Front Desk at <strong>${hotel.phone}</strong>.
        </div>

        <p style="font-size: 14px; color: #475569; margin: 0 0 6px 0;">Warm regards,</p>
        <p style="font-size: 14px; font-weight: bold; color: #0f172a; margin: 0;">${hotel.name} Front Desk Team</p>
        <p style="font-size: 12px; color: #64748b; margin: 4px 0 0 0;">${hotel.address}, ${hotel.city} • Phone: ${hotel.phone}</p>
      </div>
    </div>
  `;

  const bodyText = `
Booking Confirmation #${booking.bookingCode} - ${hotel.name}
Dear ${booking.guest.fullName},

Thank you for choosing ${hotel.name}. Your booking details are:
Booking Code: #${booking.bookingCode}
Check-In: ${booking.checkInDate}
Check-Out: ${booking.checkOutDate} (${booking.nights} Nights)
Room: ${roomName}
Guests: ${booking.adults} Adults
Total Amount: ₹${netAmount}
Paid Amount: ₹${paidAmount}
Balance: ₹${balance}

Hotel Address: ${hotel.address}, ${hotel.city}
Front Desk Contact: ${hotel.phone}

We look forward to hosting you!
  `.trim();

  return { subject, bodyHtml, bodyText };
};

// Check-in Welcome & Wi-Fi Details
export const generateCheckInWelcomeEmail = (
  booking: Booking,
  hotel: HotelProfile,
  room?: Room
): { subject: string; bodyHtml: string; bodyText: string } => {
  const roomName = room ? `${room.number} (${room.type})` : 'Your Room';
  const subject = `Welcome to ${hotel.name} - Wi-Fi & Hotel Services Guide`;

  const bodyHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 620px; margin: 0 auto; color: #1e293b; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
      <h2 style="color: #0d9488; margin-top: 0;">Welcome to ${hotel.name}!</h2>
      <p>Dear <strong>${booking.guest.fullName}</strong>,</p>
      <p>We are delighted to have you stay with us in <strong>Room ${roomName}</strong>.</p>
      
      <div style="background-color: #f0fdfa; border: 1px solid #ccfbf1; padding: 16px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #115e59; font-size: 15px;">Guest Essentials:</h3>
        <ul style="margin: 0; padding-left: 20px; line-height: 1.8; font-size: 14px; color: #134e4a;">
          <li><strong>High-Speed Wi-Fi Network:</strong> ${hotel.name}_Guest</li>
          <li><strong>Wi-Fi Password:</strong> Welcome@2026</li>
          <li><strong>Breakfast Timing:</strong> 7:30 AM to 10:30 AM</li>
          <li><strong>Front Desk Dial:</strong> Dial 9 from room intercom or call ${hotel.phone}</li>
          <li><strong>Standard Check-out:</strong> 11:00 AM</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #475569;">If you require fresh linen, extra towels, room service, or travel assistance in ${hotel.city}, our front desk team is always here to assist.</p>
      
      <p style="font-size: 14px; margin-top: 24px;">Wishing you a pleasant and restful stay!<br/><strong>${hotel.name} Management</strong></p>
    </div>
  `;

  const bodyText = `
Welcome to ${hotel.name}!
Dear ${booking.guest.fullName},
We are happy to have you stay with us in Room ${roomName}.
Wi-Fi Network: ${hotel.name}_Guest
Wi-Fi Password: Welcome@2026
Breakfast: 7:30 AM to 10:30 AM
Front Desk: ${hotel.phone}
Enjoy your stay!
  `.trim();

  return { subject, bodyHtml, bodyText };
};
