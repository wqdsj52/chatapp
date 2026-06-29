import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

export default function SearchUserScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingIds, setAddingIds] = useState(new Set());

  const handleSearch = async () => {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.searchUsers(query.trim());
      setResults(data);
    } catch (e: any) {
      Alert.alert('搜索失败', e.message);
    } finally {
      setLoading(false);
    }
  };

  const startChat = async (userId: string) => {
    try {
      const session = await api.createSingleSession(userId);
      navigation.replace('Chat', { sessionId: session.id, name: results.find(u => u.id === userId)?.nickname || results.find(u => u.id === userId)?.account || '聊天' });
    } catch (e: any) {
      Alert.alert('失败', e.message);
    }
  };

  const addFriend = async (userId: string) => {
    setAddingIds((prev) => new Set(prev).add(userId));
    try {
      await api.addFriend(userId);
      Alert.alert('成功', '好友添加成功');
    } catch (e: any) {
      Alert.alert('提示', e.message);
    } finally {
      setAddingIds((prev) => { const next = new Set(prev); next.delete(userId); return next; });
    }
  };

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 8 }} />
        <TextInput style={s.searchInput} placeholder={'输入用户名、账号或代号搜索'} value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} autoFocus returnKeyType="search" />
      </View>
      {loading && <Text style={s.hint}>{'搜索中...'}</Text>}
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          !loading ? (
            <View style={s.empty}>
              <Ionicons name="people-outline" size={64} color="#CBD5E1" />
              <Text style={s.emptyText}>{'输入关键词搜索用户'}</Text>
              <Text style={s.emptyHint}>{'支持用户名、账号、代号搜索'}</Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <View style={s.item}>
            <TouchableOpacity style={s.main} onPress={() => navigation.navigate('UserProfile', { userId: item.id })}>
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
            <TouchableOpacity style={s.addBtn} onPress={() => addFriend(item.id)} disabled={addingIds.has(item.id)}>
              <Ionicons name={addingIds.has(item.id) ? 'checkmark-circle' : 'person-add-outline'} size={22} color={addingIds.has(item.id) ? '#22C55E' : '#3B82F6'} />
            </TouchableOpacity>
            <TouchableOpacity style={s.chatBtn} onPress={() => startChat(item.id)}>
              <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
            </TouchableOpacity>
          </View>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: 16 },
  hint: { textAlign: 'center', color: '#94A3B8', marginTop: 8 },
  item: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  main: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarImg: { width: 44, height: 44, borderRadius: 22, marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  code: { fontSize: 13, color: '#3B82F6', marginTop: 2 },
  account: { fontSize: 12, color: '#94A3B8', marginTop: 1 },
  addBtn: { padding: 10 },
  chatBtn: { padding: 10 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8', marginTop: 12 },
  emptyHint: { fontSize: 13, color: '#CBD5E1', marginTop: 4 },
});
