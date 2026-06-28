import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../lib/auth-context';

export default function LoginScreen({ navigation }: any) {
  const { login } = useAuth();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!account || !password) return Alert.alert('提示', '请输入账号和密码');
    setLoading(true);
    try {
      await login(account, password);
    } catch (e: any) {
      Alert.alert('登录失败', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={s.inner}>
        <Text style={s.logo}>💬</Text>
        <Text style={s.title}>ChatApp</Text>
        <Text style={s.subtitle}>和朋友开始聊天吧</Text>
        <TextInput style={s.input} placeholder="账号" value={account} onChangeText={setAccount} autoCapitalize="none" />
        <TextInput style={s.input} placeholder="密码" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={s.btn} onPress={handleLogin} disabled={loading}>
          <Text style={s.btnText}>{loading ? '登录中...' : '登录'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={s.link}>没有账号？去注册</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  logo: { fontSize: 64, textAlign: 'center' },
  title: { fontSize: 32, fontWeight: '700', textAlign: 'center', color: '#1E293B', marginTop: 8 },
  subtitle: { fontSize: 15, textAlign: 'center', color: '#64748B', marginTop: 4, marginBottom: 40 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  link: { textAlign: 'center', color: '#3B82F6', marginTop: 20, fontSize: 15 },
});
