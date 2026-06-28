import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useFocusEffect } from '@react-navigation/native';

export default function ChatScreen({ route }: any) {
  const { sessionId, name } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const intervalRef = useRef<any>(null);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(sessionId);
      setMessages(data);
    } catch {}
  };

  useFocusEffect(useCallback(() => {
    loadMessages();
    intervalRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]));

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);
    try {
      await api.sendMessage(sessionId, 'text', content);
      await loadMessages();
    } catch (e: any) {
      Alert.alert('发送失败', e.message);
    } finally {
      setSending(false);
    }
  };

  const isMe = (msg: any) => msg.senderId === user?.userId;

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={s.list}
        contentContainerStyle={s.listContent}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => (
          <View style={[s.bubble, isMe(item) ? s.me : s.them]}>
            {!isMe(item) && <Text style={s.sender}>{item.senderNickname || item.senderAccount || ''}</Text>}
            <Text style={[s.msgText, isMe(item) ? s.msgTextMe : s.msgTextThem]}>{item.content}</Text>
            <Text style={[s.msgTime, isMe(item) ? s.msgTimeMe : s.msgTimeThem]}>
              {new Date(item.createdAt).getHours().toString().padStart(2, '0')}:{new Date(item.createdAt).getMinutes().toString().padStart(2, '0')}
            </Text>
          </View>
        )}
      />
      <View style={s.inputBar}>
        <TextInput style={s.input} value={text} onChangeText={setText} placeholder="输入消息..." multiline maxLength={500} />
        <TouchableOpacity style={s.sendBtn} onPress={handleSend} disabled={sending || !text.trim()}>
          <Ionicons name="send" size={22} color={text.trim() ? '#3B82F6' : '#CBD5E1'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 4 },
  bubble: { maxWidth: '75%', marginBottom: 10, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  me: { alignSelf: 'flex-end', backgroundColor: '#3B82F6', borderBottomRightRadius: 4 },
  them: { alignSelf: 'flex-start', backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  sender: { fontSize: 11, color: '#64748B', marginBottom: 2 },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextThem: { color: '#1E293B' },
  msgTime: { fontSize: 10, marginTop: 4 },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  msgTimeThem: { color: '#94A3B8' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { marginLeft: 8, padding: 10 },
});
