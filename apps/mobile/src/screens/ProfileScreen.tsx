import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView, Image, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../lib/auth-context';
import { api } from '../lib/api';
import * as ImagePicker from 'expo-image-picker';

const GENDER_OPTIONS = [
  { value: '', label: '未设置' },
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
];

export default function ProfileScreen() {
  const { user, logout, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [nickname, setNickname] = useState(user?.nickname || '');
  const [userCode, setUserCode] = useState(user?.userCode || '');
  const [gender, setGender] = useState(user?.gender || '');
  const [birthDate, setBirthDate] = useState(user?.birthDate || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [province, setProvince] = useState(user?.province || '');
  const [address, setAddress] = useState(user?.address || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showGenderPicker, setShowGenderPicker] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.updateMe({ nickname, userCode: userCode || undefined, gender, birthDate, bio, city, province, address });
      await refresh();
      setEditing(false);
      Alert.alert('成功', '个人资料已更新');
    } catch (e: any) {
      Alert.alert('失败', e.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePickAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('提示', '需要相册权限才能选择头像');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (result.canceled) return;
    const asset = result.assets[0];
    setUploading(true);
    try {
      await api.uploadAvatar(asset.uri, asset.fileName || 'avatar.jpg', asset.mimeType || 'image/jpeg');
      await refresh();
      Alert.alert('成功', '头像已更新');
    } catch (e: any) {
      Alert.alert('上传失败', e.message);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert('退出登录', '确定要退出吗？', [
      { text: '取消', style: 'cancel' },
      { text: '确定', style: 'destructive', onPress: logout },
    ]);
  };

  const genderLabel = (g: string) => GENDER_OPTIONS.find(o => o.value === g)?.label || '未设置';

  return (
    <ScrollView style={s.container}>
      <View style={s.header}>
        <Text style={s.headerTitle}>个人中心</Text>
        <TouchableOpacity onPress={editing ? handleSave : () => setEditing(true)}>
          <Text style={s.headerBtn}>{editing ? (saving ? '保存中...' : '保存') : '编辑'}</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.avatarSection} onPress={handlePickAvatar} disabled={uploading}>
        {user?.avatarUrl ? (
          <Image source={{ uri: user.avatarUrl }} style={s.avatarImg} />
        ) : (
          <View style={s.avatar}>
            <Text style={s.avatarText}>{(nickname || user?.account || '?')[0].toUpperCase()}</Text>
          </View>
        )}
        {uploading ? (
          <View style={s.uploadingOverlay}><ActivityIndicator color="#fff" /></View>
        ) : (
          <View style={s.cameraIcon}><Ionicons name="camera" size={16} color="#fff" /></View>
        )}
      </TouchableOpacity>

      <View style={s.card}>
        <ProfileRow label="账号" value={user?.account} />
        <ProfileRow label="昵称" value={nickname} editing={editing} onChangeText={setNickname} placeholder="请输入昵称" />
        <ProfileRow label="用户代号" value={userCode} editing={editing} onChangeText={setUserCode} placeholder="设置代号" />
        <View style={s.divider} />
        {editing ? (
          <TouchableOpacity style={s.row} onPress={() => setShowGenderPicker(!showGenderPicker)}>
            <Text style={s.label}>{'性别'}</Text>
            <View style={s.rowRight}>
              <Text style={s.value}>{genderLabel(gender)}</Text>
              <Ionicons name="chevron-down" size={16} color="#94A3B8" />
            </View>
          </TouchableOpacity>
        ) : (
          <ProfileRow label="性别" value={genderLabel(gender)} />
        )}
        {showGenderPicker && editing && (
          <View style={s.genderPicker}>
            {GENDER_OPTIONS.map(opt => (
              <TouchableOpacity key={opt.value} style={[s.genderOption, gender === opt.value && s.genderActive]} onPress={() => { setGender(opt.value); setShowGenderPicker(false); }}>
                <Text style={[s.genderText, gender === opt.value && s.genderTextActive]}>{opt.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
        <ProfileRow label="生日" value={birthDate || '未设置'} editing={editing} onChangeText={setBirthDate} placeholder="YYYY-MM-DD" />
        <ProfileRow label="个性签名" value={bio || '还没有签名'} editing={editing} onChangeText={setBio} placeholder="写点什么吧" multiline />
        <View style={s.divider} />
        <ProfileRow label="所在省份" value={province || '未设置'} editing={editing} onChangeText={setProvince} placeholder="如广东" />
        <ProfileRow label="所在城市" value={city || '未设置'} editing={editing} onChangeText={setCity} placeholder="如深圳" />
        <ProfileRow label="详细地址" value={address || '未设置'} editing={editing} onChangeText={setAddress} placeholder="街道门牌号等" multiline />
      </View>

      <View style={s.card}>
        <View style={s.row}>
          <Text style={s.label}>{'注册时间'}</Text>
          <Text style={s.value}>{user?.createdAt ? new Date(user.createdAt).toLocaleDateString('zh-CN') : ''}</Text>
        </View>
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color="#EF4444" />
        <Text style={s.logoutText}>{'退出登录'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

function ProfileRow({ label, value, editing, onChangeText, placeholder, multiline }: any) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      {editing && onChangeText ? (
        <TextInput style={[s.editInput, multiline && { minHeight: 40, textAlignVertical: 'top' }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#CBD5E1" multiline={multiline} />
      ) : (
        <Text style={s.value} numberOfLines={2}>{value || ''}</Text>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 56, paddingBottom: 12, backgroundColor: '#fff' },
  headerTitle: { fontSize: 24, fontWeight: '700', color: '#1E293B' },
  headerBtn: { fontSize: 15, color: '#3B82F6', fontWeight: '600' },
  avatarSection: { alignItems: 'center', paddingVertical: 24, backgroundColor: '#fff', marginBottom: 12 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarImg: { width: 80, height: 80, borderRadius: 40 },
  avatarText: { color: '#fff', fontSize: 32, fontWeight: '700' },
  cameraIcon: { position: 'absolute', top: 68, right: '36%', backgroundColor: '#3B82F6', width: 28, height: 28, borderRadius: 14, justifyContent: 'center', alignItems: 'center', borderWidth: 2, borderColor: '#fff' },
  uploadingOverlay: { position: 'absolute', top: 0, width: 80, height: 80, borderRadius: 40, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  card: { backgroundColor: '#fff', marginHorizontal: 0, marginBottom: 12, paddingHorizontal: 0 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14, minHeight: 48 },
  rowRight: { flexDirection: 'row', alignItems: 'center' },
  label: { fontSize: 15, color: '#64748B', minWidth: 72 },
  value: { fontSize: 15, color: '#1E293B', fontWeight: '400', flex: 1, textAlign: 'right' },
  editInput: { fontSize: 15, color: '#1E293B', flex: 1, textAlign: 'right', paddingVertical: 0, paddingHorizontal: 0 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: '#F1F5F9', marginLeft: 20 },
  genderPicker: { flexDirection: 'row', paddingHorizontal: 20, paddingBottom: 12, gap: 10 },
  genderOption: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  genderActive: { backgroundColor: '#EFF6FF' },
  genderText: { fontSize: 14, color: '#64748B' },
  genderTextActive: { color: '#3B82F6', fontWeight: '600' },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 12, marginHorizontal: 0, backgroundColor: '#fff', paddingVertical: 16, marginBottom: 40 },
  logoutText: { color: '#EF4444', fontSize: 16, fontWeight: '500', marginLeft: 6 },
});
