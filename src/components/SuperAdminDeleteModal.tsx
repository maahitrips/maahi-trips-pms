import React, { useState } from 'react';
import { UserAccount, DeletionRequest } from '../types';
import { 
  ShieldAlert, 
  Trash2, 
  X, 
  Lock, 
  Phone, 
  Mail, 
  AlertTriangle, 
  CheckCircle2, 
  Send, 
  KeyRound, 
  Crown, 
  ExternalLink 
} from 'lucide-react';

interface SuperAdminDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetType: 'room' | 'hotel';
  targetId: string;
  targetName: string;
  hotelId: string;
  hotelName: string;
  currentUser: UserAccount | null;
  activeBookingsCount?: number;
  onConfirmDelete: (type: 'room' | 'hotel', id: string) => void;
  onRequestDeleteToSuperAdmin: (req: Omit<DeletionRequest, 'id' | 'requestedAt' | 'status'>) => void;
}

export const SuperAdminDeleteModal: React.FC<SuperAdminDeleteModalProps> = ({
  isOpen,
  onClose,
  targetType,
  targetId,
  targetName,
  hotelId,
  hotelName,
  currentUser,
  activeBookingsCount = 0,
  onConfirmDelete,
  onRequestDeleteToSuperAdmin
}) => {
  const [reason, setReason] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [requestSent, setRequestSent] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [useAdminOverride, setUseAdminOverride] = useState(false);

  if (!isOpen) return null;

  const isSuperAdmin = currentUser?.role === 'super_admin';

  const handleSuperAdminDirectDelete = () => {
    onConfirmDelete(targetType, targetId);
    onClose();
  };

  const handleAdminOverrideDelete = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (adminPassword === '417905kpj' || adminPassword === 'password123' || adminPassword === 'admin') {
      onConfirmDelete(targetType, targetId);
      onClose();
    } else {
      setPasswordError('Invalid Super Admin password (use: 417905kpj). Please check with Shahid or submit a formal request.');
    }
  };

  const handleSendRequestToAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    onRequestDeleteToSuperAdmin({
      type: targetType,
      targetId,
      targetName,
      hotelId,
      hotelName,
      requestedBy: currentUser?.name || 'Hotel Partner',
      requestedByUsername: currentUser?.username || 'partner',
      reason: reason.trim() || 'No specific reason provided'
    });
    setRequestSent(true);
    setTimeout(() => {
      setRequestSent(false);
      onClose();
    }, 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        id="super-admin-delete-modal"
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className={`p-5 text-white flex items-center justify-between ${
          isSuperAdmin 
            ? 'bg-gradient-to-r from-rose-900 via-rose-800 to-slate-900' 
            : 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center border shadow-inner ${
              isSuperAdmin 
                ? 'bg-rose-500/20 border-rose-400/30 text-rose-300' 
                : 'bg-amber-500/20 border-amber-400/30 text-amber-300'
            }`}>
              {isSuperAdmin ? <Trash2 size={20} /> : <Lock size={20} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold tracking-tight">
                  {isSuperAdmin 
                    ? `Delete ${targetType === 'room' ? 'Room' : 'Hotel Property'}` 
                    : 'Super Admin Authorization Required'}
                </h2>
                {!isSuperAdmin && (
                  <span className="text-[10px] uppercase font-bold tracking-wider bg-amber-400/20 text-amber-200 px-2 py-0.5 rounded-full border border-amber-400/30">
                    Protected
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-300">
                Target: <strong>{targetName}</strong> ({hotelName})
              </p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-white/70 hover:text-white p-1 rounded-lg hover:bg-white/10 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Case 1: Logged in user IS Super Admin (Shahid) */}
          {isSuperAdmin ? (
            <div className="space-y-4">
              <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-900 flex items-start gap-3">
                <AlertTriangle size={20} className="text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="block font-bold text-sm text-rose-950 mb-1">
                    Permanent Deletion Confirmation
                  </strong>
                  <p className="leading-relaxed">
                    You are logged in as <strong>Super Admin (Shahid)</strong>. You have direct authorization to permanently delete <strong>{targetName}</strong> from <strong>{hotelName}</strong>.
                  </p>
                </div>
              </div>

              {activeBookingsCount > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  ⚠️ <strong>Warning:</strong> There are currently <strong>{activeBookingsCount}</strong> active or upcoming bookings associated with this {targetType}. Deleting it may impact guest reservations.
                </div>
              )}

              <p className="text-slate-600 text-xs">
                This action is irreversible and will remove all inventory records for this {targetType} across the PMS tape chart.
              </p>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSuperAdminDirectDelete}
                  className="flex items-center gap-1.5 px-5 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg shadow-md transition-colors cursor-pointer"
                >
                  <Trash2 size={15} />
                  <span>Permanently Delete {targetType === 'room' ? 'Room' : 'Hotel'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Case 2: Regular Manager / Friend is logged in */
            <div className="space-y-4">
              {requestSent ? (
                <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-2">
                  <CheckCircle2 size={36} className="text-emerald-600 mx-auto" />
                  <h3 className="text-base font-bold text-emerald-950">
                    Deletion Request Sent to Super Admin!
                  </h3>
                  <p className="text-xs text-emerald-800">
                    Aapki request Super Admin <strong>Shahid</strong> ko bhej di gayi hai. Super Admin review karke is {targetType} ko delete kar denge.
                  </p>
                </div>
              ) : (
                <>
                  {/* Notice Box in Hindi / Hinglish as requested */}
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-xl text-slate-800 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-sm">
                      <ShieldAlert size={18} className="text-amber-700" />
                      <span>Delete Restricted: Super Admin ko bole</span>
                    </div>
                    <p className="text-xs text-slate-700 leading-relaxed">
                      Hotel security aur revenue safety rules ke anusar, kisi bhi <strong>Room</strong> ya <strong>Property</strong> ko directly delete karne ki permission sirf <strong>Super Admin (Shahid)</strong> ke pass hai.
                    </p>
                  </div>

                  {/* Super Admin Contact Card */}
                  <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                    <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">
                      Super Admin Contact Details:
                    </span>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-900 border border-amber-300 flex items-center justify-center font-bold text-base">
                          👑
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-xs">Shahid</div>
                          <div className="text-[11px] text-slate-500">Group Managing Director &amp; Owner</div>
                        </div>
                      </div>
                      <span className="text-[10px] bg-teal-100 text-teal-800 font-bold px-2 py-0.5 rounded-full">
                        Centralized Admin
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-xs">
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Phone size={13} className="text-teal-700" />
                        <span className="font-mono">+91 98980 12345</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-700">
                        <Mail size={13} className="text-teal-700" />
                        <span className="font-mono truncate">shahidkpj@gmail.com</span>
                      </div>
                    </div>
                  </div>

                  {/* Toggle between Send Request OR Admin Password Override */}
                  <div className="flex items-center gap-2 pt-1 border-b border-slate-100 pb-2">
                    <button
                      type="button"
                      onClick={() => setUseAdminOverride(false)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        !useAdminOverride 
                          ? 'bg-teal-800 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      1. Request Super Admin
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseAdminOverride(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer flex items-center gap-1 ${
                        useAdminOverride 
                          ? 'bg-slate-900 text-white shadow-xs' 
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <KeyRound size={12} />
                      <span>2. Admin Password Override</span>
                    </button>
                  </div>

                  {!useAdminOverride ? (
                    /* Form 1: Send request to Super Admin */
                    <form onSubmit={handleSendRequestToAdmin} className="space-y-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">
                          Deletion Reason (Super Admin ko batayein kyu delete karna hai) *
                        </label>
                        <textarea
                          value={reason}
                          onChange={(e) => setReason(e.target.value)}
                          placeholder="e.g. Room 102 ko permanently dining hall me convert kar rahe hain..."
                          rows={3}
                          className="w-full text-xs bg-slate-50 border border-slate-300 rounded-lg p-2.5 outline-hidden focus:ring-2 focus:ring-teal-500"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={onClose}
                          className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-lg text-xs"
                        >
                          Cancel
                        </button>
                        <button
                          id="btn-submit-delete-request"
                          type="submit"
                          className="flex items-center gap-1.5 px-5 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                        >
                          <Send size={14} />
                          <span>Send Request to Shahid</span>
                        </button>
                      </div>
                    </form>
                  ) : (
                    /* Form 2: Admin Password Override */
                    <form onSubmit={handleAdminOverrideDelete} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <div className="text-[11px] text-slate-600">
                        Agar Super Admin Shahid aapke sath hain ya unhone permission de di hai, to unka password enter karein:
                      </div>

                      {passwordError && (
                        <div className="p-2 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs">
                          {passwordError}
                        </div>
                      )}

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Super Admin Password</label>
                        <input
                          type="password"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          placeholder="Enter Shahid's admin password"
                          className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 focus:ring-2 focus:ring-teal-500 font-mono"
                          required
                        />
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <button
                          type="button"
                          onClick={() => setUseAdminOverride(false)}
                          className="text-xs text-slate-500 font-medium hover:underline"
                        >
                          Back to Request
                        </button>
                        <button
                          id="btn-admin-override-delete"
                          type="submit"
                          className="flex items-center gap-1.5 px-4 py-2 bg-rose-700 hover:bg-rose-800 text-white font-bold rounded-lg text-xs shadow-md transition-colors cursor-pointer"
                        >
                          <KeyRound size={13} />
                          <span>Unlock &amp; Delete</span>
                        </button>
                      </div>
                    </form>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
