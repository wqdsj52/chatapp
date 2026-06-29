import React, { useEffect, useState, useRef, useCallback } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, Alert, Image, Modal, ActivityIndicator, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { api } from '../lib/api';
import { useAuth } from '../lib/auth-context';
import { useFocusEffect } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';

export default function ChatScreen({ route, navigation }: any) {
  const { sessionId, name } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<any[]>([]);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [uploading, setUploading] = useState(false);
  const flatRef = useRef<FlatList>(null);
  const intervalRef = useRef<any>(null);

  const loadMessages = async () => {
    try {
      const data = await api.getMessages(sessionId);
      setMessages(data);
      if (!otherUser && data.length > 0) {
        const other = data.find((m: any) => m.senderId !== user?.userId);
        if (other?.sender) setOtherUser({ id: other.senderId, ...other.sender });
      }
    } catch {}
  };

  useEffect(() => {
    (async () => {
      if (!otherUser) {
        try {
          const sessions = await api.getSessions();
          const sess = sessions.find((s: any) => s.id === sessionId);
          if (sess?.otherMembers?.[0]) setOtherUser(sess.otherMembers[0]);
        } catch {}
      }
    })();
  }, [sessionId]);

  useFocusEffect(useCallback(() => {
    loadMessages();
    intervalRef.current = setInterval(loadMessages, 3000);
    return () => clearInterval(intervalRef.current);
  }, [sessionId]));

  const handleSend = async () => {
    const content = text.trim();
    if (!content || sending) return;
    setText('');
    setSending(true);
    try {
      await api.sendMessage(sessionId, 'text', content);
      await loadMessages();
    } catch (e: any) {
      Alert.alert('发送失败', e.message);
    } finally {
      setSending(false);
    }
  };

  const handlePickImage = async () => {
    setMenuVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return Alert.alert('提示', '需要相册权限');
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await doUpload(asset.uri, asset.fileName || 'photo.jpg', asset.mimeType || 'image/jpeg');
  };

  const handleTakePhoto = async () => {
    setMenuVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') return Alert.alert('提示', '需要相机权限');
    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;
    const asset = result.assets[0];
    await doUpload(asset.uri, asset.fileName || 'photo.jpg', asset.mimeType || 'image/jpeg');
  };

  const handlePickFile = async () => {
    setMenuVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (result.canceled || !result.assets?.[0]) return;
      const asset = result.assets[0];
      await doUpload(asset.uri, asset.name || 'file', asset.mimeType || 'application/octet-stream');
    } catch (e: any) {
      Alert.alert('失败', e.message);
    }
  };

  const doUpload = async (uri: string, fileName: string, mimeType: string) => {
    setUploading(true);
    try {
      await api.uploadChatFile(sessionId, uri, fileName, mimeType);
      await loadMessages();
    } catch (e: any) {
      Alert.alert('发送失败', e.message);
    }
    setUploading(false);
  };

  const isMe = (msg: any) => msg.senderId === user?.userId;

  const parseContent = (msg: any) => {
    if (msg.type === 'image' || msg.type === 'file') {
      try { return JSON.parse(msg.content); } catch { return { url: msg.content }; }
    }
    return null;
  };

  const renderAvatar = (isSelf: boolean, msg?: any) => {
    const avatarUrl = isSelf ? user?.avatarUrl : (msg?.sender?.avatarUrl || otherUser?.avatarUrl);
    const label = isSelf ? (user?.nickname || user?.account || '?') : (otherUser?.nickname || otherUser?.account || name || '?');
    if (avatarUrl) return <Image source={{ uri: avatarUrl }} style={styles.avatar} />;
    return <View style={[styles.avatar, styles.avatarFallback]}><Text style={styles.avatarChar}>{label[0].toUpperCase()}</Text></View>;
  };

  const renderMessage = (msg: any) => {
    const mine = isMe(msg);
    const fileData = parseContent(msg);

    if (msg.type === 'image' && fileData?.url) {
      return (
        <View style={[styles.row, mine ? styles.rowMe : styles.rowThem]}>
          {!mine && renderAvatar(false, msg)}
          <View style={[styles.bubble, mine ? styles.me : styles.them, { padding: 4 }]}>
            <TouchableOpacity onPress={() => Linking.openURL(fileData.url)}>
              <Image source={{ uri: fileData.url }} style={styles.chatImage} resizeMode="cover" />
            </TouchableOpacity>
            <Text style={[styles.msgTimeInline, mine ? { color: 'rgba(255,255,255,0.7)' } : { color: '#94A3B8' }]}>
              {new Date(msg.createdAt).getHours().toString().padStart(2,'0')}:{new Date(msg.createdAt).getMinutes().toString().padStart(2,'0')}
            </Text>
          </View>
          {mine && renderAvatar(true)}
        </View>
      );
    }

    if (msg.type === 'file' && fileData?.url) {
      return (
        <View style={[styles.row, mine ? styles.rowMe : styles.rowThem]}>
          {!mine && renderAvatar(false, msg)}
          <TouchableOpacity style={[styles.bubble, mine ? styles.me : styles.them, styles.fileBubble]} onPress={() => Linking.openURL(fileData.url)}>
            <Ionicons name="document" size={24} color={mine ? '#fff' : '#3B82F6'} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.fileName, mine ? { color: '#fff' } : {}]} numberOfLines={1}>{fileData.name || '文件'}</Text>
              <Text style={[styles.fileSize, mine ? { color: 'rgba(255,255,255,0.7)' } : {}]}>{fileData.size ? (fileData.size / 1024).toFixed(1) + ' KB' : ''}</Text>
            </View>
          </TouchableOpacity>
          {mine && renderAvatar(true)}
        </View>
      );
    }

    return (
      <View style={[styles.row, mine ? styles.rowMe : styles.rowThem]}>
        {!mine && renderAvatar(false, msg)}
        <View style={[styles.bubble, mine ? styles.me : styles.them]}>
          {!mine && (
            <TouchableOpacity onPress={() => msg.senderId && navigation.navigate('UserProfile', { userId: msg.senderId })}>
              <Text style={styles.sender}>{msg.sender?.nickname || msg.sender?.account || '对方'}</Text>
            </TouchableOpacity>
          )}
          <Text style={[styles.msgText, mine ? styles.msgTextMe : styles.msgTextThem]}>{msg.content}</Text>
          <Text style={[styles.msgTime, mine ? styles.msgTimeMe : styles.msgTimeThem]}>
            {new Date(msg.createdAt).getHours().toString().padStart(2,'0')}:{new Date(msg.createdAt).getMinutes().toString().padStart(2,'0')}
          </Text>
        </View>
        {mine && renderAvatar(true)}
      </View>
    );
  };

  const handleHeaderPress = () => {
    if (otherUser?.id) navigation.navigate('UserProfile', { userId: otherUser.id });
  };

  React.useLayoutEffect(() => {
    navigation.setOptions({
      headerShown: true,
      headerTitle: () => (
        <TouchableOpacity onPress={handleHeaderPress}>
          <Text style={{ fontSize: 17, fontWeight: '600', color: '#1E293B' }}>{name || '聊天'}</Text>
          <Text style={{ fontSize: 11, color: '#3B82F6', textAlign: 'center' }}>{'查看名片'}</Text>
        </TouchableOpacity>
      ),
      headerBackTitle: '返回',
    });
  }, [navigation, name, otherUser]);

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90}>
      {uploading && (
        <View style={styles.uploadOverlay}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={{ color: '#fff', marginTop: 8 }}>{'发送中...'}</Text>
        </View>
      )}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
        renderItem={({ item }) => renderMessage(item)}
      />
      <View style={styles.inputBar}>
        <TouchableOpacity style={styles.plusBtn} onPress={() => setMenuVisible(true)}>
          <Ionicons name="add-circle" size={32} color="#3B82F6" />
        </TouchableOpacity>
        <TextInput style={styles.input} value={text} onChangeText={setText} placeholder={'输入消息...'} multiline maxLength={500} />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={sending || !text.trim()}>
          <Ionicons name="send" size={22} color={text.trim() ? '#3B82F6' : '#CBD5E1'} />
        </TouchableOpacity>
      </View>

      <Modal visible={menuVisible} transparent animationType="slide" onRequestClose={() => setMenuVisible(false)}>
        <TouchableOpacity style={styles.menuOverlay} activeOpacity={1} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Text style={styles.menuTitle}>{'发送内容'}</Text>
            <View style={styles.menuGrid}>
              <TouchableOpacity style={styles.menuItem} onPress={handlePickImage}>
                <View style={[styles.menuIcon, { backgroundColor: '#3B82F6' }]}>
                  <Ionicons name="image" size={24} color="#fff" />
                </View>
                <Text style={styles.menuLabel}>{'相册'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handleTakePhoto}>
                <View style={[styles.menuIcon, { backgroundColor: '#22C55E' }]}>
                  <Ionicons name="camera" size={24} color="#fff" />
                </View>
                <Text style={styles.menuLabel}>{'拍照'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.menuItem} onPress={handlePickFile}>
                <View style={[styles.menuIcon, { backgroundColor: '#F59E0B' }]}>
                  <Ionicons name="document" size={24} color="#fff" />
                </View>
                <Text style={styles.menuLabel}>{'文件'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.menuCancel} onPress={() => setMenuVisible(false)}>
              <Text style={styles.menuCancelText}>{'取消'}</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9' },
  list: { flex: 1 },
  listContent: { padding: 12, paddingBottom: 4 },
  row: { flexDirection: 'row', marginBottom: 12, alignItems: 'flex-end' },
  rowMe: { justifyContent: 'flex-end' },
  rowThem: { justifyContent: 'flex-start' },
  avatar: { width: 36, height: 36, borderRadius: 18, marginHorizontal: 6 },
  avatarFallback: { backgroundColor: '#3B82F6', justifyContent: 'center', alignItems: 'center' },
  avatarChar: { color: '#fff', fontSize: 16, fontWeight: '600' },
  bubble: { maxWidth: '70%', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 16 },
  me: { backgroundColor: '#3B82F6', borderBottomRightRadius: 4 },
  them: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E2E8F0' },
  sender: { fontSize: 11, color: '#3B82F6', marginBottom: 2, fontWeight: '500' },
  msgText: { fontSize: 15, lineHeight: 20 },
  msgTextMe: { color: '#FFFFFF' },
  msgTextThem: { color: '#1E293B' },
  msgTime: { fontSize: 10, marginTop: 4 },
  msgTimeMe: { color: 'rgba(255,255,255,0.7)', textAlign: 'right' },
  msgTimeThem: { color: '#94A3B8' },
  msgTimeInline: { fontSize: 10, marginTop: 4, textAlign: 'right' },
  chatImage: { width: 200, height: 200, borderRadius: 12 },
  fileBubble: { flexDirection: 'row', alignItems: 'center', minWidth: 160 },
  fileName: { fontSize: 14, fontWeight: '500', color: '#1E293B' },
  fileSize: { fontSize: 11, color: '#94A3B8', marginTop: 2 },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', padding: 8, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E2E8F0' },
  plusBtn: { padding: 4, marginRight: 4 },
  input: { flex: 1, backgroundColor: '#F1F5F9', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, maxHeight: 100 },
  sendBtn: { marginLeft: 8, padding: 10 },
  uploadOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' },
  menuSheet: { backgroundColor: '#fff', borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#1E293B', textAlign: 'center', marginBottom: 20 },
  menuGrid: { flexDirection: 'row', justifyContent: 'space-around' },
  menuItem: { alignItems: 'center' },
  menuIcon: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  menuLabel: { fontSize: 13, color: '#64748B' },
  menuCancel: { marginTop: 20, alignItems: 'center', paddingVertical: 12, backgroundColor: '#F1F5F9', borderRadius: 12 },
  menuCancelText: { fontSize: 16, color: '#64748B' },
});
