import { BlockKind } from '@/components/blocks/components/block';

export interface User {
  id: string;
  email: string;
  password?: string;
  createdAt: Date;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  createdAt: Date;
  visibility: 'private' | 'public';
}

export interface Message {
  id: string;
  chatId: string;
  content: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  title: string;
  kind: BlockKind;
  content: string;
  userId: string;
  createdAt: Date;
}

export interface Suggestion {
  id: string;
  documentId: string;
  content: string;
  createdAt: Date;
}

export interface Vote {
  id: string;
  messageId: string;
  chatId: string;
  type: 'up' | 'down';
  createdAt: Date;
}
