import { Booking, EquipmentItem } from './types';

export interface OverlapAvailabilityCheckResult {
  equipmentId: number;
  equipmentName: string;
  totalQuantity: number;
  allocatedQuantity: number;
  availableQuantity: number;
  requestedQuantity: number;
  isAvailable: boolean;
}

/**
 * Checks whether two date ranges [start1, end1] and [start2, end2] overlap (inclusive).
 * Dates are formatted as ISO 'YYYY-MM-DD'.
 */
export function areDatesOverlapping(start1: string, end1: string, start2: string, end2: string): boolean {
  return start1 <= end2 && end1 >= start2;
}

/**
 * Active statuses that reserve equipment stock.
 * 'rejected' and 'returned' release stock.
 */
export const ACTIVE_BOOKING_STATUSES = ['pending', 'approved', 'checked_out'] as const;

/**
 * Calculates current available quantity of an equipment item for a requested date range.
 */
export function calculateEquipmentAvailability(
  equipment: EquipmentItem,
  allBookings: Booking[],
  startDate: string,
  endDate: string,
  requestedQuantity: number,
  excludeBookingId?: string
): OverlapAvailabilityCheckResult {
  // Find all active bookings overlapping with the requested period
  const overlappingBookings = allBookings.filter((b) => {
    if (excludeBookingId && b.id === excludeBookingId) return false;
    if (!ACTIVE_BOOKING_STATUSES.includes(b.status as any)) return false;
    return areDatesOverlapping(b.start_date, b.end_date, startDate, endDate);
  });

  // Calculate sum of booked quantities across overlapping bookings
  let allocatedQuantity = 0;
  for (const b of overlappingBookings) {
    for (const item of b.items) {
      if (item.equipment_id === equipment.id) {
        // If checked out, adjust for returned quantity if any
        const remainingBooked = Math.max(0, item.quantity - (item.returned_quantity || 0));
        allocatedQuantity += remainingBooked;
      }
    }
  }

  const availableQuantity = Math.max(0, equipment.total_quantity - allocatedQuantity);
  const isAvailable = requestedQuantity <= availableQuantity;

  return {
    equipmentId: equipment.id,
    equipmentName: equipment.name,
    totalQuantity: equipment.total_quantity,
    allocatedQuantity,
    availableQuantity,
    requestedQuantity,
    isAvailable,
  };
}
