'use client';

import React, { useState } from 'react';
import { useMedplum } from '@medplum/react';
import {
  FlaskConical,
  Scan,
  Pill,
  Scissors,
  Calendar,
  X,
  ShoppingBasket,
  CheckCircle2,
} from 'lucide-react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Label,
} from '@lotto-emr/ui';
import type { BasketItem } from '../types';

type ItemType = BasketItem['type'];
type Priority = BasketItem['priority'];
type PaymentMode = 'hmo' | 'cash' | 'waiver';

const TYPE_OPTIONS: { value: ItemType; label: string; icon: React.ElementType }[] = [
  { value: 'LAB',       label: 'Lab',        icon: FlaskConical },
  { value: 'IMAGING',   label: 'Imaging',    icon: Scan },
  { value: 'MEDICATION',label: 'Medication', icon: Pill },
  { value: 'PROCEDURE', label: 'Procedure',  icon: Scissors },
  { value: 'FOLLOWUP',  label: 'Follow-up',  icon: Calendar },
];

const TYPE_ICON: Record<ItemType, React.ElementType> = {
  LAB:       FlaskConical,
  IMAGING:   Scan,
  MEDICATION:Pill,
  PROCEDURE: Scissors,
  FOLLOWUP:  Calendar,
};

const TYPE_COLOR: Record<ItemType, string> = {
  LAB:       'text-blue-600',
  IMAGING:   'text-purple-600',
  MEDICATION:'text-green-600',
  PROCEDURE: 'text-orange-600',
  FOLLOWUP:  'text-teal-600',
};

const PRIORITY_STYLES: Record<Priority, string> = {
  routine: 'bg-gray-100 text-gray-700',
  urgent:  'bg-amber-100 text-amber-800',
  stat:    'bg-red-100 text-red-800',
};

interface OrderBasketProps {
  patientId: string;
  encounterId?: string;
  onSubmitted?: () => void;
}

function generateId() {
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function OrderBasket({ patientId, encounterId, onSubmitted }: OrderBasketProps) {
  const medplum = useMedplum();

  // Basket state
  const [items, setItems] = useState<BasketItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>('cash');
  const [hmoProvider, setHmoProvider] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Add-item form state
  const [selectedType, setSelectedType] = useState<ItemType>('LAB');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('routine');
  const [notes, setNotes] = useState('');
  const [estimatedCost, setEstimatedCost] = useState('');
  // Medication fields
  const [dose, setDose] = useState('');
  const [frequency, setFrequency] = useState('');
  const [durationDays, setDurationDays] = useState('');

  const totalEstimate = items.reduce((sum, i) => sum + (i.estimatedCost ?? 0), 0);

  function resetForm() {
    setDescription('');
    setPriority('routine');
    setNotes('');
    setEstimatedCost('');
    setDose('');
    setFrequency('');
    setDurationDays('');
  }

  function handleAddItem() {
    if (!description.trim()) return;

    const item: BasketItem = {
      id: generateId(),
      type: selectedType,
      description: description.trim(),
      priority,
      notes: notes.trim() || undefined,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      ...(selectedType === 'MEDICATION'
        ? {
            dose: dose.trim() || undefined,
            frequency: frequency.trim() || undefined,
            durationDays: durationDays ? parseInt(durationDays, 10) : undefined,
          }
        : {}),
    };

    setItems((prev) => [...prev, item]);
    resetForm();
  }

  function handleRemoveItem(id: string) {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function handleSubmit() {
    if (items.length === 0) return;
    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();

      // 1. Create FHIR RequestGroup as the basket
      const requestGroup = await medplum.createResource({
        resourceType: 'RequestGroup',
        status: 'active',
        intent: 'proposal',
        subject: { reference: `Patient/${patientId}` },
        authoredOn: now,
        note: [
          {
            text: JSON.stringify({
              items,
              paymentMode,
              hmoProvider: paymentMode === 'hmo' ? hmoProvider : undefined,
              totalEstimate,
            }),
          },
        ],
        action: items.map((item) => ({
          title: item.description,
          resource: undefined,
        })),
      } as any);

      // 2. Create individual FHIR resources for each basket item as draft
      await Promise.allSettled(
        items.map((item) => {
          if (item.type === 'MEDICATION') {
            return medplum.createResource({
              resourceType: 'MedicationRequest',
              status: 'draft',
              intent: 'order',
              medicationCodeableConcept: { text: item.description },
              subject: { reference: `Patient/${patientId}` },
              encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
              authoredOn: now,
              priority: item.priority,
              dosageInstruction: item.dose
                ? [
                    {
                      text: `${item.dose}${item.frequency ? ` ${item.frequency}` : ''}`,
                      timing: item.frequency ? { code: { text: item.frequency } } : undefined,
                    },
                  ]
                : undefined,
              dispenseRequest: item.durationDays
                ? {
                    expectedSupplyDuration: {
                      value: item.durationDays,
                      unit: 'days',
                      system: 'http://unitsofmeasure.org',
                      code: 'd',
                    },
                  }
                : undefined,
              note: item.notes ? [{ text: item.notes }] : undefined,
            } as any);
          }

          // LAB, IMAGING, PROCEDURE, FOLLOWUP → ServiceRequest
          const category =
            item.type === 'IMAGING'
              ? [{ coding: [{ system: 'http://snomed.info/sct', code: '363679005', display: 'Imaging' }] }]
              : [{ coding: [{ system: 'http://snomed.info/sct', code: '108252007', display: 'Laboratory procedure' }] }];

          return medplum.createResource({
            resourceType: 'ServiceRequest',
            status: 'draft',
            intent: 'order',
            category,
            code: { text: item.description },
            subject: { reference: `Patient/${patientId}` },
            encounter: encounterId ? { reference: `Encounter/${encounterId}` } : undefined,
            authoredOn: now,
            priority: item.priority,
            note: item.notes ? [{ text: item.notes }] : undefined,
          } as any);
        })
      );

      setSubmitted(true);
      onSubmitted?.();
    } catch (err) {
      console.error('Failed to submit basket:', err);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-l-4 border-indigo-400">
        <CardContent className="p-8 flex flex-col items-center gap-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <p className="text-lg font-semibold text-gray-900">
            Basket Submitted for Authorization
          </p>
          <p className="text-sm text-muted-foreground">
            Your order basket has been sent to the billing team for HMO/payment authorization.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSubmitted(false);
              setItems([]);
              setPaymentMode('cash');
              setHmoProvider('');
            }}
          >
            Start New Basket
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-indigo-400">
      {/* Header */}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ShoppingBasket className="h-5 w-5 text-indigo-500" />
          Order Basket
          {items.length > 0 && (
            <Badge className="ml-1 bg-indigo-100 text-indigo-800 text-xs">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-5">
        {/* Add Item Section */}
        <div className="rounded-lg border bg-indigo-50 p-4 space-y-4">
          <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
            Add Item
          </p>

          {/* Type selector */}
          <div className="flex flex-wrap gap-1.5">
            {TYPE_OPTIONS.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                onClick={() => setSelectedType(value)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                  selectedType === value
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>

          {/* Description */}
          <div className="space-y-1">
            <Label htmlFor="basket-description">
              {selectedType === 'MEDICATION' ? 'Medication Name *' : 'Description *'}
            </Label>
            <input
              id="basket-description"
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={
                selectedType === 'LAB'
                  ? 'e.g. Full Blood Count'
                  : selectedType === 'IMAGING'
                  ? 'e.g. Chest X-Ray PA view'
                  : selectedType === 'MEDICATION'
                  ? 'e.g. Metformin 500mg'
                  : selectedType === 'PROCEDURE'
                  ? 'e.g. IV cannulation'
                  : 'e.g. Review in 2 weeks'
              }
              className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
            />
          </div>

          {/* Priority chips */}
          <div className="space-y-1.5">
            <Label>Priority</Label>
            <div className="flex gap-2">
              {(['routine', 'urgent', 'stat'] as Priority[]).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors capitalize ${
                    priority === p
                      ? p === 'stat'
                        ? 'bg-red-600 text-white border-red-600'
                        : p === 'urgent'
                        ? 'bg-amber-500 text-white border-amber-500'
                        : 'bg-gray-700 text-white border-gray-700'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                  }`}
                >
                  {p === 'stat' ? 'STAT' : p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Medication-specific fields */}
          {selectedType === 'MEDICATION' && (
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <Label htmlFor="basket-dose">Dose</Label>
                <input
                  id="basket-dose"
                  type="text"
                  value={dose}
                  onChange={(e) => setDose(e.target.value)}
                  placeholder="e.g. 500mg"
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="basket-frequency">Frequency</Label>
                <select
                  id="basket-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <option value="">Select...</option>
                  <option value="Once daily (OD)">Once daily (OD)</option>
                  <option value="Twice daily (BD)">Twice daily (BD)</option>
                  <option value="Three times daily (TDS)">Three times daily (TDS)</option>
                  <option value="Four times daily (QDS)">Four times daily (QDS)</option>
                  <option value="As needed (PRN)">As needed (PRN)</option>
                  <option value="Stat (single dose)">Stat (single dose)</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="basket-duration">Duration (days)</Label>
                <input
                  id="basket-duration"
                  type="number"
                  min={1}
                  value={durationDays}
                  onChange={(e) => setDurationDays(e.target.value)}
                  placeholder="e.g. 7"
                  className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
            </div>
          )}

          {/* Notes and Cost row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="basket-notes">Notes (optional)</Label>
              <input
                id="basket-notes"
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Clinical indication..."
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="basket-cost">Est. Cost (₦)</Label>
              <input
                id="basket-cost"
                type="number"
                min={0}
                step={0.01}
                value={estimatedCost}
                onChange={(e) => setEstimatedCost(e.target.value)}
                placeholder="0.00"
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          </div>

          <Button
            type="button"
            size="sm"
            onClick={handleAddItem}
            disabled={!description.trim()}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            Add to Basket
          </Button>
        </div>

        {/* Basket List */}
        {items.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              Items in Basket
            </p>
            <div className="space-y-2">
              {items.map((item) => {
                const Icon = TYPE_ICON[item.type];
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 rounded-lg border bg-white px-3 py-2.5"
                  >
                    <Icon className={`h-4 w-4 flex-shrink-0 ${TYPE_COLOR[item.type]}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {item.description}
                      </p>
                      {item.notes && (
                        <p className="text-xs text-muted-foreground truncate">{item.notes}</p>
                      )}
                      {item.type === 'MEDICATION' && (item.dose || item.frequency) && (
                        <p className="text-xs text-muted-foreground">
                          {[item.dose, item.frequency, item.durationDays ? `${item.durationDays}d` : '']
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      )}
                    </div>
                    <span
                      className={`flex-shrink-0 px-2 py-0.5 rounded-full text-xs font-medium ${PRIORITY_STYLES[item.priority]}`}
                    >
                      {item.priority === 'stat' ? 'STAT' : item.priority}
                    </span>
                    {item.estimatedCost != null && (
                      <span className="flex-shrink-0 text-xs font-mono text-gray-600">
                        ₦{item.estimatedCost.toLocaleString()}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(item.id)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-500 transition-colors"
                      aria-label="Remove item"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Summary Footer */}
        <div className="rounded-lg border bg-gray-50 p-4 space-y-4">
          {/* Total */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">Total Estimated Cost</span>
            <span className="text-lg font-bold text-gray-900">
              ₦{totalEstimate.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          {/* Payment mode */}
          <div className="space-y-1.5">
            <Label>Payment Mode</Label>
            <div className="flex gap-2">
              {(['hmo', 'cash', 'waiver'] as PaymentMode[]).map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setPaymentMode(mode)}
                  className={`flex-1 py-1.5 rounded-md text-xs font-medium border transition-colors uppercase ${
                    paymentMode === mode
                      ? 'bg-indigo-600 text-white border-indigo-600'
                      : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
                  }`}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* HMO Provider input */}
          {paymentMode === 'hmo' && (
            <div className="space-y-1">
              <Label htmlFor="hmo-provider">HMO Provider *</Label>
              <input
                id="hmo-provider"
                type="text"
                value={hmoProvider}
                onChange={(e) => setHmoProvider(e.target.value)}
                placeholder="e.g. NHIS, Hygeia, AXA Mansard..."
                className="flex h-9 w-full rounded-md border border-input bg-white px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>
          )}

          {/* Submit button */}
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={
              items.length === 0 ||
              isSubmitting ||
              (paymentMode === 'hmo' && !hmoProvider.trim())
            }
            className="w-full bg-teal-600 hover:bg-teal-700 text-white disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Billing Authorization'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
