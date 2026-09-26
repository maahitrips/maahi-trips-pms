import React, { useState, useEffect } from 'react';
import { HotelProfile, Hotel, UserAccount, Room, DeletionRequest } from '../types';
import { 
  Building2, 
  Save, 
  ShieldCheck, 
  CheckCircle2, 
  Plus, 
  Users, 
  Database, 
  Download, 
  Upload, 
  Crown, 
  Hotel as HotelIcon, 
  KeyRound, 
  Check, 
  ExternalLink, 
  BedDouble, 
  Trash2, 
  Lock, 
  AlertTriangle, 
  UserPlus, 
  Copy, 
  Clock, 
  XCircle, 
  CheckCircle, 
  ShieldAlert,
  Globe,
  Code,
  Edit3,
  MapPin,
  Cloud,
  CloudOff,
  Info,
  Smartphone,
  Laptop,
  Sparkles,
  X
} from 'lucide-react';
import { 
  canUserAddProperty, 
  getAccessibleHotels, 
  isSuperAdminUser, 
  isPropertyOwnerUser, 
  isStaffUser,
  canUserManageStaff,
  MAX_OWNER_PROPERTIES 
} from '../utils/permissionHelper';

interface SettingsViewProps {
  hotelProfile: HotelProfile;
  onUpdateProfile: (updated: HotelProfile) => void;
  // Multi-hotel props
  hotels: Hotel[];
  activeHotelId: string;
  onSelectHotel: (hotelId: string) => void;
  onOpenAddHotel: () => void;
  initialSubTab?: 'profile' | 'rooms' | 'hotels' | 'users' | 'requests' | 'backup' | 'domain_connect';
  currentUser: UserAccount | null;
  users: UserAccount[];
  onOpenLogin: () => void;
  onExportBackup?: () => void;
  onImportBackup?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  // Rooms & inventory
  rooms?: Room[];
  onOpenAddRoom?: () => void;
  onEditRoom?: (room: Room) => void;
  onRequestDeleteRoom?: (room: Room) => void;
  onRequestDeleteHotel?: (hotel: Hotel) => void;
  onOpenCreateUser?: () => void;
  // Deletion requests workflow
  deletionRequests?: DeletionRequest[];
  onApproveDeleteRequest?: (req: DeletionRequest) => void;
  onRejectDeleteRequest?: (reqId: string) => void;
  onShowToast?: (message: string, sub?: string) => void;
  isCloudConnected?: boolean;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  hotelProfile,
  onUpdateProfile,
  hotels,
  activeHotelId,
  onSelectHotel,
  onOpenAddHotel,
  initialSubTab,
  currentUser,
  users,
  onOpenLogin,
  onExportBackup,
  onImportBackup,
  rooms = [],
  onOpenAddRoom,
  onEditRoom,
  onRequestDeleteRoom,
  onRequestDeleteHotel,
  onOpenCreateUser,
  deletionRequests = [],
  onApproveDeleteRequest,
  onRejectDeleteRequest,
  onShowToast,
  isCloudConnected = true
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'rooms' | 'hotels' | 'users' | 'requests' | 'backup' | 'domain_connect'>(initialSubTab || 'profile');
  const [showCloudSyncModal, setShowCloudSyncModal] = useState<boolean>(false);

  useEffect(() => {
    if (initialSubTab) {
      setActiveSubTab(initialSubTab);
    }
  }, [initialSubTab]);
  const [profile, setProfile] = useState<HotelProfile>(hotelProfile);

  // Keep local profile state in sync with active hotel profile prop
  useEffect(() => {
    setProfile(hotelProfile);
  }, [hotelProfile, activeHotelId]);

  const [saved, setSaved] = useState<boolean>(false);
  const [copiedUserId, setCopiedUserId] = useState<string | null>(null);
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  const handleTriggerCloudSyncNotice = () => {
    setShowCloudSyncModal(true);
    if (onShowToast) {
      if (isCloudConnected) {
        onShowToast(
          'Cloud Sync Active: Real-time Multi-Device Sync',
          'Google Cloud Firestore is connected. All devices share live hotel data.'
        );
      } else {
        onShowToast(
          'Cloud Sync Status: Local-Only Data',
          'Data is saved only on this device. Export regular backups to prevent data loss.'
        );
      }
    }
  };

  const isSuperAdmin = isSuperAdminUser(currentUser);
  const isOwner = isPropertyOwnerUser(currentUser);
  const isStaff = isStaffUser(currentUser);
  const propertyAddCheck = canUserAddProperty(currentUser, hotels);
  const canManageStaff = canUserManageStaff(currentUser);
  const accessibleHotels = getAccessibleHotels(currentUser, hotels);
  const pendingRequests = deletionRequests.filter(r => r.status === 'pending');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateProfile(profile);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const copyCredentials = (u: UserAccount) => {
    const text = `🏨 Maahi Trips PMS Login:\nUsername: ${u.username}\nPassword: ${u.password || 'password123'}\nRole: ${u.designation}`;
    navigator.clipboard.writeText(text);
    setCopiedUserId(u.id);
    setTimeout(() => setCopiedUserId(null), 2000);
  };

  return (
    <div className="flex-1 flex flex-col overflow-y-auto bg-slate-50 p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
      {/* Top Banner */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              PMS Control Center &amp; Property Settings
            </h1>
            <span className="text-[10px] uppercase font-bold tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-full border border-teal-200">
              Multi-Tenant Architecture
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-500">
            Manage hotel properties, room inventories, friend logins, and Super Admin deletion authorizations
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-center shrink-0">
          {/* Prominent Cloud Sync Button */}
          <button
            type="button"
            onClick={handleTriggerCloudSyncNotice}
            className={`px-4 py-2.5 text-white font-bold text-xs rounded-xl shadow-md hover:shadow-lg flex items-center gap-2 transition-all cursor-pointer border group shrink-0 ${
              isCloudConnected
                ? 'bg-gradient-to-r from-teal-700 via-emerald-700 to-teal-800 hover:from-teal-800 hover:to-emerald-800 border-emerald-400/40'
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-teal-700 hover:from-blue-700 hover:to-indigo-800 border-blue-400/40'
            }`}
            title="Check Cloud Sync Status & Multi-Device Information"
          >
            <Cloud size={16} className={`${isCloudConnected ? 'text-emerald-200' : 'text-blue-200'} group-hover:scale-110 transition-transform`} />
            <span>{isCloudConnected ? 'Cloud Sync Active' : 'Enable Cloud Sync'}</span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-1 ${
              isCloudConnected ? 'bg-emerald-300 text-emerald-950' : 'bg-amber-400 text-amber-950'
            }`}>
              {isCloudConnected ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-900 inline-block animate-pulse"></span>
                  Live Online
                </>
              ) : (
                'Local Only'
              )}
            </span>
          </button>

          {saved && (
            <div className="flex items-center gap-1 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300">
              <CheckCircle2 size={15} />
              <span>Settings Saved!</span>
            </div>
          )}
        </div>
      </div>

      {/* Cloud Sync Status Notice Banner */}
      {isCloudConnected ? (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-emerald-950">
            <Cloud size={18} className="text-emerald-700 shrink-0" />
            <span>
              <strong>Multi-Device Cloud Sync is ACTIVE!</strong> Live synchronized with Google Cloud Firestore database. Any booking or room change is reflected in real-time across all your phones, tablets, and computers.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTriggerCloudSyncNotice}
              className="text-[11px] font-bold text-teal-800 hover:text-teal-950 underline cursor-pointer"
            >
              Cloud Sync Details &rarr;
            </button>
            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="px-2.5 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-950 rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download size={12} />
                <span>Backup JSON</span>
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5 text-amber-950">
            <CloudOff size={16} className="text-amber-700 shrink-0" />
            <span>
              <strong>Cloud Sync Status: Local Storage Only.</strong> Data on this phone/computer is not synced live to other devices. Remember to export regular JSON backups.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleTriggerCloudSyncNotice}
              className="text-[11px] font-bold text-blue-700 hover:text-blue-900 underline cursor-pointer"
            >
              Learn More / Enable Cloud Sync &rarr;
            </button>
            {onExportBackup && (
              <button
                type="button"
                onClick={onExportBackup}
                className="px-2.5 py-1 bg-amber-200 hover:bg-amber-300 text-amber-950 rounded-md font-bold text-[11px] transition-colors cursor-pointer flex items-center gap-1"
              >
                <Download size={12} />
                <span>Backup JSON</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-semibold">
        <button
          onClick={() => setActiveSubTab('profile')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'profile'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Building2 size={15} />
          <span>Active Hotel Profile</span>
        </button>

        <button
          onClick={() => setActiveSubTab('rooms')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'rooms'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <BedDouble size={15} />
          <span>Rooms &amp; Inventory ({rooms.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('hotels')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'hotels'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <HotelIcon size={15} />
          <span>Hotel Properties ({hotels.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('users')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'users'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Users size={15} />
          <span>Staff &amp; Friend Logins ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('requests')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'requests'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert size={15} className={pendingRequests.length > 0 ? "text-amber-500" : ""} />
          <span>Delete Requests</span>
          {pendingRequests.length > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.2 rounded-full">
              {pendingRequests.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('backup')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'backup'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database size={15} />
          <span>Data Backup &amp; Recovery</span>
        </button>

        <button
          id="btn-subtab-domain-connect"
          onClick={() => setActiveSubTab('domain_connect')}
          className={`px-3.5 py-2 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeSubTab === 'domain_connect'
              ? 'bg-teal-800 text-white shadow-xs'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Globe size={15} />
          <span>Website &amp; Subdomain Setup</span>
        </button>
      </div>

      {/* Tab 1: Profile Form */}
      {activeSubTab === 'profile' && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 max-w-3xl text-xs">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-sm block">Active Property Details</span>
              <span className="text-[11px] text-slate-500">Currently configuring: <strong>{profile.name}</strong></span>
            </div>
            {!isStaff && (
              <button
                type="button"
                onClick={onOpenAddHotel}
                className={`flex items-center gap-1 text-[11px] font-bold px-2.5 py-1.5 rounded-lg border transition-colors cursor-pointer ${
                  isOwner && propertyAddCheck.currentCount >= 5
                    ? 'text-amber-900 bg-amber-50 hover:bg-amber-100 border-amber-300'
                    : 'text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200'
                }`}
              >
                <Plus size={13} /> {isOwner ? (propertyAddCheck.currentCount >= 5 ? 'Properties (5/5 Max)' : `+ Add Property (${propertyAddCheck.currentCount}/5)`) : '+ Add Property'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Hotel Property Name *</label>
              <input
                type="text"
                value={profile.name}
                onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-bold"
                required
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Brand Tagline</label>
              <input
                type="text"
                value={profile.tagline}
                onChange={(e) => setProfile({ ...profile, tagline: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Property Address</label>
              <input
                type="text"
                value={profile.address}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">City, State &amp; PIN</label>
              <input
                type="text"
                value={profile.city}
                onChange={(e) => setProfile({ ...profile, city: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN (Tax ID)</label>
              <input
                type="text"
                value={profile.gstin}
                onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                className="w-full text-sm font-mono font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Front Desk Phone</label>
              <input
                type="text"
                value={profile.phone}
                onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 font-mono"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Standard Check-In Time</label>
              <input
                type="text"
                value={profile.checkInTime}
                onChange={(e) => setProfile({ ...profile, checkInTime: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Standard Check-Out Time</label>
              <input
                type="text"
                value={profile.checkOutTime}
                onChange={(e) => setProfile({ ...profile, checkOutTime: e.target.value })}
                className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-200 flex justify-end">
            <button
              type="submit"
              className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg shadow-md flex items-center gap-2 cursor-pointer"
            >
              <Save size={16} />
              Save Profile Settings
            </button>
          </div>
        </form>
      )}

      {/* Tab 2: Rooms & Inventory */}
      {activeSubTab === 'rooms' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Active Rooms Inventory ({rooms.length} Rooms in {profile.name})
              </span>
              <span className="text-[11px] text-slate-500">
                Add, manage, or request Super Admin deletion of rooms
              </span>
            </div>

            {onOpenAddRoom && (
              <button
                id="btn-settings-add-room"
                onClick={onOpenAddRoom}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
              >
                <Plus size={15} strokeWidth={2.5} />
                <span>+ Add Room</span>
              </button>
            )}
          </div>

          {/* Security policy notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <ShieldAlert size={16} className="text-amber-700 shrink-0" />
              <span>
                <strong>Room Deletion Policy:</strong> {isSuperAdmin ? 'Aap Super Admin (Maahi Trips) hain — aap rooms ko directly edit ya delete kar sakte hain.' : 'Room delete karne ke liye Super Admin (Maahi Trips) ko request bhejna anivarya hai. Regular users directly delete nahi kar sakte.'}
              </span>
            </div>
            {isSuperAdmin ? (
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-300 shrink-0 flex items-center gap-1">
                👑 Super Admin Mode
              </span>
            ) : (
              <span className="text-[10px] bg-amber-200/60 font-bold px-2 py-0.5 rounded border border-amber-300 shrink-0">
                Protected Mode
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {rooms.map(rm => (
              <div key={rm.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-2xs flex flex-col justify-between space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{rm.name}</div>
                    <div className="text-[11px] text-slate-500">{rm.type} • Floor {rm.floor}</div>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                    rm.status === 'clean' ? 'bg-emerald-100 text-emerald-800' :
                    rm.status === 'dirty' ? 'bg-amber-100 text-amber-800' :
                    rm.status === 'cleaning' ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {rm.status}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100 text-slate-600">
                  <span>Tariff: <strong className="text-slate-900 font-mono">₹{rm.baseRate}</strong>/nt</span>
                  <span>Capacity: <strong className="text-slate-900">{rm.maxOccupancy} Guests</strong></span>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {rm.amenities.slice(0, 3).map(a => (
                      <span key={a} className="text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                        {a}
                      </span>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onEditRoom && (
                      <button
                        type="button"
                        onClick={() => onEditRoom(rm)}
                        className="flex items-center gap-1 px-2 py-1 text-slate-700 hover:text-teal-900 bg-slate-100 hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs"
                        title="Edit Room Category & Details"
                      >
                        <Edit3 size={13} className="text-teal-700" />
                        <span>Edit</span>
                      </button>
                    )}

                    {onRequestDeleteRoom && (
                      <button
                        type="button"
                        onClick={() => onRequestDeleteRoom(rm)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                        title={isSuperAdmin ? "Delete Room (Super Admin)" : "Delete Room (Super Admin Approval Required)"}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Multi-Hotel Directory */}
      {activeSubTab === 'hotels' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isSuperAdmin 
                  ? `Registered Hotel Properties (${hotels.length})` 
                  : isOwner 
                    ? `My Hotel Properties (${accessibleHotels.length}/${MAX_OWNER_PROPERTIES} Max Allowed)` 
                    : `My Assigned Hotel (${accessibleHotels.length})`}
              </span>
              <span className="text-[11px] text-slate-500">
                {isSuperAdmin 
                  ? 'Centralized directory of all hotel properties listed by Super Admin (Maahi Trips)' 
                  : isOwner 
                    ? `Property Owner Quota: You can add up to 5 properties (Currently ${accessibleHotels.length}/5 used)` 
                    : 'Staff View: Operations and management for your assigned property'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {!isStaff && (
                <button
                  id="btn-settings-add-hotel"
                  onClick={onOpenAddHotel}
                  className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer ${
                    isOwner && propertyAddCheck.currentCount >= 5
                      ? 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-300'
                      : 'bg-teal-800 hover:bg-teal-900 text-white'
                  }`}
                >
                  <Plus size={15} strokeWidth={2.5} />
                  <span>
                    {isOwner 
                      ? (propertyAddCheck.currentCount >= 5 ? 'Quota Full (5/5 Properties)' : `+ Add Property (${propertyAddCheck.currentCount}/5)`) 
                      : '+ Add / Register New Property'}
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Super Admin Property Control Panel */}
          {isSuperAdmin && (
            <div className="p-4 bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 text-white rounded-2xl border border-rose-800/50 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center justify-center font-bold text-lg shrink-0">
                    👑
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-white">Super Admin Multi-Property Panel</span>
                      <span className="text-[10px] bg-rose-500/30 text-rose-200 border border-rose-500/40 font-bold px-2 py-0.5 rounded-full uppercase">
                        Master Property Control
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 mt-0.5">
                      Super Admin (Maahi Trips) ke paas kisi bhi property ko add karne aur <strong>permanently delete</strong> karne ka complete control hai.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {onOpenAddHotel && (
                    <button
                      onClick={onOpenAddHotel}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                    >
                      <Plus size={13} strokeWidth={2.5} />
                      <span>Add Property</span>
                    </button>
                  )}
                  {hotels.length > 1 && onRequestDeleteHotel && (
                    <button
                      onClick={() => {
                        const currentHotel = hotels.find(h => h.id === activeHotelId);
                        if (currentHotel) onRequestDeleteHotel(currentHotel);
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold rounded-lg transition-colors cursor-pointer shadow-xs"
                      title="Quick Delete currently active property"
                    >
                      <Trash2 size={13} />
                      <span>Delete Active Property</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Quota Notice for Property Owner */}
          {isOwner && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <HotelIcon size={16} className="text-blue-700 shrink-0" />
                <span>
                  <strong>Property Owner Limit:</strong> Super Admin ke niyam anusar aap maximum <strong>5 property</strong> add kar sakte hain. ({accessibleHotels.length}/5 active). User panel me staff add kar sakte hain.
                </span>
              </div>
              <span className="text-[11px] font-bold bg-blue-200/80 text-blue-900 px-2.5 py-0.5 rounded-full shrink-0">
                {MAX_OWNER_PROPERTIES - accessibleHotels.length} slots remaining
              </span>
            </div>
          )}

          {/* Notice for Staff Member */}
          {isStaff && (
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 flex items-center gap-2">
              <Lock size={15} className="text-slate-500 shrink-0" />
              <span>
                <strong>Staff Member Access:</strong> Staff accounts new property add ya register nahi kar sakte. Nayi property keval Property Owner ya Super Admin hi add kar sakte hain.
              </span>
            </div>
          )}

          {/* Security policy notice */}
          {!isSuperAdmin && (
            <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-950 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <ShieldAlert size={16} className="text-amber-700 shrink-0" />
                <span>
                  <strong>Property Deletion Policy:</strong> Hotel property delete karne ka right sirf Super Admin (Maahi Trips) ke pass hai. Manager deletion request submit kar sakte hain.
                </span>
              </div>
              <span className="text-[10px] bg-amber-200/60 font-bold px-2 py-0.5 rounded border border-amber-300 shrink-0">
                Protected Mode
              </span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {hotels.map((h) => {
              const isCurrent = h.id === activeHotelId;
              const assignedUser = users.find(u => u.hotelId === h.id);

              return (
                <div
                  key={h.id}
                  className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between transition-all ${
                    isCurrent 
                      ? 'border-teal-500 ring-2 ring-teal-500/20' 
                      : 'border-slate-200 hover:border-teal-300'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                          isCurrent ? 'bg-teal-800 text-white shadow-xs' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {h.code}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{h.name}</div>
                          <div className="text-[11px] text-slate-500">{h.city}, {h.state}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1">
                        {isCurrent ? (
                          <span className="bg-teal-100 text-teal-800 border border-teal-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        ) : (
                          <span className="bg-slate-100 text-slate-600 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                            {h.starCategory || 'Hotel'}
                          </span>
                        )}

                        {onRequestDeleteHotel && (
                          <button
                            type="button"
                            onClick={() => onRequestDeleteHotel(h)}
                            disabled={hotels.length <= 1}
                            className={`p-1.5 rounded-md transition-colors ${
                              hotels.length <= 1
                                ? 'text-slate-300 cursor-not-allowed'
                                : isSuperAdmin
                                  ? 'text-rose-600 hover:text-rose-700 hover:bg-rose-50 cursor-pointer'
                                  : 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                            }`}
                            title={
                              hotels.length <= 1 
                                ? "Cannot delete the only property in PMS" 
                                : isSuperAdmin 
                                  ? `Delete Hotel Property: ${h.name} (Super Admin)` 
                                  : `Delete Hotel (Super Admin Approval Required)`
                            }
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 italic line-clamp-2">
                      "{h.tagline}"
                    </p>

                    <div className="text-xs space-y-1.5 pt-2 border-t border-slate-100 text-slate-600">
                      <div className="flex justify-between items-start gap-2">
                        <span className="shrink-0 flex items-center gap-1 text-slate-500">
                          <MapPin size={11} className="text-teal-700" />
                          <span>Address:</span>
                        </span>
                        <strong className="text-slate-800 text-right truncate max-w-[200px]" title={h.address}>
                          {h.address || 'Address pending'}
                        </strong>
                      </div>
                      <div className="flex justify-between">
                        <span>GSTIN:</span>
                        <strong className="font-mono text-slate-800">{h.gstin}</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Contact:</span>
                        <span>{h.phone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dedicated Manager:</span>
                        <span className="font-semibold text-teal-900">{assignedUser?.name || 'Assigned'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                    {isCurrent ? (
                      <div className="flex items-center gap-2 flex-1">
                        <span className="text-xs font-bold text-teal-700 flex items-center gap-1 shrink-0">
                          <CheckCircle2 size={15} /> Active
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveSubTab('profile')}
                          className="flex-1 py-1.5 px-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                        >
                          Edit Address / Profile &rarr;
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 flex-1">
                        <button
                          onClick={() => onSelectHotel(h.id)}
                          className="flex-1 py-2 bg-slate-100 hover:bg-teal-800 hover:text-white text-slate-700 text-xs font-bold rounded-lg transition-colors cursor-pointer text-center"
                        >
                          Switch to {h.name}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            onSelectHotel(h.id);
                            setActiveSubTab('profile');
                          }}
                          className="py-2 px-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200 text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                          title="Switch & Edit Address"
                        >
                          Edit
                        </button>
                      </div>
                    )}

                    {onRequestDeleteHotel && (
                      <button
                        type="button"
                        onClick={() => onRequestDeleteHotel(h)}
                        disabled={hotels.length <= 1}
                        className={`px-3 py-2 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 shrink-0 ${
                          hotels.length <= 1
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                            : isSuperAdmin 
                              ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 cursor-pointer shadow-2xs hover:shadow-xs' 
                              : 'bg-slate-100 hover:bg-rose-50 text-slate-600 hover:text-rose-700 border border-slate-200 cursor-pointer'
                        }`}
                        title={
                          hotels.length <= 1 
                            ? 'Cannot delete the only property in PMS' 
                            : isSuperAdmin 
                              ? `Permanently Delete ${h.name} (Super Admin)` 
                              : `Send Deletion Request for ${h.name} to Super Admin`
                        }
                      >
                        <Trash2 size={13} />
                        <span>{isSuperAdmin ? 'Delete Property' : 'Request Delete'}</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 4: Staff & Friend Logins */}
      {activeSubTab === 'users' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                {isSuperAdmin 
                  ? `All User, Owner & Staff Accounts (${users.length})` 
                  : isOwner 
                    ? `My Hotel Staff & Team Logins` 
                    : `Hotel Team Directory (${users.length})`}
              </span>
              <span className="text-[11px] text-slate-500">
                {isSuperAdmin 
                  ? 'Super Admin Control: Create property owners (max 5 properties) or dedicated hotel staff' 
                  : isOwner 
                    ? 'Property Owner Panel: Add and manage staff for your hotel. Staff members cannot add new properties.' 
                    : 'Staff View: View team members and staff contacts (Read-only)'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {canManageStaff && onOpenCreateUser && (
                <button
                  id="btn-settings-create-user"
                  onClick={onOpenCreateUser}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-800 hover:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm transition-colors cursor-pointer"
                >
                  <UserPlus size={15} />
                  <span>{isOwner ? '+ Add Staff Member' : '+ Create Owner / Staff'}</span>
                </button>
              )}

              {isStaff && (
                <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-3 py-1.5 rounded-lg flex items-center gap-1">
                  <Lock size={12} className="text-slate-400" />
                  Staff View (Read-Only)
                </span>
              )}

              <button
                onClick={onOpenLogin}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-lg border border-slate-200 transition-colors cursor-pointer"
              >
                <KeyRound size={15} />
                <span>Switch / Test Login</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">User &amp; Designation</th>
                    <th className="py-3 px-4">Role &amp; Permissions</th>
                    <th className="py-3 px-4">Assigned Hotel Property</th>
                    <th className="py-3 px-4">Login Username</th>
                    <th className="py-3 px-4">Password</th>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((u) => {
                    const isCurrent = currentUser?.id === u.id;
                    const isSuper = u.role === 'super_admin';
                    const isOwnerAccount = u.role === 'hotel_owner';
                    const isStaffAccount = u.role === 'hotel_manager' || u.role === 'front_desk';
                    const hotel = hotels.find(h => h.id === u.hotelId);

                    return (
                      <tr key={u.id} className={`hover:bg-slate-50/80 ${isCurrent ? 'bg-teal-50/40' : ''}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                              isSuper 
                                ? 'bg-amber-100 text-amber-900 border border-amber-300' 
                                : isOwnerAccount 
                                  ? 'bg-blue-100 text-blue-900 border border-blue-300' 
                                  : 'bg-teal-800 text-white'
                            }`}>
                              {isSuper ? '👑' : isOwnerAccount ? '🏨' : u.avatarText || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {isCurrent && (
                                  <span className="bg-teal-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold">
                                    CURRENT USER
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-slate-400">{u.designation}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          {isSuper ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                              👑 Super Admin (All Access)
                            </span>
                          ) : isOwnerAccount ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-900 border border-blue-300">
                              🏨 Property Owner (Max 5 Properties)
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">
                              👔 Staff (Cannot Add Property)
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-4">
                          <span className="font-bold text-teal-900 flex items-center gap-1">
                            <HotelIcon size={13} className="text-teal-700" />
                            {isSuper ? 'Centralized (All Hotels)' : hotel?.name || u.hotelName || 'Will Add Property'}
                          </span>
                        </td>

                        <td className="py-3 px-4 font-mono font-bold text-slate-700">
                          @{u.username}
                        </td>

                        <td className="py-3 px-4 font-mono text-slate-600">
                          {u.password || 'password123'}
                        </td>

                        <td className="py-3 px-4 text-slate-600 font-mono">
                          {u.phone || '-'}
                        </td>

                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              type="button"
                              onClick={() => copyCredentials(u)}
                              className="text-[11px] font-bold text-slate-600 hover:text-slate-900 px-2 py-1 bg-slate-100 hover:bg-slate-200 rounded border border-slate-300 flex items-center gap-1"
                              title="Copy login details to send to friend"
                            >
                              {copiedUserId === u.id ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              <span>{copiedUserId === u.id ? 'Copied' : 'Share'}</span>
                            </button>

                            <button
                              onClick={onOpenLogin}
                              className="text-xs font-bold text-teal-700 hover:text-teal-900 px-2.5 py-1 bg-teal-50 hover:bg-teal-100 rounded-md border border-teal-200 transition-colors"
                            >
                              Log In
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Deletion Requests Workflow */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-600 block">
                Pending &amp; Completed Deletion Requests ({deletionRequests.length})
              </span>
              <span className="text-[11px] text-slate-500">
                Super Admin authorization log for room and property removals
              </span>
            </div>
          </div>

          {deletionRequests.length === 0 ? (
            <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-2">
              <ShieldCheck size={36} className="text-emerald-600 mx-auto" />
              <h3 className="font-bold text-slate-800 text-sm">No Pending Deletion Requests</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                All room inventories and hotel properties are active and secure. When a partner or manager requests a deletion, it will appear here for Super Admin approval.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {deletionRequests.map(req => {
                const isPending = req.status === 'pending';
                return (
                  <div key={req.id} className={`bg-white rounded-xl border p-4 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isPending ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                  }`}>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                          req.type === 'room' ? 'bg-blue-100 text-blue-900' : 'bg-purple-100 text-purple-900'
                        }`}>
                          {req.type === 'room' ? 'Room Deletion' : 'Property Deletion'}
                        </span>
                        <strong className="text-slate-900 text-sm">{req.targetName}</strong>
                        <span className="text-xs text-slate-500">({req.hotelName})</span>
                      </div>

                      <div className="text-xs text-slate-600">
                        Requested by: <strong>{req.requestedBy}</strong> (@{req.requestedByUsername}) • {new Date(req.requestedAt).toLocaleString()}
                      </div>

                      {req.reason && (
                        <div className="text-xs text-slate-700 italic bg-slate-50 p-2 rounded border border-slate-200">
                          "{req.reason}"
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {isPending ? (
                        isSuperAdmin ? (
                          <>
                            <button
                              type="button"
                              onClick={() => onApproveDeleteRequest && onApproveDeleteRequest(req)}
                              className="px-3.5 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center gap-1"
                            >
                              <CheckCircle size={13} />
                              <span>Approve &amp; Delete</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => onRejectDeleteRequest && onRejectDeleteRequest(req.id)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-lg transition-colors cursor-pointer"
                            >
                              Reject
                            </button>
                          </>
                        ) : (
                          <span className="text-xs text-amber-700 font-bold bg-amber-100 px-2.5 py-1 rounded-full border border-amber-300 flex items-center gap-1">
                            <Clock size={12} /> Awaiting Super Admin (Shahid)
                          </span>
                        )
                      ) : (
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1 ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {req.status === 'approved' ? <CheckCircle size={12} /> : <XCircle size={12} />}
                          {req.status.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Backup & Recovery */}
      {activeSubTab === 'backup' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5 max-w-3xl text-xs">
          <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
            <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-center">
              <Database size={20} className="text-teal-800" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Full System Data Backup &amp; Migration</h3>
              <p className="text-slate-500">Export or restore all properties, rooms, guest KYC documents, and booking bundles</p>
            </div>
          </div>

          {/* Cloud Sync Advisory inside Backup tab */}
          {isCloudConnected ? (
            <div className="p-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-300 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 rounded-lg text-emerald-800 shrink-0">
                    <Cloud size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-emerald-950 text-sm block">Current Mode: Live Cloud Sync (Automatic ON)</span>
                      <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-emerald-700 text-white tracking-wide flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-300 inline-block animate-pulse"></span>
                        Live Online
                      </span>
                    </div>
                    <span className="text-[11px] text-emerald-800">
                      Cloud sync is automatically active. Any booking made on mobile phones, laptops, or tablets syncs in real-time across all screens.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerCloudSyncNotice}
                  className="px-3 py-1.5 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Sparkles size={14} />
                  <span>Cloud Active</span>
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Your data is automatically saved to Google Cloud Firestore in real-time. You can also download a regular offline JSON backup below for your hotel records or bookkeeping.
              </p>
            </div>
          ) : (
            <div className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-100 rounded-lg text-amber-800 shrink-0">
                    <CloudOff size={18} />
                  </div>
                  <div>
                    <span className="font-bold text-amber-950 text-sm block">Current Mode: Local Device Storage (Offline)</span>
                    <span className="text-[11px] text-amber-800">No cloud database connected. Different phones or laptops will display different data.</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerCloudSyncNotice}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-2xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
                >
                  <Cloud size={14} />
                  <span>Enable Cloud Sync</span>
                </button>
              </div>
              <p className="text-slate-600 leading-relaxed text-[11px]">
                Until an online cloud database is active, <strong>export a JSON backup regularly</strong> using the button below. This protects your hotel rooms, bookings, and customer KYC proofs against device loss or browser cache resets.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Download size={18} className="text-teal-800" />
                <span className="font-bold text-slate-900 text-sm">Export Complete Backup</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Download a complete JSON archive of all hotels, room rates, active reservations, and guest IDs for safekeeping.
              </p>
              <button
                type="button"
                onClick={onExportBackup}
                className="w-full py-2.5 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg shadow-sm transition-colors cursor-pointer flex items-center justify-center gap-2"
              >
                <Download size={15} />
                <span>Export System Data (JSON)</span>
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <Upload size={18} className="text-teal-800" />
                <span className="font-bold text-slate-900 text-sm">Restore from Backup File</span>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Restore data from a previously exported Maahi Trips JSON backup file to sync states or restore on a new computer.
              </p>
              <label className="w-full py-2.5 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-lg shadow-2xs transition-colors cursor-pointer flex items-center justify-center gap-2">
                <Upload size={15} />
                <span>Select &amp; Import JSON</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Tab 7: Website & Subdomain Connection Guide */}
      {activeSubTab === 'domain_connect' && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-6 max-w-4xl text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <span className="font-bold text-slate-900 text-sm block flex items-center gap-2">
                <Globe size={18} className="text-teal-800" />
                <span>Connect PMS to Your Website / Subdomain</span>
              </span>
              <span className="text-[11px] text-slate-500">
                Live URLs, DNS CNAME records, and ready-to-use website header/menu embed codes.
              </span>
            </div>
            <span className="bg-teal-50 text-teal-800 border border-teal-200 px-2.5 py-1 rounded-full font-bold text-[10px]">
              Ready to Connect
            </span>
          </div>

          {/* Current Live URL Card */}
          <div className="bg-slate-900 text-white p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-teal-400 font-bold uppercase tracking-wider block mb-0.5">
                Current Live PMS Web Application URL
              </span>
              <span className="text-xs sm:text-sm font-mono text-slate-200 break-all select-all font-semibold">
                {typeof window !== 'undefined' ? window.location.origin : 'https://ais-dev-pibjniodpjsmsyf4yqpbry-941942044826.asia-east1.run.app'}
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => {
                  const url = typeof window !== 'undefined' ? window.location.origin : '';
                  navigator.clipboard.writeText(url);
                  setCopiedSnippet('url');
                  setTimeout(() => setCopiedSnippet(null), 2000);
                }}
                className="px-3 py-1.5 bg-teal-700 hover:bg-teal-600 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                {copiedSnippet === 'url' ? <Check size={13} className="text-emerald-300" /> : <Copy size={13} />}
                <span>{copiedSnippet === 'url' ? 'Copied URL!' : 'Copy URL'}</span>
              </button>
              <a
                href={typeof window !== 'undefined' ? window.location.origin : '#'}
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <ExternalLink size={13} />
                <span>Open in Tab</span>
              </a>
            </div>
          </div>

          {/* 3 Step Integration Guide */}
          <div className="space-y-5">
            {/* Step A: Subdomain Setup */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[10px]">
                  1
                </span>
                <h4 className="font-bold text-slate-900 text-xs">
                  Option A: Set Up Subdomain (e.g., pms.maahitrips.com)
                </h4>
              </div>
              <p className="text-slate-600 leading-relaxed">
                Aap apne domain registrar (<strong>GoDaddy, Hostinger, Cloudflare ya Namecheap</strong>) ke DNS section mein jakar ek simple CNAME record add karein:
              </p>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse border border-slate-300 bg-white rounded-lg overflow-hidden text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-700">
                      <th className="p-2.5 border-r border-slate-300">Type</th>
                      <th className="p-2.5 border-r border-slate-300">Name / Host</th>
                      <th className="p-2.5 border-r border-slate-300">Points To / Target</th>
                      <th className="p-2.5">TTL</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td className="p-2.5 border-r border-slate-300 font-mono font-bold text-teal-800">CNAME</td>
                      <td className="p-2.5 border-r border-slate-300 font-mono font-bold text-slate-900">pms</td>
                      <td className="p-2.5 border-r border-slate-300 font-mono text-slate-700">
                        cname.vercel-dns.com <span className="text-[10px] text-slate-500">(or Cloud Run domain mapping)</span>
                      </td>
                      <td className="p-2.5 font-mono text-slate-600">Auto / 3600</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <p className="text-[11px] text-slate-500">
                Tip: AI Studio menu se <strong>Export to GitHub</strong> karke Vercel par 1-click deploy karein aur Custom Domains mein <code>pms.maahitrips.com</code> enter karein.
              </p>
            </div>

            {/* Step B: Add Button to Website Header / Menu */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[10px]">
                    2
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Option B: Add "PMS / Staff Login" Button to Website Menu
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pms.maahitrips.com';
                    const code = `<a href="${currentUrl}" target="_blank" rel="noopener noreferrer" style="display:inline-flex;align-items:center;background:#0d9488;color:#ffffff;padding:8px 16px;border-radius:6px;font-weight:600;font-size:13px;text-decoration:none;font-family:sans-serif;">🏨 Staff / PMS Login</a>`;
                    navigator.clipboard.writeText(code);
                    setCopiedSnippet('btn');
                    setTimeout(() => setCopiedSnippet(null), 2000);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet === 'btn' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedSnippet === 'btn' ? 'Copied HTML!' : 'Copy Button HTML'}</span>
                </button>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Apni website (WordPress, PHP ya HTML) ke Header Navigation menu mein ek naya custom link add karein:
              </p>

              <div className="bg-slate-900 text-emerald-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                {`<a href="${typeof window !== 'undefined' ? window.location.origin : 'https://pms.maahitrips.com'}" target="_blank" class="pms-login-button">\n  🏨 Hotel Staff / PMS Login\n</a>`}
              </div>
              <p className="text-[11px] text-slate-500">
                <strong>WordPress User:</strong> WordPress Admin &gt; Appearance &gt; Menus mein jakar <strong>"Custom Link"</strong> chunein, URL mein upar wala link dalein aur Link Text mein <em>"PMS Login"</em> likh kar Save karein.
              </p>
            </div>

            {/* Step C: Embed directly inside a page */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-teal-800 text-white flex items-center justify-center font-bold text-[10px]">
                    3
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs">
                    Option C: Embed Inside a Web Page (e.g. maahitrips.com/pms)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const currentUrl = typeof window !== 'undefined' ? window.location.origin : 'https://pms.maahitrips.com';
                    const code = `<iframe src="${currentUrl}" width="100%" height="950px" style="border:none;border-radius:12px;box-shadow:0 4px 12px rgba(0,0,0,0.1);" allow="camera"></iframe>`;
                    navigator.clipboard.writeText(code);
                    setCopiedSnippet('iframe');
                    setTimeout(() => setCopiedSnippet(null), 2000);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded text-slate-700 font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  {copiedSnippet === 'iframe' ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                  <span>{copiedSnippet === 'iframe' ? 'Copied iFrame!' : 'Copy iFrame Code'}</span>
                </button>
              </div>

              <p className="text-slate-600 leading-relaxed">
                Agar aap chahte hain ki PMS aapki website ke page ke andar hi khule, to apni site ke kisi bhi page par ye iFrame code paste kar sakte hain:
              </p>

              <div className="bg-slate-900 text-amber-300 p-3 rounded-lg font-mono text-[11px] overflow-x-auto">
                {`<iframe src="${typeof window !== 'undefined' ? window.location.origin : 'https://pms.maahitrips.com'}" width="100%" height="950px" style="border:none;" allow="camera"></iframe>`}
              </div>
            </div>
          </div>

          {/* Quick Access Credentials Banner */}
          <div className="p-3.5 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-between">
            <div className="text-slate-700">
              <span className="font-bold text-teal-900 block">Super Admin Access Portal:</span>
              <span className="text-xs text-slate-600">Master Account Username: <strong className="text-teal-950 font-mono font-bold">maahitrips</strong> (Password is private &amp; secured)</span>
            </div>
            <span className="text-[10px] bg-teal-800 text-white font-bold px-2 py-1 rounded">
              Full Master Access
            </span>
          </div>
        </div>
      )}

      {/* Cloud Sync Status & Multi-Device Notification Modal */}
      {showCloudSyncModal && (
        <div className="fixed inset-0 z-60 bg-slate-900/75 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className={`p-5 flex items-start justify-between text-white ${
              isCloudConnected 
                ? 'bg-gradient-to-r from-slate-900 via-teal-950 to-slate-900' 
                : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`p-2.5 rounded-xl border ${
                  isCloudConnected 
                    ? 'bg-emerald-500/20 border-emerald-400/30 text-emerald-300' 
                    : 'bg-blue-500/20 border-blue-400/30 text-blue-300'
                }`}>
                  <Cloud size={24} />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-base text-white">Multi-Device Cloud Synchronization</h3>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      isCloudConnected 
                        ? 'bg-emerald-400 text-emerald-950' 
                        : 'bg-amber-400 text-amber-950'
                    }`}>
                      {isCloudConnected ? '🟢 Live Online' : 'Local Only'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {isCloudConnected ? 'Google Cloud Firestore Connected' : 'Data storage and multi-device sharing status'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowCloudSyncModal(false)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 text-xs text-slate-700">
              {isCloudConnected ? (
                <>
                  {/* Connected Status Box */}
                  <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs uppercase tracking-wide">
                      <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                      <span>Cloud Database Successfully Connected</span>
                    </div>
                    <p className="text-emerald-900 leading-relaxed">
                      Aapka PMS ab Google Cloud Firestore Database se jud gaya hai. Ab aap jo bhi booking, check-in, room shifting ya rates badlenge, wo <strong>online live sync</strong> ho jayega.
                    </p>
                  </div>

                  {/* Multi-Device Synchronized Info */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-900 block text-xs">
                      Sabhi Devices Par Same Live Data:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-teal-800">
                          <Smartphone size={13} />
                          <span>Mobile Devices</span>
                        </div>
                        <p className="text-slate-500">Staff ya owner ke mobile me live updates turant dikhenge.</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-teal-800">
                          <Laptop size={13} />
                          <span>Laptops &amp; PCs</span>
                        </div>
                        <p className="text-slate-500">Reception desk PC par bhi bilkul wahi booking show hogi.</p>
                      </div>
                    </div>
                  </div>

                  {/* Backup Still Advised Box */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <ShieldCheck size={15} className="text-blue-700 shrink-0" />
                      <span>Safety Best Practice: Export Periodic Backups</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Data cloud par safe hai, lekin extra safety aur offline archive ke liye aap mahine me ek baar <strong>Export Complete Backup (JSON)</strong> file download karke rakh sakte hain.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  {/* Notice Box */}
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl space-y-1.5">
                    <div className="flex items-center gap-2 text-amber-900 font-bold text-xs uppercase tracking-wide">
                      <AlertTriangle size={15} className="text-amber-600 shrink-0" />
                      <span>Data is Currently Stored Locally Only</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Aapka sara hotel data (rooms, bookings, folios, guest KYC proof) abhi sirf isi device ke <strong>localStorage</strong> me save hai. Yeh online cloud database se connected nahi hai.
                    </p>
                  </div>

                  {/* Multi-Device Explanation */}
                  <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                    <span className="font-bold text-slate-900 block text-xs">
                      Why different devices show different data:
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-[11px]">
                      <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Smartphone size={13} className="text-teal-700" />
                          <span>Device A (Mobile)</span>
                        </div>
                        <p className="text-slate-500">Saves data in Mobile Browser memory only.</p>
                      </div>
                      <div className="p-2 bg-white rounded-lg border border-slate-200 space-y-1">
                        <div className="flex items-center gap-1 font-bold text-slate-800">
                          <Laptop size={13} className="text-teal-700" />
                          <span>Device B (PC / Other)</span>
                        </div>
                        <p className="text-slate-500">Has separate local memory, so data does not match.</p>
                      </div>
                    </div>
                  </div>

                  {/* Recommendation Box */}
                  <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
                      <ShieldCheck size={15} className="text-blue-700 shrink-0" />
                      <span>Important Recommendation: Backup Regularly!</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed">
                      Jab tak online cloud database connect nahi hota, <strong>apne data ka regular JSON backup export karein</strong>. Agar aapka browser cache delete hota hai ya phone badalte hain, to yeh backup file aapka sara data wapas restore kar degi.
                    </p>
                  </div>
                </>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
              {onExportBackup && (
                <button
                  type="button"
                  onClick={() => {
                    onExportBackup();
                    setShowCloudSyncModal(false);
                  }}
                  className="w-full sm:w-auto px-4 py-2 bg-teal-800 hover:bg-teal-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download size={14} />
                  <span>Export Full Backup (JSON)</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setShowCloudSyncModal(false)}
                className="w-full sm:w-auto px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold text-xs rounded-xl transition-colors cursor-pointer text-center"
              >
                Got It / Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
