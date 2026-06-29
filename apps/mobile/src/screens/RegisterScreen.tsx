import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useAuth } from '../lib/auth-context';

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [phone, setPhone] = useState('');
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRegister = async () => {
    if (!phone || !account || !password) return Alert.alert('提示', '请填写手机号、账号和密码');
    setLoading(true);
    try {
      await register(phone, account, password, nickname || undefined);
    } catch (e: any) {
      Alert.alert('注册失败', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={st.inner}>
        <Text style={st.title}>{'注册新账号'}</Text>
        <TextInput style={st.input} placeholder={'手机号'} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={st.input} placeholder={'账号'} value={account} onChangeText={setAccount} autoCapitalize="none" />
        <TextInput style={st.input} placeholder={'昵称（选填）'} value={nickname} onChangeText={setNickname} />
        <TextInput style={st.input} placeholder={'密码'} value={password} onChangeText={setPassword} secureTextEntry />
        <Text style={st.hint}>{'注册后将自动生成8位用户代号'}</Text>
        <TouchableOpacity style={st.btn} onPress={handleRegister} disabled={loading}>
          <Text style={st.btnText}>{loading ? '注册中...' : '注册'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={st.link}>{'已有账号？去登录'}</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const st = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  inner: { flex: 1, justifyContent: 'center', paddingHorizontal: 32 },
  title: { fontSize: 28, fontWeight: '700', textAlign: 'center', color: '#1E293B', marginBottom: 32 },
  input: { backgroundColor: '#fff', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 14, fontSize: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E2E8F0' },
  hint: { fontSize: 12, color: '#94A3B8', textAlign: 'center', marginBottom: 4 },
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  link: { textAlign: 'center', color: '#3B82F6', marginTop: 20, fontSize: 15 },
});
