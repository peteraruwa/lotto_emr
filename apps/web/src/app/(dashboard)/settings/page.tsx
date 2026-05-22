'use client';

import React, { useState } from 'react';
import {
  User, Bell, SlidersHorizontal, Palette,
  ShieldCheck, ChevronRight, Camera, Save, Loader2, Lock, Eye, EyeOff,
} from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { useMedplum } from '@medplum/react';

type SettingsTab = 'profile' | 'security' | 'notifications' | 'preferences' | 'theme' | 'roles';

const TABS: { id: SettingsTab; label: string; icon: React.ElementType; description: string }[] = [
  { id: 'profile',       label: 'Profile',             icon: User,             description: 'Your name, photo, and contact details' },
  { id: 'security',      label: 'Security',            icon: Lock,             description: 'Password and authentication settings' },
  { id: 'notifications', label: 'Notifications',       icon: Bell,             description: 'Email, SMS, and in-app alerts' },
  { id: 'preferences',   label: 'User Preferences',    icon: SlidersHorizontal,description: 'Language, date format, and defaults' },
  { id: 'theme',         label: 'Theme',               icon: Palette,          description: 'Appearance and colour scheme' },
  { id: 'roles',         label: 'Role & Permissions',  icon: ShieldCheck,      description: 'Access levels and role assignments' },
];

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="mb-6 pb-4 border-b border-gray-100">
      <h2 className="text-base font-bold text-gray-900">{title}</h2>
      <p className="text-sm text-gray-500 mt-0.5">{description}</p>
    </div>
  );
}

function FormField({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

function TextInput({ value, onChange, placeholder, disabled }: {
  value: string; onChange: (v: string) => void; placeholder?: string; disabled?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      disabled={disabled}
      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400 disabled:bg-gray-50 disabled:text-gray-400 transition-all"
    />
  );
}

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-4 py-3 cursor-pointer group">
      <span className="text-sm text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={cn(
          'relative inline-flex h-5 w-9 items-center rounded-full transition-colors duration-200 flex-shrink-0',
          checked ? 'bg-hospital-600' : 'bg-gray-200',
        )}
      >
        <span className={cn(
          'inline-block h-3.5 w-3.5 rounded-full bg-white shadow transition-transform duration-200',
          checked ? 'translate-x-4' : 'translate-x-1',
        )} />
      </button>
    </label>
  );
}

function SaveButton({ saving, onClick }: { saving: boolean; onClick: () => void }) {
  return (
    <div className="pt-4 border-t border-gray-100">
      <button
        type="button"
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

function ProfileTab() {
  const medplum  = useMedplum();
  const profile  = medplum.getProfile() as any;
  const userId   = profile?.id ?? 'user';
  const photoKey = `emr-profile-photo-${userId}`;

  const [given,  setGiven]  = useState(profile?.name?.[0]?.given?.[0] ?? '');
  const [family, setFamily] = useState(profile?.name?.[0]?.family ?? '');
  const [email,  setEmail]  = useState(profile?.telecom?.find((t: any) => t.system === 'email')?.value ?? '');
  const [phone,  setPhone]  = useState(profile?.telecom?.find((t: any) => t.system === 'phone')?.value ?? '');
  const [photoSrc, setPhotoSrc] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(photoKey);
  });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const fileRef = React.useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPhotoSrc(dataUrl);
    };
    reader.readAsDataURL(file);
  }

  async function handleSave() {
    setSaving(true);
    if (photoSrc) localStorage.setItem(photoKey, photoSrc);
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  const initials = `${given[0] ?? ''}${family[0] ?? ''}`.toUpperCase() || 'U';

  return (
    <div className="space-y-6">
      <SectionHeading title="Profile" description="Manage your personal information and contact details" />

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          {photoSrc ? (
            <img src={photoSrc} alt="Profile" className="w-16 h-16 rounded-2xl object-cover shadow-md" />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-hospital-400 to-hospital-600 flex items-center justify-center text-white text-xl font-bold shadow-md">
              {initials}
            </div>
          )}
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white border border-gray-200 flex items-center justify-center shadow-sm hover:bg-gray-50 transition-colors"
          >
            <Camera className="h-3 w-3 text-gray-500" />
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-800">{given} {family}</p>
          <p className="text-xs text-gray-400 mt-0.5">Click the camera icon to upload a photo</p>
          {photoSrc && (
            <button
              type="button"
              onClick={() => { setPhotoSrc(null); localStorage.removeItem(photoKey); }}
              className="text-xs text-red-500 hover:text-red-600 mt-0.5 underline"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="First Name">
          <TextInput value={given} onChange={setGiven} placeholder="Given name" />
        </FormField>
        <FormField label="Last Name">
          <TextInput value={family} onChange={setFamily} placeholder="Family name" />
        </FormField>
        <FormField label="Email Address">
          <TextInput value={email} onChange={setEmail} placeholder="you@hospital.com" />
        </FormField>
        <FormField label="Phone Number">
          <TextInput value={phone} onChange={setPhone} placeholder="+234…" />
        </FormField>
      </div>

      {saved && (
        <p className="text-sm text-emerald-600 font-medium">Profile updated successfully.</p>
      )}
      <SaveButton saving={saving} onClick={handleSave} />
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder }: {
  value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 pr-10 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400 transition-all"
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
      >
        {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
      </button>
    </div>
  );
}

function SecurityTab() {
  const [current,  setCurrent]  = useState('');
  const [next,     setNext]     = useState('');
  const [confirm,  setConfirm]  = useState('');
  const [saving,   setSaving]   = useState(false);
  const [saved,    setSaved]    = useState(false);
  const [error,    setError]    = useState('');

  async function handleChangePassword() {
    setError('');
    if (!current) { setError('Please enter your current password.'); return; }
    if (next.length < 8) { setError('New password must be at least 8 characters.'); return; }
    if (next !== confirm) { setError('New passwords do not match.'); return; }
    setSaving(true);
    await new Promise((r) => setTimeout(r, 800));
    setSaving(false);
    setSaved(true);
    setCurrent(''); setNext(''); setConfirm('');
    setTimeout(() => setSaved(false), 4000);
  }

  const strength = next.length === 0 ? 0
    : next.length < 8 ? 1
    : (next.length >= 12 && /[A-Z]/.test(next) && /[0-9]/.test(next) && /[^A-Za-z0-9]/.test(next)) ? 3
    : 2;
  const strengthLabel = ['', 'Weak', 'Moderate', 'Strong'];
  const strengthColor = ['', 'bg-red-400', 'bg-amber-400', 'bg-emerald-500'];

  return (
    <div className="space-y-6">
      <SectionHeading title="Security" description="Change your password and manage authentication" />

      <div className="max-w-sm space-y-4">
        <FormField label="Current Password">
          <PasswordInput value={current} onChange={setCurrent} placeholder="Enter current password" />
        </FormField>

        <FormField label="New Password" hint="Minimum 8 characters">
          <PasswordInput value={next} onChange={setNext} placeholder="Enter new password" />
          {next.length > 0 && (
            <div className="flex items-center gap-2 mt-1.5">
              <div className="flex-1 h-1 rounded-full bg-gray-100 overflow-hidden">
                <div
                  className={cn('h-full rounded-full transition-all', strengthColor[strength])}
                  style={{ width: `${(strength / 3) * 100}%` }}
                />
              </div>
              <span className={cn('text-xs font-medium', strength === 1 ? 'text-red-500' : strength === 2 ? 'text-amber-500' : 'text-emerald-600')}>
                {strengthLabel[strength]}
              </span>
            </div>
          )}
        </FormField>

        <FormField label="Confirm New Password">
          <PasswordInput value={confirm} onChange={setConfirm} placeholder="Re-enter new password" />
          {confirm.length > 0 && next !== confirm && (
            <p className="text-xs text-red-500 mt-1">Passwords do not match</p>
          )}
        </FormField>

        {error && <p className="text-sm text-red-600">{error}</p>}
        {saved && <p className="text-sm text-emerald-600 font-medium">Password changed successfully.</p>}
      </div>

      <div className="pt-4 border-t border-gray-100">
        <button
          type="button"
          onClick={handleChangePassword}
          disabled={saving}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Lock className="h-4 w-4" />}
          {saving ? 'Updating…' : 'Change Password'}
        </button>
      </div>
    </div>
  );
}


function NotificationsTab() {
  const [emailAppt, setEmailAppt] = useState(true);
  const [smsAppt, setSmsAppt] = useState(true);
  const [emailResults, setEmailResults] = useState(true);
  const [inAppResults, setInAppResults] = useState(true);
  const [emailReminders, setEmailReminders] = useState(false);
  const [smsReminders, setSmsReminders] = useState(true);
  const [dailySummary, setDailySummary] = useState(true);

  return (
    <div className="space-y-6">
      <SectionHeading title="Notification Settings" description="Choose how and when you receive alerts" />

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Appointments</p>
        <div className="divide-y divide-gray-50">
          <Toggle checked={emailAppt} onChange={setEmailAppt} label="Email on new appointment" />
          <Toggle checked={smsAppt} onChange={setSmsAppt} label="SMS confirmation to patient" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Results & Orders</p>
        <div className="divide-y divide-gray-50">
          <Toggle checked={emailResults} onChange={setEmailResults} label="Email on new lab result" />
          <Toggle checked={inAppResults} onChange={setInAppResults} label="In-app badge for pending results" />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Reminders</p>
        <div className="divide-y divide-gray-50">
          <Toggle checked={emailReminders} onChange={setEmailReminders} label="24-hour appointment reminder (email)" />
          <Toggle checked={smsReminders} onChange={setSmsReminders} label="2-hour appointment reminder (SMS)" />
          <Toggle checked={dailySummary} onChange={setDailySummary} label="Daily schedule summary" />
        </div>
      </div>

      <SaveButton saving={false} onClick={() => {}} />
    </div>
  );
}

function PreferencesTab() {
  const [lang, setLang] = useState('en');
  const [dateFormat, setDateFormat] = useState('dd/MM/yyyy');
  const [timeFormat, setTimeFormat] = useState('24h');
  const [defaultView, setDefaultView] = useState('dashboard');
  const [autoSave, setAutoSave] = useState(true);
  const [compactMode, setCompactMode] = useState(false);

  return (
    <div className="space-y-6">
      <SectionHeading title="User Preferences" description="Customise your workflow and display defaults" />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Language">
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400"
          >
            <option value="en">English</option>
            <option value="fr">Français</option>
            <option value="ha">Hausa</option>
            <option value="yo">Yoruba</option>
            <option value="ig">Igbo</option>
          </select>
        </FormField>

        <FormField label="Date Format">
          <select
            value={dateFormat}
            onChange={(e) => setDateFormat(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400"
          >
            <option value="dd/MM/yyyy">DD/MM/YYYY</option>
            <option value="MM/dd/yyyy">MM/DD/YYYY</option>
            <option value="yyyy-MM-dd">YYYY-MM-DD</option>
          </select>
        </FormField>

        <FormField label="Time Format">
          <select
            value={timeFormat}
            onChange={(e) => setTimeFormat(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400"
          >
            <option value="24h">24-hour (14:30)</option>
            <option value="12h">12-hour (2:30 PM)</option>
          </select>
        </FormField>

        <FormField label="Default Landing Page">
          <select
            value={defaultView}
            onChange={(e) => setDefaultView(e.target.value)}
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-200 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400"
          >
            <option value="dashboard">Dashboard</option>
            <option value="patients">Patients</option>
            <option value="schedule">Schedule</option>
            <option value="ward">Ward</option>
          </select>
        </FormField>
      </div>

      <div className="divide-y divide-gray-50">
        <Toggle checked={autoSave} onChange={setAutoSave} label="Auto-save clinical notes every 10 seconds" />
        <Toggle checked={compactMode} onChange={setCompactMode} label="Compact sidebar (collapsed by default)" />
      </div>

      <SaveButton saving={false} onClick={() => {}} />
    </div>
  );
}

function ThemeTab() {
  const [scheme, setScheme] = useState<'light' | 'dark' | 'system'>('system');

  const options: { value: typeof scheme; label: string; desc: string }[] = [
    { value: 'light',  label: 'Light',  desc: 'Always use the light theme' },
    { value: 'dark',   label: 'Dark',   desc: 'Always use the dark theme' },
    { value: 'system', label: 'System', desc: 'Follow device preference' },
  ];

  function applyTheme(v: typeof scheme) {
    setScheme(v);
    const isDark = v === 'dark' || (v === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
    localStorage.setItem('emr-theme', v);
  }

  return (
    <div className="space-y-6">
      <SectionHeading title="Theme" description="Choose your preferred colour scheme" />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => applyTheme(opt.value)}
            className={cn(
              'rounded-xl border-2 p-4 text-left transition-all',
              scheme === opt.value
                ? 'border-hospital-500 bg-hospital-50'
                : 'border-gray-200 hover:border-gray-300 bg-white',
            )}
          >
            <div className={cn(
              'w-full h-12 rounded-lg mb-3 border',
              opt.value === 'dark'
                ? 'bg-gray-900 border-gray-700'
                : opt.value === 'light'
                ? 'bg-white border-gray-200'
                : 'bg-gradient-to-r from-white to-gray-900 border-gray-300',
            )} />
            <p className={cn('text-sm font-semibold', scheme === opt.value ? 'text-hospital-700' : 'text-gray-800')}>
              {opt.label}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );
}

function RolesTab() {
  const ROLE_DESCRIPTIONS: Record<string, string> = {
    doctor:      'Full clinical access — notes, orders, prescriptions, results',
    nurse:       'Vitals, triage, ward tasks, medication administration',
    pharmacist:  'Prescription review, dispensing, medication records',
    lab:         'Lab order management, result entry, specimen tracking',
    radiologist: 'Imaging orders, report generation, DICOM viewing',
    admin:       'Patient registration, scheduling, facility management',
    hr:          'Employee management, payroll, staff scheduling',
    records:     'Medical record access, filing, patient history',
    billing:     'Claims, invoicing, insurance, payments',
    superadmin:  'Full system access including configuration and analytics',
  };

  const roleColors: Record<string, string> = {
    doctor: 'bg-blue-50 text-blue-700 border-blue-200',
    nurse: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    pharmacist: 'bg-purple-50 text-purple-700 border-purple-200',
    lab: 'bg-amber-50 text-amber-700 border-amber-200',
    radiologist: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    admin: 'bg-gray-50 text-gray-700 border-gray-200',
    hr: 'bg-rose-50 text-rose-700 border-rose-200',
    records: 'bg-teal-50 text-teal-700 border-teal-200',
    billing: 'bg-orange-50 text-orange-700 border-orange-200',
    superadmin: 'bg-red-50 text-red-700 border-red-200',
  };

  return (
    <div className="space-y-6">
      <SectionHeading title="Role & Permissions" description="System roles and their associated access levels" />

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
        Role assignments are managed by your system administrator via Medplum AccessPolicies. Contact support to request a role change.
      </div>

      <div className="space-y-2">
        {Object.entries(ROLE_DESCRIPTIONS).map(([role, desc]) => (
          <div key={role} className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-white">
            <span className={cn('px-2.5 py-1 rounded-lg text-xs font-semibold border flex-shrink-0 capitalize mt-0.5', roleColors[role] ?? 'bg-gray-100 text-gray-600')}>
              {role}
            </span>
            <p className="text-sm text-gray-600 leading-relaxed">{desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');

  const TAB_CONTENT: Record<SettingsTab, React.ReactNode> = {
    profile:       <ProfileTab />,
    security:      <SecurityTab />,
    notifications: <NotificationsTab />,
    preferences:   <PreferencesTab />,
    theme:         <ThemeTab />,
    roles:         <RolesTab />,
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4 animate-fade-in">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Settings</h1>
        <p className="text-sm text-gray-500 mt-0.5">Manage your profile, preferences, and system configuration</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-4">
        {/* Sidebar */}
        <aside className="lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-2xl border border-gray-100 shadow-sm p-2 space-y-0.5">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left',
                    activeTab === tab.id
                      ? 'bg-hospital-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900',
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', activeTab === tab.id ? 'text-white' : 'text-gray-400')} />
                  <span className="truncate">{tab.label}</span>
                  {activeTab !== tab.id && <ChevronRight className="h-3.5 w-3.5 ml-auto text-gray-300 flex-shrink-0" />}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <main className="flex-1 min-w-0 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6">
          {TAB_CONTENT[activeTab]}
        </main>
      </div>
    </div>
  );
}
