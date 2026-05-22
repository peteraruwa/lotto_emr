'use client';

import React, { useState } from 'react';
import { format, addDays, subDays } from 'date-fns';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button, Badge } from '@lotto-emr/ui';
import { useAppointments } from '../api/use-appointments';
import { AppointmentForm } from './appointment-form';

const STATUS_VARIANT: Record<string, 'active' | 'completed' | 'cancelled' | 'pending'> = {
  booked: 'active',
  arrived: 'active',
  fulfilled: 'completed',
  cancelled: 'cancelled',
  noshow: 'cancelled',
  proposed: 'pending',
  pending: 'pending',
};

/**
 * Day-view appointment calendar with navigation and booking capability.
 */
export function AppointmentCalendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);

  const { data: appointments = [], isLoading } = useAppointments({ date: selectedDate });

  return (
    <div className="space-y-4">
      {/* Date navigation */}
      <div className="flex items-center justify-between bg-white border rounded-lg p-3">
        <Button variant="outline" size="sm" onClick={() => setSelectedDate((d) => subDays(d, 1))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="text-center">
          <p className="font-semibold">{format(selectedDate, 'EEEE')}</p>
          <p className="text-sm text-muted-foreground">{format(selectedDate, 'd MMMM yyyy')}</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setSelectedDate((d) => addDays(d, 1))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* New appointment button */}
      <div className="flex justify-end">
        <Button size="sm" onClick={() => setShowForm(true)}>
          <Plus className="h-4 w-4 mr-1" />
          New Appointment
        </Button>
      </div>

      {/* Appointment form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-lg font-semibold mb-4">New Appointment</h2>
            <AppointmentForm
              defaultDate={selectedDate}
              onSuccess={() => setShowForm(false)}
              onCancel={() => setShowForm(false)}
            />
          </div>
        </div>
      )}

      {/* Appointment list */}
      <div className="bg-white border rounded-lg">
        {isLoading ? (
          <div className="py-8 text-center text-muted-foreground text-sm">Loading appointments...</div>
        ) : appointments.length === 0 ? (
          <div className="py-8 text-center text-muted-foreground text-sm">
            No appointments scheduled for {format(selectedDate, 'd MMMM yyyy')}.
          </div>
        ) : (
          <div className="divide-y">
            {appointments.map((appt) => (
              <div key={appt.id} className="p-4 flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{appt.patientName}</span>
                    <Badge
                      variant={STATUS_VARIANT[appt.status] ?? 'default'}
                      className="text-xs capitalize"
                    >
                      {appt.status}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {appt.serviceType} • Dr. {appt.practitionerName}
                  </p>
                  {appt.reason && (
                    <p className="text-xs text-gray-500 mt-0.5">{appt.reason}</p>
                  )}
                </div>
                <div className="text-right text-xs text-muted-foreground">
                  <p>{format(new Date(appt.start), 'HH:mm')}</p>
                  <p>{format(new Date(appt.end), 'HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
