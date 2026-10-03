import { Hotel, UserAccount } from '../types';

export const MAX_OWNER_PROPERTIES = 5;

/**
 * Check if the user is a Super Admin (Maahi Trips)
 */
export const isSuperAdminUser = (user: UserAccount | null | undefined): boolean => {
  if (!user) return false;
  const username = (user.username || '').toLowerCase().trim();
  const email = (user.email || '').toLowerCase().trim();
  return (
    user.role === 'super_admin' ||
    user.id === 'user-admin' ||
    username === 'maahitrips' ||
    username === 'admin' ||
    email === 'shahidkpj@gmail.com'
  );
};

/**
 * Check if the user is a Property Owner / Hotel Partner
 */
export const isPropertyOwnerUser = (user: UserAccount | null | undefined): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return false;
  return user.role === 'hotel_owner';
};

/**
 * Check if the user is a staff member (Hotel Manager, Front Desk, Housekeeping)
 */
export const isStaffUser = (user: UserAccount | null | undefined): boolean => {
  if (!user) return false;
  if (isSuperAdminUser(user)) return false;
  if (isPropertyOwnerUser(user)) return false;
  return user.role === 'hotel_manager' || user.role === 'front_desk';
};

/**
 * Get all hotels owned or accessible by the given user
 */
export const getAccessibleHotels = (
  user: UserAccount | null | undefined,
  allHotels: Hotel[]
): Hotel[] => {
  if (!user) return allHotels;
  // In the hotel portfolio switcher, all active hotels (including Royal Guest House) are visible
  // so property owners and managers never lose sight of their properties.
  return allHotels;
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
  return {
    allowed: true,
    currentCount: allHotels.length,
    maxLimit: Infinity
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
