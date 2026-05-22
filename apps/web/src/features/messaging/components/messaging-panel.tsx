'use client';

import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Search, ArrowLeft, Circle } from 'lucide-react';
import { cn } from '@lotto-emr/ui';
import { format, isToday, isYesterday } from 'date-fns';
import { useMessaging } from '../hooks/use-messaging';
import type { Conversation } from '../types';

const ROLE_COLOR: Record<string, string> = {
  doctor:      'bg-blue-100 text-blue-700',
  nurse:       'bg-emerald-100 text-emerald-700',
  pharmacist:  'bg-purple-100 text-purple-700',
  lab:         'bg-amber-100 text-amber-700',
  radiologist: 'bg-cyan-100 text-cyan-700',
  admin:       'bg-gray-100 text-gray-600',
  hr:          'bg-rose-100 text-rose-700',
};

function formatTs(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (isToday(d)) return format(d, 'HH:mm');
  if (isYesterday(d)) return 'Yesterday';
  return format(d, 'd MMM');
}

function initials(name: string) {
  return name.split(' ').map((w) => w[0]).join('').toUpperCase().slice(0, 2);
}

interface MessagingPanelProps {
  userId: string;
  userName: string;
  userRole: string;
}

export function MessagingPanel({ userId, userName, userRole }: MessagingPanelProps) {
  const [open, setOpen] = useState(false);
  const [activeConvo, setActiveConvo] = useState<Conversation | null>(null);
  const [draft, setDraft] = useState('');
  const [search, setSearch] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const { conversations, totalUnread, getConversationMessages, sendMessage, markRead } = useMessaging(userId, userName, userRole);

  const msgs = activeConvo ? getConversationMessages(activeConvo.id) : [];

  useEffect(() => {
    if (activeConvo) {
      markRead(activeConvo.id);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 80);
    }
  }, [activeConvo, msgs.length]);

  function handleSend() {
    if (!draft.trim() || !activeConvo) return;
    sendMessage(activeConvo.id, draft);
    setDraft('');
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const filtered = conversations.filter((c) =>
    c.participantName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Floating trigger button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-100 text-gray-500 hover:bg-gray-200 transition-colors flex-shrink-0"
        title="Messages"
      >
        <MessageCircle className="h-4 w-4" />
        {totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="fixed bottom-4 right-4 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 flex flex-col overflow-hidden animate-fade-in"
          style={{ maxHeight: '70vh', height: 520 }}>

          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-hospital-600 text-white flex-shrink-0 rounded-t-2xl">
            {activeConvo ? (
              <>
                <button onClick={() => setActiveConvo(null)} className="p-1 rounded-lg hover:bg-white/20 transition-colors mr-2">
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold flex-shrink-0', ROLE_COLOR[activeConvo.participantRole] ?? 'bg-gray-100 text-gray-600')}>
                    {initials(activeConvo.participantName)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{activeConvo.participantName}</p>
                    <p className="text-[11px] text-white/70 capitalize">{activeConvo.participantRole}</p>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2 flex-1">
                <MessageCircle className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm font-semibold">Messages</p>
                {totalUnread > 0 && (
                  <span className="ml-1 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {totalUnread}
                  </span>
                )}
              </div>
            )}
            <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-white/20 transition-colors ml-2">
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation list */}
          {!activeConvo && (
            <>
              <div className="px-3 py-2 border-b border-gray-100 flex-shrink-0">
                <div className="relative">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="w-full pl-8 pr-3 py-1.5 text-sm rounded-lg bg-gray-100 border-transparent focus:outline-none focus:ring-2 focus:ring-hospital-400/30 text-gray-800 placeholder:text-gray-400"
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto">
                {filtered.map((convo) => (
                  <button
                    key={convo.id}
                    type="button"
                    onClick={() => setActiveConvo(convo)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-0 text-left"
                  >
                    <div className={cn('w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0', ROLE_COLOR[convo.participantRole] ?? 'bg-gray-100 text-gray-600')}>
                      {initials(convo.participantName)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className={cn('text-sm truncate', convo.unreadCount > 0 ? 'font-bold text-gray-900' : 'font-semibold text-gray-800')}>
                          {convo.participantName}
                        </p>
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{formatTs(convo.lastTimestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <p className={cn('text-xs truncate', convo.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400')}>
                          {convo.lastMessage}
                        </p>
                        {convo.unreadCount > 0 && (
                          <span className="flex-shrink-0 w-4 h-4 rounded-full bg-hospital-600 text-white text-[9px] font-bold flex items-center justify-center ml-auto">
                            {convo.unreadCount > 9 ? '9+' : convo.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}

          {/* Chat window */}
          {activeConvo && (
            <>
              <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
                {msgs.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full text-center py-8">
                    <MessageCircle className="h-8 w-8 text-gray-200 mb-2" />
                    <p className="text-sm text-gray-400">No messages yet. Say hello!</p>
                  </div>
                )}
                {msgs.map((msg) => {
                  const isMine = msg.senderId === userId;
                  return (
                    <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                      <div className={cn(
                        'max-w-[75%] px-3 py-2 rounded-xl text-sm leading-relaxed',
                        isMine
                          ? 'bg-hospital-600 text-white rounded-br-sm'
                          : 'bg-gray-100 text-gray-800 rounded-bl-sm',
                      )}>
                        {!isMine && (
                          <p className="text-[10px] font-semibold mb-0.5 text-gray-500">{msg.senderName}</p>
                        )}
                        <p>{msg.text}</p>
                        <p className={cn('text-[10px] mt-1', isMine ? 'text-white/60' : 'text-gray-400')}>
                          {formatTs(msg.timestamp)}
                          {isMine && (
                            <span className="ml-1">
                              {msg.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  );
                })}
                <div ref={bottomRef} />
              </div>

              {/* Input */}
              <div className="px-3 py-2 border-t border-gray-100 flex items-end gap-2 flex-shrink-0">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  placeholder="Type a message…"
                  className="flex-1 min-w-0 px-3 py-2 text-sm rounded-xl border border-gray-200 bg-gray-50 resize-none focus:outline-none focus:ring-2 focus:ring-hospital-400/30 focus:border-hospital-400 max-h-24 overflow-y-auto leading-relaxed"
                  style={{ height: 40 }}
                />
                <button
                  type="button"
                  onClick={handleSend}
                  disabled={!draft.trim()}
                  className="w-9 h-9 flex items-center justify-center rounded-xl bg-hospital-600 hover:bg-hospital-700 text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}
