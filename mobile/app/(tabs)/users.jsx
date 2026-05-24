import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

const ROLE_COLORS = {
  admin:   { bg:'rgba(245,158,11,0.1)',  text:'#F59E0B' },
  staff:   { bg:'rgba(99,102,241,0.1)',  text:'#818CF8' },
  student: { bg:'rgba(20,184,166,0.1)',  text:'#2DD4BF' },
}

export default function Users() {
  const [users,      setUsers]      = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/auth/users/')
      setUsers(res.data.results || res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  const handleActivate = (user) => {
    Alert.alert(
      'Activate Account',
      `Activate account for ${user.first_name} ${user.last_name}?`,
      [
        { text:'Cancel', style:'cancel' },
        { text:'Activate', onPress: async () => {
          try {
            await api.patch(`/auth/users/${user.id}/activate/`)
            setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active:true } : u))
          } catch {
            Alert.alert('Error', 'Failed to activate account.')
          }
        }}
      ]
    )
  }

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>User Accounts</Text>
        <Text style={s.count}>{users.length} total</Text>
      </View>

      {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:40 }}/> : (
        <FlatList
          data={users}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding:16, paddingTop:8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
          ListEmptyComponent={<Text style={s.empty}>No users found</Text>}
          renderItem={({ item:u }) => {
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.student
            const initials = `${u.first_name?.[0]||''}${u.last_name?.[0]||''}`
            return (
              <View style={s.card}>
                <View style={s.avatar}>
                  <Text style={s.avatarText}>{initials}</Text>
                </View>
                <View style={s.info}>
                  <View style={s.nameRow}>
                    <Text style={s.name}>{u.first_name} {u.last_name}</Text>
                    <View style={[s.roleBadge, { backgroundColor:rc.bg }]}>
                      <Text style={[s.roleText, { color:rc.text }]}>{u.role}</Text>
                    </View>
                  </View>
                  <Text style={s.email}>{u.email}</Text>
                  <View style={s.statusRow}>
                    <View style={[s.statusDot, { backgroundColor: u.is_active ? '#22C55E' : '#F43F5E' }]}/>
                    <Text style={s.statusText}>{u.is_active ? 'Active' : 'Inactive'}</Text>
                    <Text style={s.dot}>·</Text>
                    <Text style={s.statusText}>{u.is_verified ? 'Verified' : 'Unverified'}</Text>
                  </View>
                </View>
                {!u.is_active && (
                  <TouchableOpacity style={s.activateBtn} onPress={() => handleActivate(u)}>
                    <Text style={s.activateBtnText}>Activate</Text>
                  </TouchableOpacity>
                )}
              </View>
            )
          }}
        />
      )}
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:            { flex:1, backgroundColor:'#0D1117' },
  header:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  title:           { fontSize:20, fontWeight:'bold', color:'#FFF' },
  count:           { fontSize:12, color:'#6B7280' },
  empty:           { color:'#4B5563', textAlign:'center', marginTop:40, fontSize:13 },
  card:            { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:12 },
  avatar:          { width:44, height:44, borderRadius:12, backgroundColor:'#4F46E5', alignItems:'center', justifyContent:'center', flexShrink:0 },
  avatarText:      { color:'#FFF', fontWeight:'bold', fontSize:16 },
  info:            { flex:1 },
  nameRow:         { flexDirection:'row', alignItems:'center', gap:8, marginBottom:3, flexWrap:'wrap' },
  name:            { color:'#FFF', fontWeight:'600', fontSize:14 },
  roleBadge:       { paddingHorizontal:8, paddingVertical:2, borderRadius:20 },
  roleText:        { fontSize:10, fontWeight:'700', textTransform:'capitalize' },
  email:           { color:'#6B7280', fontSize:11, marginBottom:4 },
  statusRow:       { flexDirection:'row', alignItems:'center', gap:4 },
  statusDot:       { width:6, height:6, borderRadius:3 },
  statusText:      { color:'#9CA3AF', fontSize:11 },
  dot:             { color:'#4B5563', fontSize:11 },
  activateBtn:     { backgroundColor:'#F59E0B', paddingHorizontal:12, paddingVertical:7, borderRadius:8 },
  activateBtnText: { color:'#000', fontWeight:'700', fontSize:12 },
})