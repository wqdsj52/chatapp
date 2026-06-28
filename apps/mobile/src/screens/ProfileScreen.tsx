import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';

export default function ProfileScreen() {
  const { user, logout, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMe({ nickname });
      await refresh();
      setEditing(false);
      Alert.alert('成功', '个人信息已更新');
    } catch (e: any) {
      Alert.alert('失败', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: logout },
    ]);
  };

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>个人中心</Text>
      </View>
      <View style={s.avatarSection}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{(nickname || user?.account || '?')[0].toUpperCase()}</Text>
        </View>
      </View>
      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.label}>账号</Text>
          <Text style={s.value}>{user?.account}</Text>
        </View>
        <View style={s.divider} />
        <View style={s.row}>
          <Text style={s.label}>昵称</Text>
          {editing ? (
            <TextInput style={s.editInput} value={nickname} onChangeText={setNickname} autoFocus />
          ) : (
            <Text style={s.value}>{nickname || '未设置'}</Text>
          )}
        </View>
        <View style={s.divider} />
        <TouchableOpacity style={s.row} onPress={editing ? handleSave : () => setEditing(true)}>
          <Ionicons name={editing ? 'checkmark-circle-outline' : 'create-outline'} size={20} color="#3B82F6" />
          <Text style={s.editBtn}>{editing ? (saving ? '保存中...' : '保存') : '编辑资料'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={s.logoutText}>退出登录</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { paddingTop: 56, paddingBottom: 12, paddingHorizontal: 20, backgroundColor: '#fff', borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  avatarSection: { alignItems: 'center', paddingVertical: 32 },
  avatar: { width: 88, height: 88, borderRadius: 44, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarText: { color: '#fff', fontSize: 36, fontWeight: '700' },
  card: { backgroundColor: '#fff', marginHorizontal: 16, borderRadius: 16, padding: 4, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 10, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 },
  label: { fontSize: 15, color: '#64748B' },
  value: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  editInput: { fontSize: 15, color: '#1E293B', borderBottomWidth: 1, borderBottomColor: '#3B82F6', paddingVertical: 2, minWidth: 120, textAlign: 'right' },
  divider: { height: 1, backgroundColor: '#F1F5F9', marginHorizontal: 16 },
  editBtn: { color: '#3B82F6', fontSize: 15, fontWeight: '500', marginLeft: 6 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 32, marginHorizontal: 16, backgroundColor: '#fff', borderRadius: 12, paddingVertical: 16, borderWidth: 1, borderColor: '#FEE2E2' },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '500', marginLeft: 6 },
});
