import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, ScrollView,
  Alert, KeyboardAvoidingView, Platform, TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

const EMPTY = { code:'', name:'', units:'3', schedule:'', room:'', description:'', department:'', subject_type:'lecture' }
const TYPES = ['lecture','lab','lec_lab']
const COLORS = ['#6366F1','#14B8A6','#F59E0B','#F43F5E','#8B5CF6']

export default function Subjects() {
  const [subjects,   setSubjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)

  const load = async () => {
    try {
      const res = await api.get('/subjects/')
      setSubjects(res.data.results || res.data)
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setShowModal(true) }

  const openEdit = (sub) => {
    setEditItem(sub)
    setForm({
      code:         sub.code,
      name:         sub.name,
      units:        String(sub.units),
      schedule:     sub.schedule || '',
      room:         sub.room     || '',
      description:  sub.description || '',
      department:   sub.department,
      subject_type: sub.subject_type,
    })
    setShowModal(true)
  }

  const handleSave = async () => {
    if (!form.code || !form.name || !form.department) {
      Alert.alert('Error', 'Code, name, and department are required.')
      return
    }
    setSaving(true)
    try {
      const payload = { ...form, units: Number(form.units) }
      if (editItem) {
        await api.patch(`/subjects/${editItem.id}/`, payload)
      } else {
        await api.post('/subjects/', payload)
      }
      setShowModal(false)
      load()
    } catch (err) {
      const d = err.response?.data
      Alert.alert('Error', typeof d === 'object' ? Object.values(d).flat().join('\n') : 'Failed to save.')
    } finally { setSaving(false) }
  }

  const handleDelete = (id, name) => {
    Alert.alert('Delete Subject', `Delete "${name}"?`, [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        await api.delete(`/subjects/${id}/`)
        load()
      }}
    ])
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Subjects</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Add</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:40 }}/> : (
        <FlatList
          data={subjects}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding:16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
          ListEmptyComponent={<Text style={s.empty}>No subjects yet. Add one!</Text>}
          renderItem={({ item:sub, index }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <View style={[s.codeBadge, { backgroundColor: COLORS[index % COLORS.length] + '20', borderColor: COLORS[index % COLORS.length] + '50' }]}>
                  <Text style={[s.codeText, { color: COLORS[index % COLORS.length] }]}>{sub.code}</Text>
                </View>
                <Text style={s.units}>{sub.units} units</Text>
              </View>
              <Text style={s.name}>{sub.name}</Text>
              <Text style={s.dept}>{sub.department} · {sub.subject_type.replace('_',' ')}</Text>
              {sub.schedule ? <Text style={s.detail}>🕐 {sub.schedule}</Text> : null}
              {sub.room     ? <Text style={s.detail}>📍 {sub.room}</Text>     : null}
              <View style={s.cardActions}>
                <TouchableOpacity onPress={() => openEdit(sub)} style={s.editBtn}>
                  <Text style={s.editBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(sub.id, sub.name)} style={s.delBtn}>
                  <Text style={s.delBtnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={ms.overlay}>
            <View style={ms.sheet}>
              <View style={ms.sheetHeader}>
                <Text style={ms.sheetTitle}>{editItem ? 'Edit Subject' : 'Add Subject'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={ms.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false}>
                <View style={ms.row}>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Code *</Text>
                    <TextInput style={ms.input} value={form.code} onChangeText={v => set('code',v)}
                      placeholder="CS101" placeholderTextColor="#4B5563" autoCapitalize="characters"/>
                  </View>
                  <View style={{ width:10 }}/>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Units *</Text>
                    <TextInput style={ms.input} value={form.units} onChangeText={v => set('units',v)}
                      keyboardType="numeric" placeholder="3" placeholderTextColor="#4B5563"/>
                  </View>
                </View>
                <Text style={ms.label}>Subject Name *</Text>
                <TextInput style={ms.input} value={form.name} onChangeText={v => set('name',v)}
                  placeholder="e.g. Introduction to CS" placeholderTextColor="#4B5563"/>
                <Text style={ms.label}>Department *</Text>
                <TextInput style={ms.input} value={form.department} onChangeText={v => set('department',v)}
                  placeholder="e.g. Computer Science" placeholderTextColor="#4B5563"/>
                <Text style={ms.label}>Type</Text>
                <View style={ms.typeRow}>
                  {TYPES.map(t => (
                    <TouchableOpacity key={t} onPress={() => set('subject_type',t)}
                      style={[ms.typeBtn, form.subject_type === t && ms.typeBtnActive]}>
                      <Text style={[ms.typeBtnText, form.subject_type === t && ms.typeBtnTextActive]}>
                        {t.replace('_',' ')}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={ms.row}>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Schedule</Text>
                    <TextInput style={ms.input} value={form.schedule} onChangeText={v => set('schedule',v)}
                      placeholder="MWF 7:30-9:00" placeholderTextColor="#4B5563"/>
                  </View>
                  <View style={{ width:10 }}/>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Room</Text>
                    <TextInput style={ms.input} value={form.room} onChangeText={v => set('room',v)}
                      placeholder="Lab 204" placeholderTextColor="#4B5563"/>
                  </View>
                </View>
                <Text style={ms.label}>Description</Text>
                <TextInput style={[ms.input, { height:70, textAlignVertical:'top' }]}
                  value={form.description} onChangeText={v => set('description',v)}
                  placeholder="Optional description..." placeholderTextColor="#4B5563" multiline/>
                <TouchableOpacity style={[ms.saveBtn, saving && ms.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                  <Text style={ms.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Save Changes' : 'Add Subject'}</Text>
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
  safe:        { flex:1, backgroundColor:'#0D1117' },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  title:       { fontSize:20, fontWeight:'bold', color:'#FFF' },
  addBtn:      { backgroundColor:'#F59E0B', paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  addBtnText:  { color:'#000', fontWeight:'700', fontSize:13 },
  empty:       { color:'#4B5563', textAlign:'center', marginTop:40, fontSize:13 },
  card:        { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:14, marginBottom:10 },
  cardTop:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  codeBadge:   { borderWidth:1, borderRadius:8, paddingHorizontal:10, paddingVertical:3 },
  codeText:    { fontSize:12, fontWeight:'700' },
  units:       { color:'#F59E0B', fontWeight:'700', fontSize:14 },
  name:        { color:'#FFF', fontWeight:'600', fontSize:14, marginBottom:3 },
  dept:        { color:'#6B7280', fontSize:11, marginBottom:4 },
  detail:      { color:'#9CA3AF', fontSize:11, marginBottom:2 },
  cardActions: { flexDirection:'row', gap:8, marginTop:10, paddingTop:10, borderTopWidth:1, borderTopColor:'#1F2937' },
  editBtn:     { backgroundColor:'rgba(99,102,241,0.15)', paddingHorizontal:14, paddingVertical:6, borderRadius:8 },
  editBtnText: { color:'#818CF8', fontSize:12, fontWeight:'600' },
  delBtn:      { backgroundColor:'rgba(244,63,94,0.1)', paddingHorizontal:14, paddingVertical:6, borderRadius:8 },
  delBtnText:  { color:'#FB7185', fontSize:12, fontWeight:'600' },
})

const ms = StyleSheet.create({
  overlay:          { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:            { backgroundColor:'#111827', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'90%' },
  sheetHeader:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  sheetTitle:       { color:'#FFF', fontSize:18, fontWeight:'bold' },
  closeBtn:         { color:'#6B7280', fontSize:20 },
  label:            { color:'#9CA3AF', fontSize:12, marginBottom:6 },
  input:            { backgroundColor:'#1F2937', borderWidth:1, borderColor:'#374151', borderRadius:10, paddingHorizontal:14, paddingVertical:11, color:'#FFF', fontSize:14, marginBottom:14 },
  row:              { flexDirection:'row' },
  typeRow:          { flexDirection:'row', gap:6, marginBottom:14 },
  typeBtn:          { flex:1, borderWidth:1, borderColor:'#374151', borderRadius:8, paddingVertical:8, alignItems:'center' },
  typeBtnActive:    { backgroundColor:'#F59E0B', borderColor:'#F59E0B' },
  typeBtnText:      { color:'#9CA3AF', fontSize:11, textTransform:'capitalize' },
  typeBtnTextActive:{ color:'#000', fontWeight:'700' },
  saveBtn:          { backgroundColor:'#F59E0B', borderRadius:12, paddingVertical:14, alignItems:'center', marginTop:8, marginBottom:16 },
  saveBtnDisabled:  { opacity:0.5 },
  saveBtnText:      { color:'#000', fontWeight:'700', fontSize:15 },
})