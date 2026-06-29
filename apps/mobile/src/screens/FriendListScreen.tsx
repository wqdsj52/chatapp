import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useFocusEffect, useNavigation } from '@react-navigation/native';

export default function FriendListScreen() {
  const navigation = useNavigation<any>();
  const [friends, setFriends] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    try {
      const data = await api.getFriends();
      setFriends(data);
    } catch {}
  };

  useFocusEffect(useCallback(() => { load(); }, []));

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  };

  const handleRemove = (id: string, name: string) => {
    Alert.alert('删除好友', '确定要删除 ' + name + ' 吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          try {
            await api.removeFriend(id);
            setFriends((prev) => prev.filter((f) => f.id !== id));
          } catch (e: any) {
            Alert.alert('失败', e.message);
          }
        },
      },
    ]);
  };

  const startChat = async (friend: any) => {
    try {
      const session = await api.createSingleSession(friend.id);
      navigation.navigate('Chat', { sessionId: session.id, name: friend.nickname || friend.account });
    } catch (e: any) {
      Alert.alert('失败', e.message);
    }
  };

  const viewProfile = (friend: any) => {
    navigation.navigate('UserProfile', { userId: friend.id });
  };

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>{'好友'}</Text>
        <TouchableOpacity onPress={() => navigation.navigate('SearchUser')}>
          <Ionicons name="person-add-outline" size={26} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={friends}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={s.empty}>
            <Ionicons name="people-outline" size={64} color="#CBD5E1" />
            <Text style={s.emptyText}>{'暂无好友'}</Text>
            <Text style={s.emptyHint}>{'点击右上角添加好友'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <TouchableOpacity style={s.main} onPress={() => viewProfile(item)}>
              {item.avatarUrl ? (
                <Image source={{ uri: item.avatarUrl }} style={s.avatarImg} />
              ) : (
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{(item.nickname || item.account || '?')[0].toUpperCase()}</Text>
                </View>
              )}
              <View style={s.info}>
                <Text style={s.name}>{item.nickname || item.account}</Text>
                {item.userCode ? <Text style={s.code}>#{item.userCode}</Text> : null}
                <Text style={s.account}>@{item.account}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
            </TouchableOpacity>
            <TouchableOpacity style={s.chatBtn} onPress={() => startChat(item)}>
              <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
            <TouchableOpacity style={s.delBtn} onPress={() => handleRemove(item.id, item.nickname || item.account)}>
              <Ionicons name="trash-outline" size={18} color="#EF4444" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  item: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 48, height: 48, borderRadius: 24, marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 20, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  code: { fontSize: 12, color: '#3B82F6', marginTop: 2 },
  account: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  chatBtn: { padding: 10 },
  delBtn: { padding: 10 },
  empty: { alignItems: 'center', paddingTop: 120 },
  emptyText: { fontSize: 17, color: '#94A3B8', marginTop: 12 },
  emptyHint: { fontSize: 14, color: '#CBD5E1', marginTop: 4 },
});
