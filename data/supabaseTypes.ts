import type { IntakeResult } from './types';

export type EntryType =
  | 'memory'
  | 'claim'
  | 'task'
  | 'event'
  | 'goal'
  | 'recommendation'
  | 'blindspot'
  | 'profile'
  | 'rule_of_life';

export type ContentType = 'text' | 'image' | 'url' | 'video';
export type Sentiment = 'positive' | 'negative' | 'neutral' | 'mixed';
export type EntrySource = 'dashboard' | 'telegram' | 'import';

export interface VaultEntryRow {
  id: string;
  user_id: string;
  entry_type: EntryType;
  entry_id: string;
  encrypted_data: string;
  iv: string;
  category?: string | null;
  subcategory?: string | null;
  sentiment?: Sentiment | null;
  source: EntrySource;
  logged_at: string;
  created_at: string;
  updated_at: string;
}

export interface InboxEntry {
  id: string;
  user_id: string;
  source: string;
  raw_content: string;
  content_type: ContentType;
  source_url?: string | null;
  media_storage_path?: string | null;
  ai_result?: IntakeResult | null;
  merged: boolean;
  merged_at?: string | null;
  created_at: string;
}

export interface TelegramBinding {
  id: string;
  user_id: string;
  telegram_chat_id: number;
  telegram_username?: string | null;
  telegram_first_name?: string | null;
  linked_at: string;
  is_active: boolean;
}

export interface UserProfileRow {
  id: string;
  display_name?: string | null;
  vault_salt: string;
  vault_iterations: number;
  timezone?: string | null;
  telegram_link_token?: string | null;
  telegram_link_expires_at?: string | null;
  created_at: string;
  updated_at: string;
}

export type Database = {
  public: {
    Tables: {
      vault_entries: {
        Row: VaultEntryRow;
        Insert: Omit<VaultEntryRow, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<VaultEntryRow>;
      };
      inbox_entries: {
        Row: InboxEntry;
        Insert: Omit<InboxEntry, 'id' | 'created_at' | 'merged'> & {
          id?: string;
          created_at?: string;
          merged?: boolean;
        };
        Update: Partial<InboxEntry>;
      };
      telegram_bindings: {
        Row: TelegramBinding;
        Insert: Omit<TelegramBinding, 'id' | 'linked_at'> & {
          id?: string;
          linked_at?: string;
        };
        Update: Partial<TelegramBinding>;
      };
      user_profiles: {
        Row: UserProfileRow;
        Insert: Omit<UserProfileRow, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<UserProfileRow>;
      };
    };
  };
};
