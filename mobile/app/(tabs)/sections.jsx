import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, ScrollView,
  Alert, KeyboardAvoidingView, Platform, TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

const EMPTY = { code:'', subjects:[], max_capacity:'40', academic_year:'2025-2026', semester:'1' }

export default function Sections() {
  const [sections,   setSections]   = useState([])
  const [subjects,   setSubjects]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [form,       setForm]       = useState(EMPTY)
  const [saving,     setSaving]     = useState(false)

  const load = async () => {
    try {
      const [sec, sub] = await Promise.all([api.get('/sections/'), api.get('/subjects/')])
      setSections(sec.data.results || sec.data)
      setSubjects(sub.data.results || sub.data)
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => { setEditItem(null); setForm(EMPTY); setShowModal(true) }

  const openEdit = (sec) => {
    setEditItem(sec)
    setForm({
      code:          sec.code,
      subjects:      sec.subjects || [],
      max_capacity:  String(sec.max_capacity),
      academic_year: sec.academic_year,
      semester:      String(sec.semester),
    })
    setShowModal(true)
  }

  const toggleSubject = (id) => {
    setForm(f => ({
      ...f,
      subjects: f.subjects.includes(id)
        ? f.subjects.filter(s => s !== id)
        : [...f.subjects, id]
    }))
  }

  const handleSave = async () => {
    if (!form.code) { Alert.alert('Error', 'Section code is required.'); return }
    if (form.subjects.length === 0) { Alert.alert('Error', 'Please select at least one subject.'); return }
    setSaving(true)
    try {
      const payload = {
        code:          form.code,
        subjects:      form.subjects,
        max_capacity:  Number(form.max_capacity),
        academic_year: form.academic_year,
        semester:      Number(form.semester),
      }
      if (editItem) {
        await api.patch(`/sections/${editItem.id}/`, payload)
      } else {
        await api.post('/sections/', payload)
      }
      setShowModal(false)
      load()
    } catch (err) {
      const d = err.response?.data
      Alert.alert('Error', typeof d === 'object' ? Object.values(d).flat().join('\n') : 'Failed to save.')
    } finally { setSaving(false) }
  }

  const handleDelete = (id, code) => {
    Alert.alert('Delete Section', `Delete section "${code}"?`, [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        await api.delete(`/sections/${id}/`)
        load()
      }}
    ])
  }

  const set = (key, val) => setForm(f => ({ ...f, [key]: val }))

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Sections</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Create</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:40 }}/> : (
        <FlatList
          data={sections}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding:16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
          ListEmptyComponent={<Text style={s.empty}>No sections yet</Text>}
          renderItem={({ item:sec }) => {
            const pct      = sec.max_capacity > 0 ? Math.min((sec.enrolled_count / sec.max_capacity) * 100, 100) : 0
            const barColor = pct >= 100 ? '#F43F5E' : pct >= 80 ? '#F59E0B' : '#14B8A6'
            const label    = pct >= 100 ? 'Full' : pct >= 80 ? 'Near Full' : 'Open'
            const lblColor = pct >= 100 ? '#FB7185' : pct >= 80 ? '#FBB24F' : '#2DD4BF'
            const lblBg    = pct >= 100 ? 'rgba(244,63,94,0.1)' : pct >= 80 ? 'rgba(245,158,11,0.1)' : 'rgba(20,184,166,0.1)'
            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <Text style={s.code}>{sec.code}</Text>
                  <View style={[s.badge, { backgroundColor:lblBg }]}>
                    <Text style={[s.badgeText, { color:lblColor }]}>{label}</Text>
                  </View>
                </View>
                {sec.subjects_detail?.length > 0 ? (
                  <View style={s.subjectsList}>
                    {sec.subjects_detail.map(sub => (
                      <View key={sub.id} style={s.subjectChip}>
                        <Text style={s.subjectCode}>{sub.code}</Text>
                        {sub.schedule ? <Text style={s.subjectMeta}> · {sub.schedule}</Text> : null}
                        {sub.room     ? <Text style={s.subjectMeta}> · {sub.room}</Text>     : null}
                      </View>
                    ))}
                  </View>
                ) : (
                  <Text style={s.noSubjects}>No subjects assigned</Text>
                )}
                <View style={s.barRow}>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width:`${pct}%`, backgroundColor:barColor }]}/>
                  </View>
                  <Text style={s.barLabel}>{sec.enrolled_count}/{sec.max_capacity}</Text>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(sec)} style={s.editBtn}>
                    <Text style={s.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(sec.id, sec.code)} style={s.delBtn}>
                    <Text style={s.delBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}

      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex:1 }}>
          <View style={ms.overlay}>
            {/* ✅ Sheet needs flex:1 so ScrollView inside can scroll */}
            <View style={[ms.sheet, { flex:1, maxHeight:'92%' }]}>
              <View style={ms.sheetHeader}>
                <Text style={ms.sheetTitle}>{editItem ? 'Edit Section' : 'Create Section'}</Text>
                <TouchableOpacity onPress={() => setShowModal(false)}>
                  <Text style={ms.closeBtn}>✕</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={ms.label}>Section Code *</Text>
                <TextInput style={ms.input} value={form.code} onChangeText={v => set('code',v)}
                  placeholder="e.g. BSCS-1A" placeholderTextColor="#4B5563" autoCapitalize="characters"/>

                <Text style={ms.label}>
                  Subjects * <Text style={{ color:'#F59E0B' }}>({form.subjects.length} selected)</Text>
                </Text>

                {/* ✅ Replace overflow:hidden View with ScrollView so subjects list scrolls */}
                <View style={ms.subjectPickerWrap}>
                  {subjects.length === 0 ? (
                    <Text style={ms.noSubMsg}>No subjects yet. Add subjects first.</Text>
                  ) : (
                    subjects.map(sub => {
                      const selected = form.subjects.includes(sub.id)
                      return (
                        <TouchableOpacity key={sub.id} onPress={() => toggleSubject(sub.id)}
                          style={[ms.subjectRow, selected && ms.subjectRowSelected]}>
                          <View style={[ms.checkbox, selected && ms.checkboxSelected]}>
                            {selected && <Text style={ms.checkmark}>✓</Text>}
                          </View>
                          <View style={{ flex:1 }}>
                            <Text style={ms.subjectName}>{sub.code} — {sub.name}</Text>
                            {sub.schedule ? <Text style={ms.subjectDetail}>{sub.schedule}{sub.room ? ` · ${sub.room}` : ''}</Text> : null}
                          </View>
                          <Text style={ms.subjectUnits}>{sub.units}u</Text>
                        </TouchableOpacity>
                      )
                    })
                  )}
                </View>

                <View style={ms.row}>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Max Capacity</Text>
                    <TextInput style={ms.input} value={form.max_capacity} onChangeText={v => set('max_capacity',v)}
                      keyboardType="numeric" placeholder="40" placeholderTextColor="#4B5563"/>
                  </View>
                  <View style={{ width:10 }}/>
                  <View style={{ flex:1 }}>
                    <Text style={ms.label}>Semester</Text>
                    <View style={ms.semRow}>
                      {['1','2'].map(sem => (
                        <TouchableOpacity key={sem} onPress={() => set('semester',sem)}
                          style={[ms.semBtn, form.semester === sem && ms.semBtnActive]}>
                          <Text style={[ms.semBtnText, form.semester === sem && ms.semBtnTextActive]}>Sem {sem}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                </View>

                <Text style={ms.label}>Academic Year</Text>
                <TextInput style={ms.input} value={form.academic_year} onChangeText={v => set('academic_year',v)}
                  placeholder="2025-2026" placeholderTextColor="#4B5563"/>

                <TouchableOpacity style={[ms.saveBtn, saving && ms.saveBtnDisabled]} onPress={handleSave} disabled={saving}>
                  <Text style={ms.saveBtnText}>{saving ? 'Saving...' : editItem ? 'Save Changes' : 'Create Section'}</Text>
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
  safe:         { flex:1, backgroundColor:'#0D1117' },
  header:       { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:16, paddingBottom:8 },
  title:        { fontSize:20, fontWeight:'bold', color:'#FFF' },
  addBtn:       { backgroundColor:'#F59E0B', paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  addBtnText:   { color:'#000', fontWeight:'700', fontSize:13 },
  empty:        { color:'#4B5563', textAlign:'center', marginTop:40, fontSize:13 },
  card:         { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:14, marginBottom:10 },
  cardTop:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:8 },
  code:         { color:'#FFF', fontWeight:'700', fontSize:16 },
  badge:        { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  badgeText:    { fontSize:10, fontWeight:'700' },
  subjectsList: { marginBottom:10, gap:4 },
  subjectChip:  { flexDirection:'row', flexWrap:'wrap', backgroundColor:'rgba(99,102,241,0.1)', borderRadius:8, paddingHorizontal:8, paddingVertical:4 },
  subjectCode:  { color:'#818CF8', fontSize:11, fontWeight:'700' },
  subjectMeta:  { color:'#6B7280', fontSize:11 },
  noSubjects:   { color:'#4B5563', fontSize:11, marginBottom:10 },
  barRow:       { flexDirection:'row', alignItems:'center', gap:8, marginBottom:10 },
  barBg:        { flex:1, height:5, backgroundColor:'#1F2937', borderRadius:3, overflow:'hidden' },
  barFill:      { height:'100%', borderRadius:3 },
  barLabel:     { color:'#6B7280', fontSize:11, minWidth:36, textAlign:'right' },
  cardActions:  { flexDirection:'row', gap:8, paddingTop:10, borderTopWidth:1, borderTopColor:'#1F2937' },
  editBtn:      { backgroundColor:'rgba(99,102,241,0.15)', paddingHorizontal:14, paddingVertical:6, borderRadius:8 },
  editBtnText:  { color:'#818CF8', fontSize:12, fontWeight:'600' },
  delBtn:       { backgroundColor:'rgba(244,63,94,0.1)', paddingHorizontal:14, paddingVertical:6, borderRadius:8 },
  delBtnText:   { color:'#FB7185', fontSize:12, fontWeight:'600' },
})

const ms = StyleSheet.create({
  overlay:           { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:             { backgroundColor:'#111827', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24 },
  sheetHeader:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  sheetTitle:        { color:'#FFF', fontSize:18, fontWeight:'bold' },
  closeBtn:          { color:'#6B7280', fontSize:20 },
  label:             { color:'#9CA3AF', fontSize:12, marginBottom:6 },
  input:             { backgroundColor:'#1F2937', borderWidth:1, borderColor:'#374151', borderRadius:10, paddingHorizontal:14, paddingVertical:11, color:'#FFF', fontSize:14, marginBottom:14 },
  row:               { flexDirection:'row' },
  // ✅ Removed overflow:'hidden' and maxHeight — parent ScrollView handles it
  subjectPickerWrap: { backgroundColor:'#1F2937', borderWidth:1, borderColor:'#374151', borderRadius:12, marginBottom:14 },
  noSubMsg:          { color:'#4B5563', padding:14, fontSize:12 },
  subjectRow:        { flexDirection:'row', alignItems:'center', gap:10, padding:12, borderBottomWidth:1, borderBottomColor:'#374151' },
  subjectRowSelected:{ backgroundColor:'rgba(245,158,11,0.05)' },
  checkbox:          { width:20, height:20, borderRadius:6, borderWidth:2, borderColor:'#374151', alignItems:'center', justifyContent:'center' },
  checkboxSelected:  { backgroundColor:'#F59E0B', borderColor:'#F59E0B' },
  checkmark:         { color:'#000', fontSize:12, fontWeight:'bold' },
  subjectName:       { color:'#FFF', fontSize:12, fontWeight:'500' },
  subjectDetail:     { color:'#6B7280', fontSize:11, marginTop:1 },
  subjectUnits:      { color:'#F59E0B', fontSize:11, fontWeight:'700' },
  semRow:            { flexDirection:'row', gap:6, marginBottom:14 },
  semBtn:            { flex:1, borderWidth:1, borderColor:'#374151', borderRadius:8, paddingVertical:10, alignItems:'center' },
  semBtnActive:      { backgroundColor:'#F59E0B', borderColor:'#F59E0B' },
  semBtnText:        { color:'#9CA3AF', fontSize:12 },
  semBtnTextActive:  { color:'#000', fontWeight:'700' },
  saveBtn:           { backgroundColor:'#F59E0B', borderRadius:12, paddingVertical:14, alignItems:'center', marginTop:8, marginBottom:16 },
  saveBtnDisabled:   { opacity:0.5 },
  saveBtnText:       { color:'#000', fontWeight:'700', fontSize:15 },
})