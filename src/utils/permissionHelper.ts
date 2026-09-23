import { Hotel, UserAccount } from '../types';

export const MAX_OWNER_PROPERTIES = 5;

/**
 * Check if the user is a Super Admin (Group Director)
 */
export const isSuperAdminUser = (user: UserAccount | null | undefined): boolean => {
  return user?.role === 'super_admin';
};

/**
 * Check if the user is a Property Owner / Hotel Partner
 */
export const isPropertyOwnerUser = (user: UserAccount | null | undefined): boolean => {
  return user?.role === 'hotel_owner';
};

/**
 * Check if the user is a staff member (Hotel Manager, Front Desk, Housekeeping)
 */
export const isStaffUser = (user: UserAccount | null | undefined): boolean => {
  if (!user) return true;
  return user.role !== 'super_admin' && user.role !== 'hotel_owner';
};

/**
 * Get all hotels owned or accessible by the given user
 */
export const getAccessibleHotels = (
  user: UserAccount | null | undefined,
  allHotels: Hotel[]
): Hotel[] => {
  if (!user) return allHotels;
  if (user.role === 'super_admin') {
    return allHotels;
  }

  const uName = (user.username || '').toLowerCase();
  const uId = user.id;

  if (user.role === 'hotel_owner') {
    return allHotels.filter(h => {
      const matchOwnerId = h.ownerId && h.ownerId === uId;
      const matchOwnerName = h.ownerUsername && h.ownerUsername.toLowerCase() === uName;
      const matchSpecialSadik = uName === 'sadik8806' && h.id === 'hotel-bighouse';
      const matchAssignedHotel = user.hotelId && user.hotelId === h.id;
      return matchOwnerId || matchOwnerName || matchSpecialSadik || matchAssignedHotel;
    });
  }

  // Staff member: only their designated hotel
  return allHotels.filter(h => h.id === user.hotelId);
};

/**
 * Check if the user can add another hotel property
 * - Super Admin: Unlimited
 * - Property Owner: Maximum 5 properties
 * - Staff: CANNOT add properties (0 allowed)
 */
export const canUserAddProperty = (
  user: UserAccount | null | undefined,
  allHotels: Hotel[]
): {
  allowed: boolean;
  reason?: string;
  currentCount: number;
  maxLimit: number;
} => {
  if (!user) {
    return {
      allowed: false,
      reason: 'Please login to add hotel properties.',
      currentCount: 0,
      maxLimit: 0
    };
  }

  if (user.role === 'super_admin') {
    return {
      allowed: true,
      currentCount: allHotels.length,
      maxLimit: Infinity
    };
  }

  if (isStaffUser(user)) {
    return {
      allowed: false,
      reason: 'Staff members are not permitted to add or register hotel properties. Only Property Owners or Super Admin have this permission.',
      currentCount: 0,
      maxLimit: 0
    };
  }

  if (user.role === 'hotel_owner') {
    const owned = getAccessibleHotels(user, allHotels);
    const count = owned.length;
    if (count >= MAX_OWNER_PROPERTIES) {
      return {
        allowed: false,
        reason: `Property quota reached (${count}/${MAX_OWNER_PROPERTIES}). Property owners can add a maximum of ${MAX_OWNER_PROPERTIES} properties. Please contact Super Admin (+91 96481 33671) to upgrade.`,
        currentCount: count,
        maxLimit: MAX_OWNER_PROPERTIES
      };
    }

    return {
      allowed: true,
      currentCount: count,
      maxLimit: MAX_OWNER_PROPERTIES
    };
  }

  return {
    allowed: false,
    reason: 'Unauthorized action.',
    currentCount: 0,
    maxLimit: 0
  };
};

/**
 * Check if the user can create staff members in the user panel
 * - Super Admin: Can create owners and staff
 * - Property Owner: Can create staff for their owned hotels
 * - Staff: CANNOT create users
 */
export const canUserManageStaff = (user: UserAccount | null | undefined): boolean => {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'hotel_owner';
};
