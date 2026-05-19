'use client';

import React, { useState } from 'react';
import { Plus, FlaskConical, Scan, Pill } from 'lucide-react';
import { Badge, Button } from '@lotto-emr/ui';
import { RequireRole } from '@/shared/rbac';
import { formatDateTime } from '@/shared/lib/utils';
import { useOrders } from '../api/use-orders';
import { OrderForm } from './order-form';
import type { OrderType } from '../types';

const TYPE_ICON: Record<OrderType, React.ElementType> = {
  LAB: FlaskConical,
  IMAGING: Scan,
  MEDICATION: Pill,
};

const TYPE_COLOR: Record<OrderType, string> = {
  LAB: 'text-blue-600',
  IMAGING: 'text-purple-600',
  MEDICATION: 'text-green-600',
};

const PRIORITY_VARIANT: Record<string, 'critical' | 'destructive' | 'pending' | 'default'> = {
  stat: 'critical',
  asap: 'destructive',
  urgent: 'pending',
  routine: 'default',
};

interface OrderListProps {
  patientId?: string;
}

export function OrderList({ patientId }: OrderListProps) {
  const [showForm, setShowForm] = useState(false);
  const { data: orders = [], isLoading, error } = useOrders({ patientId });

  return (
    <div className="space-y-4">
      <RequireRole roles={['doctor']}>
        <div className="flex justify-end">
          <Button size="sm" onClick={() => setShowForm(true)}>
            <Plus className="h-4 w-4 mr-1" />
            New Order
          </Button>
        </div>
      </RequireRole>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">Create Order</h2>
            <OrderForm
              patientId={patientId ?? ''}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      <div className="border rounded-lg overflow-hidden bg-white">
        <table className="clinical-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>Order</th>
              <th>Patient</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Ordered By</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  Loading orders...
                </td>
              </tr>
            )}
            {error && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-destructive">
                  Failed to load orders.
                </td>
              </tr>
            )}
            {!isLoading && orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-8 text-muted-foreground">
                  No orders found.
                </td>
              </tr>
            )}
            {orders.map((order) => {
              const Icon = TYPE_ICON[order.type];
              return (
                <tr key={order.id}>
                  <td>
                    <div className={`flex items-center gap-1.5 ${TYPE_COLOR[order.type]}`}>
                      <Icon className="h-4 w-4" />
                      <span className="text-xs font-medium">{order.type}</span>
                    </div>
                  </td>
                  <td>
                    <span className="font-medium">{order.orderText}</span>
                    {order.notes && (
                      <p className="text-xs text-muted-foreground">{order.notes}</p>
                    )}
                  </td>
                  <td>{order.patientName || '—'}</td>
                  <td>
                    <Badge
                      variant={PRIORITY_VARIANT[order.priority] ?? 'default'}
                      className="text-xs uppercase"
                    >
                      {order.priority}
                    </Badge>
                  </td>
                  <td>
                    <Badge variant={order.status === 'active' ? 'active' : order.status === 'completed' ? 'completed' : 'default'} className="text-xs capitalize">
                      {order.status}
                    </Badge>
                  </td>
                  <td>{order.orderedBy ?? '—'}</td>
                  <td>{formatDateTime(order.orderedAt)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
