import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Image, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';

const GENDER_MAP: any = { male: '男', female: '女', other: '其他' };

export default function UserProfileScreen({ route, navigation }: any) {
  const { userId } = route.params;
  const { user: me } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const loadProfile = async () => {
    setLoading(true);
    try {
      const [p, f] = await Promise.all([
        api.searchUsers(userId).then(list => list.find((u: any) => u.id === userId)),
        api.checkFriend(userId),
      ]);
      if (p) setProfile(p);
      setIsFriend(f?.isFriend || false);
    } catch {
      // fallback: try get profile via search
    }
    setLoading(false);
  };

  const handleAddFriend = async () => {
    setActionLoading(true);
    try {
      await api.addFriend(userId);
      setIsFriend(true);
      Alert.alert('成功', '已添加为好友');
    } catch (e: any) {
      Alert.alert('提示', e.message);
    }
    setActionLoading(false);
  };

  const handleRemoveFriend = async () => {
    Alert.alert('删除好友', '确定要删除该好友吗？', [
      { text: '取消', style: 'cancel' },
      {
        text: '删除', style: 'destructive',
        onPress: async () => {
          setActionLoading(true);
          try {
            await api.removeFriend(userId);
            setIsFriend(false);
            Alert.alert('已删除');
          } catch (e: any) {
            Alert.alert('失败', e.message);
          }
          setActionLoading(false);
        },
      },
    ]);
  };

  const handleChat = async () => {
    try {
      const session = await api.createSingleSession(userId);
      navigation.navigate('Chat', { sessionId: session.id, name: profile?.nickname || profile?.account });
    } catch (e: any) {
      Alert.alert('失败', e.message);
    }
  };

  if (loading) {
    return (
      <View style={s.loadingView}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={s.loadingView}>
        <Text style={{ color: '#94A3B8' }}>{'无法加载用户信息'}</Text>
      </View>
    );
  }

  const isMe = me?.userId === userId;

  return (
    <ScrollView style={s.container}>
      <View style={s.topSection}>
        {profile.avatarUrl ? (
          <Image source={{ uri: profile.avatarUrl }} style={s.avatar} />
        ) : (
          <View style={s.avatarCircle}>
            <Text style={s.avatarText}>{(profile.nickname || profile.account || '?')[0].toUpperCase()}</Text>
          </View>
        )}
        <Text style={s.nickname}>{profile.nickname || profile.account}</Text>
        {profile.userCode ? <Text style={s.userCode}>#{profile.userCode}</Text> : null}
        <Text style={s.accountName}>@{profile.account}</Text>
        {profile.bio ? <Text style={s.bio}>{profile.bio}</Text> : null}

        {!isMe && (
          <View style={s.actions}>
            <TouchableOpacity style={s.actionBtn} onPress={handleChat}>
              <Ionicons name="chatbubble" size={18} color="#fff" />
              <Text style={s.actionBtnText}>{'发消息'}</Text>
            </TouchableOpacity>
            {isFriend ? (
              <TouchableOpacity style={[s.actionBtn, s.actionOutline]} onPress={handleRemoveFriend} disabled={actionLoading}>
                <Ionicons name="person-remove" size={18} color="#3B82F6" />
                <Text style={[s.actionBtnText, { color: '#3B82F6' }]}>{'已好友'}</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={[s.actionBtn, s.actionOutline]} onPress={handleAddFriend} disabled={actionLoading}>
                <Ionicons name="person-add" size={18} color="#3B82F6" />
                <Text style={[s.actionBtnText, { color: '#3B82F6' }]}>{'添加好友'}</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      <View style={s.card}>
        {profile.gender ? <InfoRow icon="person" label="性别" value={GENDER_MAP[profile.gender] || profile.gender} /> : null}
        {profile.birthDate ? <InfoRow icon="calendar" label="生日" value={profile.birthDate} /> : null}
        {profile.province || profile.city ? (
          <InfoRow icon="location" label="地区" value={[profile.province, profile.city].filter(Boolean).join(' ')} />
        ) : null}
        {profile.address ? <InfoRow icon="home" label="地址" value={profile.address} /> : null}
        {profile.phone ? <InfoRow icon="call" label="手机" value={profile.phone} /> : null}
        <InfoRow icon="time" label="注册" value={profile.createdAt ? new Date(profile.createdAt).toLocaleDateString('zh-CN') : ''} />
      </View>
    </ScrollView>
  );
}

function InfoRow({ icon, label, value }: any) {
  return (
    <View style={s.infoRow}>
      <Ionicons name={icon} size={18} color="#94A3B8" style={{ width: 24 }} />
      <Text style={s.infoLabel}>{label}</Text>
      <Text style={s.infoValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  loadingView: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F1F5F9' },
  topSection: { alignItems: 'center', backgroundColor: '#fff', paddingTop: 24, paddingBottom: 24, marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, marginBottom: 12 },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  nickname: { fontSize: 22, fontWeight: '700', color: '#1E293B' },
  userCode: { fontSize: 14, color: '#3B82F6', marginTop: 4 },
  accountName: { fontSize: 13, color: '#94A3B8', marginTop: 2 },
  bio: { fontSize: 14, color: '#64748B', marginTop: 8, paddingHorizontal: 40, textAlign: 'center' },
  actions: { flexDirection: 'row', marginTop: 16, gap: 12 },
  actionBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#3B82F6', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 24, gap: 6 },
  actionOutline: { backgroundColor: '#fff', borderWidth: 1, borderColor: '#3B82F6' },
  actionBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },
  card: { backgroundColor: '#fff', marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: '#F1F5F9' },
  infoLabel: { fontSize: 14, color: '#94A3B8', width: 56, marginLeft: 8 },
  infoValue: { fontSize: 14, color: '#1E293B', flex: 1 },
});
