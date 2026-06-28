import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useFocusEffect } from '@react-navigation/native';

export default function SessionListScreen({ navigation }: any) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getSessions();
      setSessions(data);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const getName = (s: any) => {
    if (s.name) return s.name;
    const other = s.members?.find((m: any) => m.userId !== user?.userId);
    return other?.nickname || other?.account || '未知';
  };

  const getLastMsg = (s: any) => {
    if (!s.lastMessage) return '暂无消息';
    const msg = s.lastMessage;
    if (msg.type === 'image') return '[图片]';
    if (msg.type === 'file') return '[文件]';
    return msg.content?.substring(0, 40) || '';
  };

  const formatTime = (t: string) => {
    if (!t) return '';
    const d = new Date(t);
    const now = new Date();
    if (d.toDateString() === now.toDateString()) {
      return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
    }
    return (d.getMonth() + 1) + '/' + d.getDate();
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>消息</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchUser')}>
          <Ionicons name="add-circle-outline" size={28} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={sessions}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CBD5E1" />
            <Text style={s.emptyText}>暂无会话</Text>
            <Text style={s.emptyHint}>点击右上角 + 发起新聊天</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.item} onPress={() => navigation.navigate('Chat', { sessionId: item.id, name: getName(item) })}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{getName(item)[0]}</Text>
            </View>
            <View style={s.info}>
              <View style={s.row}>
                <Text style={s.name} numberOfLines={1}>{getName(item)}</Text>
                <Text style={s.time}>{formatTime(item.lastMessage?.createdAt || item.updatedAt)}</Text>
              </View>
              <Text style={s.msg} numberOfLines={1}>{getLastMsg(item)}</Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  item: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  avatar: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  info: { flex: 1, justifyContent: 'center' },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 16, fontWeight: '600', color: '#1E293B', flex: 1 },
  time: { fontSize: 12, color: '#94A3B8', marginLeft: 8 },
  msg: { fontSize: 14, color: '#64748B', marginTop: 4 },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyText: { fontSize: 17, color: '#94A3B8', marginTop: 12 },
  emptyHint: { fontSize: 14, color: '#CBD5E1', marginTop: 4 },
});
