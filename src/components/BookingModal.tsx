import React, { useState, useRef, useMemo, useEffect } from 'react';
import { 
  Room, 
  Booking, 
  BookingChannel, 
  IdType, 
  IdDocument, 
  Guest, 
  ID_TYPE_OPTIONS 
} from '../types';
import { sampleAadhaarFront, sampleAadhaarBack, samplePassportFront } from '../data/initialData';
import { getTodayDateStr, addDaysToStr } from '../utils/dateHelper';
import { 
  X, 
  Calendar, 
  User, 
  CreditCard, 
  ShieldCheck, 
  Upload, 
  Camera, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Phone, 
  Mail, 
  MapPin, 
  Check, 
  Clock, 
  Building, 
  ArrowRight, 
  ArrowLeft,
  Search,
  Plus,
  Zap,
  Tag,
  Eye,
  FileText,
  BedDouble,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';

export interface BookingDocItem extends IdDocument {
  id: string;
}

export interface RoomAllocation {
  roomId: string;
  guestName: string;
  adults: number;
  children: number;
  ratePerNight: number;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings: Booking[];
  initialRoomId?: string;
  initialDate?: string;
  initialCheckOutDate?: string;
  onSaveBooking: (booking: Booking | Booking[]) => void;
  existingBooking?: Booking | null;
  isLastMinuteFlashActive?: boolean;
  lastMinuteDiscountPercent?: number;
  hotelName?: string;
  initialBookingMode?: 'single' | 'multi';
}

const formatDisplayDate = (dStr: string) => {
  if (!dStr) return '';
  try {
    const parts = dStr.split('-');
    if (parts.length === 3) {
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parts[2].padStart(2, '0');
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${day} ${months[monthIdx] || parts[1]} ${year}`;
    }
  } catch {}
  return dStr;
};

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  rooms = [],
  bookings = [],
  initialRoomId,
  initialDate,
  initialCheckOutDate,
  onSaveBooking,
  existingBooking,
  isLastMinuteFlashActive = false,
  lastMinuteDiscountPercent = 15,
  hotelName = 'Big House Inn',
  initialBookingMode = 'single'
}) => {
  // Stepper State: 1 = Dates, 2 = Rooms, 3 = Booking Details
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(() => {
    if (existingBooking) return 3;
    if (initialRoomId && initialDate) return 2;
    return 1;
  });

  // Booking Mode: single vs multi
  const [bookingMode, setBookingMode] = useState<'single' | 'multi'>(() => {
    if (existingBooking?.groupId || ((existingBooking?.groupTotalRooms ?? 0) > 1)) {
      return 'multi';
    }
    return initialBookingMode || 'single';
  });

  // Stay & Date Range info
  const [checkInDate, setCheckInDate] = useState<string>(
    existingBooking?.checkInDate || initialDate || getTodayDateStr()
  );
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    if (existingBooking?.checkOutDate) return existingBooking.checkOutDate;
    if (initialCheckOutDate) return initialCheckOutDate;
    return addDaysToStr(initialDate || getTodayDateStr(), 1);
  });

  // Calculate nights
  const computeNights = () => {
    if (!checkInDate || !checkOutDate) return 1;
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return (!isNaN(diff) && diff > 0) ? diff : 1;
  };
  const nights = computeNights();

  // Helper to check availability for any room over the selected date range
  const checkRoomAvailability = (targetRoomId: string, inDate: string, outDate: string) => {
    if (!inDate || !outDate || inDate >= outDate) {
      return { isAvailable: false, conflict: null, reason: 'Invalid date range' };
    }
    const conflict = bookings.find(b => {
      if (b.status === 'cancelled') return false;
      if (existingBooking && b.id === existingBooking.id) return false;
      if (b.roomId !== targetRoomId) return false;
      return inDate < b.checkOutDate && outDate > b.checkInDate;
    });

    return {
      isAvailable: !conflict,
      conflict: conflict || null
    };
  };

  // Comprehensive availability evaluation for all rooms
  const roomAvailabilityList = useMemo(() => {
    return rooms.map(room => {
      const status = checkRoomAvailability(room.id, checkInDate, checkOutDate);
      return {
        room,
        isAvailable: status.isAvailable,
        conflict: status.conflict
      };
    });
  }, [rooms, bookings, checkInDate, checkOutDate, existingBooking]);

  const availableRooms = useMemo(() => {
    return roomAvailabilityList.filter(item => item.isAvailable).map(item => item.room);
  }, [roomAvailabilityList]);

  // Selected Room IDs (array supporting single or multi-room)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => {
    if (existingBooking?.roomId) return [existingBooking.roomId];
    if (initialRoomId) return [initialRoomId];
    const firstFree = rooms.find(r => checkRoomAvailability(r.id, checkInDate, checkOutDate).isAvailable);
    return firstFree ? [firstFree.id] : (rooms[0] ? [rooms[0].id] : []);
  });

  // Selected room object (primary)
  const primaryRoomId = selectedRoomIds[0] || '';
  const selectedRoom = rooms.find(r => r.id === primaryRoomId);

  // Custom rate per room (roomId -> nightly rate)
  const [roomRates, setRoomRates] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    const effectiveInDate = existingBooking?.checkInDate || initialDate || getTodayDateStr();
    const applyInitialFlash = isLastMinuteFlashActive && effectiveInDate === getTodayDateStr() && !existingBooking;

    rooms.forEach(r => {
      if (r.customRates && r.customRates[effectiveInDate] !== undefined && r.customRates[effectiveInDate] > 0) {
        map[r.id] = r.customRates[effectiveInDate];
      } else if (applyInitialFlash) {
        map[r.id] = Math.round(r.baseRate * (1 - (lastMinuteDiscountPercent || 15) / 100));
      } else {
        map[r.id] = r.baseRate;
      }
    });
    if (existingBooking?.roomId && existingBooking?.roomRatePerNight) {
      map[existingBooking.roomId] = existingBooking.roomRatePerNight;
    }
    return map;
  });

  // Guest Details State
  const [fullName, setFullName] = useState<string>(existingBooking?.guest?.fullName || '');
  const [phone, setPhone] = useState<string>(existingBooking?.guest?.phone || '');
  const [email, setEmail] = useState<string>(existingBooking?.guest?.email || '');
  const [arrivingFrom, setArrivingFrom] = useState<string>(existingBooking?.guest?.arrivingFrom || '');
  const [departingTo, setDepartingTo] = useState<string>(existingBooking?.guest?.departingTo || '');
  const [remarks, setRemarks] = useState<string>(existingBooking?.specialRequests || '');

  // Room Allocations for Multi-Room (occupant name, adults, kids, rate per room)
  const [roomAllocations, setRoomAllocations] = useState<Record<string, RoomAllocation>>(() => {
    const init: Record<string, RoomAllocation> = {};
    rooms.forEach(r => {
      init[r.id] = {
        roomId: r.id,
        guestName: existingBooking?.guest?.fullName || '',
        adults: 2,
        children: 0,
        ratePerNight: roomRates[r.id] || r.baseRate || 3500
      };
    });
    return init;
  });

  // Ensure allocations exist for any newly added room
  useEffect(() => {
    setRoomAllocations(prev => {
      const updated = { ...prev };
      let changed = false;
      selectedRoomIds.forEach((rId, idx) => {
        if (!updated[rId]) {
          const rm = rooms.find(r => r.id === rId);
          updated[rId] = {
            roomId: rId,
            guestName: idx === 0 ? fullName : '',
            adults: 2,
            children: 0,
            ratePerNight: roomRates[rId] || rm?.baseRate || 3500
          };
          changed = true;
        }
      });
      return changed ? updated : prev;
    });
  }, [selectedRoomIds, rooms, roomRates, fullName]);

  const updateRoomAllocation = (rId: string, field: keyof RoomAllocation, val: any) => {
    setRoomAllocations(prev => ({
      ...prev,
      [rId]: {
        ...(prev[rId] || { roomId: rId, guestName: '', adults: 2, children: 0, ratePerNight: 3500 }),
        [field]: val
      }
    }));
  };

  // Total room rate per night (computed from allocations)
  const totalRoomRatePerNight = useMemo(() => {
    if (selectedRoomIds.length === 0) return 0;
    return selectedRoomIds.reduce((sum, rId) => {
      const rate = roomAllocations[rId]?.ratePerNight !== undefined 
        ? roomAllocations[rId].ratePerNight 
        : (roomRates[rId] || 3500);
      return sum + rate;
    }, 0);
  }, [selectedRoomIds, roomAllocations, roomRates]);

  const subtotal = nights * totalRoomRatePerNight;

  // Room Type Filter
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState<string>('all');
  const roomTypes = useMemo(() => {
    const set = new Set<string>();
    rooms.forEach(r => set.add(r.type));
    return ['all', ...Array.from(set)];
  }, [rooms]);

  // Overall Occupancy Summary
  const totalAdults = useMemo(() => {
    if (bookingMode === 'single') return 2;
    return selectedRoomIds.reduce((sum, rId) => sum + (roomAllocations[rId]?.adults || 2), 0);
  }, [selectedRoomIds, roomAllocations, bookingMode]);

  const totalChildren = useMemo(() => {
    if (bookingMode === 'single') return 0;
    return selectedRoomIds.reduce((sum, rId) => sum + (roomAllocations[rId]?.children || 0), 0);
  }, [selectedRoomIds, roomAllocations, bookingMode]);

  // Booking details & channel
  const [channel, setChannel] = useState<BookingChannel>(existingBooking?.channel || 'walkin');
  const [channelRefId, setChannelRefId] = useState<string>(existingBooking?.channelRefId || '');

  // Financials & Payment
  const [advanceAmount, setAdvanceAmount] = useState<number>(() => {
    if (existingBooking?.payments && existingBooking.payments.length > 0) {
      return existingBooking.payments.reduce((sum, p) => sum + p.amount, 0);
    }
    return 0;
  });
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'ota_virtual_card'>('cash');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Discount
  const [discountValue, setDiscountValue] = useState<number>(existingBooking?.discountValue || 0);
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>('flat');
  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      return Math.round((subtotal * Math.min(100, discountValue)) / 100);
    }
    return Math.min(subtotal, discountValue);
  }, [discountValue, discountType, subtotal]);

  const totalAmount = Math.max(0, subtotal - discountAmount);
  const balanceDue = Math.max(0, totalAmount - advanceAmount);

  // ID Proof / KYC Documents State (supports both Front & Back)
  const [isKycExpanded, setIsKycExpanded] = useState<boolean>(
    Boolean(existingBooking?.guest?.idDocument?.idNumber || existingBooking?.documents?.length)
  );
  const [documents, setDocuments] = useState<BookingDocItem[]>(() => {
    if (existingBooking?.documents && existingBooking.documents.length > 0) {
      return existingBooking.documents.map((d, idx) => ({
        ...d,
        id: d.id || `doc-${Date.now()}-${idx}`
      }));
    }
    return [{
      id: 'doc-1',
      idType: 'aadhaar',
      idNumber: '',
      isVerified: false,
      uploadedAt: 'Due at Check-in',
      documentTitle: 'Primary Guest ID'
    }];
  });

  // Camera state for document snap
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturingDocIdx, setCapturingDocIdx] = useState<number>(0);
  const [cameraTarget, setCameraTarget] = useState<'front' | 'back'>('front');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [validationError, setValidationError] = useState<string>('');

  // Step 1: Quick duration presets
  const handleQuickDuration = (days: number) => {
    const newOutDate = addDaysToStr(checkInDate, days);
    setCheckOutDate(newOutDate);
  };

  // Toggle room selection
  const handleToggleRoom = (rId: string) => {
    const status = checkRoomAvailability(rId, checkInDate, checkOutDate);
    if (!status.isAvailable) {
      alert(`Cannot select this room: already booked by ${status.conflict?.guest.fullName || 'another guest'}.`);
      return;
    }

    if (bookingMode === 'single') {
      setSelectedRoomIds([rId]);
    } else {
      setSelectedRoomIds(prev => {
        if (prev.includes(rId)) {
          if (prev.length <= 1) return prev; // keep at least 1
          return prev.filter(id => id !== rId);
        } else {
          return [...prev, rId];
        }
      });
    }
  };

  // Quick Select All Available Rooms (for group bookings)
  const handleSelectAllAvailableRooms = () => {
    if (availableRooms.length === 0) {
      alert('No available rooms for the selected dates.');
      return;
    }
    setBookingMode('multi');
    setSelectedRoomIds(availableRooms.map(r => r.id));
  };

  // Single document file upload (front or back)
  const handleDocFileUpload = (e: React.ChangeEvent<HTMLInputElement>, docIdx: number, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const result = uploadEvent.target?.result as string;
        setDocuments(prev => {
          const copy = [...prev];
          if (copy[docIdx]) {
            copy[docIdx] = {
              ...copy[docIdx],
              [side === 'front' ? 'frontImageUrl' : 'backImageUrl']: result,
              isVerified: true,
              uploadedAt: new Date().toLocaleString()
            };
          }
          return copy;
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // Camera start & capture
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
      setCameraError('Webcam / Camera not accessible. You can upload a document file instead.');
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
        setDocuments(prev => {
          const copy = [...prev];
          if (copy[capturingDocIdx]) {
            copy[capturingDocIdx] = {
              ...copy[capturingDocIdx],
              [cameraTarget === 'front' ? 'frontImageUrl' : 'backImageUrl']: dataUrl,
              isVerified: true,
              uploadedAt: new Date().toLocaleString()
            };
          }
          return copy;
        });
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

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Quick Sample ID fillers
  const handleFillSampleAadhaar = (docIdx = 0) => {
    setDocuments(prev => {
      const copy = [...prev];
      if (copy[docIdx]) {
        copy[docIdx] = {
          ...copy[docIdx],
          idType: 'aadhaar',
          idNumber: '5482 9104 3821',
          frontImageUrl: sampleAadhaarFront,
          backImageUrl: sampleAadhaarBack,
          isVerified: true,
          uploadedAt: new Date().toLocaleString(),
          documentTitle: 'Primary Guest Aadhaar Card'
        };
      }
      return copy;
    });
  };

  const handleFillSamplePassport = (docIdx = 0) => {
    setDocuments(prev => {
      const copy = [...prev];
      if (copy[docIdx]) {
        copy[docIdx] = {
          ...copy[docIdx],
          idType: 'passport',
          idNumber: 'Z9182304',
          frontImageUrl: samplePassportFront,
          backImageUrl: undefined,
          isVerified: true,
          uploadedAt: new Date().toLocaleString(),
          documentTitle: 'Primary Guest Passport'
        };
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
        isVerified: false,
        uploadedAt: 'Due at Check-in',
        documentTitle: `Co-Guest #${nextIdx - 1} ID`
      }
    ]);
  };

  const handleRemoveDoc = (idx: number) => {
    if (documents.length <= 1) {
      setDocuments([{
        id: 'doc-1',
        idType: 'aadhaar',
        idNumber: '',
        frontImageUrl: undefined,
        backImageUrl: undefined,
        isVerified: false,
        uploadedAt: 'Due at Check-in',
        documentTitle: 'Primary Guest ID'
      }]);
      return;
    }
    setDocuments(prev => prev.filter((_, i) => i !== idx));
  };

  // Handle Submit Form
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setValidationError('');

    if (!checkInDate || !checkOutDate) {
      setValidationError('Please select valid check-in and check-out dates.');
      setActiveStep(1);
      return;
    }

    if (checkInDate >= checkOutDate) {
      setValidationError('Check-out date must be after check-in date.');
      setActiveStep(1);
      return;
    }

    if (selectedRoomIds.length === 0) {
      setValidationError('Please select at least 1 room.');
      setActiveStep(2);
      return;
    }

    if (!fullName.trim()) {
      setValidationError('Lead guest full name is required.');
      setActiveStep(3);
      return;
    }

    if (!phone.trim()) {
      setValidationError('Lead guest phone number is required.');
      setActiveStep(3);
      return;
    }

    // Build Guest object
    const preparedDocuments: IdDocument[] = documents.map(doc => ({
      ...doc,
      isVerified: Boolean(doc.idNumber?.trim() || doc.frontImageUrl),
      uploadedAt: doc.uploadedAt || (doc.idNumber ? new Date().toLocaleString() : 'Due at Check-in')
    }));

    const primaryGuest: Guest = {
      id: existingBooking?.guest?.id || `gst-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      arrivingFrom: arrivingFrom.trim() || undefined,
      departingTo: departingTo.trim() || undefined,
      country: 'India',
      nationality: 'Indian',
      purposeOfVisit: 'Tourism & Leisure',
      idDocument: preparedDocuments[0],
      idDocuments: preparedDocuments,
      previousStaysCount: existingBooking?.guest?.previousStaysCount || 0,
      totalSpent: (existingBooking?.guest?.totalSpent || 0) + totalAmount
    };

    // Booking code
    let code = existingBooking?.bookingCode;
    if (!code) {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
      code = `${yy}${mm}${dd}${randomSuffix}`;
    }

    if (selectedRoomIds.length === 1 && bookingMode === 'single') {
      const sRoomId = selectedRoomIds[0];
      const rm = rooms.find(r => r.id === sRoomId);
      const alloc = roomAllocations[sRoomId];
      const sRate = alloc?.ratePerNight || roomRates[sRoomId] || (rm?.baseRate || 3500);

      const bookingPayload: Booking = {
        id: existingBooking?.id || `bk-${Date.now()}`,
        bookingCode: code,
        roomId: sRoomId,
        roomNumber: rm?.number,
        groupId: existingBooking?.groupId || undefined,
        groupTotalRooms: 1,
        guest: primaryGuest,
        documents: preparedDocuments,
        checkInDate,
        checkOutDate,
        nights,
        adults: alloc?.adults || 2,
        children: alloc?.children || 0,
        channel,
        channelRefId: channelRefId.trim() || undefined,
        roomRatePerNight: Number(sRate),
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountType: discountAmount > 0 ? discountType : undefined,
        discountReason: discountAmount > 0 ? 'Direct Booking Concession' : undefined,
        taxRatePercent: existingBooking?.taxRatePercent ?? 0,
        extraCharges: existingBooking?.extraCharges || [],
        payments: advanceAmount > 0 ? [
          {
            id: `pay-${Date.now()}`,
            amount: Number(advanceAmount),
            mode: paymentMode,
            reference: paymentRef.trim() || undefined,
            date: new Date().toLocaleString()
          }
        ] : [],
        status: existingBooking?.status || 'confirmed',
        specialRequests: remarks.trim() || undefined,
        createdAt: existingBooking?.createdAt || new Date().toLocaleString()
      };

      onSaveBooking(bookingPayload);
    } else {
      // Multi-room group booking
      const groupId = existingBooking?.groupId || `grp-${Date.now()}`;
      const numRooms = selectedRoomIds.length;
      const baseRoomDiscount = numRooms > 0 ? Math.floor(discountAmount / numRooms) : 0;

      const multiPayloads: Booking[] = selectedRoomIds.map((rId, idx) => {
        const rm = rooms.find(r => r.id === rId);
        const alloc = roomAllocations[rId];
        const rRate = alloc?.ratePerNight || roomRates[rId] || (rm?.baseRate || 3500);
        const isPrimary = idx === 0;

        const roomGuestName = alloc?.guestName?.trim() || fullName.trim();
        const roomGuest: Guest = {
          ...primaryGuest,
          id: isPrimary ? primaryGuest.id : `gst-${Date.now()}-${idx}`,
          fullName: roomGuestName,
          phone: isPrimary ? primaryGuest.phone : (primaryGuest.phone || ''),
          email: primaryGuest.email
        };

        return {
          id: (existingBooking && idx === 0) ? existingBooking.id : `bk-${Date.now()}-${idx}`,
          bookingCode: `${code}-${rm?.number || (idx + 1)}`,
          roomId: rId,
          roomNumber: rm?.number,
          groupId,
          groupTotalRooms: selectedRoomIds.length,
          guest: roomGuest,
          documents: isPrimary ? preparedDocuments : (preparedDocuments[idx] ? [preparedDocuments[idx]] : preparedDocuments),
          checkInDate,
          checkOutDate,
          nights,
          adults: alloc?.adults || 2,
          children: alloc?.children || 0,
          channel,
          channelRefId: channelRefId.trim() || undefined,
          roomRatePerNight: Number(rRate),
          discountAmount: baseRoomDiscount > 0 ? baseRoomDiscount : undefined,
          taxRatePercent: existingBooking?.taxRatePercent ?? 0,
          extraCharges: [],
          payments: (isPrimary && advanceAmount > 0) ? [
            {
              id: `pay-${Date.now()}-${idx}`,
              amount: Number(advanceAmount),
              mode: paymentMode,
              reference: paymentRef.trim() || `GRP-ADV-${Date.now().toString().slice(-4)}`,
              date: new Date().toLocaleString()
            }
          ] : [],
          status: existingBooking?.status || 'confirmed',
          specialRequests: remarks.trim() 
            ? `${remarks.trim()} [Group: ${numRooms} Rooms]` 
            : `Group Booking: ${numRooms} Rooms (${selectedRoomIds.map(id => rooms.find(r => r.id === id)?.number || id).join(', ')})`,
          createdAt: existingBooking?.createdAt || new Date().toLocaleString()
        };
      });

      onSaveBooking(multiPayloads);
    }

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header with Title, Mode Switcher & Stepper Tabs */}
        <div className="bg-[#1e293b] text-white px-5 py-4 shrink-0 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center font-bold">
              {bookingMode === 'multi' ? <Building size={22} /> : <BedDouble size={22} />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-tight">
                  {existingBooking 
                    ? 'Edit Booking' 
                    : bookingMode === 'multi' 
                    ? '🏢 Multi-Room Group Booking' 
                    : '+ New Room Reservation'}
                </h2>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                  {hotelName}
                </span>
              </div>
              <p className="text-xs text-slate-300">
                {bookingMode === 'multi' 
                  ? `Group reservation for ${selectedRoomIds.length} room${selectedRoomIds.length > 1 ? 's' : ''}` 
                  : 'Single room reservation for front desk'}
              </p>
            </div>
          </div>

          {/* Booking Mode Switcher: Single vs Multi-Room */}
          <div className="flex items-center gap-2">
            <div className="flex items-center bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setBookingMode('single');
                  if (selectedRoomIds.length > 1) {
                    setSelectedRoomIds([selectedRoomIds[0]]);
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  bookingMode === 'single'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <BedDouble size={14} />
                <span>Single Room</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setBookingMode('multi');
                  if (selectedRoomIds.length === 1 && availableRooms.length > 1) {
                    // Preselect another room if available to guide user
                    const nextRoom = availableRooms.find(r => r.id !== selectedRoomIds[0]);
                    if (nextRoom) {
                      setSelectedRoomIds(prev => [...prev, nextRoom.id]);
                    }
                  }
                }}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                  bookingMode === 'multi'
                    ? 'bg-teal-600 text-white shadow-xs'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <Building size={14} />
                <span>Multi-Room Group ({selectedRoomIds.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Close"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Stepper Navigation Bar */}
        <div className="bg-slate-100/80 px-5 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveStep(1)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStep === 1 
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">1</span>
              <span>Stay Dates</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(2)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStep === 2 
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">2</span>
              <span>Select Rooms ({selectedRoomIds.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveStep(3)}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeStep === 3 
                  ? 'bg-teal-700 text-white shadow-xs' 
                  : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-50'
              }`}
            >
              <span className="w-4 h-4 rounded-full bg-black/10 flex items-center justify-center text-[10px]">3</span>
              <span>Details &amp; Payment</span>
            </button>
          </div>

          {/* Quick Active Summary Pill */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <span className="text-teal-800 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Calendar size={12} />
              <span>{nights}N ({checkInDate.slice(5)} to {checkOutDate.slice(5)})</span>
            </span>
            <span className="text-teal-900 bg-teal-100/70 border border-teal-300 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Building size={12} />
              <span>{selectedRoomIds.length} Room{selectedRoomIds.length > 1 ? 's' : ''}</span>
            </span>
            <span className="text-slate-900 font-extrabold bg-white border border-slate-300 px-2 py-0.5 rounded-full">
              ₹{totalAmount}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 space-y-5">
          {validationError && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold text-rose-700 flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{validationError}</span>
            </div>
          )}

          {/* STEP 1: DATES */}
          {activeStep === 1 && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Multi-Room Notification Banner */}
              {bookingMode === 'multi' && (
                <div className="p-3 bg-teal-50 border border-teal-300 rounded-xl flex items-center justify-between text-xs text-teal-900">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-teal-700 shrink-0" />
                    <span className="font-bold">
                      Multi-Room Group Booking Mode is Active. You will be able to select multiple rooms on the next step!
                    </span>
                  </div>
                  <span className="px-2 py-0.5 bg-teal-700 text-white rounded font-bold text-[11px]">
                    Group Mode
                  </span>
                </div>
              )}

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                  <div className="flex items-center gap-2">
                    <Calendar size={18} className="text-teal-700" />
                    <h3 className="text-sm font-bold text-slate-900">Select Stay Dates &amp; Duration</h3>
                  </div>
                  <span className="text-xs font-extrabold text-teal-800 bg-teal-100 px-2.5 py-1 rounded-full">
                    {nights} Night{nights > 1 ? 's' : ''} Stay
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Check-in Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Check-out Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={addDaysToStr(checkInDate, 1)}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full px-3.5 py-2.5 text-sm font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 focus:ring-1 focus:ring-teal-600 outline-hidden"
                      required
                    />
                  </div>
                </div>

                {/* Quick Stay Presets */}
                <div className="pt-2">
                  <span className="text-xs font-bold text-slate-600 block mb-2">Quick Duration Presets:</span>
                  <div className="flex flex-wrap items-center gap-2">
                    {[1, 2, 3, 4, 5, 7].map(days => (
                      <button
                        key={days}
                        type="button"
                        onClick={() => handleQuickDuration(days)}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                          nights === days
                            ? 'bg-teal-700 text-white border-teal-700 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {days} Night{days > 1 ? 's' : ''}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-end">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Continue to Select Rooms</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: ROOM SELECTION */}
          {activeStep === 2 && (
            <div className="space-y-4 animate-in fade-in-50 duration-150">
              {/* Multi-Room Group Action Bar */}
              <div className="bg-teal-50/80 border border-teal-200 p-3 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-teal-950 flex items-center gap-1.5">
                    <Building size={15} className="text-teal-800" />
                    <span>Multi-Room Selection:</span>
                  </span>
                  <span className="text-teal-800 font-semibold">
                    {bookingMode === 'multi' 
                      ? 'Click on any available rooms to add or remove them from this group.'
                      : 'Switch to Multi-Room to select 2 or more rooms.'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSelectAllAvailableRooms}
                    className="px-3 py-1 bg-teal-800 hover:bg-teal-900 text-white font-bold rounded-lg shadow-2xs transition-colors cursor-pointer"
                  >
                    + Select All Available ({availableRooms.length} Rooms)
                  </button>

                  {selectedRoomIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setSelectedRoomIds([selectedRoomIds[0]])}
                      className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Reset to 1 Room
                    </button>
                  )}
                </div>
              </div>

              {/* Room Type Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-700">Filter Type:</span>
                  <div className="flex flex-wrap items-center gap-1.5">
                    {roomTypes.map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setSelectedRoomTypeFilter(t)}
                        className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-colors cursor-pointer border ${
                          selectedRoomTypeFilter === t
                            ? 'bg-teal-700 text-white border-teal-700'
                            : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                        }`}
                      >
                        {t === 'all' ? 'All Types' : t}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="text-xs font-semibold text-slate-600">
                  <span>Available: </span>
                  <strong className="text-emerald-700 font-bold">{availableRooms.length}</strong>
                  <span> / {rooms.length} Rooms</span>
                </div>
              </div>

              {/* Rooms Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-h-[50vh] overflow-y-auto p-1">
                {rooms
                  .filter(r => selectedRoomTypeFilter === 'all' || r.type === selectedRoomTypeFilter)
                  .map(room => {
                    const status = checkRoomAvailability(room.id, checkInDate, checkOutDate);
                    const isSelected = selectedRoomIds.includes(room.id);
                    const rate = roomRates[room.id] !== undefined ? roomRates[room.id] : room.baseRate;

                    return (
                      <div
                        key={room.id}
                        onClick={() => status.isAvailable && handleToggleRoom(room.id)}
                        className={`p-3.5 rounded-xl border-2 transition-all cursor-pointer relative ${
                          isSelected
                            ? 'border-teal-700 bg-teal-50/80 shadow-md ring-2 ring-teal-500/20'
                            : status.isAvailable
                            ? 'border-slate-200 bg-white hover:border-teal-400 hover:shadow-xs'
                            : 'border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <span className="font-mono text-base font-extrabold text-slate-900">
                              Room {room.number}
                            </span>
                            <div className="text-xs text-slate-500 font-semibold">{room.type}</div>
                          </div>
                          {isSelected ? (
                            <div className="w-6 h-6 rounded-full bg-teal-700 text-white flex items-center justify-center shadow-xs">
                              <Check size={14} strokeWidth={3} />
                            </div>
                          ) : status.isAvailable ? (
                            <div className="w-5 h-5 rounded-full border-2 border-slate-300 text-transparent flex items-center justify-center">
                              +
                            </div>
                          ) : null}
                        </div>

                        <div className="mt-3 pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                          <span className="font-extrabold text-slate-900">₹{rate}/N</span>
                          <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded ${
                            status.isAvailable 
                              ? 'bg-emerald-100 text-emerald-800' 
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {status.isAvailable ? (isSelected ? 'Selected' : 'Available') : 'Booked'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Selected Rooms Summary Tray */}
              <div className="bg-slate-900 text-white p-3.5 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs shadow-md">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold text-teal-300 flex items-center gap-1.5">
                    <Building size={15} />
                    <span>{selectedRoomIds.length} Room{selectedRoomIds.length > 1 ? 's' : ''} Selected:</span>
                  </span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {selectedRoomIds.map(rId => {
                      const rm = rooms.find(r => r.id === rId);
                      return (
                        <span key={rId} className="px-2 py-0.5 bg-slate-800 border border-teal-500/40 text-teal-200 rounded-md font-mono font-bold text-[11px] flex items-center gap-1">
                          Room {rm?.number || rId}
                          {selectedRoomIds.length > 1 && (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleToggleRoom(rId);
                              }}
                              className="text-slate-400 hover:text-rose-400 ml-1 cursor-pointer"
                              title="Remove"
                            >
                              ×
                            </button>
                          )}
                        </span>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div>
                    <span className="text-slate-400 mr-1">Rate:</span>
                    <strong className="text-white">₹{totalRoomRatePerNight}/N</strong>
                  </div>
                  <div className="border-l border-slate-700 pl-3">
                    <span className="text-slate-400 mr-1">Total ({nights}N):</span>
                    <strong className="text-teal-300 font-extrabold text-sm">₹{subtotal}</strong>
                  </div>
                </div>
              </div>

              {/* Navigation Bar with BACK button */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(1)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Dates</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (selectedRoomIds.length === 0) {
                      alert('Please select at least 1 room.');
                      return;
                    }
                    setActiveStep(3);
                  }}
                  disabled={selectedRoomIds.length === 0}
                  className="px-6 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
                >
                  <span>Continue to Details &amp; Payment</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: BOOKING DETAILS */}
          {activeStep === 3 && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              {/* Summary Banner */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3 text-xs">
                <div>
                  <div className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{formatDisplayDate(checkInDate)}</span>
                    <span className="text-slate-400">→</span>
                    <span>{formatDisplayDate(checkOutDate)}</span>
                  </div>
                  <div className="text-slate-500 font-medium text-[11px] mt-0.5">
                    {nights} night{nights > 1 ? 's' : ''} stay
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-3 py-1 bg-teal-100 text-teal-900 rounded-full font-bold text-xs flex items-center gap-1.5">
                    <Building size={13} />
                    <span>
                      {selectedRoomIds.length} Room{selectedRoomIds.length > 1 ? 's' : ''} ({selectedRoomIds.map(id => rooms.find(r => r.id === id)?.number || id).join(', ')})
                    </span>
                  </span>
                  <span className="text-slate-600 font-semibold text-xs">
                    Total {totalAdults + totalChildren} guest(s)
                  </span>
                </div>
              </div>

              {/* Lead Guest Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <User size={15} className="text-teal-700" />
                  <span>Primary / Lead Guest Details</span>
                </h3>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="e.g. Amit Sharma (Group Leader)"
                    className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email (Optional)
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="guest@gmail.com"
                      className="w-full px-3 py-2 text-xs font-medium text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Arriving From (Optional)
                    </label>
                    <input
                      type="text"
                      value={arrivingFrom}
                      onChange={(e) => setArrivingFrom(e.target.value)}
                      placeholder="e.g. Jaipur"
                      className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Remarks / Notes (Optional)
                    </label>
                    <input
                      type="text"
                      value={remarks}
                      onChange={(e) => setRemarks(e.target.value)}
                      placeholder="Special requests or group notes"
                      className="w-full px-3 py-2 text-xs text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                    />
                  </div>
                </div>
              </div>

              {/* DEDICATED MULTI-ROOM BREAKDOWN & CUSTOMIZATION (WHEN 2+ ROOMS) */}
              {selectedRoomIds.length > 1 && (
                <div className="bg-teal-50/60 border border-teal-200 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between border-b border-teal-200/80 pb-2">
                    <div className="flex items-center gap-2">
                      <Layers size={16} className="text-teal-800" />
                      <h4 className="text-xs font-extrabold text-teal-950 uppercase tracking-wider">
                        Multi-Room Breakdown &amp; Individual Room Rates ({selectedRoomIds.length} Rooms)
                      </h4>
                    </div>
                    <span className="text-[11px] text-teal-800 font-semibold">
                      You can customize occupant names and rates per room
                    </span>
                  </div>

                  <div className="space-y-2.5">
                    {selectedRoomIds.map((rId, idx) => {
                      const rm = rooms.find(r => r.id === rId);
                      const alloc = roomAllocations[rId] || { roomId: rId, guestName: '', adults: 2, children: 0, ratePerNight: rm?.baseRate || 3500 };
                      const isPrimary = idx === 0;

                      return (
                        <div 
                          key={rId} 
                          className="bg-white border border-teal-200/90 rounded-xl p-3 shadow-2xs grid grid-cols-1 sm:grid-cols-4 gap-3 items-center text-xs"
                        >
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-extrabold text-sm text-slate-900">
                                Room {rm?.number || rId}
                              </span>
                              {isPrimary && (
                                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-teal-800 text-white rounded">
                                  Lead
                                </span>
                              )}
                            </div>
                            <span className="text-slate-500 text-[11px]">{rm?.type}</span>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Occupant / Guest Name
                            </label>
                            <input
                              type="text"
                              value={alloc.guestName}
                              onChange={(e) => updateRoomAllocation(rId, 'guestName', e.target.value)}
                              placeholder={isPrimary ? (fullName || 'Lead Guest') : `Guest for Room ${rm?.number}`}
                              className="w-full px-2 py-1 text-xs font-semibold text-slate-900 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-teal-600 outline-hidden"
                            />
                          </div>

                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Adults</label>
                              <input
                                type="number"
                                min={1}
                                max={6}
                                value={alloc.adults}
                                onChange={(e) => updateRoomAllocation(rId, 'adults', Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full px-1.5 py-1 text-xs text-center font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded outline-hidden"
                              />
                            </div>
                            <div>
                              <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Kids</label>
                              <input
                                type="number"
                                min={0}
                                max={4}
                                value={alloc.children}
                                onChange={(e) => updateRoomAllocation(rId, 'children', Math.max(0, parseInt(e.target.value, 10) || 0))}
                                className="w-full px-1.5 py-1 text-xs text-center font-bold text-slate-900 bg-slate-50 border border-slate-300 rounded outline-hidden"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                              Rate / Night (₹)
                            </label>
                            <input
                              type="number"
                              min={0}
                              step={50}
                              value={alloc.ratePerNight}
                              onChange={(e) => updateRoomAllocation(rId, 'ratePerNight', Math.max(0, parseInt(e.target.value, 10) || 0))}
                              className="w-full px-2 py-1 text-xs font-extrabold text-teal-900 bg-slate-50 border border-slate-300 rounded focus:bg-white focus:border-teal-600 outline-hidden"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Booking Channel & Financials Card */}
              <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-3 shadow-2xs">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-2 flex items-center gap-1.5">
                  <CreditCard size={15} className="text-teal-700" />
                  <span>Channel &amp; Group Financials</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Channel</label>
                    <select
                      value={channel}
                      onChange={(e) => setChannel(e.target.value as BookingChannel)}
                      className="w-full px-3 py-2 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                    >
                      <option value="walkin">Walk-in Direct</option>
                      <option value="phone">Phone / WhatsApp Booking</option>
                      <option value="makemytrip">MakeMyTrip</option>
                      <option value="booking_com">Booking.com</option>
                      <option value="agoda">Agoda</option>
                      <option value="airbnb">Airbnb</option>
                      <option value="goibibo">Goibibo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">OTA / Reference ID</label>
                    <input
                      type="text"
                      value={channelRefId}
                      onChange={(e) => setChannelRefId(e.target.value)}
                      placeholder="e.g. GRP-9102"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg focus:border-teal-600 outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Group Discount (₹)</label>
                    <input
                      type="number"
                      min={0}
                      max={subtotal}
                      value={discountValue}
                      onChange={(e) => setDiscountValue(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      placeholder="Optional group discount"
                      className="w-full px-3 py-2 text-xs font-semibold text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div>
                    <span className="block text-slate-500 font-semibold mb-0.5">Combined Rate / Night:</span>
                    <span className="text-sm font-extrabold text-slate-900">₹{totalRoomRatePerNight}</span>
                    <span className="text-[10px] text-slate-400 block">for {selectedRoomIds.length} room(s)</span>
                  </div>

                  <div>
                    <span className="block text-slate-500 font-semibold mb-0.5">Total Amount ({nights}N):</span>
                    <span className="text-sm font-extrabold text-teal-800">₹{totalAmount}</span>
                    {discountAmount > 0 && (
                      <span className="text-[10px] text-emerald-700 font-bold block">₹{discountAmount} discount applied</span>
                    )}
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-0.5 flex items-center justify-between">
                      <span>Advance Received:</span>
                      <button
                        type="button"
                        onClick={() => setAdvanceAmount(totalAmount)}
                        className="text-[10px] text-teal-700 hover:underline font-bold"
                      >
                        Full
                      </button>
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={totalAmount}
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Math.max(0, parseInt(e.target.value, 10) || 0))}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md outline-hidden"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-700 font-bold mb-0.5">Payment Mode:</label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full px-2.5 py-1.5 text-xs font-bold text-slate-900 bg-white border border-slate-300 rounded-md outline-hidden"
                    >
                      <option value="cash">Cash</option>
                      <option value="upi">UPI (GPay / PhonePe)</option>
                      <option value="card">Card (POS)</option>
                      <option value="ota_virtual_card">OTA Virtual Card</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* ID Proof / KYC Collapsible Option */}
              <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setIsKycExpanded(!isKycExpanded)}
                  className="w-full p-4 flex items-center justify-between text-left hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={16} className="text-teal-700" />
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Guest ID &amp; KYC Proof (Front &amp; Back)
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      {isKycExpanded ? 'Click to collapse' : 'Aadhaar / Passport / DL'}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-teal-800">
                    {isKycExpanded ? '− Hide' : '+ Attach ID'}
                  </span>
                </button>

                {isKycExpanded && (
                  <div className="p-4 border-t border-slate-100 bg-slate-50/50 space-y-4">
                    {/* Live Camera Stream */}
                    {isCameraActive && (
                      <div className="bg-slate-900 rounded-xl p-3 text-white space-y-2">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-teal-400 flex items-center gap-1">
                            <Camera size={14} /> Live Camera — Capturing {cameraTarget.toUpperCase()} of ID
                          </span>
                          <button type="button" onClick={stopCamera} className="text-slate-400 hover:text-white">
                            <X size={15} />
                          </button>
                        </div>
                        <div className="aspect-video max-h-48 bg-black rounded overflow-hidden flex items-center justify-center">
                          <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
                        </div>
                        <div className="flex justify-end gap-2">
                          <button type="button" onClick={stopCamera} className="px-3 py-1 bg-slate-800 text-xs rounded">Cancel</button>
                          <button type="button" onClick={capturePhoto} className="px-3 py-1 bg-teal-600 text-white font-bold text-xs rounded">Snap</button>
                        </div>
                      </div>
                    )}

                    {documents.map((doc, docIdx) => (
                      <div key={doc.id || `doc-${docIdx}`} className="border border-slate-200 rounded-xl p-3 bg-white space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-800">
                            {docIdx === 0 ? 'Primary Guest ID' : `Co-Guest Document #${docIdx}`}
                          </span>
                          <div className="flex items-center gap-2">
                            {docIdx === 0 && (
                              <button
                                type="button"
                                onClick={() => handleFillSampleAadhaar(0)}
                                className="px-2 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-bold rounded border border-teal-200 cursor-pointer"
                              >
                                + Sample Aadhaar
                              </button>
                            )}
                            {documents.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveDoc(docIdx)}
                                className="text-rose-600 text-xs font-bold flex items-center gap-0.5 cursor-pointer"
                              >
                                <Trash2 size={12} /> Remove
                              </button>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">ID Type</label>
                            <select
                              value={doc.idType}
                              onChange={(e) => {
                                const val = e.target.value as IdType;
                                setDocuments(prev => {
                                  const c = [...prev];
                                  c[docIdx] = { ...c[docIdx], idType: val };
                                  return c;
                                });
                              }}
                              className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg outline-hidden"
                            >
                              <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                              <option value="passport">Passport</option>
                              <option value="driving_license">Driving License</option>
                              <option value="voter_id">Voter ID</option>
                              <option value="pan_card">PAN Card</option>
                              <option value="national_id">Government Photo ID</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-[11px] font-bold text-slate-700 mb-1">ID Number</label>
                            <input
                              type="text"
                              value={doc.idNumber}
                              onChange={(e) => {
                                const val = e.target.value;
                                setDocuments(prev => {
                                  const c = [...prev];
                                  c[docIdx] = { ...c[docIdx], idNumber: val };
                                  return c;
                                });
                              }}
                              placeholder="e.g. 5482 9104 3821"
                              className="w-full px-2.5 py-1.5 text-xs font-mono font-bold text-slate-900 bg-white border border-slate-300 rounded-lg outline-hidden"
                            />
                          </div>
                        </div>

                        {/* Side-by-side Front & Back photo blocks */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                          {/* Front Side */}
                          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>Front Side Photo</span>
                              {doc.frontImageUrl && (
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">✓ Attached</span>
                              )}
                            </div>
                            {doc.frontImageUrl ? (
                              <div className="relative h-28 bg-white rounded border border-slate-200 flex items-center justify-center p-1 group">
                                <img src={doc.frontImageUrl} alt="Front ID" className="max-h-full max-w-full object-contain cursor-zoom-in" onClick={() => setPreviewImage(doc.frontImageUrl || null)} />
                                <div className="absolute top-1 right-1 flex gap-1 bg-black/60 p-0.5 rounded">
                                  <button type="button" onClick={() => setPreviewImage(doc.frontImageUrl || null)} className="p-1 text-white hover:text-teal-300"><Eye size={12} /></button>
                                  <button type="button" onClick={() => setDocuments(prev => { const c = [...prev]; c[docIdx] = { ...c[docIdx], frontImageUrl: undefined }; return c; })} className="p-1 text-white hover:text-rose-400"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-28 bg-white rounded border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 text-center">
                                <span className="text-[11px] text-slate-400">Front side scan</span>
                                <div className="flex gap-1.5 mt-2">
                                  <label className="px-2 py-1 bg-teal-700 text-white text-[11px] font-bold rounded cursor-pointer">
                                    <Upload size={11} className="inline mr-1" /> Browse
                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, docIdx, 'front')} />
                                  </label>
                                  <button type="button" onClick={() => startCamera(docIdx, 'front')} className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-slate-300 cursor-pointer">
                                    <Camera size={11} className="inline mr-1" /> Camera
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Back Side */}
                          <div className="border border-slate-200 rounded-lg p-2.5 bg-slate-50 space-y-2">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                              <span>Back Side Photo</span>
                              {doc.backImageUrl && (
                                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">✓ Attached</span>
                              )}
                            </div>
                            {doc.backImageUrl ? (
                              <div className="relative h-28 bg-white rounded border border-slate-200 flex items-center justify-center p-1 group">
                                <img src={doc.backImageUrl} alt="Back ID" className="max-h-full max-w-full object-contain cursor-zoom-in" onClick={() => setPreviewImage(doc.backImageUrl || null)} />
                                <div className="absolute top-1 right-1 flex gap-1 bg-black/60 p-0.5 rounded">
                                  <button type="button" onClick={() => setPreviewImage(doc.backImageUrl || null)} className="p-1 text-white hover:text-teal-300"><Eye size={12} /></button>
                                  <button type="button" onClick={() => setDocuments(prev => { const c = [...prev]; c[docIdx] = { ...c[docIdx], backImageUrl: undefined }; return c; })} className="p-1 text-white hover:text-rose-400"><Trash2 size={12} /></button>
                                </div>
                              </div>
                            ) : (
                              <div className="h-28 bg-white rounded border border-dashed border-slate-300 flex flex-col items-center justify-center p-2 text-center">
                                <span className="text-[11px] text-slate-400">Back side scan</span>
                                <div className="flex gap-1.5 mt-2">
                                  <label className="px-2 py-1 bg-teal-700 text-white text-[11px] font-bold rounded cursor-pointer">
                                    <Upload size={11} className="inline mr-1" /> Browse
                                    <input type="file" accept="image/*,.pdf" className="hidden" onChange={(e) => handleDocFileUpload(e, docIdx, 'back')} />
                                  </label>
                                  <button type="button" onClick={() => startCamera(docIdx, 'back')} className="px-2 py-1 bg-slate-100 text-slate-700 text-[11px] font-bold rounded border border-slate-300 cursor-pointer">
                                    <Camera size={11} className="inline mr-1" /> Camera
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={handleAddAnotherDoc}
                      className="w-full py-2 border border-dashed border-slate-300 hover:border-teal-600 text-slate-700 hover:text-teal-800 rounded-lg text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Plus size={13} />
                      <span>+ Add Another Co-Guest Document</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Bottom Actions with BACK to Rooms */}
              <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => setActiveStep(2)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-bold rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={14} />
                  <span>Back to Rooms</span>
                </button>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    className="px-7 py-2.5 bg-teal-700 hover:bg-teal-800 active:bg-teal-900 text-white text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer flex items-center gap-2"
                  >
                    <Check size={16} />
                    <span>
                      {existingBooking 
                        ? 'Save Changes' 
                        : selectedRoomIds.length > 1 
                        ? `Confirm ${selectedRoomIds.length} Rooms Booking` 
                        : 'Confirm Booking'}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          )}

        </form>

        {/* Lightbox Modal */}
        {previewImage && (
          <div 
            className="fixed inset-0 z-70 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 cursor-pointer"
            onClick={() => setPreviewImage(null)}
          >
            <div className="max-w-2xl max-h-[85vh] bg-white rounded-xl p-2 relative shadow-2xl" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-3 right-3 p-1.5 bg-black/70 hover:bg-black text-white rounded-full z-10"
              >
                <X size={18} />
              </button>
              <img 
                src={previewImage} 
                alt="Document Preview" 
                className="max-h-[80vh] max-w-full object-contain rounded-lg"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
