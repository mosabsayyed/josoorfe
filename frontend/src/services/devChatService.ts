import { supabase } from '../lib/supabaseClient';

export interface DevChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'claude' | 'human' | 'system';
  content: string;
  channel: string;
  created_at: string;
  metadata: Record<string, unknown>;
}

/**
 * Fetch recent messages for a channel
 */
export async function getRecentMessages(channel = 'general', limit = 100): Promise<DevChatMessage[]> {
  const { data, error } = await supabase
    .from('dev_chat_messages')
    .select('*')
    .eq('channel', channel)
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('DevChat: error fetching messages', error);
    throw error;
  }
  return data || [];
}

/**
 * Send a message
 */
export async function sendMessage(
  senderId: string,
  senderType: 'claude' | 'human' | 'system',
  content: string,
  metadata: Record<string, unknown> = {},
  channel = 'general'
): Promise<DevChatMessage> {
  const { data, error } = await supabase
    .from('dev_chat_messages')
    .insert({ sender_id: senderId, sender_type: senderType, content, channel, metadata })
    .select()
    .single();

  if (error) {
    console.error('DevChat: error sending message', error);
    throw error;
  }
  return data;
}

/**
 * Subscribe to new messages via Supabase Realtime
 */
export function subscribeToMessages(
  channel: string,
  callback: (msg: DevChatMessage) => void
) {
  const sub = supabase
    .channel(`devchat:${channel}`)
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'dev_chat_messages',
        filter: `channel=eq.${channel}`,
      },
      (payload: { new: DevChatMessage }) => {
        callback(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(sub);
  };
}
