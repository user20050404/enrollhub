import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, TextInput,
  ActivityIndicator, RefreshControl, TouchableOpacity,
  Modal, ScrollView, Alert, KeyboardAvoidingView, Platform
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

const EMPTY_FORM = { email:'', first_name:'', last_name:'', student_id:'', course:'', year_level:'1', max_units:'24' }

export default function Students() {
  const [students,   setStudents]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [search,     setSearch]     = useState('')
  const [showModal,  setShowModal]  = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [form,       setForm]       = useState(EMPTY_FORM)
  const [saving,     setSaving]     = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/students/')
      setStudents(res.data.results || res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  const filtered = students.filter(s =>
    s.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    s.student_id?.includes(search)
  )

  const openAdd = () => {
    setEditItem(null)
    setForm(EMPTY_FORM)
    setShowModal(true)
  }

  const openEdit = (st) => {
    setEditItem(st)
    setForm({
      email:      st.user?.email      || '',
      first_name: st.user?.first_name || '',
      last_name:  st.user?.last_name  || '',
      student_id: st.student_id,
      course:     st.course,
      year_level: String(st.year_level),
      max_units:  String(st.max_units),
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.student_id || !form.course) {
      Alert.alert('Error', 'Please fill in all required fields.')
      return
    }
    setSaving(true)
    try {
      if (editItem) {
        await api.patch(`/students/${editItem.id}/`, {
          student_id: form.student_id,
          course:     form.course,
          year_level: Number(form.year_level),
          max_units:  Number(form.max_units),
        })
      } else {
        if (!form.email || !form.first_name || !form.last_name) {
          Alert.alert('Error', 'Please fill in all fields.')
          setSaving(false)
          return
        }
        await api.post('/students/', {
          ...form,
          year_level: Number(form.year_level),
          max_units:  Number(form.max_units),
        })
      }
      setShowModal(false)
      load()
    } catch (err) {
      const d = err.response?.data
      Alert.alert('Error', typeof d === 'object' ? Object.values(d).flat().join('\n') : 'Failed to save.')
    } finally { setSaving(false) }
  }

  const handleDelete = (id, name) => {
    Alert.alert('Delete Student', `Delete ${name}? This cannot be undone.`, [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        await api.delete(`/students/${id}/`)
        load()
      }}
    ])
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Students</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={s.search} value={search} onChangeText={setSearch}
        placeholder="Search name or ID…" placeholderTextColor="#4B5563"/>

      {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:40 }}/> : (
        <FlatList
          data={filtered}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding:16, paddingTop:8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
          ListEmptyComponent={<Text style={s.empty}>No students found</Text>}
          renderItem={({ item:st }) => (
            <View style={s.card}>
              <View style={s.avatar}>
                <Text style={s.avatarText}>{st.full_name?.[0]}</Text>
              </View>
              <View style={s.info}>
                <Text style={s.name}>{st.full_name}</Text>
                <Text style={s.meta}>{st.student_id} · {st.course} · Year {st.year_level}</Text>
                <Text style={s.units}>
                  <Text style={{ color:'#F59E0B' }}>{st.total_enrolled_units}</Text>
                  <Text style={{ color:'#6B7280' }}> / {st.max_units} units</Text>
                </Text>
              </View>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => openEdit(st)} style={s.editBtn}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(st.id, st.full_name)} style={s.delBtn}>
                  <Text style={s.delBtnText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={ms.overlay}>
            <View style={ms.sheet}>
              <View style={ms.sheetHeader}>
                <Text style={ms.sheetTitle}>{editItem ? 'Edit Student' : 'Add Student'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={ms.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                {!editItem && (
                  <>
                    <View style={ms.row}>
                      <View style={{ flex:1 }}>
                        <Text style={ms.label}>First name *</Text>
                        <TextInput style={ms.input} value={form.first_name} onChangeText={v => set('first_name',v)} placeholderTextColor="#4B5563" placeholder="Juan"/>
                      </View>
                      <View style={{ width:10 }}/>
                      <View style={{ flex:1 }}>
                        <Text style={ms.label}>Last name *</Text>
                        <TextInput style={ms.input} value={form.last_name} onChangeText={v => set('last_name',v)} placeholderTextColor="#4B5563" placeholder="Dela Cruz"/>
                      </View>
                    </View>
                    <Text style={ms.label}>Email *</Text>
                    <TextInput style={ms.input} value={form.email} onChangeText={v => set('email',v)}
                      placeholder="student@email.com" placeholderTextColor="#4B5563"
                      keyboardType="email-address" autoCapitalize="none"/>
                  </>
                )}
                <Text style={ms.label}>Student ID *</Text>
                <TextInput style={ms.input} value={form.student_id} onChangeText={v => set('student_id',v)}
                  placeholder="e.g. 2024-0001" placeholderTextColor="#4B5563"/>
                <Text style={ms.label}>Course *</Text>
                <TextInput style={ms.input} value={form.course} onChangeText={v => set('course',v)}
                  placeholder="e.g. BSCS" placeholderTextColor="#4B5563"/>
                <View style={ms.row}>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Year Level</Text>
                    <TextInput style={ms.input} value={form.year_level} onChangeText={v => set('year_level',v)}
                      keyboardType="numeric" placeholder="1" placeholderTextColor="#4B5563"/>
                  </View>
                  <View style={{ width:10 }}/>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Max Units</Text>
                    <TextInput style={ms.input} value={form.max_units} onChangeText={v => set('max_units',v)}
                      keyboardType="numeric" placeholder="24" placeholderTextColor="#4B5563"/>
                  </View>
                </View>
                <TouchableOpacity style={[ms.saveBtn, saving && ms.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                  <Text style={ms.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Student'}</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:       { flex:1, backgroundColor:'#0D1117' },
  header:     { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  title:      { fontSize:20, fontWeight:'bold', color:'#FFF' },
  addBtn:     { backgroundColor:'#F59E0B', paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  addBtnText: { color:'#000', fontWeight:'700', fontSize:13 },
  search:     { margin:16, marginTop:4, backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:10, paddingHorizontal:14, paddingVertical:10, color:'#FFF', fontSize:13 },
  empty:      { color:'#4B5563', textAlign:'center', marginTop:40, fontSize:13 },
  card:       { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:14, marginBottom:10, flexDirection:'row', alignItems:'center', gap:10 },
  avatar:     { width:42, height:42, borderRadius:10, backgroundColor:'#4F46E5', alignItems:'center', justifyContent:'center' },
  avatarText: { color:'#FFF', fontWeight:'bold', fontSize:16 },
  info:       { flex:1 },
  name:       { color:'#FFF', fontWeight:'600', fontSize:14, marginBottom:2 },
  meta:       { color:'#6B7280', fontSize:11, marginBottom:2 },
  units:      { fontSize:12 },
  actions:    { gap:6 },
  editBtn:    { backgroundColor:'rgba(99,102,241,0.15)', paddingHorizontal:10, paddingVertical:5, borderRadius:8 },
  editBtnText:{ color:'#818CF8', fontSize:11, fontWeight:'600' },
  delBtn:     { backgroundColor:'rgba(244,63,94,0.1)', paddingHorizontal:10, paddingVertical:5, borderRadius:8 },
  delBtnText: { color:'#FB7185', fontSize:11, fontWeight:'600' },
})

const ms = StyleSheet.create({
  overlay:      { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:        { backgroundColor:'#111827', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'90%' },
  sheetHeader:  { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  sheetTitle:   { color:'#FFF', fontSize:18, fontWeight:'bold' },
  closeBtn:     { color:'#6B7280', fontSize:20 },
  label:        { color:'#9CA3AF', fontSize:12, marginBottom:6 },
  input:        { backgroundColor:'#1F2937', borderWidth:1, borderColor:'#374151', borderRadius:10, paddingHorizontal:14, paddingVertical:11, color:'#FFF', fontSize:14, marginBottom:14 },
  row:          { flexDirection:'row' },
  saveBtn:      { backgroundColor:'#F59E0B', borderRadius:12, paddingVertical:14, alignItems:'center', marginTop:8, marginBottom:16 },
  saveBtnDisabled: { opacity:0.5 },
  saveBtnText:  { color:'#000', fontWeight:'700', fontSize:15 },
})