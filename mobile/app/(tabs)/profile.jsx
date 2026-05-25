import { useState } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity, Alert,
  ScrollView, Modal, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator, Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'
import api from '../../src/api/axios'

// Converts any image value the backend returns into a proper Cloudinary URL
const getImageUrl = (image) => {
  if (!image) return null
  const url = String(image).trim()
  if (url.startsWith('http')) return url
  const filename = url.split('/').pop()
  if (!filename) return null
  return `https://res.cloudinary.com/dhcszgtm5/image/upload/profiles/${filename}`
}

export default function Profile() {
  const { user, logout, setUser } = useAuth()
  const router = useRouter()

  const [showEditModal, setShowEditModal] = useState(false)
  const [showPwModal,   setShowPwModal]   = useState(false)

  const [firstName,     setFirstName]     = useState(user?.first_name || '')
  const [lastName,      setLastName]      = useState(user?.last_name  || '')
  const [imageUri,      setImageUri]      = useState(null)
  const [savingProfile, setSavingProfile] = useState(false)

  const [oldPw,     setOldPw]     = useState('')
  const [newPw,     setNewPw]     = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw,  setSavingPw]  = useState(false)

  const handleLogout = () => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text:'Cancel', style:'cancel' },
      { text:'Sign out', style:'destructive', onPress: async () => {
        await logout()
        router.replace('/(auth)/login')
      }}
    ])
  }

  const openEditModal = () => {
    setFirstName(user?.first_name || '')
    setLastName(user?.last_name   || '')
    setImageUri(null)
    setShowEditModal(true)
  }

  const handlePickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow access to your photo library.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    })
    if (!result.canceled) {
      setImageUri(result.assets[0].uri)
    }
  }

  const handleSaveProfile = async () => {
    if (!firstName || !lastName) {
      Alert.alert('Error', 'Name cannot be empty.')
      return
    }
    setSavingProfile(true)
    try {
      const formData = new FormData()
      formData.append('first_name', firstName)
      formData.append('last_name',  lastName)

      if (imageUri) {
        const filename = imageUri.split('/').pop()
        const match    = /\.(\w+)$/.exec(filename)
        const type     = match ? `image/${match[1]}` : 'image/jpeg'
        formData.append('profile_image', { uri:imageUri, name:filename, type })
      }

      await api.patch('/auth/me/update/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      const fresh = await api.get('/auth/me/')
      setUser(fresh.data)
      setShowEditModal(false)
      setImageUri(null)
      Alert.alert('Success', 'Profile updated!')

    } catch (err) {
      Alert.alert('Error',
        err.response?.data?.detail ||
        err.response?.data?.error  ||
        JSON.stringify(err.response?.data) ||
        'Failed to update profile.'
      )
    } finally { setSavingProfile(false) }
  }

  const handleChangePassword = async () => {
    if (!oldPw || !newPw || !confirmPw) {
      Alert.alert('Error', 'Please fill in all fields.')
      return
    }
    if (newPw !== confirmPw) {
      Alert.alert('Error', 'New passwords do not match.')
      return
    }
    setSavingPw(true)
    try {
      await api.post('/auth/change-password/', {
        old_password: oldPw,
        new_password: newPw,
      })
      setShowPwModal(false)
      setOldPw(''); setNewPw(''); setConfirmPw('')
      Alert.alert('Success', 'Password changed successfully!')
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to change password.')
    } finally { setSavingPw(false) }
  }

  const initials     = `${user?.first_name?.[0] || ''}${user?.last_name?.[0] || ''}`
  const profileImage = getImageUrl(user?.profile_image)

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Avatar */}
        <View style={s.avatarWrap}>
          {profileImage ? (
            <Image
              source={{ uri: profileImage }}
              style={s.avatarImg}
              onError={() => console.log('Image failed to load:', profileImage)}
            />
          ) : (
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initials}</Text>
            </View>
          )}
          <Text style={s.name}>{user?.first_name} {user?.last_name}</Text>
          <View style={s.roleBadge}>
            <Text style={s.roleText}>{user?.role}</Text>
          </View>
        </View>

        {/* Action buttons */}
        <View style={s.actionRow}>
          <TouchableOpacity style={s.actionBtn} onPress={openEditModal}>
            <Text style={s.actionBtnText}>✏ Edit Profile</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.actionBtn, s.actionBtnSecondary]} onPress={() => setShowPwModal(true)}>
            <Text style={[s.actionBtnText, { color:'#818CF8' }]}>🔒 Change Password</Text>
          </TouchableOpacity>
        </View>

        {/* Account info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Account Info</Text>
          {[
            { label:'Email',    value: user?.email },
            { label:'Role',     value: user?.role },
            { label:'Verified', value: user?.is_verified ? '✓ Yes' : '✗ No' },
            { label:'Active',   value: user?.is_active   ? '✓ Yes' : '✗ No' },
            { label:'Joined',   value: user?.date_joined ? new Date(user.date_joined).toLocaleDateString() : '—' },
          ].map(row => (
            <View key={row.label} style={s.infoRow}>
              <Text style={s.infoLabel}>{row.label}</Text>
              <Text style={s.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* System info */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>System</Text>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>App version</Text>
            <Text style={s.infoValue}>1.0.0</Text>
          </View>
          <View style={s.infoRow}>
            <Text style={s.infoLabel}>Academic year</Text>
            <Text style={s.infoValue}>2025–2026</Text>
          </View>
        </View>

        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
          <Text style={s.logoutText}>Sign out</Text>
        </TouchableOpacity>

      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent onRequestClose={() => setShowEditModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={ms.overlay}>
            <View style={ms.sheet}>
              <View style={ms.sheetHeader}>
                <Text style={ms.sheetTitle}>Edit Profile</Text>
                <TouchableOpacity onPress={() => setShowEditModal(false)}>
                  <Text style={ms.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Image picker */}
              <View style={ms.avatarRow}>
                {imageUri ? (
                  <Image source={{ uri: imageUri }} style={ms.previewImg}/>
                ) : profileImage ? (
                  <Image source={{ uri: profileImage }} style={ms.previewImg}/>
                ) : (
                  <View style={ms.previewInitials}>
                    <Text style={ms.previewInitialsText}>{initials}</Text>
                  </View>
                )}
                <TouchableOpacity style={ms.changePhotoBtn} onPress={handlePickImage}>
                  <Text style={ms.changePhotoText}>📷 Change Photo</Text>
                </TouchableOpacity>
              </View>

              <Text style={ms.label}>First name</Text>
              <TextInput style={ms.input} value={firstName} onChangeText={setFirstName}
                placeholder="First name" placeholderTextColor="#4B5563"/>

              <Text style={ms.label}>Last name</Text>
              <TextInput style={ms.input} value={lastName} onChangeText={setLastName}
                placeholder="Last name" placeholderTextColor="#4B5563"/>

              <TouchableOpacity
                style={[ms.saveBtn, savingProfile && ms.saveBtnDisabled]}
                onPress={handleSaveProfile} disabled={savingProfile}>
                {savingProfile
                  ? <ActivityIndicator color="#000"/>
                  : <Text style={ms.saveBtnText}>Save Changes</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Change Password Modal */}
      <Modal visible={showPwModal} animationType="slide" transparent onRequestClose={() => setShowPwModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={ms.overlay}>
            <View style={ms.sheet}>
              <View style={ms.sheetHeader}>
                <Text style={ms.sheetTitle}>Change Password</Text>
                <TouchableOpacity onPress={() => setShowPwModal(false)}>
                  <Text style={ms.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <Text style={ms.label}>Current password</Text>
              <TextInput style={ms.input} value={oldPw} onChangeText={setOldPw}
                placeholder="••••••••" placeholderTextColor="#4B5563" secureTextEntry/>

              <Text style={ms.label}>New password</Text>
              <TextInput style={ms.input} value={newPw} onChangeText={setNewPw}
                placeholder="••••••••" placeholderTextColor="#4B5563" secureTextEntry/>

              <Text style={ms.label}>Confirm new password</Text>
              <TextInput style={ms.input} value={confirmPw} onChangeText={setConfirmPw}
                placeholder="••••••••" placeholderTextColor="#4B5563" secureTextEntry/>

              <TouchableOpacity
                style={[ms.saveBtn, { backgroundColor:'#6366F1' }, savingPw && ms.saveBtnDisabled]}
                onPress={handleChangePassword} disabled={savingPw}>
                {savingPw
                  ? <ActivityIndicator color="#FFF"/>
                  : <Text style={[ms.saveBtnText, { color:'#FFF' }]}>Change Password</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:              { flex:1, backgroundColor:'#0D1117' },
  content:           { padding:20 },
  avatarWrap:        { alignItems:'center', marginBottom:20, paddingTop:16 },
  avatar:            { width:72, height:72, borderRadius:18, backgroundColor:'#4F46E5', alignItems:'center', justifyContent:'center', marginBottom:12 },
  avatarImg:         { width:72, height:72, borderRadius:18, marginBottom:12, backgroundColor:'#4F46E5' },
  avatarText:        { color:'#FFF', fontSize:26, fontWeight:'bold' },
  name:              { color:'#FFF', fontSize:20, fontWeight:'bold', marginBottom:6 },
  roleBadge:         { backgroundColor:'rgba(245,158,11,0.15)', paddingHorizontal:12, paddingVertical:4, borderRadius:20 },
  roleText:          { color:'#F59E0B', fontSize:12, fontWeight:'600', textTransform:'capitalize' },
  actionRow:         { flexDirection:'row', gap:10, marginBottom:20 },
  actionBtn:         { flex:1, backgroundColor:'rgba(245,158,11,0.1)', borderWidth:1, borderColor:'rgba(245,158,11,0.2)', borderRadius:12, paddingVertical:12, alignItems:'center' },
  actionBtnSecondary:{ backgroundColor:'rgba(99,102,241,0.1)', borderColor:'rgba(99,102,241,0.2)' },
  actionBtnText:     { color:'#F59E0B', fontSize:12, fontWeight:'600' },
  section:           { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:16, marginBottom:14 },
  sectionTitle:      { color:'#6B7280', fontSize:11, fontWeight:'600', textTransform:'uppercase', letterSpacing:0.5, marginBottom:12 },
  infoRow:           { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor:'#1F2937' },
  infoLabel:         { color:'#9CA3AF', fontSize:13 },
  infoValue:         { color:'#FFF', fontSize:13, fontWeight:'500', flex:1, textAlign:'right' },
  logoutBtn:         { backgroundColor:'rgba(244,63,94,0.1)', borderWidth:1, borderColor:'rgba(244,63,94,0.2)', borderRadius:12, paddingVertical:14, alignItems:'center', marginTop:8 },
  logoutText:        { color:'#F43F5E', fontWeight:'700', fontSize:14 },
})

const ms = StyleSheet.create({
  overlay:             { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:               { backgroundColor:'#111827', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24 },
  sheetHeader:         { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  sheetTitle:          { color:'#FFF', fontSize:18, fontWeight:'bold' },
  closeBtn:            { color:'#6B7280', fontSize:20 },
  avatarRow:           { alignItems:'center', marginBottom:20 },
  previewImg:          { width:72, height:72, borderRadius:18, marginBottom:10, backgroundColor:'#4F46E5' },
  previewInitials:     { width:72, height:72, borderRadius:18, backgroundColor:'#4F46E5', alignItems:'center', justifyContent:'center', marginBottom:10 },
  previewInitialsText: { color:'#FFF', fontSize:26, fontWeight:'bold' },
  changePhotoBtn:      { backgroundColor:'rgba(245,158,11,0.1)', borderWidth:1, borderColor:'rgba(245,158,11,0.3)', borderRadius:10, paddingHorizontal:16, paddingVertical:8 },
  changePhotoText:     { color:'#F59E0B', fontSize:13, fontWeight:'600' },
  label:               { color:'#9CA3AF', fontSize:12, marginBottom:6 },
  input:               { backgroundColor:'#1F2937', borderWidth:1, borderColor:'#374151', borderRadius:10, paddingHorizontal:14, paddingVertical:12, color:'#FFF', fontSize:14, marginBottom:14 },
  saveBtn:             { backgroundColor:'#F59E0B', borderRadius:12, paddingVertical:14, alignItems:'center', marginTop:4, marginBottom:8 },
  saveBtnDisabled:     { opacity:0.5 },
  saveBtnText:         { color:'#000', fontWeight:'700', fontSize:15 },
})