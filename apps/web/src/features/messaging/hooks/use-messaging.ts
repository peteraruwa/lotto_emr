'use client';

import { useState, useCallback, useEffect } from 'react';
import type { ChatMessage, Conversation } from '../types';

const STORAGE_KEY = 'emr_messages';
const CONVOS_KEY  = 'emr_conversations';

const SEED_STAFF: Omit<Conversation, 'lastMessage' | 'lastTimestamp' | 'unreadCount'>[] = [
  { id: 'conv_lab',      participantId: 'lab',      participantName: 'Lab Team',      participantRole: 'lab' },
  { id: 'conv_nurse',    participantId: 'nurse',    participantName: 'Nursing Team',  participantRole: 'nurse' },
  { id: 'conv_pharmacy', participantId: 'pharmacy', participantName: 'Pharmacy',      participantRole: 'pharmacist' },
  { id: 'conv_admin',    participantId: 'admin',    participantName: 'Admin Office',  participantRole: 'admin' },
  { id: 'conv_radiology',participantId: 'radiology',participantName: 'Radiology',     participantRole: 'radiologist' },
];

function loadMessages(): ChatMessage[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
  } catch {
    return [];
  }
}

function saveMessages(msgs: ChatMessage[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(msgs.slice(-500)));
}

function loadConversations(): Conversation[] {
  try {
    const stored = JSON.parse(localStorage.getItem(CONVOS_KEY) ?? '[]') as Conversation[];
    // Merge seed staff — ensure all seed convos exist
    const seeded = SEED_STAFF.map((s) => {
      const existing = stored.find((c) => c.id === s.id);
      return existing ?? { ...s, lastMessage: 'Start a conversation', lastTimestamp: '', unreadCount: 0 };
    });
    return seeded;
  } catch {
    return SEED_STAFF.map((s) => ({ ...s, lastMessage: 'Start a conversation', lastTimestamp: '', unreadCount: 0 }));
  }
}

function saveConversations(convos: Conversation[]) {
  localStorage.setItem(CONVOS_KEY, JSON.stringify(convos));
}

export function useMessaging(currentUserId: string, currentUserName: string, currentUserRole: string) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  useEffect(() => {
    setConversations(loadConversations());
    setMessages(loadMessages());
  }, []);

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const getConversationMessages = useCallback((conversationId: string) =>
    messages.filter((m) => m.conversationId === conversationId)
  , [messages]);

  const sendMessage = useCallback((conversationId: string, text: string) => {
    const msg: ChatMessage = {
      id:             `msg_${Date.now()}`,
      conversationId,
      senderId:       currentUserId,
      senderName:     currentUserName,
      senderRole:     currentUserRole,
      text:           text.trim(),
      timestamp:      new Date().toISOString(),
      read:           true,
    };
    const updated = [...messages, msg];
    setMessages(updated);
    saveMessages(updated);

    // Simulate a reply after 2–4s for demo purposes
    const convo = conversations.find((c) => c.id === conversationId);
    if (convo) {
      const replyDelay = 2000 + Math.random() * 2000;
      setTimeout(() => {
        const replies = [
          'Got it, thank you!',
          'Noted. We will action that shortly.',
          'Understood, I will follow up.',
          'Thanks for the update.',
          'On it — will let you know.',
          'Received. Processing now.',
        ];
        const reply: ChatMessage = {
          id:             `msg_${Date.now()}_reply`,
          conversationId,
          senderId:       convo.participantId,
          senderName:     convo.participantName,
          senderRole:     convo.participantRole,
          text:           replies[Math.floor(Math.random() * replies.length)],
          timestamp:      new Date().toISOString(),
          read:           false,
        };
        setMessages((prev) => {
          const next = [...prev, reply];
          saveMessages(next);
          return next;
        });
        setConversations((prev) => {
          const next = prev.map((c) =>
            c.id === conversationId
              ? { ...c, lastMessage: reply.text, lastTimestamp: reply.timestamp, unreadCount: c.unreadCount + 1 }
              : c
          );
          saveConversations(next);
          return next;
        });
      }, replyDelay);
    }

    // Update conversation
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessage: text.trim(), lastTimestamp: msg.timestamp }
          : c
      );
      saveConversations(next);
      return next;
    });
  }, [messages, conversations, currentUserId, currentUserName, currentUserRole]);

  const markRead = useCallback((conversationId: string) => {
    setMessages((prev) => {
      const next = prev.map((m) =>
        m.conversationId === conversationId ? { ...m, read: true } : m
      );
      saveMessages(next);
      return next;
    });
    setConversations((prev) => {
      const next = prev.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      );
      saveConversations(next);
      return next;
    });
  }, []);

  return { conversations, totalUnread, getConversationMessages, sendMessage, markRead };
}
