import React, { useState, useRef, useMemo } from 'react';
import { 
  Room, 
  Booking, 
  BookingChannel, 
  IdType, 
  IdDocument, 
  Guest 
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
  Eye, 
  Sparkles,
  RefreshCw,
  Search,
  Lock,
  Check,
  AlertTriangle,
  Bed,
  ArrowRight,
  Clock,
  Building,
  Tag,
  Percent,
  BadgePercent
} from 'lucide-react';

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
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings,
  initialRoomId,
  initialDate,
  initialCheckOutDate,
  onSaveBooking,
  existingBooking
}) => {
  if (!isOpen) return null;

  // Active step tab: 'stay' | 'guest_id' | 'billing'
  const [activeTab, setActiveTab] = useState<'stay' | 'guest_id' | 'billing'>('stay');

  // Stay & Date Range info
  const [checkInDate, setCheckInDate] = useState<string>(
    existingBooking?.checkInDate || initialDate || getTodayDateStr()
  );
  const [checkOutDate, setCheckOutDate] = useState<string>(() => {
    if (existingBooking?.checkOutDate) return existingBooking.checkOutDate;
    if (initialCheckOutDate) return initialCheckOutDate;
    return addDaysToStr(initialDate || getTodayDateStr(), 1);
  });

  // Room search state
  const [selectedRoomTypeFilter, setSelectedRoomTypeFilter] = useState<string>('all');
  const [availabilitySearchCount, setAvailabilitySearchCount] = useState<number>(0);
  const [searchNotification, setSearchNotification] = useState<string>('');

  // Helper to check availability for any room over the selected date range
  const checkRoomAvailability = (targetRoomId: string, inDate: string, outDate: string) => {
    if (!inDate || !outDate || inDate >= outDate) {
      return { isAvailable: false, conflict: null, reason: 'Invalid date range' };
    }
    const conflict = bookings.find(b => {
      if (b.status === 'cancelled') return false;
      if (existingBooking && b.id === existingBooking.id) return false;
      if (b.roomId !== targetRoomId) return false;
      // Standard overlap check: inDate < checkOutDate && outDate > checkInDate
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

  const occupiedRooms = useMemo(() => {
    return roomAvailabilityList.filter(item => !item.isAvailable);
  }, [roomAvailabilityList]);

  // Booking Selection Mode: 'single' (1 Room) or 'multi' (Multiple Rooms under 1 Guest Name)
  const [bookingMode, setBookingMode] = useState<'single' | 'multi'>(() => {
    if (existingBooking?.groupId || (existingBooking?.groupTotalRooms && existingBooking.groupTotalRooms > 1)) {
      return 'multi';
    }
    return 'single';
  });

  // Selected Room IDs (array of strings supporting multi-room allocation)
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>(() => {
    if (existingBooking?.roomId) return [existingBooking.roomId];
    if (initialRoomId) return [initialRoomId];
    // Otherwise pick first available room if one exists
    const firstFree = rooms.find(r => {
      const st = checkRoomAvailability(r.id, checkInDate, checkOutDate);
      return st.isAvailable;
    });
    return firstFree ? [firstFree.id] : (rooms[0] ? [rooms[0].id] : []);
  });

  // Custom rate per room (roomId -> nightly rate)
  const [roomRates, setRoomRates] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    rooms.forEach(r => {
      map[r.id] = r.baseRate;
    });
    if (existingBooking?.roomId && existingBooking.roomRatePerNight) {
      map[existingBooking.roomId] = existingBooking.roomRatePerNight;
    }
    return map;
  });

  // Primary room helper for backward-compatibility
  const roomId = selectedRoomIds[0] || '';
  const selectedRoom = rooms.find(r => r.id === roomId);

  // Check if any of the chosen rooms are blocked
  const selectedRoomsStatus = useMemo(() => {
    if (selectedRoomIds.length === 0) return { isAvailable: false, conflicts: [] };
    const conflicts = selectedRoomIds
      .map(id => ({ id, status: checkRoomAvailability(id, checkInDate, checkOutDate) }))
      .filter(item => !item.status.isAvailable);

    return {
      isAvailable: conflicts.length === 0,
      conflicts
    };
  }, [selectedRoomIds, checkInDate, checkOutDate, bookings, existingBooking]);

  const isCurrentRoomBlocked = !selectedRoomsStatus.isAvailable;
  const currentRoomConflict = selectedRoomsStatus.conflicts[0]?.status.conflict || null;

  const [adults, setAdults] = useState<number>(existingBooking?.adults || 2);
  const [children, setChildren] = useState<number>(existingBooking?.children || 0);
  const [channel, setChannel] = useState<BookingChannel>(existingBooking?.channel || 'walkin');
  const [channelRefId, setChannelRefId] = useState<string>(existingBooking?.channelRefId || '');
  const [specialRequests, setSpecialRequests] = useState<string>(existingBooking?.specialRequests || '');

  // Calculate sum of room rates for all selected rooms
  const totalRoomRatePerNight = useMemo(() => {
    if (selectedRoomIds.length === 0) return 0;
    return selectedRoomIds.reduce((sum, rId) => {
      const rm = rooms.find(r => r.id === rId);
      const rate = roomRates[rId] !== undefined ? roomRates[rId] : (rm?.baseRate || 3000);
      return sum + rate;
    }, 0);
  }, [selectedRoomIds, roomRates, rooms]);

  const roomRate = totalRoomRatePerNight;

  // Quick duration presets (1N, 2N, 3N, 5N, 7N)
  const handleQuickDuration = (days: number) => {
    const d = new Date(checkInDate);
    d.setDate(d.getDate() + days);
    const newOutDate = d.toISOString().split('T')[0];
    setCheckOutDate(newOutDate);
    setSearchNotification(`Updated stay to ${days} night${days > 1 ? 's' : ''}`);
    setTimeout(() => setSearchNotification(''), 2500);
  };

  // Action to toggle room in selection or set as single room
  const handleSelectAndBlockRoom = (targetRoomId: string) => {
    const status = checkRoomAvailability(targetRoomId, checkInDate, checkOutDate);
    if (!status.isAvailable) {
      alert(`Cannot select this room: Room is already booked by ${status.conflict?.guest.fullName || 'another guest'}.`);
      return;
    }

    if (bookingMode === 'single') {
      setSelectedRoomIds([targetRoomId]);
      const rm = rooms.find(r => r.id === targetRoomId);
      if (rm) {
        setSearchNotification(`✓ Room ${rm.name} (${rm.type}) selected & blocked!`);
        setTimeout(() => setSearchNotification(''), 3000);
      }
    } else {
      setSelectedRoomIds(prev => {
        if (prev.includes(targetRoomId)) {
          if (prev.length <= 1) {
            alert('At least 1 room must remain selected for this guest booking.');
            return prev;
          }
          const filtered = prev.filter(id => id !== targetRoomId);
          setSearchNotification(`Room deselected. ${filtered.length} room(s) currently selected.`);
          setTimeout(() => setSearchNotification(''), 2500);
          return filtered;
        } else {
          const updated = [...prev, targetRoomId];
          const rm = rooms.find(r => r.id === targetRoomId);
          setSearchNotification(`✓ Room ${rm?.name || targetRoomId} added! Total: ${updated.length} rooms under this guest.`);
          setTimeout(() => setSearchNotification(''), 3000);
          return updated;
        }
      });
    }
  };

  // Remove room from selection
  const handleRemoveRoomFromSelection = (targetRoomId: string) => {
    if (selectedRoomIds.length <= 1) {
      alert('At least 1 room must remain selected.');
      return;
    }
    setSelectedRoomIds(prev => prev.filter(id => id !== targetRoomId));
  };

  // Update specific room rate
  const handleUpdateSpecificRoomRate = (targetRoomId: string, newRate: number) => {
    setRoomRates(prev => ({
      ...prev,
      [targetRoomId]: Math.max(0, newRate)
    }));
  };

  // Auto pick first available room if conflict occurs
  const handleAutoSelectAvailableRoom = () => {
    if (availableRooms.length > 0) {
      handleSelectAndBlockRoom(availableRooms[0].id);
    }
  };

  // Explicit Search Available Rooms trigger
  const handleTriggerSearch = () => {
    setAvailabilitySearchCount(prev => prev + 1);
    setSearchNotification(
      `Search Complete: ${availableRooms.length} room${availableRooms.length === 1 ? '' : 's'} available for ${nights} night${nights > 1 ? 's' : ''}!`
    );
    setTimeout(() => setSearchNotification(''), 3000);
  };

  // Guest Details
  const [fullName, setFullName] = useState<string>(existingBooking?.guest.fullName || '');
  const [phone, setPhone] = useState<string>(existingBooking?.guest.phone || '');
  const [email, setEmail] = useState<string>(existingBooking?.guest.email || '');
  const [address, setAddress] = useState<string>(existingBooking?.guest.address || '');
  const [city, setCity] = useState<string>(existingBooking?.guest.city || '');
  const [state, setState] = useState<string>(existingBooking?.guest.state || '');
  const [nationality, setNationality] = useState<string>(existingBooking?.guest.nationality || 'Indian');
  const [purposeOfVisit, setPurposeOfVisit] = useState<string>(existingBooking?.guest.purposeOfVisit || 'Tourism & Leisure');
  const [vehicleNumber, setVehicleNumber] = useState<string>(existingBooking?.guest.vehicleNumber || '');
  const [emergencyContact, setEmergencyContact] = useState<string>(existingBooking?.guest.emergencyContact || '');

  // ID Proof Details (Hotel Workflow: ID is submitted during check-in)
  const [idSubmissionPolicy, setIdSubmissionPolicy] = useState<'at_checkin' | 'submit_now'>(
    existingBooking?.guest.idDocument.isVerified ? 'submit_now' : 'at_checkin'
  );
  const [idType, setIdType] = useState<IdType>(existingBooking?.guest.idDocument.idType || 'aadhaar');
  const [idNumber, setIdNumber] = useState<string>(
    existingBooking?.guest.idDocument.idNumber && existingBooking.guest.idDocument.idNumber !== 'Pending at Check-in'
      ? existingBooking.guest.idDocument.idNumber 
      : ''
  );
  const [frontImageUrl, setFrontImageUrl] = useState<string>(existingBooking?.guest.idDocument.frontImageUrl || '');
  const [backImageUrl, setBackImageUrl] = useState<string>(existingBooking?.guest.idDocument.backImageUrl || '');
  const [expiryDate, setExpiryDate] = useState<string>(existingBooking?.guest.idDocument.expiryDate || '');
  const [isVerified, setIsVerified] = useState<boolean>(existingBooking?.guest.idDocument.isVerified ?? false);
  const [idNotes, setIdNotes] = useState<string>(
    existingBooking?.guest.idDocument.notes || 'Customer ID to be submitted upon arrival at check-in'
  );

  // Camera capture state
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [capturingSide, setCapturingSide] = useState<'front' | 'back'>('front');
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Discount Option & Concession
  const [discountType, setDiscountType] = useState<'flat' | 'percentage'>(
    existingBooking?.discountType || 'flat'
  );
  const [discountValue, setDiscountValue] = useState<number>(
    existingBooking?.discountValue !== undefined
      ? existingBooking.discountValue
      : (existingBooking?.discountAmount || 0)
  );
  const [discountReason, setDiscountReason] = useState<string>(
    existingBooking?.discountReason || ''
  );

  // Billing (GST Optional: 5% or 0%)
  const [applyGst, setApplyGst] = useState<boolean>(
    existingBooking !== undefined ? ((existingBooking.taxRatePercent || 0) > 0) : true
  );
  const taxRate = applyGst ? 5 : 0;
  const [advanceAmount, setAdvanceAmount] = useState<number>(
    existingBooking?.payments.reduce((sum, p) => sum + p.amount, 0) || 0
  );
  const [paymentMode, setPaymentMode] = useState<'cash' | 'upi' | 'card' | 'ota_virtual_card'>('upi');
  const [paymentRef, setPaymentRef] = useState<string>('');

  // Calculate nights
  const computeNights = () => {
    const start = new Date(checkInDate).getTime();
    const end = new Date(checkOutDate).getTime();
    const diff = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff || 1);
  };
  const nights = computeNights();
  const subtotal = nights * roomRate;

  // Calculate discount deduction
  const discountAmount = useMemo(() => {
    if (!discountValue || discountValue <= 0) return 0;
    if (discountType === 'percentage') {
      const pct = Math.min(100, Math.max(0, discountValue));
      return Math.round((subtotal * pct) / 100);
    }
    return Math.min(subtotal, Math.max(0, discountValue));
  }, [discountType, discountValue, subtotal]);

  // Taxable subtotal after discount deduction
  const taxableSubtotal = Math.max(0, subtotal - discountAmount);

  // GST (Optional: 5% or 0%)
  const taxes = applyGst ? Math.round((taxableSubtotal * 5) / 100) : 0;
  const totalAmount = taxableSubtotal + taxes;
  const balanceDue = Math.max(0, totalAmount - advanceAmount);

  // Update room rate when room changes
  const handleRoomChange = (newRoomId: string) => {
    handleSelectAndBlockRoom(newRoomId);
  };

  // Quick fill sample Aadhaar
  const fillSampleAadhaar = () => {
    setIdSubmissionPolicy('submit_now');
    setIdType('aadhaar');
    setIdNumber('5482 9104 3821');
    setFrontImageUrl(sampleAadhaarFront);
    setBackImageUrl(sampleAadhaarBack);
    setIsVerified(true);
    setIdNotes('Biometric QR Code verified via UIDAI Portal');
    if (!fullName) setFullName('Nizamuddin Saifi');
    if (!city) setCity('New Delhi');
    if (!phone) setPhone('+91 98112 44332');
  };

  // Quick fill sample Passport
  const fillSamplePassport = () => {
    setIdSubmissionPolicy('submit_now');
    setIdType('passport');
    setIdNumber('Z9182304');
    setFrontImageUrl(samplePassportFront);
    setBackImageUrl('');
    setExpiryDate('2031-09-18');
    setIsVerified(true);
    setIdNotes('Indian Passport verified by Receptionist');
    if (!fullName) setFullName('Tanu Shukla');
    if (!city) setCity('Lucknow');
    if (!phone) setPhone('+91 94500 12890');
  };

  // Quick fill sample Voter ID
  const fillSampleVoter = () => {
    setIdSubmissionPolicy('submit_now');
    setIdType('voter_id');
    setIdNumber('WBF2910482');
    setIsVerified(true);
    setIdNotes('Election Commission of India Voter ID card verified');
    if (!fullName) setFullName('Rajeev Sengupta');
    if (!city) setCity('Kolkata');
    if (!phone) setPhone('+91 98301 22910');
  };

  // Quick fill sample Driving License
  const fillSampleDL = () => {
    setIdSubmissionPolicy('submit_now');
    setIdType('driving_license');
    setIdNumber('DL-042019008129');
    setExpiryDate('2038-08-15');
    setIsVerified(true);
    setIdNotes('State Transport Authority Driving License verified');
    if (!fullName) setFullName('Amitabh Verma');
    if (!city) setCity('New Delhi');
    if (!phone) setPhone('+91 98100 44219');
  };

  // Quick set Pending at Check-in
  const fillPendingCheckIn = () => {
    setIdSubmissionPolicy('at_checkin');
    setIdNumber('');
    setIsVerified(false);
    setIdNotes('Customer ID to be submitted upon arrival at front desk check-in');
  };

  // File Upload Handlers (Front / Back ID)
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, side: 'front' | 'back') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (uploadEvent) => {
      const dataUrl = uploadEvent.target?.result as string;
      if (side === 'front') {
        setFrontImageUrl(dataUrl);
      } else {
        setBackImageUrl(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  // Camera Handlers
  const startCamera = async (side: 'front' | 'back') => {
    setCapturingSide(side);
    setIsCameraActive(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 } }
      });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('Camera access error:', err);
      alert('Camera access not granted or not available. You can also upload photos or use sample ID cards.');
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const photoDataUrl = canvas.toDataURL('image/jpeg', 0.9);
      if (capturingSide === 'front') {
        setFrontImageUrl(photoDataUrl);
      } else {
        setBackImageUrl(photoDataUrl);
      }
    }
    stopCamera();
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  // Final Form Submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Verify Date Range
    if (!checkInDate || !checkOutDate || checkInDate >= checkOutDate) {
      setActiveTab('stay');
      alert('Please select a valid date range (Check-out date must be after Check-in date).');
      return;
    }

    // 2. Verify Room Selected and Not Blocked
    if (selectedRoomIds.length === 0) {
      setActiveTab('stay');
      alert('Please search and select at least one available room to block for this reservation.');
      return;
    }

    for (const rId of selectedRoomIds) {
      const roomStatus = checkRoomAvailability(rId, checkInDate, checkOutDate);
      if (!roomStatus.isAvailable) {
        setActiveTab('stay');
        const rm = rooms.find(r => r.id === rId);
        const conflictMsg = roomStatus.conflict 
          ? `Room ${rm?.name || rId} is ALREADY OCCUPIED by ${roomStatus.conflict.guest.fullName} from ${roomStatus.conflict.checkInDate} to ${roomStatus.conflict.checkOutDate}.`
          : `Room ${rm?.name || rId} is currently blocked for these dates.`;
        alert(`⚠️ Room Conflict Detected!\n\n${conflictMsg}\n\nPlease remove this room or select another available room from the list below.`);
        return;
      }
    }

    if (!fullName.trim()) {
      setActiveTab('guest_id');
      alert('Please enter guest full name');
      return;
    }

    const isAtCheckin = idSubmissionPolicy === 'at_checkin' && !idNumber.trim();

    if (!idNumber.trim() && idSubmissionPolicy === 'submit_now') {
      setActiveTab('guest_id');
      alert('Please enter customer ID number (Aadhaar / Passport / DL) or select "Submit ID at Check-In".');
      return;
    }

    const idDoc: IdDocument = {
      idType,
      idNumber: isAtCheckin ? 'Pending at Check-in' : idNumber.trim(),
      frontImageUrl: frontImageUrl || undefined,
      backImageUrl: backImageUrl || undefined,
      expiryDate: expiryDate || undefined,
      isVerified: isAtCheckin ? false : isVerified,
      uploadedAt: isAtCheckin ? 'Due at Check-in' : new Date().toLocaleString(),
      notes: isAtCheckin 
        ? (idNotes || 'Customer ID to be submitted upon arrival at front desk check-in')
        : idNotes
    };

    const guest: Guest = {
      id: existingBooking?.guest.id || `gst-${Date.now()}`,
      fullName: fullName.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
      city: city.trim(),
      state: state.trim(),
      country: 'India',
      nationality: nationality.trim(),
      purposeOfVisit,
      vehicleNumber,
      emergencyContact,
      idDocument: idDoc,
      previousStaysCount: existingBooking?.guest.previousStaysCount || 0,
      totalSpent: (existingBooking?.guest.totalSpent || 0) + totalAmount
    };

    // Auto-generate booking code if new (Matches TripMakerz format: 16-digit reference like 2609160502199534)
    let code = existingBooking?.bookingCode;
    if (!code) {
      const now = new Date();
      const yy = String(now.getFullYear()).slice(-2);
      const mm = String(now.getMonth() + 1).padStart(2, '0');
      const dd = String(now.getDate()).padStart(2, '0');
      const randomSuffix = Math.floor(1000000000 + Math.random() * 9000000000);
      code = `${yy}${mm}${dd}${randomSuffix}`;
    }

    if (selectedRoomIds.length === 1) {
      // Single Room Booking
      const singleRoomId = selectedRoomIds[0];
      const rm = rooms.find(r => r.id === singleRoomId);
      const singleRate = roomRates[singleRoomId] !== undefined ? roomRates[singleRoomId] : (rm?.baseRate || 3000);

      const bookingPayload: Booking = {
        id: existingBooking?.id || `bk-${Date.now()}`,
        bookingCode: code,
        roomId: singleRoomId,
        roomNumber: rm?.number,
        groupId: existingBooking?.groupId || undefined,
        groupTotalRooms: 1,
        guest,
        checkInDate,
        checkOutDate,
        nights,
        adults,
        children,
        channel,
        channelRefId: channelRefId.trim() || undefined,
        roomRatePerNight: Number(singleRate),
        discountAmount: discountAmount > 0 ? discountAmount : undefined,
        discountType: discountAmount > 0 ? discountType : undefined,
        discountValue: discountAmount > 0 ? Number(discountValue) : undefined,
        discountReason: discountAmount > 0 ? (discountReason.trim() || undefined) : undefined,
        taxRatePercent: applyGst ? 5 : 0, // Optional GST
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
        specialRequests,
        createdAt: existingBooking?.createdAt || new Date().toLocaleString()
      };

      onSaveBooking(bookingPayload);
    } else {
      // Multi-Room Booking under 1 Guest Name
      const groupId = existingBooking?.groupId || `grp-${Date.now()}`;
      const numRooms = selectedRoomIds.length;
      const baseRoomDiscount = numRooms > 0 ? Math.floor(discountAmount / numRooms) : 0;
      const remainderDiscount = numRooms > 0 ? (discountAmount % numRooms) : 0;

      const multiPayloads: Booking[] = selectedRoomIds.map((rId, idx) => {
        const rm = rooms.find(r => r.id === rId);
        const rRate = roomRates[rId] !== undefined ? roomRates[rId] : (rm?.baseRate || 3000);
        const isPrimary = idx === 0;
        const roomDiscount = idx === 0 ? baseRoomDiscount + remainderDiscount : baseRoomDiscount;

        return {
          id: (existingBooking && idx === 0) ? existingBooking.id : `bk-${Date.now()}-${idx}`,
          bookingCode: `${code}-${rm?.number || (idx + 1)}`,
          roomId: rId,
          roomNumber: rm?.number,
          groupId,
          groupTotalRooms: selectedRoomIds.length,
          guest,
          checkInDate,
          checkOutDate,
          nights,
          adults: Math.max(1, Math.round(adults / selectedRoomIds.length)),
          children: Math.round(children / selectedRoomIds.length),
          channel,
          channelRefId: channelRefId.trim() || undefined,
          roomRatePerNight: Number(rRate),
          discountAmount: roomDiscount > 0 ? roomDiscount : undefined,
          discountType: discountAmount > 0 ? discountType : undefined,
          discountValue: discountAmount > 0 ? Number(discountValue) : undefined,
          discountReason: discountAmount > 0 ? (discountReason.trim() || undefined) : undefined,
          taxRatePercent: applyGst ? 5 : 0, // Optional GST
          extraCharges: [],
          payments: (isPrimary && advanceAmount > 0) ? [
            {
              id: `pay-${Date.now()}-${idx}`,
              amount: Number(advanceAmount),
              mode: paymentMode,
              reference: paymentRef.trim() || undefined,
              date: new Date().toLocaleString(),
              notes: `Multi-Room Group Advance (Total ${selectedRoomIds.length} rooms for ${guest.fullName})`
            }
          ] : [],
          status: existingBooking?.status || 'confirmed',
          specialRequests: [
            specialRequests.trim(),
            `[Multi-Room Group: Room ${idx + 1} of ${selectedRoomIds.length} for ${guest.fullName}]`
          ].filter(Boolean).join(' • '),
          createdAt: existingBooking?.createdAt || new Date().toLocaleString(),
          notes: `Multi-Room Group: ${selectedRoomIds.length} rooms booked under 1 guest (${guest.fullName})`
        };
      });

      onSaveBooking(multiPayloads);
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-3 md:p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[96vh] sm:max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold tracking-tight">
                {existingBooking ? 'Edit Reservation & KYC ID' : 'New Reservation & Guest KYC ID Registration'}
              </h2>
              <span className="text-[10px] sm:text-xs bg-teal-500/20 text-teal-300 font-semibold px-2 py-0.5 rounded border border-teal-500/40">
                Front Desk
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 mt-0.5">
              Manage room allocation, save customer ID proofs (Aadhaar/Passport), and track OTA channel source
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-100 px-3 sm:px-6 pt-2 sm:pt-3 flex border-b border-slate-200 gap-1 sm:gap-2 shrink-0 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('stay')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-t-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'stay'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Calendar size={14} />
            <span>1. Stay &amp; Room Allocation</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('guest_id')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-t-lg transition-all relative shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'guest_id'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <ShieldCheck size={14} className="text-emerald-700" />
            <span>2. Guest KYC &amp; Customer ID</span>
            {idNumber && (
              <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block ml-0.5"></span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('billing')}
            className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 text-xs font-bold rounded-t-lg transition-all shrink-0 whitespace-nowrap cursor-pointer ${
              activeTab === 'billing'
                ? 'bg-white text-teal-900 border-t-2 border-teal-600 shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <CreditCard size={14} />
            <span>3. Billing &amp; Advance</span>
          </button>
        </div>

        {/* Main Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-3.5 sm:p-6 space-y-4 sm:space-y-6">
          {/* TAB 1: STAY & ROOM ALLOCATION (DATE RANGE -> SEARCH ROOMS -> BLOCK ROOM) */}
          {activeTab === 'stay' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* STEP 1: DATE RANGE SELECTION & SEARCH BAR */}
              <div className="bg-gradient-to-r from-slate-900 to-teal-950 text-white p-5 rounded-2xl shadow-md border border-slate-800 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-700/80 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-400/40">
                      1
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white tracking-wide">
                        Select Date Range &amp; Search Available Rooms
                      </h3>
                      <p className="text-xs text-slate-300">
                        Specify reservation dates to search live inventory and block available rooms
                      </p>
                    </div>
                  </div>

                  {/* Stay Duration Badge */}
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-teal-600/30 text-teal-300 border border-teal-500/40 rounded-full text-xs font-bold flex items-center gap-1.5">
                      <Clock size={13} />
                      {nights} {nights === 1 ? 'Night' : 'Nights'} Stay
                    </span>
                  </div>
                </div>

                {/* Date Inputs & Search Trigger Button */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                  {/* Check-in Date */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Calendar size={13} className="text-teal-400" />
                      Check-in Date *
                    </label>
                    <input
                      type="date"
                      value={checkInDate}
                      onChange={(e) => {
                        const newIn = e.target.value;
                        setCheckInDate(newIn);
                        if (newIn >= checkOutDate) {
                          const nextD = new Date(newIn);
                          nextD.setDate(nextD.getDate() + 1);
                          setCheckOutDate(nextD.toISOString().split('T')[0]);
                        }
                      }}
                      className="w-full text-sm font-bold bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                      required
                    />
                  </div>

                  {/* Check-out Date */}
                  <div className="sm:col-span-4">
                    <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                      <Calendar size={13} className="text-teal-400" />
                      Check-out Date *
                    </label>
                    <input
                      type="date"
                      value={checkOutDate}
                      min={checkInDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full text-sm font-bold bg-slate-800 border border-slate-700 text-white rounded-xl p-2.5 focus:ring-2 focus:ring-teal-400 focus:border-teal-400"
                      required
                    />
                  </div>

                  {/* Search Room Availability Button */}
                  <div className="sm:col-span-4">
                    <button
                      type="button"
                      id="btn-search-available-rooms"
                      onClick={handleTriggerSearch}
                      className="w-full h-10.5 px-4 bg-teal-500 hover:bg-teal-400 active:bg-teal-600 text-slate-950 font-bold text-xs md:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Search size={16} strokeWidth={2.5} />
                      <span>Search Available Rooms</span>
                    </button>
                  </div>
                </div>

                {/* Quick Night Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-xs text-slate-400 font-medium">Quick Stay Duration:</span>
                  {[
                    { label: '1 Night', days: 1 },
                    { label: '2 Nights', days: 2 },
                    { label: '3 Nights', days: 3 },
                    { label: '5 Nights', days: 5 },
                    { label: '7 Nights (1 Wk)', days: 7 },
                  ].map(preset => (
                    <button
                      key={preset.days}
                      type="button"
                      onClick={() => handleQuickDuration(preset.days)}
                      className={`px-2.5 py-1 text-xs rounded-lg font-semibold transition-all border ${
                        nights === preset.days
                          ? 'bg-teal-500 text-slate-950 border-teal-400 shadow-2xs font-bold'
                          : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                      }`}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>

                {/* Search Feedback Notification */}
                {searchNotification && (
                  <div className="p-2.5 bg-teal-900/60 border border-teal-500/50 rounded-lg text-xs font-semibold text-teal-200 flex items-center gap-2 animate-in fade-in duration-200">
                    <CheckCircle2 size={15} className="text-teal-400 shrink-0" />
                    <span>{searchNotification}</span>
                  </div>
                )}
              </div>

              {/* STEP 2: AVAILABLE & BLOCKED ROOM RESULTS ("KAUN KAUNSA ROOM AVAILABLE H") */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-white space-y-4 shadow-2xs">
                {/* Section Header & Summary Badges */}
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center font-bold text-xs">
                        2
                      </div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Room Inventory &amp; Availability Matrix
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Showing live room occupancy for {checkInDate} to {checkOutDate} ({nights} {nights === 1 ? 'night' : 'nights'})
                    </p>
                  </div>

                  {/* Summary Badges */}
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                      {availableRooms.length} Available to Block
                    </span>
                    <span className="px-2.5 py-1 bg-rose-50 text-rose-800 border border-rose-300 rounded-lg text-xs font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
                      {occupiedRooms.length} Blocked / Booked
                    </span>
                  </div>
                </div>

                {/* Multi-Room Mode Selector Banner */}
                <div className="flex flex-wrap items-center justify-between gap-2.5 p-3 bg-slate-900 text-white rounded-xl">
                  <div className="flex items-center gap-2">
                    <Building size={16} className="text-teal-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-slate-200">
                        Room Allocation Mode:
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Ek hi guest ke naam par 2 ya zyada rooms add karne ke liye &ldquo;Multi-Room&rdquo; select karein
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-slate-800 p-1 rounded-lg border border-slate-700">
                    <button
                      type="button"
                      onClick={() => {
                        setBookingMode('single');
                        if (selectedRoomIds.length > 1) {
                          setSelectedRoomIds([selectedRoomIds[0]]);
                        }
                      }}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                        bookingMode === 'single'
                          ? 'bg-teal-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      Single Room (1 Room)
                    </button>
                    <button
                      type="button"
                      onClick={() => setBookingMode('multi')}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                        bookingMode === 'multi'
                          ? 'bg-teal-500 text-slate-950 shadow-xs'
                          : 'text-slate-300 hover:text-white'
                      }`}
                    >
                      <Sparkles size={13} className={bookingMode === 'multi' ? 'text-slate-950' : 'text-teal-400'} />
                      <span>Multi-Room (1 Guest • Multi Rooms)</span>
                      <span className="px-1.5 py-0.2 bg-teal-900/60 text-teal-200 rounded text-[10px] font-bold">
                        {selectedRoomIds.length}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Selected Rooms Tray */}
                {selectedRoomIds.length > 0 && (
                  <div className="p-3 bg-teal-50/80 border border-teal-200 rounded-xl space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 size={16} className="text-teal-700" />
                        <span className="text-xs font-bold text-teal-950">
                          Selected Rooms for {fullName.trim() || 'Guest'} ({selectedRoomIds.length} {selectedRoomIds.length === 1 ? 'Room' : 'Rooms'} Selected):
                        </span>
                      </div>
                      <div className="text-xs font-bold text-teal-900">
                        Combined Rate: ₹{totalRoomRatePerNight.toLocaleString()}/night ({nights} {nights === 1 ? 'Night' : 'Nights'} = ₹{subtotal.toLocaleString()})
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      {selectedRoomIds.map((rId) => {
                        const rm = rooms.find(r => r.id === rId);
                        const rate = roomRates[rId] !== undefined ? roomRates[rId] : (rm?.baseRate || 3000);
                        return (
                          <div
                            key={rId}
                            className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-teal-300 shadow-2xs text-xs"
                          >
                            <span className="font-bold text-slate-900">
                              Room {rm?.number || rId}
                            </span>
                            <span className="text-slate-500 text-[11px]">
                              ({rm?.type})
                            </span>
                            <span className="font-semibold text-teal-800 font-mono">
                              ₹{rate}/N
                            </span>
                            {selectedRoomIds.length > 1 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveRoomFromSelection(rId)}
                                className="p-0.5 hover:bg-rose-50 text-slate-400 hover:text-rose-600 rounded transition-colors cursor-pointer"
                                title="Remove this room from selection"
                              >
                                <X size={13} />
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Filter Chips */}
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-semibold mr-1">Filter Rooms:</span>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomTypeFilter('all')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      selectedRoomTypeFilter === 'all'
                        ? 'bg-slate-900 text-white shadow-2xs'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    All Rooms ({rooms.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomTypeFilter('available_only')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      selectedRoomTypeFilter === 'available_only'
                        ? 'bg-emerald-700 text-white shadow-2xs'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    🟢 Available Only ({availableRooms.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedRoomTypeFilter('blocked_only')}
                    className={`px-3 py-1 rounded-lg font-bold transition-colors ${
                      selectedRoomTypeFilter === 'blocked_only'
                        ? 'bg-rose-700 text-white shadow-2xs'
                        : 'bg-rose-50 text-rose-800 hover:bg-rose-100 border border-rose-200'
                    }`}
                  >
                    🔴 Blocked Only ({occupiedRooms.length})
                  </button>
                  {Array.from(new Set(rooms.map(r => r.type))).map(type => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setSelectedRoomTypeFilter(type)}
                      className={`px-3 py-1 rounded-lg font-semibold transition-colors ${
                        selectedRoomTypeFilter === type
                          ? 'bg-teal-800 text-white shadow-2xs'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Room Cards Grid (Available vs Blocked Rooms) */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-1">
                  {rooms
                    .filter(room => {
                      if (selectedRoomTypeFilter === 'available_only') {
                        return availableRooms.some(r => r.id === room.id);
                      }
                      if (selectedRoomTypeFilter === 'blocked_only') {
                        return occupiedRooms.some(item => item.room.id === room.id);
                      }
                      if (selectedRoomTypeFilter !== 'all') {
                        return room.type === selectedRoomTypeFilter;
                      }
                      return true;
                    })
                    .map(room => {
                      const availItem = roomAvailabilityList.find(item => item.room.id === room.id);
                      const isAvail = availItem?.isAvailable ?? false;
                      const conflict = availItem?.conflict;
                      const isSelected = selectedRoomIds.includes(room.id);
                      const customRate = roomRates[room.id] !== undefined ? roomRates[room.id] : room.baseRate;

                      if (isAvail) {
                        return (
                          <div
                            key={room.id}
                            className={`rounded-xl border p-4 flex flex-col justify-between transition-all ${
                              isSelected
                                ? 'border-2 border-teal-600 bg-teal-50/50 shadow-md ring-2 ring-teal-500/20'
                                : 'border-slate-200 bg-white hover:border-teal-400 hover:shadow-sm'
                            }`}
                          >
                            <div className="space-y-2">
                              {/* Top Bar: Room Name & Available Tag */}
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-base text-slate-900 flex items-center gap-1.5">
                                  <Bed size={16} className={isSelected ? 'text-teal-700' : 'text-slate-600'} />
                                  {room.name}
                                </span>
                                {isSelected ? (
                                  <span className="px-2 py-0.5 bg-teal-700 text-white text-[10px] font-extrabold uppercase tracking-wide rounded-full shadow-2xs flex items-center gap-1">
                                    <Check size={11} strokeWidth={3} />
                                    <span>Selected</span>
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-emerald-300">
                                    🟢 Available
                                  </span>
                                )}
                              </div>

                              {/* Details */}
                              <div className="text-xs text-slate-600 space-y-1">
                                <div className="font-semibold text-slate-800">{room.type} • Floor {room.floor}</div>
                                <div className="text-slate-500 text-[11px] truncate">
                                  {room.bedType} • Max {room.capacity} Guests • AC
                                </div>
                              </div>

                              {/* Pricing */}
                              <div className="pt-2 border-t border-slate-100 flex items-baseline justify-between">
                                <div>
                                  <span className="text-xs text-slate-500">Tariff: </span>
                                  <span className="text-sm font-bold text-slate-900">₹{customRate}</span>
                                  <span className="text-[11px] text-slate-500">/night</span>
                                </div>
                                <div className="text-xs font-semibold text-teal-800">
                                  Total: ₹{(customRate * nights).toLocaleString()}
                                </div>
                              </div>
                            </div>

                            {/* Action Button: Block / Select Room */}
                            <div className="pt-3">
                              {isSelected ? (
                                <button
                                  type="button"
                                  onClick={() => handleSelectAndBlockRoom(room.id)}
                                  className="w-full py-2 px-3 bg-teal-800 hover:bg-rose-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition-colors cursor-pointer group/btn"
                                  title="Click to remove from selection"
                                >
                                  <Check size={15} strokeWidth={2.5} className="group-hover/btn:hidden" />
                                  <X size={15} strokeWidth={2.5} className="hidden group-hover/btn:inline" />
                                  <span className="group-hover/btn:hidden">
                                    {selectedRoomIds.length > 1 ? `✓ Added (${selectedRoomIds.length} Rooms)` : '✓ Selected & Blocked'}
                                  </span>
                                  <span className="hidden group-hover/btn:inline">
                                    Click to Remove
                                  </span>
                                </button>
                              ) : (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => handleSelectAndBlockRoom(room.id)}
                                    className="flex-1 py-2 px-3 bg-white hover:bg-teal-700 text-teal-800 hover:text-white border border-teal-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                                  >
                                    <span>{bookingMode === 'multi' ? '+ Add to Multi-Room' : 'Select Room'}</span>
                                    <ArrowRight size={13} />
                                  </button>
                                  {bookingMode === 'single' && (
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setBookingMode('multi');
                                        if (!selectedRoomIds.includes(room.id)) {
                                          setSelectedRoomIds(prev => [...prev, room.id]);
                                        }
                                        setSearchNotification(`Switched to Multi-Room mode! Room ${room.name} added.`);
                                        setTimeout(() => setSearchNotification(''), 3000);
                                      }}
                                      className="py-2 px-2.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-300 rounded-lg text-xs font-bold transition-colors cursor-pointer shrink-0"
                                      title="Add this room to multi-room booking"
                                    >
                                      + Multi
                                    </button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      } else {
                        // Room is Blocked / Occupied
                        return (
                          <div
                            key={room.id}
                            className="rounded-xl border border-rose-200 bg-rose-50/30 p-4 flex flex-col justify-between opacity-85"
                          >
                            <div className="space-y-2">
                              {/* Top Bar: Room Name & Blocked Tag */}
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-base text-slate-700 flex items-center gap-1.5">
                                  <Lock size={15} className="text-rose-600" />
                                  {room.name}
                                </span>
                                <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-[10px] font-extrabold uppercase tracking-wide rounded-full border border-rose-300">
                                  🔴 Blocked / Booked
                                </span>
                              </div>

                              <div className="text-xs text-slate-600">
                                <div className="font-semibold text-slate-700">{room.type} • Floor {room.floor}</div>
                              </div>

                              {/* Conflict Info */}
                              <div className="p-2 bg-white/90 border border-rose-200 rounded-lg text-[11px] text-slate-700 space-y-0.5">
                                <div className="font-bold text-rose-900 truncate">
                                  Booked by: {conflict?.guest.fullName || 'Guest'}
                                </div>
                                <div className="text-slate-500">
                                  Source: <span className="font-semibold uppercase">{conflict?.channel || 'OTA'}</span> (#{conflict?.bookingCode})
                                </div>
                                <div className="text-slate-600 font-medium">
                                  Stay: {conflict?.checkInDate} to {conflict?.checkOutDate}
                                </div>
                              </div>
                            </div>

                            {/* Disabled Block Button */}
                            <div className="pt-3">
                              <button
                                type="button"
                                disabled
                                className="w-full py-2 px-3 bg-slate-200 text-slate-500 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 cursor-not-allowed"
                              >
                                <Lock size={13} />
                                <span>Blocked for Selected Dates</span>
                              </button>
                            </div>
                          </div>
                        );
                      }
                    })}
                </div>
              </div>

              {/* STEP 3: ROOM SELECTION & BLOCKING CONFIRMATION BANNER */}
              {isCurrentRoomBlocked ? (
                /* Red Conflict Alert */
                <div className="p-4 bg-rose-50 border-2 border-rose-400 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-rose-200 text-rose-800 rounded-xl mt-0.5">
                      <AlertTriangle size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-rose-950">
                        Room Conflict Detected in Selected Rooms!
                      </h4>
                      <p className="text-xs text-rose-800 mt-0.5">
                        One or more selected rooms are already occupied from{' '}
                        <span className="font-semibold">{currentRoomConflict?.checkInDate}</span> to{' '}
                        <span className="font-semibold">{currentRoomConflict?.checkOutDate}</span>. You cannot confirm this booking until conflicting rooms are deselected.
                      </p>
                    </div>
                  </div>

                  {availableRooms.length > 0 && (
                    <button
                      type="button"
                      onClick={handleAutoSelectAvailableRoom}
                      className="px-4 py-2 bg-rose-700 hover:bg-rose-800 active:bg-rose-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                    >
                      <Sparkles size={14} />
                      <span>Auto-Pick Available Room</span>
                    </button>
                  )}
                </div>
              ) : (
                /* Green Allocated & Blocked Confirmation */
                <div className="p-4 bg-emerald-50 border border-emerald-300 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-emerald-200 text-emerald-900 rounded-xl mt-0.5">
                      <Lock size={18} />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
                        <span>
                          {selectedRoomIds.length > 1 
                            ? `Multi-Room (${selectedRoomIds.length} Rooms) Blocked for ${fullName || 'Guest'}` 
                            : `${selectedRoom?.name} (${selectedRoom?.type}) Blocked for Reservation`
                          }
                        </span>
                        <span className="text-[10px] bg-emerald-200 text-emerald-900 font-extrabold px-2 py-0.5 rounded-full">
                          Ready
                        </span>
                      </h4>
                      <p className="text-xs text-emerald-800 mt-0.5">
                        {selectedRoomIds.length > 1
                          ? `Rooms: ${selectedRoomIds.map(id => rooms.find(r => r.id === id)?.name || id).join(', ')} • `
                          : ''
                        }
                        Stay from <span className="font-bold">{checkInDate}</span> to{' '}
                        <span className="font-bold">{checkOutDate}</span> ({nights} nights) • Combined tariff: ₹{totalRoomRatePerNight.toLocaleString()}/night (Total ₹{(totalRoomRatePerNight * nights).toLocaleString()}).
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab('guest_id')}
                    className="px-4 py-2 bg-emerald-800 hover:bg-emerald-900 text-white font-bold text-xs rounded-xl shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
                  >
                    <span>Proceed to Guest KYC &amp; ID Proof</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              )}

              {/* STEP 4: ROOM OCCUPANCY & TARIFF FINE-TUNING */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Room Occupancy &amp; Per-Night Tariff Setup
                  </span>
                  <span className="text-xs font-bold text-teal-800">
                    {selectedRoomIds.length > 1 ? `Multi-Room Booking (${selectedRoomIds.length} Rooms)` : 'Single Room Stay'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {/* Room Allocation Display / Dropdown */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {selectedRoomIds.length > 1 ? `Selected Rooms (${selectedRoomIds.length})` : 'Room Allocation'}
                    </label>
                    {selectedRoomIds.length > 1 ? (
                      <div className="text-xs font-bold bg-white border border-teal-300 text-teal-900 rounded-lg p-2 truncate" title={selectedRoomIds.map(id => rooms.find(r => r.id === id)?.name || id).join(', ')}>
                        {selectedRoomIds.map(id => rooms.find(r => r.id === id)?.number || id).join(', ')}
                      </div>
                    ) : (
                      <select
                        value={roomId}
                        onChange={(e) => handleSelectAndBlockRoom(e.target.value)}
                        className="w-full text-xs font-semibold bg-white border border-slate-300 rounded-lg p-2 text-slate-900 focus:ring-2 focus:ring-teal-500"
                      >
                        {rooms.map(rm => {
                          const st = checkRoomAvailability(rm.id, checkInDate, checkOutDate);
                          return (
                            <option
                              key={rm.id}
                              value={rm.id}
                              disabled={!st.isAvailable && rm.id !== roomId}
                            >
                              {st.isAvailable ? '🟢' : '🔴 [BLOCKED]'} {rm.name} — {rm.type} (₹{rm.baseRate})
                            </option>
                          );
                        })}
                      </select>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Adults
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={20}
                      value={adults}
                      onChange={(e) => setAdults(Number(e.target.value))}
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Children
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={children}
                      onChange={(e) => setChildren(Number(e.target.value))}
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Total Tariff / Night (₹)
                    </label>
                    <div className="w-full text-sm font-bold bg-teal-50 border border-teal-300 rounded-lg p-2 text-teal-950 flex items-center justify-between">
                      <span>₹{totalRoomRatePerNight.toLocaleString()}</span>
                      <span className="text-[10px] text-teal-700 font-medium">({selectedRoomIds.length} Rms)</span>
                    </div>
                  </div>
                </div>

                {/* If multi-room, show individual room rate adjustments */}
                {selectedRoomIds.length > 1 && (
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-[11px] font-bold text-slate-600 block mb-1.5 uppercase">
                      Individual Room Rates per Night:
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {selectedRoomIds.map((rId) => {
                        const rm = rooms.find(r => r.id === rId);
                        const rate = roomRates[rId] !== undefined ? roomRates[rId] : (rm?.baseRate || 3000);
                        return (
                          <div key={rId} className="bg-white p-2 rounded-lg border border-slate-200 flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-800 truncate">
                              Room {rm?.number || rId}:
                            </span>
                            <div className="flex items-center gap-0.5">
                              <span className="text-xs text-slate-400">₹</span>
                              <input
                                type="number"
                                value={rate}
                                onChange={(e) => handleUpdateSpecificRoomRate(rId, Number(e.target.value))}
                                className="w-20 text-xs font-bold p-1 border border-slate-300 rounded text-right"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* STEP 5: BOOKING SOURCE & OTA CHANNELS */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Booking Source &amp; OTA Channel Integration
                  </span>
                  <span className="text-xs text-teal-700 font-medium">
                    Two-way Channel Sync enabled
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {[
                    { id: 'makemytrip', name: 'MakeMyTrip (MMT)', color: 'border-emerald-500 bg-emerald-50 text-emerald-900' },
                    { id: 'cleartrip', name: 'Cleartrip', color: 'border-orange-500 bg-orange-50 text-orange-900' },
                    { id: 'oyo', name: 'OYO Rooms', color: 'border-red-500 bg-red-50 text-red-900' },
                    { id: 'easemytrip', name: 'EaseMyTrip', color: 'border-sky-500 bg-sky-50 text-sky-900' },
                    { id: 'booking_com', name: 'Booking.com', color: 'border-blue-500 bg-blue-50 text-blue-900' },
                    { id: 'agoda', name: 'Agoda', color: 'border-teal-500 bg-teal-50 text-teal-900' },
                    { id: 'airbnb', name: 'Airbnb', color: 'border-rose-500 bg-rose-50 text-rose-900' },
                    { id: 'goibibo', name: 'Goibibo', color: 'border-orange-500 bg-amber-50 text-amber-900' },
                    { id: 'yatra', name: 'Yatra.com', color: 'border-rose-600 bg-rose-50 text-rose-900' },
                    { id: 'expedia', name: 'Expedia Group', color: 'border-indigo-500 bg-indigo-50 text-indigo-900' },
                    { id: 'walkin', name: 'Direct / Walk-in', color: 'border-amber-500 bg-amber-50 text-amber-900' },
                    { id: 'phone', name: 'Phone Booking', color: 'border-slate-500 bg-slate-50 text-slate-900' },
                  ].map((ch) => (
                    <button
                      key={ch.id}
                      type="button"
                      onClick={() => setChannel(ch.id as BookingChannel)}
                      className={`p-2 rounded-lg text-xs font-semibold border text-left transition-all cursor-pointer ${
                        channel === ch.id
                          ? `${ch.color} ring-2 ring-teal-600 font-bold shadow-xs`
                          : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      {ch.name}
                    </button>
                  ))}
                </div>

                {channel !== 'walkin' && channel !== 'phone' && (
                  <div className="pt-2">
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      OTA Confirmation Number / Booking Reference
                    </label>
                    <input
                      type="text"
                      placeholder={`e.g. ${channel.toUpperCase()}-984120`}
                      value={channelRefId}
                      onChange={(e) => setChannelRefId(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                    />
                  </div>
                )}
              </div>

              {/* Special Requests */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Special Requests / Guest Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Early check-in requested, high floor, vegetarian breakfast"
                  value={specialRequests}
                  onChange={(e) => setSpecialRequests(e.target.value)}
                  className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GUEST KYC & CUSTOMER ID PROOF (KEY USER REQUIREMENT) */}
          {activeTab === 'guest_id' && (
            <div className="space-y-6 animate-in fade-in-50 duration-150">
              {/* Quick Fill Testing Assist */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-teal-50 border border-teal-200 rounded-xl text-xs text-teal-900">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-teal-700 shrink-0" />
                  <span className="font-semibold">Quick Sample ID Proofs for instant testing:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={fillSampleAadhaar}
                    className="px-2.5 py-1 bg-white border border-teal-300 rounded-md font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs"
                  >
                    + Sample Aadhaar Card
                  </button>
                  <button
                    type="button"
                    onClick={fillSamplePassport}
                    className="px-2.5 py-1 bg-white border border-teal-300 rounded-md font-bold text-teal-800 hover:bg-teal-100 transition-colors shadow-2xs"
                  >
                    + Sample Passport
                  </button>
                </div>
              </div>

              {/* Guest Personal Information */}
              <div className="border border-slate-200 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <User size={14} className="text-teal-700" />
                    Guest Profile &amp; Contact
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Nizamuddin Saifi"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-teal-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      placeholder="+91 98112 44332"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      placeholder="guest@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Residential Address
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. B-12 Jamia Nagar, Okhla Vihar"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      City / State
                    </label>
                    <input
                      type="text"
                      placeholder="New Delhi"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nationality
                    </label>
                    <input
                      type="text"
                      value={nationality}
                      onChange={(e) => setNationality(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2 focus:bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Hotel Policy: ID Submitted at Check-In vs Immediate Walk-In */}
              <div className="bg-white border-2 border-teal-600/60 rounded-xl p-4 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-1.5">
                    <ShieldCheck size={16} className="text-teal-700" />
                    When will Customer ID be submitted?
                  </span>
                  <span className="text-[11px] font-semibold text-teal-800 bg-teal-50 px-2 py-0.5 rounded border border-teal-200">
                    Hotel Check-in Policy
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIdSubmissionPolicy('at_checkin');
                      setIsVerified(false);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      idSubmissionPolicy === 'at_checkin'
                        ? 'bg-teal-50/90 border-teal-600 ring-2 ring-teal-500/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        🏨 Submit ID at Check-In (Standard)
                      </span>
                      {idSubmissionPolicy === 'at_checkin' && (
                        <span className="text-[10px] font-bold bg-teal-700 text-white px-1.5 py-0.2 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Standard hotel rule: Customer ID is submitted upon arrival at front desk check-in. Room will be reserved now; ID fields are optional.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIdSubmissionPolicy('submit_now');
                      setIsVerified(true);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
                      idSubmissionPolicy === 'submit_now'
                        ? 'bg-teal-50/90 border-teal-600 ring-2 ring-teal-500/30 shadow-xs'
                        : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-slate-900 flex items-center gap-1.5">
                        🆔 Submit ID Now (Immediate Walk-In)
                      </span>
                      {idSubmissionPolicy === 'submit_now' && (
                        <span className="text-[10px] font-bold bg-teal-700 text-white px-1.5 py-0.2 rounded">
                          Selected
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Guest is standing at reception right now. Enter Aadhaar / Passport details &amp; upload photo proof now.
                    </p>
                  </button>
                </div>

                {idSubmissionPolicy === 'at_checkin' && (
                  <div className="p-3 bg-sky-50 border border-sky-200 rounded-lg text-xs text-sky-900 flex items-center gap-2">
                    <AlertTriangle size={15} className="text-sky-700 shrink-0" />
                    <span>
                      <strong>Advance Reservation Active:</strong> Customer ID can be submitted upon arrival during front desk check-in. You do not need to enter ID details right now.
                    </span>
                  </div>
                )}
              </div>

              {/* ID Document KYC Section */}
              <div className="border-2 border-teal-600/50 bg-teal-50/20 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-teal-200/60 pb-2">
                  <div className="flex items-center gap-2">
                    <ShieldCheck size={18} className="text-teal-700" />
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Customer ID &amp; KYC Details {idSubmissionPolicy === 'at_checkin' ? '(Optional for Advance Booking)' : '(Mandatory Now)'}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {idSubmissionPolicy === 'at_checkin' 
                          ? 'Can be filled now if known, or left blank to submit at check-in' 
                          : 'Upload ID proof or take photo for Hotel Form C / Police verification'}
                      </p>
                    </div>
                  </div>

                  <label className="flex items-center gap-2 text-xs font-bold text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isVerified}
                      onChange={(e) => setIsVerified(e.target.checked)}
                      className="rounded text-teal-600 focus:ring-teal-500"
                    />
                    <span>Mark ID Verified</span>
                  </label>
                </div>

                {/* ID Type & Number Inputs */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Select ID Document Type
                    </label>
                    <select
                      value={idType}
                      onChange={(e) => setIdType(e.target.value as IdType)}
                      className="w-full text-sm font-semibold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500"
                    >
                      <option value="aadhaar">Aadhaar Card (UIDAI)</option>
                      <option value="passport">Passport</option>
                      <option value="driving_license">Driving License</option>
                      <option value="voter_id">Voter ID (Election Card)</option>
                      <option value="pan_card">PAN Card</option>
                      <option value="national_id">Other Government ID</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ID Document Number {idSubmissionPolicy === 'submit_now' ? '*' : '(Optional)'}
                    </label>
                    <input
                      type="text"
                      placeholder={idType === 'aadhaar' ? '5482 9104 3821' : idType === 'passport' ? 'Z9182304' : 'ID Number'}
                      value={idNumber}
                      onChange={(e) => setIdNumber(e.target.value)}
                      className="w-full text-sm font-mono font-bold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-teal-500"
                      required={idSubmissionPolicy === 'submit_now'}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      ID Expiry Date (if applicable)
                    </label>
                    <input
                      type="date"
                      value={expiryDate}
                      onChange={(e) => setExpiryDate(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 text-slate-700"
                    />
                  </div>
                </div>

                {/* Camera Live Modal Stream if opened */}
                {isCameraActive && (
                  <div className="p-4 bg-slate-900 rounded-xl text-white space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-teal-400">
                        Camera Capture: Snap {capturingSide.toUpperCase()} of ID Card
                      </span>
                      <button
                        type="button"
                        onClick={stopCamera}
                        className="text-xs text-slate-400 hover:text-white"
                      >
                        Cancel
                      </button>
                    </div>
                    <div className="relative aspect-video max-h-56 bg-black rounded-lg overflow-hidden flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={capturePhoto}
                        className="px-6 py-2 bg-teal-500 hover:bg-teal-600 text-white text-xs font-bold rounded-full shadow-lg flex items-center gap-2"
                      >
                        <Camera size={16} />
                        Capture ID Document
                      </button>
                    </div>
                  </div>
                )}

                {/* Front & Back Document Upload / Previews */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  {/* Front Side */}
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        ID Proof Front Side *
                      </span>
                      {frontImageUrl && (
                        <button
                          type="button"
                          onClick={() => setFrontImageUrl('')}
                          className="text-slate-400 hover:text-rose-600 text-xs"
                          title="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {frontImageUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group aspect-4/3 max-h-44 flex items-center justify-center">
                        <img
                          src={frontImageUrl}
                          alt="ID Front"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera('front')}
                            className="p-1.5 bg-white text-slate-800 rounded text-xs font-bold"
                          >
                            Retake
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center space-y-2 hover:border-teal-500 transition-colors">
                        <Upload size={24} className="mx-auto text-slate-400" />
                        <div className="text-xs text-slate-500">
                          Upload front photo of {idType}
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <label className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-md cursor-pointer border border-teal-200">
                            Browse File
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'front')}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => startCamera('front')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md flex items-center gap-1 border border-slate-300"
                          >
                            <Camera size={14} /> Camera
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Back Side */}
                  <div className="border border-slate-200 bg-white rounded-xl p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800">
                        ID Proof Back Side (Optional)
                      </span>
                      {backImageUrl && (
                        <button
                          type="button"
                          onClick={() => setBackImageUrl('')}
                          className="text-slate-400 hover:text-rose-600 text-xs"
                          title="Remove image"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    {backImageUrl ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-slate-50 group aspect-4/3 max-h-44 flex items-center justify-center">
                        <img
                          src={backImageUrl}
                          alt="ID Back"
                          className="w-full h-full object-contain"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                          <button
                            type="button"
                            onClick={() => startCamera('back')}
                            className="p-1.5 bg-white text-slate-800 rounded text-xs font-bold"
                          >
                            Retake
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center space-y-2 hover:border-teal-500 transition-colors">
                        <Upload size={24} className="mx-auto text-slate-400" />
                        <div className="text-xs text-slate-500">
                          Upload back side (address/QR)
                        </div>
                        <div className="flex items-center justify-center gap-2 pt-1">
                          <label className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-md cursor-pointer border border-teal-200">
                            Browse File
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={(e) => handleFileUpload(e, 'back')}
                              className="hidden"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => startCamera('back')}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-md flex items-center gap-1 border border-slate-300"
                          >
                            <Camera size={14} /> Camera
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional KYC info */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Guest Vehicle Number (if parking used)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. DL 3C AB 9081"
                      value={vehicleNumber}
                      onChange={(e) => setVehicleNumber(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Emergency Contact / Relative
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98112 44330 (Brother)"
                      value={emergencyContact}
                      onChange={(e) => setEmergencyContact(e.target.value)}
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: BILLING, DISCOUNT & ADVANCE PAYMENTS */}
          {activeTab === 'billing' && (
            <div className="space-y-5 animate-in fade-in-50 duration-150">
              
              {/* Special Discount Option Card */}
              <div className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-emerald-200/70 pb-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Tag size={15} />
                    </div>
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">Special Discount / Rate Concession</span>
                      <span className="text-[11px] text-emerald-800">Apply promotional offer, walk-in discount, or corporate concession</span>
                    </div>
                  </div>
                  {discountAmount > 0 ? (
                    <span className="px-2.5 py-1 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-xs flex items-center gap-1">
                      <Check size={12} />
                      Save ₹{discountAmount.toLocaleString()}
                    </span>
                  ) : (
                    <span className="text-xs text-slate-500 font-medium">No discount applied</span>
                  )}
                </div>

                {/* Discount Type Toggle & Value Input */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Mode</label>
                    <div className="grid grid-cols-2 p-1 bg-white border border-slate-300 rounded-lg">
                      <button
                        type="button"
                        onClick={() => setDiscountType('flat')}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          discountType === 'flat'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        ₹ Flat (Rupees)
                      </button>
                      <button
                        type="button"
                        onClick={() => setDiscountType('percentage')}
                        className={`py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                          discountType === 'percentage'
                            ? 'bg-emerald-600 text-white shadow-xs'
                            : 'text-slate-600 hover:text-slate-900'
                        }`}
                      >
                        % Percentage
                      </button>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      {discountType === 'percentage' ? 'Discount Percentage (%)' : 'Discount Amount (₹)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={discountType === 'percentage' ? 100 : subtotal}
                        value={discountValue || ''}
                        onChange={(e) => setDiscountValue(Math.max(0, Number(e.target.value)))}
                        placeholder={discountType === 'percentage' ? 'e.g. 10 for 10%' : 'e.g. 500'}
                        className="w-full text-sm font-bold bg-white border border-slate-300 rounded-lg p-2.5 text-slate-900 focus:ring-2 focus:ring-emerald-500 pl-8 font-mono"
                      />
                      <span className="absolute left-2.5 top-2.5 text-slate-400 font-bold text-sm">
                        {discountType === 'percentage' ? '%' : '₹'}
                      </span>
                    </div>
                  </div>

                  <div className="md:col-span-4">
                    <label className="block text-xs font-bold text-slate-700 mb-1">Discount Reason / Note</label>
                    <input
                      type="text"
                      value={discountReason}
                      onChange={(e) => setDiscountReason(e.target.value)}
                      placeholder="e.g. Direct Walk-in / Corporate"
                      className="w-full text-sm bg-white border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Quick Presets */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5 text-xs">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Quick Presets:</span>
                  <button
                    type="button"
                    onClick={() => { setDiscountValue(0); setDiscountReason(''); }}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors cursor-pointer ${
                      discountAmount === 0 
                        ? 'bg-slate-200 border-slate-300 text-slate-800 font-bold' 
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    No Discount
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('percentage'); setDiscountValue(5); if (!discountReason) setDiscountReason('5% Direct Booking Discount'); }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold cursor-pointer"
                  >
                    5% Off
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('percentage'); setDiscountValue(10); if (!discountReason) setDiscountReason('10% Privilege Discount'); }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold cursor-pointer"
                  >
                    10% Off
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('flat'); setDiscountValue(200); if (!discountReason) setDiscountReason('₹200 Walk-in Discount'); }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold cursor-pointer"
                  >
                    ₹200 Off
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('flat'); setDiscountValue(500); if (!discountReason) setDiscountReason('₹500 Special Concession'); }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold cursor-pointer"
                  >
                    ₹500 Off
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountType('flat'); setDiscountValue(1000); if (!discountReason) setDiscountReason('₹1,000 Corporate Deal'); }}
                    className="px-2.5 py-1 bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-md text-xs font-semibold cursor-pointer"
                  >
                    ₹1,000 Off
                  </button>
                </div>
              </div>

              {/* Optional GST Selection Card */}
              <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm transition-colors ${
                    applyGst ? 'bg-teal-700 text-white shadow-xs' : 'bg-slate-100 text-slate-500 border border-slate-200'
                  }`}>
                    %
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">Goods &amp; Services Tax (GST)</span>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md">
                        Optional
                      </span>
                    </div>
                    <span className="text-xs text-slate-500 block">
                      {applyGst 
                        ? '5% GST applied (2.5% CGST + 2.5% SGST on net tariff)' 
                        : 'GST disabled (0% Tax / Non-GST or Composition bill)'}
                    </span>
                  </div>
                </div>

                <div className="inline-flex p-1 bg-slate-100 rounded-xl border border-slate-200 self-start sm:self-auto shrink-0">
                  <button
                    type="button"
                    onClick={() => setApplyGst(false)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      !applyGst
                        ? 'bg-white text-slate-900 shadow-xs border border-slate-200'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    No GST (0% Optional)
                  </button>
                  <button
                    type="button"
                    onClick={() => setApplyGst(true)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                      applyGst
                        ? 'bg-teal-700 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Apply 5% GST
                  </button>
                </div>
              </div>

              {/* Reservation Tariff Calculation */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="font-bold text-slate-800 text-sm border-b border-slate-200 pb-2 flex items-center justify-between">
                  <span>Reservation Tariff Calculation</span>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${
                    applyGst ? 'text-teal-800 bg-teal-50 border-teal-200' : 'text-slate-600 bg-slate-100 border-slate-200'
                  }`}>
                    {applyGst ? '5% GST Applied' : '0% (Non-GST Bill)'}
                  </span>
                </div>

                <div className="space-y-2 text-sm">
                  {selectedRoomIds.length > 1 ? (
                    <div className="space-y-1.5 pb-2 border-b border-slate-200">
                      <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                        Rooms Tariff Breakdown ({selectedRoomIds.length} Rooms):
                      </div>
                      {selectedRoomIds.map(rId => {
                        const rm = rooms.find(r => r.id === rId);
                        const rate = roomRates[rId] !== undefined ? roomRates[rId] : (rm?.baseRate || 3000);
                        return (
                          <div key={rId} className="flex justify-between text-xs text-slate-600">
                            <span>Room {rm?.number || rId} ({rm?.type}) — {nights}N × ₹{rate}:</span>
                            <span className="font-semibold text-slate-800">₹{(nights * rate).toLocaleString()}</span>
                          </div>
                        );
                      })}
                      <div className="flex justify-between text-slate-800 font-bold text-xs pt-1">
                        <span>Gross Combined Accommodation ({selectedRoomIds.length} Rooms):</span>
                        <span>₹{subtotal.toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between text-slate-600">
                      <span>Room Tariff ({nights} nights × ₹{roomRate}):</span>
                      <span className="font-semibold text-slate-800">₹{subtotal.toLocaleString()}</span>
                    </div>
                  )}

                  {/* Discount row if applied */}
                  {discountAmount > 0 && (
                    <div className="flex justify-between items-center text-emerald-800 font-semibold bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 text-xs">
                      <div className="flex items-center gap-1.5">
                        <Tag size={13} className="text-emerald-700" />
                        <span>Discount Applied ({discountType === 'percentage' ? `${discountValue}%` : `₹${discountValue}`}{discountReason ? ` • ${discountReason}` : ''}):</span>
                      </div>
                      <span className="font-bold font-mono">- ₹{discountAmount.toLocaleString()}</span>
                    </div>
                  )}

                  {discountAmount > 0 && (
                    <div className="flex justify-between text-slate-700 font-medium text-xs">
                      <span>Net Taxable Tariff:</span>
                      <span className="font-semibold text-slate-900">₹{taxableSubtotal.toLocaleString()}</span>
                    </div>
                  )}

                  {/* GST (Optional: 5% or 0%) */}
                  <div className="flex justify-between items-center text-slate-700 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-800">GST:</span>
                      {applyGst ? (
                        <div className="inline-flex items-center gap-1.5 bg-teal-50 text-teal-900 border border-teal-200 px-2.5 py-0.5 rounded text-xs font-semibold">
                          <span>5% GST</span>
                          <span className="text-[10px] text-teal-700 font-normal">(2.5% CGST + 2.5% SGST)</span>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1 bg-slate-100 text-slate-600 border border-slate-200 px-2 py-0.5 rounded text-xs font-semibold">
                          <span>0% (Not Applied)</span>
                        </div>
                      )}
                    </div>
                    <span className="font-bold text-slate-900 font-mono">
                      {applyGst ? `₹${taxes.toLocaleString()}` : '₹0'}
                    </span>
                  </div>

                  <div className="pt-2 border-t border-slate-200 flex justify-between text-base font-bold text-slate-900">
                    <span>Estimated Total Amount:</span>
                    <span className="text-teal-900">₹{totalAmount.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Advance Payment Section */}
              <div className="border border-slate-200 rounded-xl p-5 space-y-4">
                <div className="font-bold text-slate-800 text-sm border-b border-slate-100 pb-2 flex items-center justify-between">
                  <span>Advance Payment Received</span>
                  <span className="text-xs font-normal text-slate-500">Record check-in deposit or OTA prepayment</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Advance Amount (₹)
                    </label>
                    <input
                      type="number"
                      value={advanceAmount}
                      onChange={(e) => setAdvanceAmount(Number(e.target.value))}
                      className="w-full text-sm font-bold bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-emerald-900 focus:bg-white"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Payment Mode
                    </label>
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 text-slate-800 focus:bg-white"
                    >
                      <option value="upi">UPI / QR (GPay, PhonePe, Paytm)</option>
                      <option value="cash">Cash Payment</option>
                      <option value="card">Credit / Debit Card (POS)</option>
                      <option value="ota_virtual_card">OTA Virtual Card (MMT/Agoda VCC)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Transaction / UTR Reference
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. UPI/329482109 or AuthCode"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      className="w-full text-sm bg-slate-50 border border-slate-300 rounded-lg p-2.5 focus:bg-white"
                    />
                  </div>
                </div>

                {/* Balance Due Notification */}
                <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-900">
                  <span>Remaining Balance Due at Check-out:</span>
                  <span className="text-sm font-bold text-amber-950">₹{balanceDue.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          {/* Modal Footer Controls */}
          <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              {activeTab !== 'stay' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'billing' ? 'guest_id' : 'stay')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
                >
                  &larr; Back
                </button>
              )}
              {activeTab !== 'billing' && (
                <button
                  type="button"
                  onClick={() => setActiveTab(activeTab === 'stay' ? 'guest_id' : 'billing')}
                  className="px-4 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-bold rounded-lg transition-colors border border-teal-200"
                >
                  Next Step &rarr;
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-semibold rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                id="save-reservation-btn"
                className="px-6 py-2.5 bg-teal-800 hover:bg-teal-900 active:bg-teal-950 text-white text-xs font-bold rounded-lg shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 size={16} />
                <span>{existingBooking ? 'Save Updates' : 'Confirm & Save Reservation'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
