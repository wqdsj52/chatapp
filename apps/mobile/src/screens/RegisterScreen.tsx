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
    if (!phone || !account || !password) return Alert.alert('ÌáÊ¾', 'ÇëÌîÐ´ÊÖ»úºÅ¡¢ÕËºÅºÍÃÜÂë');
    setLoading(true);
    try {
      await register(phone, account, password, nickname || undefined);
    } catch (e: any) {
      Alert.alert('×¢²áÊ§°Ü', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={st.container} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <View style={st.inner}>
        <Text style={st.title}>×¢²áÐÂÕËºÅ</Text>
        <TextInput style={st.input} placeholder="ÊÖ»úºÅ" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
        <TextInput style={st.input} placeholder="ÕËºÅ" value={account} onChangeText={setAccount} autoCapitalize="none" />
        <TextInput style={st.input} placeholder="êÇ³Æ£¨Ñ¡Ìî£©" value={nickname} onChangeText={setNickname} />
        <TextInput style={st.input} placeholder="ÃÜÂë" value={password} onChangeText={setPassword} secureTextEntry />
        <TouchableOpacity style={st.btn} onPress={handleRegister} disabled={loading}>
          <Text style={st.btnText}>{loading ? '×¢²áÖÐ...' : '×¢²á'}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={st.link}>ÒÑÓÐÕËºÅ£¿È¥µÇÂ¼</Text>
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
  btn: { backgroundColor: '#3B82F6', borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 8 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '600' },
  link: { textAlign: 'center', color: '#3B82F6', marginTop: 20, fontSize: 15 },
});
