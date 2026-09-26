import { Booking, Room, LastMinuteRateAutomationConfig } from '../types';
import { getTodayDateStr } from './dateHelper';

export interface LastMinuteRuleStatus {
  isEnabled: boolean;
  isTriggered: boolean;
  isPast7Am: boolean;
  currentOccupancyPercent: number;
  targetOccupancyPercent: number;
  discountPercent: number;
  occupiedRoomsCount: number;
  totalRoomsCount: number;
  statusLabel: string;
  badgeVariant: 'active' | 'pending' | 'target_met' | 'disabled';
  explanation: string;
  formattedCutoffTime: string;
}

export const defaultLastMinuteConfig: LastMinuteRateAutomationConfig = {
  isEnabled: true,
  evaluationTimeHour: 7,
  evaluationTimeMinute: 0,
  targetOccupancyPercent: 60,
  discountPercent: 15,
  applyToChannels: true,
  applyToDirectWalkIn: true,
  simulatedTimePassed7am: false
};

/**
 * Evaluates whether today's Last-Minute Flash Rate reduction applies:
 * Condition: Morning 7:00 AM cutoff has passed AND same-date occupancy < 60%
 */
export function evaluateLastMinuteAutomation(
  bookings: Booking[],
  rooms: Room[],
  configInput?: LastMinuteRateAutomationConfig
): LastMinuteRuleStatus {
  const config = configInput || defaultLastMinuteConfig;
  const today = getTodayDateStr();
  const totalRoomsCount = rooms.length;
  
  // Count active rooms booked for today (same date check-ins / in-house)
  const activeBookingsToday = (bookings || []).filter(b => 
    b.checkInDate <= today && 
    b.checkOutDate > today && 
    b.status !== 'cancelled'
  );
  
  // Set of occupied room IDs today
  const bookedRoomIds = new Set(activeBookingsToday.map(b => b.roomId));
  const occupiedRoomsCount = bookedRoomIds.size;
  const currentOccupancyPercent = totalRoomsCount > 0 
    ? Math.round((occupiedRoomsCount / totalRoomsCount) * 100) 
    : 0;

  // Check current local time (or manual simulation toggle)
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const evalHour = config.evaluationTimeHour ?? 7;
  const evalMin = config.evaluationTimeMinute ?? 0;

  // Check if current time has passed the 7:00 AM cutoff
  const isPast7Am = !!config.simulatedTimePassed7am || 
    (currentHour > evalHour || (currentHour === evalHour && currentMinute >= evalMin));

  const isBelowTarget = currentOccupancyPercent < config.targetOccupancyPercent;
  const isTriggered = config.isEnabled && isPast7Am && isBelowTarget;

  const formattedCutoffTime = `${evalHour % 12 === 0 ? 12 : evalHour % 12}:${evalMin.toString().padStart(2, '0')} ${evalHour >= 12 ? 'PM' : 'AM'}`;

  let statusLabel = 'Rule Paused';
  let badgeVariant: 'active' | 'pending' | 'target_met' | 'disabled' = 'disabled';
  let explanation = '';

  if (!config.isEnabled) {
    statusLabel = '7 AM Flash Rule Disabled';
    badgeVariant = 'disabled';
    explanation = 'Last-Minute flash rate automation is turned off in settings.';
  } else if (!isPast7Am) {
    statusLabel = `Pending ${formattedCutoffTime} Evaluation (${currentOccupancyPercent}% Booked)`;
    badgeVariant = 'pending';
    explanation = `Evaluation will run automatically at ${formattedCutoffTime}. If today's bookings remain below ${config.targetOccupancyPercent}%, base rates will automatically drop by ${config.discountPercent}%.`;
  } else if (isBelowTarget) {
    statusLabel = `⚡ Flash Sale Active: -${config.discountPercent}% Base Rate Reduced`;
    badgeVariant = 'active';
    explanation = `Automatic evaluation triggered at ${formattedCutoffTime}: Same-date occupancy is ${currentOccupancyPercent}% (${occupiedRoomsCount}/${totalRoomsCount} rooms), which is below the ${config.targetOccupancyPercent}% threshold. Base rates are automatically reduced by ${config.discountPercent}% for today's reservations.`;
  } else {
    statusLabel = `Target Met (≥${config.targetOccupancyPercent}% Occupancy - Normal Base Rates)`;
    badgeVariant = 'target_met';
    explanation = `Same-date occupancy has reached ${currentOccupancyPercent}% (≥${config.targetOccupancyPercent}% target). No discount needed; standard base rates remain in effect.`;
  }

  return {
    isEnabled: config.isEnabled,
    isTriggered,
    isPast7Am,
    currentOccupancyPercent,
    targetOccupancyPercent: config.targetOccupancyPercent,
    discountPercent: config.discountPercent,
    occupiedRoomsCount,
    totalRoomsCount,
    statusLabel,
    badgeVariant,
    explanation,
    formattedCutoffTime
  };
}

/**
 * Calculates effective room rate given Last-Minute 15% discount or surge multipliers
 */
export function calculateEffectiveRoomRate(
  baseRate: number,
  isLastMinuteTriggered: boolean,
  discountPercent: number = 15,
  surgePercent: number = 0
): {
  finalRate: number;
  discountAmount: number;
  surgeAmount: number;
  originalBaseRate: number;
} {
  let rate = baseRate;
  let discountAmount = 0;
  let surgeAmount = 0;

  if (isLastMinuteTriggered) {
    discountAmount = Math.round(baseRate * (discountPercent / 100));
    rate = Math.max(100, baseRate - discountAmount);
  } else if (surgePercent > 0) {
    surgeAmount = Math.round(baseRate * (surgePercent / 100));
    rate = baseRate + surgeAmount;
  }

  return {
    finalRate: rate,
    discountAmount,
    surgeAmount,
    originalBaseRate: baseRate
  };
}
