import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Send, 
  RefreshCw, 
  Inbox, 
  Search, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  User as UserIcon, 
  LogOut, 
  Sparkles, 
  ShieldCheck, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Clock,
  Eye,
  Check,
  Building2,
  Paperclip
} from 'lucide-react';
import { 
  initAuth, 
  googleSignIn, 
  logoutGoogle, 
  getAccessToken, 
  getCurrentGoogleUser 
} from '../services/googleAuth';
import { 
  fetchGmailMessages, 
  sendGmailEmail, 
  generateBookingConfirmationEmail, 
  generateCheckInWelcomeEmail,
  GmailMessageSummary, 
  EmailPayload 
} from '../services/gmailService';
import { Booking, HotelProfile, Room } from '../types';

interface GmailViewProps {
  hotelProfile: HotelProfile;
  bookings: Booking[];
  rooms: Room[];
  onOpenBookingDetails?: (booking: Booking) => void;
}

export const GmailView: React.FC<GmailViewProps> = ({
  hotelProfile,
  bookings,
  rooms,
  onOpenBookingDetails
}) => {
  // Auth state
  const [googleUser, setGoogleUser] = useState<any>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Active subtab
  const [activeSubTab, setActiveSubTab] = useState<'compose' | 'inbox'>('compose');

  // Messages state
  const [messages, setMessages] = useState<GmailMessageSummary[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedMessage, setSelectedMessage] = useState<GmailMessageSummary | null>(null);

  // Composer state
  const [selectedBookingId, setSelectedBookingId] = useState<string>(bookings[0]?.id || '');
  const [templateType, setTemplateType] = useState<'confirmation' | 'welcome' | 'custom'>('confirmation');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [emailSubject, setEmailSubject] = useState<string>('');
  const [emailBody, setEmailBody] = useState<string>('');
  const [emailHtml, setEmailHtml] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [sendSuccessMsg, setSentSuccessMsg] = useState<string | null>(null);

  // Mandatory Destructive / Send Confirmation Dialog State
  const [confirmSendModal, setConfirmSendModal] = useState<{
    isOpen: boolean;
    payload: EmailPayload | null;
  }>({
    isOpen: false,
    payload: null
  });

  // Initial Auth Check
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        setGoogleUser(user);
        setAccessToken(token);
      },
      () => {
        // Not authenticated
        setAccessToken(null);
      }
    );

    const currentUser = getCurrentGoogleUser();
    if (currentUser) {
      setGoogleUser(currentUser);
      getAccessToken().then(tok => setAccessToken(tok));
    }

    return () => unsubscribe();
  }, []);

  // Handle Google Sign-in
  const handleSignIn = async () => {
    setIsAuthenticating(true);
    setAuthError(null);
    try {
      const result = await googleSignIn();
      if (result) {
        setGoogleUser(result.user);
        setAccessToken(result.accessToken);
        setSentSuccessMsg(`Connected successfully with ${result.user.email}`);
        setTimeout(() => setSentSuccessMsg(null), 4000);
      }
    } catch (err: any) {
      console.error('Sign-in failed:', err);
      setAuthError(err.message || 'Google Sign-in was cancelled or encountered an issue.');
    } finally {
      setIsAuthenticating(false);
    }
  };

  // Handle Disconnect
  const handleLogout = async () => {
    await logoutGoogle();
    setGoogleUser(null);
    setAccessToken(null);
    setMessages([]);
    setSelectedMessage(null);
  };

  // Populate template when booking or templateType changes
  useEffect(() => {
    const booking = bookings.find(b => b.id === selectedBookingId) || bookings[0];
    if (!booking) return;

    const room = rooms.find(r => r.id === booking.roomId);
    setRecipientEmail(booking.guest.email || 'guest@example.com');

    if (templateType === 'confirmation') {
      const template = generateBookingConfirmationEmail(booking, hotelProfile, room);
      setEmailSubject(template.subject);
      setEmailBody(template.bodyText);
      setEmailHtml(template.bodyHtml);
    } else if (templateType === 'welcome') {
      const template = generateCheckInWelcomeEmail(booking, hotelProfile, room);
      setEmailSubject(template.subject);
      setEmailBody(template.bodyText);
      setEmailHtml(template.bodyHtml);
    } else {
      setEmailSubject(`Information from ${hotelProfile.name} - Reservation #${booking.bookingCode}`);
      setEmailBody(`Dear ${booking.guest.fullName},\n\nWe hope this email finds you well.\n\nWarm regards,\n${hotelProfile.name} Front Desk`);
      setEmailHtml('');
    }
  }, [selectedBookingId, templateType, hotelProfile, bookings, rooms]);

  // Load Messages from Gmail API
  const loadMessages = async () => {
    if (!accessToken) return;
    setIsLoadingMessages(true);
    try {
      const fetched = await fetchGmailMessages(accessToken, 20, searchQuery);
      setMessages(fetched);
    } catch (err: any) {
      console.error('Failed to load Gmail messages:', err);
    } finally {
      setIsLoadingMessages(false);
    }
  };

  // Fetch when accessToken changes or user clicks Inbox
  useEffect(() => {
    if (accessToken && activeSubTab === 'inbox') {
      loadMessages();
    }
  }, [accessToken, activeSubTab]);

  // Prompt Confirmation modal before sending (MANDATORY per skill)
  const handleInitiateSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipientEmail || !emailSubject) {
      alert('Please provide recipient email and subject.');
      return;
    }

    setConfirmSendModal({
      isOpen: true,
      payload: {
        to: recipientEmail,
        subject: emailSubject,
        bodyText: emailBody,
        bodyHtml: emailHtml
      }
    });
  };

  // Execute Send after User explicitly confirms in modal
  const handleConfirmSend = async () => {
    if (!confirmSendModal.payload) return;

    if (!accessToken) {
      alert('Please connect your hotel Google account first using "Sign in with Google".');
      setConfirmSendModal({ isOpen: false, payload: null });
      return;
    }

    setIsSending(true);
    try {
      await sendGmailEmail(accessToken, confirmSendModal.payload);
      setSentSuccessMsg(`Email dispatched successfully to ${confirmSendModal.payload.to} via Gmail!`);
      setConfirmSendModal({ isOpen: false, payload: null });
      setTimeout(() => setSentSuccessMsg(null), 5000);
    } catch (err: any) {
      console.error('Send error:', err);
      alert(`Could not send email: ${err.message || 'Please check Gmail permissions'}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      {/* Top Banner Explaining "Gmail Se Kya Hoga" */}
      <div className="bg-linear-to-r from-slate-900 via-teal-950 to-slate-900 text-white rounded-2xl p-5 border border-teal-800/40 shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-teal-400 font-bold text-xs uppercase tracking-wider mb-1">
              <Sparkles size={14} />
              <span>Official Google Workspace Integration</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Gmail Hotel Communication Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mt-1 leading-relaxed">
              <strong>Gmail se kya hoga?</strong> Aapke hotel ka direct Gmail account connect karke aap guests ko 
              <strong> 1-Click Booking Confirmation Vouchers</strong>, <strong>Check-in Welcome Guides</strong>, 
              <strong>GST Folios</strong> bhej sakte hain aur OTAs (MakeMyTrip, Agoda, Booking.com) ke email alerts yahi se track kar sakte hain.
            </p>
          </div>

          {/* Account Card / Google Sign In Button */}
          <div className="shrink-0 flex flex-col items-start sm:items-end gap-2 bg-slate-800/60 p-3 rounded-xl border border-slate-700/60">
            {googleUser && accessToken ? (
              <div className="flex items-center gap-3">
                {googleUser.photoURL ? (
                  <img 
                    src={googleUser.photoURL} 
                    alt={googleUser.displayName || 'Google User'} 
                    className="w-9 h-9 rounded-full ring-2 ring-teal-500"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-teal-600 flex items-center justify-center font-bold text-white">
                    {googleUser.email ? googleUser.email[0].toUpperCase() : 'G'}
                  </div>
                )}
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-white">{googleUser.displayName || 'Hotel Admin'}</span>
                    <span className="bg-emerald-500/20 text-emerald-300 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                      <CheckCircle2 size={10} /> Connected
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">{googleUser.email}</p>
                </div>
                <button
                  id="btn-disconnect-google"
                  onClick={handleLogout}
                  className="p-1.5 hover:bg-slate-700 text-slate-400 hover:text-rose-300 rounded-lg transition-colors ml-1"
                  title="Disconnect Google Account"
                >
                  <LogOut size={16} />
                </button>
              </div>
            ) : (
              <div>
                <button
                  id="btn-google-sign-in"
                  onClick={handleSignIn}
                  disabled={isAuthenticating}
                  className="bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold px-4 py-2.5 rounded-lg shadow-sm border border-slate-300 flex items-center gap-2.5 transition-all cursor-pointer disabled:opacity-50"
                >
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                  </svg>
                  <span>{isAuthenticating ? 'Connecting Gmail...' : 'Sign in with Google'}</span>
                </button>
                <div className="text-[10px] text-slate-400 text-center mt-1">
                  Connects official hotel inbox securely
                </div>
              </div>
            )}
          </div>
        </div>

        {authError && (
          <div className="mt-3 text-xs bg-rose-950/80 border border-rose-800 text-rose-200 p-2 rounded-lg flex items-center gap-2">
            <AlertTriangle size={14} className="shrink-0" />
            <span>{authError}</span>
          </div>
        )}
      </div>

      {/* Success Toast */}
      {sendSuccessMsg && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 px-4 py-3 rounded-xl flex items-center gap-3 shadow-md animate-in slide-in-from-top duration-150">
          <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-semibold">{sendSuccessMsg}</span>
        </div>
      )}

      {/* 3 Core Benefits Card Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-teal-50 text-teal-700">
            <Send size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Instant Voucher Dispatch</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Send clean, HTML booking confirmation vouchers with check-in timings, maps &amp; tariff directly from your Gmail.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-sky-50 text-sky-700">
            <ShieldCheck size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">Verified Sender Authority</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Emails land in primary inbox from your real Google Account, avoiding spam folders and increasing trust.
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex items-start gap-3">
          <div className="p-2.5 rounded-lg bg-amber-50 text-amber-700">
            <Inbox size={18} />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900">OTA &amp; Guest Inquiries</h4>
            <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed">
              Read incoming reservation updates from MakeMyTrip, Agoda, Booking.com and reply directly without leaving the PMS.
            </p>
          </div>
        </div>
      </div>

      {/* Main Tab Navigation */}
      <div className="flex border-b border-slate-200 gap-6">
        <button
          id="tab-btn-compose"
          onClick={() => setActiveSubTab('compose')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
            activeSubTab === 'compose'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send size={15} />
          <span>Send Guest Email / Voucher</span>
        </button>

        <button
          id="tab-btn-inbox"
          onClick={() => setActiveSubTab('inbox')}
          className={`pb-3 text-xs font-bold flex items-center gap-2 cursor-pointer transition-all border-b-2 ${
            activeSubTab === 'inbox'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Inbox size={15} />
          <span>Gmail Inbox &amp; Inquiries</span>
          {messages.length > 0 && (
            <span className="bg-teal-100 text-teal-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
              {messages.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: COMPOSE & SEND GUEST VOUCHER */}
      {activeSubTab === 'compose' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 px-6 py-4 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <FileText size={16} className="text-teal-600" />
                <span>Guest Email Dispatcher</span>
              </h3>
              <p className="text-xs text-slate-500">Auto-generates branded confirmation vouchers from active bookings</p>
            </div>

            {/* Select Active Booking */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-600">Select Booking:</span>
              <select
                id="select-booking-dropdown"
                value={selectedBookingId}
                onChange={(e) => setSelectedBookingId(e.target.value)}
                className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 font-medium text-slate-800 focus:ring-2 focus:ring-teal-500 outline-hidden"
              >
                {bookings.map(b => (
                  <option key={b.id} value={b.id}>
                    #{b.bookingCode} - {b.guest.fullName} ({b.checkInDate})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <form onSubmit={handleInitiateSend} className="p-6 space-y-5">
            {/* Template Selector Pills */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Choose Email Template:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setTemplateType('confirmation')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    templateType === 'confirmation'
                      ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  📄 Official Booking Voucher
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('welcome')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    templateType === 'welcome'
                      ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  🛎️ Pre-Arrival &amp; Wi-Fi Guide
                </button>
                <button
                  type="button"
                  onClick={() => setTemplateType('custom')}
                  className={`px-3.5 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    templateType === 'custom'
                      ? 'bg-teal-50 border-teal-500 text-teal-800 ring-2 ring-teal-500/20'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  ✏️ Custom Communication
                </button>
              </div>
            </div>

            {/* Recipient & Subject */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email:
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3 top-2.5 text-slate-400" />
                  <input
                    id="input-recipient-email"
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="guest@example.com"
                    required
                    className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Email Subject:
                </label>
                <input
                  id="input-email-subject"
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  placeholder="Subject..."
                  required
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden font-medium"
                />
              </div>
            </div>

            {/* Email Preview & Body */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-700">
                  Email Message Body:
                </label>
                {emailHtml && (
                  <span className="text-[11px] text-teal-700 font-semibold flex items-center gap-1">
                    <Sparkles size={12} /> Includes Branded HTML Layout
                  </span>
                )}
              </div>
              <textarea
                id="textarea-email-body"
                rows={7}
                value={emailBody}
                onChange={(e) => setEmailBody(e.target.value)}
                className="w-full p-3 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden font-mono leading-relaxed"
              />
            </div>

            {/* Send Actions */}
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-slate-200">
              <div className="text-[11px] text-slate-500 flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-teal-600" />
                <span>
                  {googleUser ? (
                    <>Sending from authenticated account: <strong className="text-slate-800">{googleUser.email}</strong></>
                  ) : (
                    <span className="text-amber-700 font-medium">Connect Google account above to send emails directly</span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const booking = bookings.find(b => b.id === selectedBookingId);
                    if (booking && onOpenBookingDetails) onOpenBookingDetails(booking);
                  }}
                  className="px-4 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                >
                  View Reservation
                </button>

                <button
                  id="btn-send-email-action"
                  type="submit"
                  disabled={isSending}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send size={14} />
                  <span>{isSending ? 'Sending...' : 'Send via Hotel Gmail'}</span>
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* TAB 2: GMAIL INBOX & INQUIRIES */}
      {activeSubTab === 'inbox' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="bg-slate-50 px-6 py-3.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Inbox size={16} className="text-teal-600" />
                <span>Hotel Inbox &amp; Channel Communications</span>
              </h3>
              <p className="text-xs text-slate-500">Live guest messages &amp; OTA reservation notifications</p>
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search emails (e.g. MMT, booking)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') loadMessages();
                  }}
                  className="pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-teal-500 outline-hidden w-64"
                />
              </div>

              <button
                id="btn-refresh-inbox"
                onClick={loadMessages}
                disabled={isLoadingMessages || !accessToken}
                className="p-2 border border-slate-300 hover:bg-white text-slate-600 hover:text-teal-700 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                title="Refresh Inbox"
              >
                <RefreshCw size={14} className={isLoadingMessages ? 'animate-spin text-teal-600' : ''} />
              </button>
            </div>
          </div>

          {!accessToken ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 rounded-full bg-teal-50 text-teal-700 mx-auto flex items-center justify-center">
                <Mail size={24} />
              </div>
              <div>
                <h4 className="text-base font-bold text-slate-900">Connect Your Gmail to View Messages</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Sign in with the Google account associated with your hotel to view incoming guest inquiries and send responses directly.
                </p>
              </div>
              <button
                onClick={handleSignIn}
                className="bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold px-4 py-2.5 rounded-lg shadow-sm transition-all cursor-pointer"
              >
                Sign in with Google
              </button>
            </div>
          ) : isLoadingMessages ? (
            <div className="p-12 text-center text-slate-500 space-y-2">
              <RefreshCw size={24} className="animate-spin mx-auto text-teal-600" />
              <p className="text-xs font-medium">Fetching recent hotel messages from Gmail...</p>
            </div>
          ) : messages.length === 0 ? (
            <div className="p-12 text-center max-w-md mx-auto space-y-3">
              <Inbox size={32} className="mx-auto text-slate-300" />
              <div>
                <h4 className="text-sm font-bold text-slate-800">No Messages Found</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Your inbox doesn't have any matching reservation emails right now.
                </p>
              </div>
              <button
                onClick={loadMessages}
                className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Check Again
              </button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors flex items-start justify-between gap-4 ${
                    msg.isUnread ? 'bg-teal-50/40 font-semibold' : ''
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 truncate">
                        {msg.fromName}
                      </span>
                      <span className="text-[11px] text-slate-400 font-mono truncate">
                        &lt;{msg.fromEmail}&gt;
                      </span>
                      {msg.isUnread && (
                        <span className="bg-teal-600 text-white text-[9px] font-bold px-1.5 py-0.2 rounded-full">
                          NEW
                        </span>
                      )}
                    </div>
                    <h5 className="text-xs font-semibold text-slate-800 truncate">
                      {msg.subject}
                    </h5>
                    <p className="text-[11px] text-slate-500 line-clamp-1">
                      {msg.snippet}
                    </p>
                  </div>

                  <div className="shrink-0 text-right">
                    <span className="text-[10px] text-slate-400 whitespace-nowrap">
                      {msg.date ? new Date(msg.date).toLocaleDateString() : ''}
                    </span>
                    <div className="mt-1">
                      <ChevronRight size={14} className="text-slate-400 ml-auto" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Message Reader Modal */}
      {selectedMessage && (
        <div 
          className="fixed inset-0 z-60 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setSelectedMessage(null)}
        >
          <div 
            className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-98 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-teal-400">Gmail Message</span>
                <h3 className="text-base font-bold text-white mt-0.5 truncate max-w-md">
                  {selectedMessage.subject}
                </h3>
              </div>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-slate-400 hover:text-white p-1 rounded-md"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 space-y-1 text-xs">
                <div><span className="text-slate-500">From:</span> <strong className="text-slate-800">{selectedMessage.from}</strong></div>
                <div><span className="text-slate-500">Date:</span> <span className="text-slate-700">{selectedMessage.date}</span></div>
              </div>

              <div className="p-4 bg-white border border-slate-200 rounded-lg text-xs leading-relaxed text-slate-800 whitespace-pre-wrap font-sans min-h-[140px]">
                {selectedMessage.snippet}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setActiveSubTab('compose');
                    setRecipientEmail(selectedMessage.fromEmail);
                    setEmailSubject(`Re: ${selectedMessage.subject}`);
                    setSelectedMessage(null);
                  }}
                  className="px-4 py-2 bg-teal-600 text-white text-xs font-bold rounded-lg hover:bg-teal-700 flex items-center gap-1.5"
                >
                  <Send size={13} />
                  <span>Reply to Guest</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MANDATORY USER CONFIRMATION MODAL FOR SENDING EMAILS (per Workspace Integration Skill) */}
      {confirmSendModal.isOpen && confirmSendModal.payload && (
        <div 
          className="fixed inset-0 z-70 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto"
          onClick={() => setConfirmSendModal({ isOpen: false, payload: null })}
        >
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-98 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-teal-700 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Send size={18} />
                <h3 className="text-sm font-bold">Confirm Email Dispatch via Gmail</h3>
              </div>
              <button
                onClick={() => setConfirmSendModal({ isOpen: false, payload: null })}
                className="text-teal-200 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900 leading-relaxed">
                <strong>Authorization Required:</strong> You are about to send an email through your connected Google Workspace account (<strong>{googleUser?.email || 'Hotel Account'}</strong>).
              </div>

              <div className="bg-slate-50 rounded-lg p-3.5 border border-slate-200 text-xs space-y-2">
                <div>
                  <span className="text-slate-500 font-medium">To (Recipient):</span>{' '}
                  <strong className="text-slate-900">{confirmSendModal.payload.to}</strong>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Subject:</span>{' '}
                  <span className="text-slate-900 font-semibold">{confirmSendModal.payload.subject}</span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Sender:</span>{' '}
                  <span className="text-slate-700">{hotelProfile.name} &lt;{googleUser?.email}&gt;</span>
                </div>
              </div>

              <p className="text-xs text-slate-500">
                Please confirm that you want to dispatch this email to the guest. Once sent, the email will appear in your Google Sent items.
              </p>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setConfirmSendModal({ isOpen: false, payload: null })}
                  className="px-4 py-2 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSend}
                  disabled={isSending}
                  className="px-5 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  <Check size={15} />
                  <span>{isSending ? 'Sending Now...' : 'Yes, Send Email'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
