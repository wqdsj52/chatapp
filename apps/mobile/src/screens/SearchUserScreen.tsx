import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';

export default function SearchUserScreen({ navigation }: any) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

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

  return (
    <View style={s.container}>
      <View style={s.searchBar}>
        <TextInput style={s.searchInput} placeholder="搜索用户..." value={query} onChangeText={setQuery} onSubmitEditing={handleSearch} autoFocus returnKeyType="search" />
        <TouchableOpacity onPress={handleSearch}>
          <Ionicons name="search" size={22} color="#3B82F6" />
        </TouchableOpacity>
      </View>
      <FlatList
        data={results}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <View style={s.empty}>
            <Text style={s.emptyText}>{loading ? '搜索中...' : '输入关键词搜索用户'}</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={s.item} onPress={() => startChat(item.id)}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{(item.nickname || item.account || '?')[0].toUpperCase()}</Text>
            </View>
            <View style={s.info}>
              <Text style={s.name}>{item.nickname || item.account}</Text>
              <Text style={s.account}>@{item.account}</Text>
            </View>
            <Ionicons name="chatbubble-outline" size={20} color="#3B82F6" />
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  searchBar: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', margin: 16, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  searchInput: { flex: 1, fontSize: 16, marginRight: 10 },
  item: { flexDirection: 'row', padding: 16, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '600' },
  info: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: '#1E293B' },
  account: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  empty: { alignItems: 'center', paddingTop: 60 },
  emptyText: { fontSize: 15, color: '#94A3B8' },
});
