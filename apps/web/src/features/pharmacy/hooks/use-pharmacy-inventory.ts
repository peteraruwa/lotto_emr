'use client';
import { useQuery } from '@tanstack/react-query';
import { differenceInDays, parseISO } from 'date-fns';
import type { InventoryItem } from '../types';
import { MOCK_INVENTORY } from '../constants';

export function usePharmacyInventory() {
  return useQuery<InventoryItem[]>({
    queryKey: ['pharmacy-inventory'],
    staleTime: 5 * 60_000,
    queryFn: async () => {
      // Annotate daysToExpiry from expiryDate
      return MOCK_INVENTORY.map(item => ({
        ...item,
        daysToExpiry: item.expiryDate
          ? Math.max(0, differenceInDays(parseISO(item.expiryDate), new Date()))
          : undefined,
      }));
    },
  });
}
