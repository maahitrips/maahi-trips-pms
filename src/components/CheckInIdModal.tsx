import React, { useState, useEffect, useRef } from 'react';
import { Booking, Room, IdType, IdDocument, PaymentMode, getAllBookingDocuments } from '../types';
import { 
  ShieldCheck, 
  X, 
  Upload, 
  Camera, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  CreditCard, 
  Calendar, 
  User, 
  FileText,
  Key,
  Clock,
  Eye,
  Check,
  Plus,
  Trash2
} from 'lucide-react';
import { sampleAadhaarFront, sampleAadhaarBack, samplePassportFront } from '../data/initialData';

interface CheckInIdModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  room?: Room;
  onConfirmCheckInWithId: (
    bookingId: string,
    idDocument: IdDocument,
    markCheckedIn: boolean,
    paymentRecord?: { amount: number; mode: PaymentMode; reference?: string },
    allDocs?: IdDocument[]
  ) => void;
}

export const CheckInIdModal: React.FC<CheckInIdModalProps> = ({
  isOpen,
  onClose,
  booking,
  room,
  onConfirmCheckInWithId
}) => {
  if (!isOpen || !booking) return null;

  const isAlreadyCheckedIn = booking.status === 'checked_in';

  // Multi-document state initialized from booking
  const [documents, setDocuments] = useState<IdDocument[]>(() => {
    const list = getAllBookingDocuments(booking);
    if (list && list.length > 0) {
      return list.map((d, idx) => ({
        ...d,
        id: d.id || `doc-${Date.now()}-${idx}`,
        documentTitle: d.documentTitle || (idx === 0 ? 'Primary Guest ID' : `Co-Guest #${idx} ID`),
        guestName: d.guestName || (idx === 0 ? (booking.guest?.fullName || 'Primary Guest') : `Co-Guest #${idx}`),
        idNumber: (d.idNumber && d.idNumber !== 'Pending at Check-in') ? d.idNumber : ''
      }));
    }
    return [{
      id: 'doc-1',
      idType: booking.guest?.idDocument?.idType || 'aadhaar',
      idNumber: (booking.guest?.idDocument?.idNumber && booking.guest?.idDocument?.idNumber !== 'Pending at Check-in') 
        ? booking.guest.idDocument.idNumber 
        : '',
      frontImageUrl: booking.guest?.idDocument?.frontImageUrl,
      backImageUrl: booking.guest?.idDocument?.backImageUrl,
      expiryDate: booking.guest?.idDocument?.expiryDate || '',
      isVerified: true,
      uploadedAt: new Date().toLocaleString(),
      notes: booking.guest?.idDocument?.notes || 'Verified at front desk counter upon guest arrival',
      documentTitle: 'Primary Guest ID (Aadhaar / Passport)',
      guestName: booking.guest?.fullName || 'Primary Guest'
    }];
  });

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturingDocIdx, setCapturingDocIdx] = useState<number>(0);
  const [cameraTarget, setCameraTarget] = useState<'front' | 'back'>('front');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Lightbox preview
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Quick Payment collection during check-in
  const totalPaid = booking.payments.reduce((sum, p) => sum + p.amount, 0);
  const roomTotal = booking.roomRatePerNight * booking.nights;
  const discountTotal = booking.discountAmount || 0;
  const taxableRoomTotal = Math.max(0, roomTotal - discountTotal);
  const tax = Math.round((taxableRoomTotal * (booking.taxRatePercent || 0)) / 100);
  const extraTotal = booking.extraCharges.reduce((sum, e) => sum + e.amount, 0);
  const grandTotal = taxableRoomTotal + tax + extraTotal;
  const balanceDue = Math.max(0, grandTotal - totalPaid);

  const [collectPaymentNow, setCollectPaymentNow] = useState<boolean>(balanceDue > 0);
  const [paymentAmount, setPaymentAmount] = useState<number>(balanceDue);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('upi');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Sync state whenever booking changes
  useEffect(() => {
    if (booking) {
      const list = getAllBookingDocuments(booking);
      if (list && list.length > 0) {
        setDocuments(list.map((d, idx) => ({
          ...d,
          id: d.id || `doc-${Date.now()}-${idx}`,
          documentTitle: d.documentTitle || (idx === 0 ? 'Primary Guest ID' : `Co-Guest #${idx} ID`),
          guestName: d.guestName || (idx === 0 ? (booking.guest?.fullName || 'Primary Guest') : `Co-Guest #${idx}`),
          idNumber: (d.idNumber && d.idNumber !== 'Pending at Check-in') ? d.idNumber : ''
        })));
      } else {
        setDocuments([{
          id: 'doc-1',
          idType: booking.guest?.idDocument?.idType || 'aadhaar',
          idNumber: (booking.guest?.idDocument?.idNumber && booking.guest?.idDocument?.idNumber !== 'Pending at Check-in') 
            ? booking.guest.idDocument.idNumber 
            : '',
          frontImageUrl: booking.guest?.idDocument?.frontImageUrl,
          backImageUrl: booking.guest?.idDocument?.backImageUrl,
          expiryDate: booking.guest?.idDocument?.expiryDate || '',
          isVerified: true,
          uploadedAt: new Date().toLocaleString(),
          notes: booking.guest?.idDocument?.notes || 'Verified at front desk counter upon guest arrival',
          documentTitle: 'Primary Guest ID (Aadhaar / Passport)',
          guestName: booking.guest?.fullName || 'Primary Guest'
        }]);
      }
      setPaymentAmount(balanceDue);
      setCollectPaymentNow(balanceDue > 0);
    }
  }, [booking]);

  // Clean camera on unmount
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const updateDocField = (idx: number, field: keyof IdDocument, val: any) => {
    setDocuments(prev => {
      const copy = [...prev];
      if (copy[idx]) {
        copy[idx] = { ...copy[idx], [field]: val };
      }
      return copy;
    });
  };

  const handleAddAnotherDoc = () => {
    const nextIdx = documents.length + 1;
    setDocuments(prev => [
      ...prev,
      {
        id: `doc-${Date.now()}-${nextIdx}`,
        idType: 'aadhaar',
        idNumber: '',
        frontImageUrl: undefined,
        backImageUrl: undefined,
        expiryDate: '',
        isVerified: true,
        uploadedAt: new Date().toLocaleString(),
        notes: 'Co-guest verified at front desk counter',
        documentTitle: `Co-Guest #${nextIdx - 1} ID`,
        guestName: `Co-Guest ${nextIdx - 1}`
      }
    ]);
  };

  const handleRemoveDoc = (idxToRemove: number) => {
    if (documents.length <= 1) {
      setDocuments([{
        id: 'doc-1',
        idType: 'aadhaar',
        idNumber: '',
        frontImageUrl: undefined,
        backImageUrl: undefined,
        expiryDate: '',
        isVerified: true,
        uploadedAt: new Date().toLocaleString(),
        notes: '',
        documentTitle: 'Primary Guest ID',
        guestName: booking?.guest?.fullName || 'Primary Guest'
      }]);
      return;
    }
    setDocuments(prev => prev.filter((_, idx) => idx !== idxToRemove));
  };

  const handleBatchFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    files.forEach((file, fIndex) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setDocuments(prev => {
          if (prev.length === 1 && !prev[0].frontImageUrl && fIndex === 0) {
            const updated = [...prev];
            updated[0] = {
              ...updated[0],
              frontImageUrl: dataUrl,
              documentTitle: prev[0].documentTitle || file.name.replace(/\.[^/.]+$/, "")
            };
            return updated;
          }
          return [
            ...prev,
            {
              id: `doc-${Date.now()}-${fIndex}`,
              idType: 'aadhaar',
              idNumber: '',
              frontImageUrl: dataUrl,
              backImageUrl: undefined,
              expiryDate: '',
              isVerified: true,
              uploadedAt: new Date().toLocaleString(),
              notes: 'Batch uploaded at front desk check-in',
              documentTitle: file.name.replace(/\.[^/.]+$/, "") || `Document #${prev.length + 1}`,
              guestName: `Guest Document #${prev.length + 1}`
            }
          ];
        });
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSingleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docIdx: number, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        updateDocField(docIdx, side === 'front' ? 'frontImageUrl' : 'backImageUrl', result);
        if (side === 'front' && (!documents[docIdx]?.documentTitle || documents[docIdx]?.documentTitle?.startsWith('Doc #'))) {
          updateDocField(docIdx, 'documentTitle', file.name.replace(/\.[^/.]+$/, ""));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const startCamera = async (docIdx: number, side: 'front' | 'back') => {
    setCapturingDocIdx(docIdx);
    setCameraTarget(side);
    setIsCameraActive(true);
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      mediaStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      setCameraError('Webcam / Camera not accessible. You can upload a photo or use a sample ID.');
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        updateDocField(capturingDocIdx, cameraTarget === 'front' ? 'frontImageUrl' : 'backImageUrl', dataUrl);
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setIsCameraActive(false);
    setCameraError(null);
  };

  // Quick fill samples
  const fillSampleAadhaar = () => {
    updateDocField(0, 'idType', 'aadhaar');
    updateDocField(0, 'idNumber', '5482 9104 3821');
    updateDocField(0, 'frontImageUrl', sampleAadhaarFront);
    updateDocField(0, 'backImageUrl', sampleAadhaarBack);
    updateDocField(0, 'isVerified', true);
    updateDocField(0, 'documentTitle', 'Primary Guest Aadhaar Card');
    updateDocField(0, 'notes', 'Original UIDAI Aadhaar QR scanned and verified at front desk counter');
  };

  const fillSamplePassport = () => {
    updateDocField(0, 'idType', 'passport');
    updateDocField(0, 'idNumber', 'Z9182304');
    updateDocField(0, 'expiryDate', '2031-09-18');
    updateDocField(0, 'frontImageUrl', samplePassportFront);
    updateDocField(0, 'backImageUrl', undefined);
    updateDocField(0, 'isVerified', true);
    updateDocField(0, 'documentTitle', 'Primary Guest Passport');
    updateDocField(0, 'notes', 'Original Indian Passport physical copy verified at front desk counter');
  };

  const addSampleCoGuestDoc = () => {
    const nextIdx = documents.length + 1;
    setDocuments(prev => [
      ...prev,
      {
        id: `doc-${Date.now()}-${nextIdx}`,
        idType: 'driving_license',
        idNumber: `DL-04202200${Math.floor(1000 + Math.random() * 9000)}`,
        frontImageUrl: samplePassportFront,
        backImageUrl: undefined,
        expiryDate: '2035-10-15',
        isVerified: true,
        uploadedAt: new Date().toLocaleString(),
        notes: 'Co-guest DL verified at front desk counter',
        documentTitle: `Co-Guest #${nextIdx - 1} Driving License`,
        guestName: `Co-Guest ${nextIdx - 1}`
      }
    ]);
  };

  // Complete submission
  const handleFinalSubmit = (markCheckedIn: boolean) => {
    const primaryDoc = documents[0];
    if (!primaryDoc?.idNumber?.trim() && markCheckedIn && primaryDoc?.isVerified) {
      alert('Please enter or select a Customer ID Number (e.g. Aadhaar or Passport) to complete verified check-in.');
      return;
    }

    const preparedDocs: IdDocument[] = documents.map((d, idx) => ({
      ...d,
      idNumber: d.idNumber.trim() || (markCheckedIn ? 'Pending at Check-in' : 'Pending Submission'),
      isVerified: d.isVerified !== undefined ? d.isVerified : true,
      uploadedAt: d.uploadedAt || new Date().toLocaleString([], { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
      notes: d.notes || 'Verified at front desk counter'
    }));

    const payment = collectPaymentNow && paymentAmount > 0 ? {
      amount: paymentAmount,
      mode: paymentMode,
      reference: paymentRef.trim() || `CHK-${Date.now().toString().slice(-4)}`
    } : undefined;

    onConfirmCheckInWithId(booking.id, preparedDocs[0], markCheckedIn, payment, preparedDocs);
    stopCamera();
    onClose();
  };

  return (
    <div 
      id="checkin-id-modal-backdrop"
      className="fixed inset-0 z-60 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto"
      onClick={onClose}
    >
      <div 
        id="checkin-id-modal-container"
        className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full border border-slate-200 overflow-hidden my-auto animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/40 flex items-center justify-center font-bold">
              <ShieldCheck size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold tracking-tight text-white">
                  {isAlreadyCheckedIn ? 'Submit / Update Customer ID Proofs' : 'Customer Check-In & Multiple ID Proofs'}
                </h3>
                <span className="text-[11px] font-bold uppercase px-2 py-0.5 rounded bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {documents.length} Document{documents.length > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                {isAlreadyCheckedIn 
                  ? 'Submit or update government ID proofs for in-house guest and co-guests'
                  : 'Upload ID proofs for primary guest and all co-guests staying in this room'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X size={20} />
          </button>
        </div>

        {/* Guest & Room Summary Card */}
        <div className="bg-slate-50 border-b border-slate-200 p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
                <User size={16} />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">{booking.guest.fullName}</div>
                <div className="text-slate-500">{booking.guest.phone} • {booking.bookingCode}</div>
              </div>
            </div>

            <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-200 shadow-2xs">
              <span className="font-bold text-slate-700">Room:</span>
              <span className="font-mono font-extrabold text-teal-900">{room?.name || booking.roomId}</span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-600">{booking.nights}N ({booking.checkInDate} to {booking.checkOutDate})</span>
            </div>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-5 space-y-4 max-h-[calc(85vh-200px)] overflow-y-auto">
          {/* Quick Action Bar: Batch Upload & Samples */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-teal-50/70 border border-teal-200 rounded-xl text-xs text-teal-900">
            <div className="flex items-center gap-2 flex-wrap">
              {/* Batch Upload Button */}
              <label className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs">
                <Upload size={13} />
                <span>Batch Upload Multiple Files</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf"
                  onChange={handleBatchFileUpload}
                  className="hidden"
                />
              </label>

              {/* Add Co-Guest ID */}
              <button
                type="button"
                onClick={handleAddAnotherDoc}
                className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs cursor-pointer"
              >
                <Plus size={13} />
                <span>+ Add Co-Guest ID</span>
              </button>
            </div>

            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={fillSampleAadhaar}
                className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                Sample Aadhaar
              </button>
              <button
                type="button"
                onClick={fillSamplePassport}
                className="px-2 py-1 bg-white hover:bg-teal-100 text-teal-900 border border-teal-300 rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                Sample Passport
              </button>
              <button
                type="button"
                onClick={addSampleCoGuestDoc}
                className="px-2 py-1 bg-teal-100/80 hover:bg-teal-200 text-teal-900 rounded text-[11px] font-bold transition-colors cursor-pointer"
              >
                + Co-Guest DL
              </button>
            </div>
          </div>

          {/* Webcam Live Stream area if activated */}
          {isCameraActive && (
            <div className="bg-slate-900 rounded-xl p-4 text-white space-y-3 shadow-lg">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-teal-400 flex items-center gap-1.5">
                  <Camera size={15} /> Live Front Desk Camera — Capturing Document #{capturingDocIdx + 1}
                </span>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="text-slate-400 hover:text-white p-1"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="aspect-video max-h-56 bg-black rounded-lg overflow-hidden flex items-center justify-center relative">
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
              </div>

              {cameraError && (
                <div className="text-xs text-rose-300 bg-rose-950/50 p-2 rounded">
                  {cameraError}
                </div>
              )}

              <div className="flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Camera size={14} /> Snap Photo
                </button>
              </div>
            </div>
          )}

          {/* Multiple Documents List Cards */}
          <div className="space-y-4">
            {documents.map((doc, docIdx) => {
              const isPrimary = docIdx === 0;
              return (
                <div 
                  key={doc.id || `doc-${docIdx}`}
                  className="border-2 border-slate-200 rounded-xl p-4 bg-white space-y-3.5 shadow-2xs"
                >
                  {/* Card Header */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2 flex-1 flex-wrap">
                      <span className={`px-2 py-0.5 text-[11px] font-bold rounded uppercase tracking-wider ${
                        isPrimary ? 'bg-teal-800 text-white' : 'bg-slate-100 text-slate-700 border border-slate-200'
                      }`}>
                        {isPrimary ? 'Doc #1 • Primary Guest' : `Doc #${docIdx + 1} • Co-Guest`}
                      </span>

                      <input
                        type="text"
                        value={doc.documentTitle || ''}
                        onChange={(e) => updateDocField(docIdx, 'documentTitle', e.target.value)}
                        placeholder={isPrimary ? 'Primary Guest Aadhaar / Passport' : `Co-Guest #${docIdx} ID`}
                        className="text-xs font-bold text-slate-900 border border-slate-300 rounded px-2.5 py-1 bg-slate-50 focus:bg-white focus:ring-1 focus:ring-teal-500 min-w-[180px]"
                      />
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <label className="flex items-center gap-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-300 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={Boolean(doc.isVerified)}
                          onChange={(e) => updateDocField(docIdx, 'isVerified', e.target.checked)}
                          className="rounded text-teal-600 focus:ring-teal-500"
                        />
                        <span>Verified</span>
                      </label>

                      {documents.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveDoc(docIdx)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Remove document"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Document Fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Holder Name
                      </label>
                      <input
                        type="text"
                        value={doc.guestName || (isPrimary ? booking.guest.fullName : '')}
                        onChange={(e) => updateDocField(docIdx, 'guestName', e.target.value)}
                        placeholder={isPrimary ? booking.guest.fullName : `Co-Guest ${docIdx} Name`}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ID Document Type *
                      </label>
                      <select
                        value={doc.idType}
                        onChange={(e) => updateDocField(docIdx, 'idType', e.target.value as IdType)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                      >
                        <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                        <option value="passport">Passport</option>
                        <option value="driving_license">Driving License</option>
                        <option value="voter_id">Voter ID (Election Card)</option>
                        <option value="pan_card">PAN Card</option>
                        <option value="national_id">Other Government Photo ID</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        ID Document Number *
                      </label>
                      <input
                        type="text"
                        placeholder={
                          doc.idType === 'aadhaar' ? '5482 9104 3821' :
                          doc.idType === 'passport' ? 'Z9182304' :
                          doc.idType === 'driving_license' ? 'DL-04201800921' :
                          'Enter ID Number'
                        }
                        value={doc.idNumber}
                        onChange={(e) => updateDocField(docIdx, 'idNumber', e.target.value)}
                        className="w-full text-xs font-mono font-bold bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                        required={isPrimary}
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Expiry Date (Optional)
                      </label>
                      <input
                        type="date"
                        value={doc.expiryDate || ''}
                        onChange={(e) => updateDocField(docIdx, 'expiryDate', e.target.value)}
                        className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Side-by-side Front & Back photo blocks */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Front Side */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Front Side Photo</span>
                        {doc.frontImageUrl && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check size={11} /> Attached
                          </span>
                        )}
                      </div>

                      {doc.frontImageUrl ? (
                        <div className="relative aspect-4/3 max-h-36 bg-white rounded-lg overflow-hidden border border-slate-200 group">
                          <img 
                            src={doc.frontImageUrl} 
                            alt="Front ID" 
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={() => setPreviewImage(doc.frontImageUrl || null)}
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(doc.frontImageUrl || null)}
                              className="p-1 bg-black/60 hover:bg-black text-white rounded text-[10px]"
                              title="Zoom"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDocField(docIdx, 'frontImageUrl', undefined)}
                              className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px]"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-4/3 max-h-36 bg-white rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-3 text-center">
                          <ShieldCheck size={22} className="text-slate-300 mb-1" />
                          <span className="text-[11px] text-slate-500 font-medium">Front photo of ID</span>
                          <div className="flex items-center gap-2 mt-2">
                            <label className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded cursor-pointer border border-teal-200">
                              <Upload size={12} className="inline mr-1" /> Browse
                              <input 
                                type="file" 
                                accept="image/*,.pdf" 
                                className="hidden" 
                                onChange={(e) => handleSingleFileUpload(e, docIdx, 'front')} 
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => startCamera(docIdx, 'front')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-200 cursor-pointer"
                            >
                              <Camera size={12} className="inline mr-1" /> Camera
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Back Side */}
                    <div className="border border-slate-200 rounded-xl p-3 bg-slate-50/60 space-y-2">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                        <span>Back Side Photo</span>
                        {doc.backImageUrl && (
                          <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.5 rounded flex items-center gap-0.5">
                            <Check size={11} /> Attached
                          </span>
                        )}
                      </div>

                      {doc.backImageUrl ? (
                        <div className="relative aspect-4/3 max-h-36 bg-white rounded-lg overflow-hidden border border-slate-200 group">
                          <img 
                            src={doc.backImageUrl} 
                            alt="Back ID" 
                            className="w-full h-full object-contain cursor-zoom-in"
                            onClick={() => setPreviewImage(doc.backImageUrl || null)}
                          />
                          <div className="absolute top-2 right-2 flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setPreviewImage(doc.backImageUrl || null)}
                              className="p-1 bg-black/60 hover:bg-black text-white rounded text-[10px]"
                              title="Zoom"
                            >
                              <Eye size={12} />
                            </button>
                            <button
                              type="button"
                              onClick={() => updateDocField(docIdx, 'backImageUrl', undefined)}
                              className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px]"
                              title="Remove"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="aspect-4/3 max-h-36 bg-white rounded-lg border-2 border-dashed border-slate-300 flex flex-col items-center justify-center p-3 text-center">
                          <FileText size={22} className="text-slate-300 mb-1" />
                          <span className="text-[11px] text-slate-500 font-medium">Back photo with address</span>
                          <div className="flex items-center gap-2 mt-2">
                            <label className="px-2.5 py-1 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded cursor-pointer border border-slate-200">
                              <Upload size={12} className="inline mr-1" /> Browse
                              <input 
                                type="file" 
                                accept="image/*,.pdf" 
                                className="hidden" 
                                onChange={(e) => handleSingleFileUpload(e, docIdx, 'back')} 
                              />
                            </label>
                            <button
                              type="button"
                              onClick={() => startCamera(docIdx, 'back')}
                              className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded border border-slate-200 cursor-pointer"
                            >
                              <Camera size={12} className="inline mr-1" /> Camera
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <input
                      type="text"
                      value={doc.notes || ''}
                      onChange={(e) => updateDocField(docIdx, 'notes', e.target.value)}
                      placeholder="Verification remarks (e.g. Scanned original at reception counter)"
                      className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-2 text-slate-700 focus:bg-white focus:ring-1 focus:ring-teal-500"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Section: Verification Checkbox */}
          <div className="p-3.5 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-3">
            <label className="flex items-center gap-2.5 text-xs font-bold text-emerald-950 cursor-pointer">
              <input
                type="checkbox"
                defaultChecked={true}
                className="w-4 h-4 rounded text-teal-600 focus:ring-teal-500"
              />
              <span>All guest ID proofs physically verified in person at hotel reception counter</span>
            </label>
            <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100/70 px-2 py-0.5 rounded">
              Govt Norm Compliant
            </span>
          </div>

          {/* Optional: Collect Payment at Check-In if balance is pending */}
          {balanceDue > 0 && !isAlreadyCheckedIn && (
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-teal-700" />
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800">
                    Collect Payment / Advance at Check-in
                  </span>
                </div>
                <span className="text-xs font-bold text-rose-700">
                  Balance Pending: ₹{balanceDue}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={collectPaymentNow}
                    onChange={(e) => setCollectPaymentNow(e.target.checked)}
                    className="rounded text-teal-600"
                  />
                  <span>Record payment now during check-in</span>
                </label>
              </div>

              {collectPaymentNow && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={paymentAmount}
                      max={balanceDue}
                      onChange={(e) => setPaymentAmount(Number(e.target.value))}
                      className="w-full text-sm font-bold bg-white border border-slate-300 rounded-lg p-2 text-teal-900"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as PaymentMode)}
                      className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    >
                      <option value="upi">UPI / QR Code</option>
                      <option value="cash">Cash Counter</option>
                      <option value="card">Credit / Debit Card</option>
                      <option value="bank_transfer">Net Banking</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Reference / Txn ID
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI-984021"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full text-xs bg-white border border-slate-300 rounded-lg p-2 text-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer Actions */}
        <div className="bg-slate-50 border-t border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            {!isAlreadyCheckedIn && (
              <button
                type="button"
                onClick={() => handleFinalSubmit(true)}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <CheckCircle2 size={15} />
                <span>Submit {documents.length} ID{documents.length > 1 ? 's' : ''} &amp; Complete Check-In</span>
              </button>
            )}

            {isAlreadyCheckedIn && (
              <button
                type="button"
                onClick={() => handleFinalSubmit(false)}
                className="px-4 py-2 bg-teal-600 hover:bg-teal-700 active:bg-teal-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-sm transition-colors cursor-pointer"
              >
                <ShieldCheck size={15} />
                <span>Save &amp; Verify {documents.length} ID{documents.length > 1 ? 's' : ''}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Full-view Lightbox */}
      {previewImage && (
        <div 
          className="fixed inset-0 z-70 bg-black/90 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setPreviewImage(null)}
        >
          <div className="max-w-3xl max-h-[90vh] bg-white rounded-xl overflow-hidden p-2 shadow-2xl">
            <img src={previewImage} alt="Enlarged ID Document" className="w-full h-full object-contain" />
          </div>
        </div>
      )}
    </div>
  );
};
