import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useFocusEffect } from '@react-navigation/native';

export default function NotificationScreen() {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getNotifications();
      setNotifications(data);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleMarkRead = async (id: string) => {
    await api.markRead(id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAll = async () => {
    await api.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const formatTime = (t: string) => {
    const d = new Date(t);
    return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'friend_request': return 'person-add';
      case 'message': return 'chatbubble';
      case 'system': return 'information-circle';
      default: return 'notifications';
    }
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>通知</Text>
        {notifications.some(n => !n.read) && (
          <TouchableOpacity onPress={handleMarkAll}>
            <Text style={s.markAll}>全部已读</Text>
          </TouchableOpacity>
        )}
      </View>
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="notifications-off-outline" size={64} color="#CBD5E1" />
            <Text style={s.emptyText}>暂无通知</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={[s.item, !item.read && s.unread]} onPress={() => handleMarkRead(item.id)}>
            <View style={[s.iconWrap, !item.read && s.iconActive]}>
              <Ionicons name={getIcon(item.type)} size={22} color={!item.read ? '#3B82F6' : '#94A3B8'} />
            </View>
            <View style={s.content}>
              <Text style={s.title}>{item.title || '通知'}</Text>
              <Text style={s.body} numberOfLines={2}>{item.content || ''}</Text>
              <Text style={s.time}>{formatTime(item.createdAt)}</Text>
            </View>
            {!item.read && <View style={s.dot} />}
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
  markAll: { fontSize: 14, color: '#3B82F6' },
  item: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  unread: { backgroundColor: '#F0F7FF' },
  iconWrap: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#F1F5F9', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  iconActive: { backgroundColor: '#EFF6FF' },
  content: { flex: 1 },
  title: { fontSize: 15, fontWeight: '600', color: '#1E293B' },
  body: { fontSize: 14, color: '#64748B', marginTop: 2 },
  time: { fontSize: 12, color: '#94A3B8', marginTop: 4 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#3B82F6', marginLeft: 8 },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyText: { fontSize: 17, color: '#94A3B8', marginTop: 12 },
});
