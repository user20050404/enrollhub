import { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, ScrollView, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

const STATUS_STYLE = {
  enrolled: { bg:'rgba(34,197,94,0.1)',   text:'#4ADE80' },
  pending:  { bg:'rgba(245,158,11,0.1)',  text:'#FBB24F' },
  dropped:  { bg:'rgba(100,100,100,0.1)', text:'#9CA3AF' },
  blocked:  { bg:'rgba(244,63,94,0.1)',   text:'#FB7185' },
}

const STATUSES = ['enrolled','pending','dropped','blocked']

export default function Enrollment() {
  const [enrollments, setEnrollments] = useState([])
  const [students,    setStudents]    = useState([])
  const [sections,    setSections]    = useState([])
  const [loading,     setLoading]     = useState(true)
  const [refreshing,  setRefreshing]  = useState(false)

  const [showAdd,    setShowAdd]    = useState(false)
  const [selStudent, setSelStudent] = useState(null)
  const [selSection, setSelSection] = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [enrolling,  setEnrolling]  = useState(false)

  const [showEdit,   setShowEdit]   = useState(false)
  const [editItem,   setEditItem]   = useState(null)
  const [editStatus, setEditStatus] = useState('enrolled')
  const [saving,     setSaving]     = useState(false)

  const [showStudentPicker, setShowStudentPicker] = useState(false)
  const [showSectionPicker, setShowSectionPicker] = useState(false)

  const load = async () => {
    try {
      const [eRes, stRes, secRes] = await Promise.allSettled([
        api.get('/enrollments/'),
        api.get('/students/'),
        api.get('/sections/'),
      ])
      if (eRes.status === 'fulfilled')   setEnrollments(eRes.value.data.results  || eRes.value.data)
      if (stRes.status === 'fulfilled')  setStudents(stRes.value.data.results    || stRes.value.data)
      if (secRes.status === 'fulfilled') setSections(secRes.value.data.results   || secRes.value.data)
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  const openAdd = () => {
    setSelStudent(null); setSelSection(null); setPreview(null)
    setShowAdd(true)
  }

  // ─── FIXED: fetch full section detail so subjects_detail is populated ───
  const handleSelectSection = async (sec) => {
    setSelSection(sec)
    setPreview(sec)              // show immediately so UI doesn't go blank
    setShowSectionPicker(false)
    try {
      const res = await api.get(`/sections/${sec.id}/`)
      setPreview(res.data)       // overwrite with full detail that has subjects_detail
    } catch {
      // preview stays as list-level data — no crash, enrollment still works
    }
  }
  // ────────────────────────────────────────────────────────────────────────

  const handleEnroll = async () => {
    if (!selStudent || !selSection) { Alert.alert('Error', 'Please select a student and section.'); return }
    setEnrolling(true)
    try {
      await api.post('/enrollments/create/', { student: selStudent.id, section: selSection.id })
      setShowAdd(false)
      load()
      Alert.alert('Success', `Enrolled ${selStudent.full_name} in ${selSection.code}!`)
    } catch (err) {
      const d = err.response?.data
      Alert.alert('Error', typeof d === 'object' ? Object.values(d).flat().join('\n') : 'Enrollment failed.')
    } finally { setEnrolling(false) }
  }

  const openEdit = (e) => {
    setEditItem(e)
    setEditStatus(e.status)
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    setSaving(true)
    try {
      await api.patch(`/enrollments/${editItem.id}/`, { status: editStatus })
      setShowEdit(false)
      load()
    } catch {
      Alert.alert('Error', 'Failed to update status.')
    } finally { setSaving(false) }
  }

  const handleDelete = (id) => {
    Alert.alert('Delete Enrollment', 'Delete this enrollment record?', [
      { text:'Cancel', style:'cancel' },
      { text:'Delete', style:'destructive', onPress: async () => {
        await api.delete(`/enrollments/${id}/`)
        load()
      }}
    ])
  }

  const availableSections = sections.filter(s => !s.is_full)

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <Text style={s.title}>Enrollment</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <Text style={s.addBtnText}>+ Enroll</Text>
        </TouchableOpacity>
      </View>

      {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:40 }}/> : (
        <FlatList
          data={enrollments}
          keyExtractor={i => String(i.id)}
          contentContainerStyle={{ padding:16, paddingTop:8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
          ListEmptyComponent={<Text style={s.empty}>No enrollments yet</Text>}
          renderItem={({ item:e }) => {
            const ss = STATUS_STYLE[e.status] || STATUS_STYLE.pending
            return (
              <View style={s.card}>
                <View style={s.cardTop}>
                  <Text style={s.studentName}>{e.student_detail?.full_name}</Text>
                  <View style={[s.badge, { backgroundColor:ss.bg }]}>
                    <Text style={[s.badgeText, { color:ss.text }]}>{e.status}</Text>
                  </View>
                </View>
                <Text style={s.sectionText}>
                  {e.section_detail?.code} · {e.subject_detail?.code}
                </Text>
                <Text style={s.subjectName}>{e.subject_detail?.name}</Text>
                <View style={s.cardBottom}>
                  <Text style={s.units}>{e.subject_detail?.units} units</Text>
                  <Text style={s.date}>{new Date(e.enrolled_at).toLocaleDateString()}</Text>
                </View>
                <View style={s.cardActions}>
                  <TouchableOpacity onPress={() => openEdit(e)} style={s.editBtn}>
                    <Text style={s.editBtnText}>Edit Status</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => handleDelete(e.id)} style={s.delBtn}>
                    <Text style={s.delBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}

      {/* Add Enrollment Modal */}
      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>New Enrollment</Text>
              <TouchableOpacity onPress={() => setShowAdd(false)}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={ms.label}>Student</Text>
              <TouchableOpacity style={ms.picker} onPress={() => setShowStudentPicker(true)}>
                <Text style={selStudent ? ms.pickerValue : ms.pickerPlaceholder}>
                  {selStudent ? `${selStudent.student_id} — ${selStudent.full_name}` : 'Select student…'}
                </Text>
                <Text style={ms.pickerArrow}>›</Text>
              </TouchableOpacity>

              <Text style={ms.label}>Section</Text>
              <TouchableOpacity style={ms.picker} onPress={() => setShowSectionPicker(true)}>
                <Text style={selSection ? ms.pickerValue : ms.pickerPlaceholder}>
                  {selSection ? `${selSection.code} (${selSection.available_slots} slots left)` : 'Select section…'}
                </Text>
                <Text style={ms.pickerArrow}>›</Text>
              </TouchableOpacity>

              {preview && preview.subjects_detail?.length > 0 && (
                <View style={ms.preview}>
                  <View style={ms.previewHeader}>
                    <Text style={ms.previewTitle}>Subjects to enroll:</Text>
                    <Text style={ms.previewUnits}>{preview.total_units} total units</Text>
                  </View>
                  {preview.subjects_detail.map(sub => (
                    <View key={sub.id} style={ms.previewRow}>
                      <Text style={ms.previewCode}>{sub.code}</Text>
                      <Text style={ms.previewName}>{sub.name}</Text>
                      <Text style={ms.previewU}>{sub.units}u</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[ms.saveBtn, (enrolling || !selStudent || !selSection) && ms.saveBtnDisabled]}
                onPress={handleEnroll}
                disabled={enrolling || !selStudent || !selSection}
              >
                <Text style={ms.saveBtnText}>
                  {enrolling ? 'Enrolling...' : `Enroll in ${preview?.subjects_detail?.length || 0} Subject(s)`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Student Picker Modal */}
      <Modal visible={showStudentPicker} animationType="slide" transparent onRequestClose={() => setShowStudentPicker(false)}>
        <View style={ms.overlay}>
          <View style={ms.pickerSheet}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Select Student</Text>
              <TouchableOpacity onPress={() => setShowStudentPicker(false)}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* DEBUG LINE — remove after fixing */}
            <Text style={{ color:'red', fontSize:11, marginBottom:8 }}>
              students: {students.length}
            </Text>

            {students.length === 0 ? (
              <Text style={ms.noSubMsg}>No students found</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {students.map(st => (
                  <TouchableOpacity key={st.id} style={ms.listItem} onPress={() => { setSelStudent(st); setShowStudentPicker(false) }}>
                    <Text style={ms.listItemMain}>{st.full_name}</Text>
                    <Text style={ms.listItemSub}>{st.student_id} · {st.course}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Section Picker Modal */}
      <Modal visible={showSectionPicker} animationType="slide" transparent onRequestClose={() => setShowSectionPicker(false)}>
        <View style={ms.overlay}>
          <View style={ms.pickerSheet}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Select Section</Text>
              <TouchableOpacity onPress={() => setShowSectionPicker(false)}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>

            {/* DEBUG LINE — remove after fixing */}
            <Text style={{ color:'red', fontSize:11, marginBottom:8 }}>
              sections: {sections.length} | available: {availableSections.length}
            </Text>

            {availableSections.length === 0 ? (
              <Text style={ms.noSubMsg}>No open sections available</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {availableSections.map(sec => (
                  <TouchableOpacity key={sec.id} style={ms.listItem} onPress={() => handleSelectSection(sec)}>
                    <Text style={ms.listItemMain}>{sec.code}</Text>
                    <Text style={ms.listItemSub}>{sec.available_slots} slots · {sec.subjects_detail?.map(s => s.code).join(', ')}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Edit Status Modal */}
      <Modal visible={showEdit} animationType="slide" transparent onRequestClose={() => setShowEdit(false)}>
        <View style={ms.overlay}>
          <View style={[ms.sheet, { maxHeight:'50%' }]}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Edit Status</Text>
              <TouchableOpacity onPress={() => setShowEdit(false)}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <Text style={ms.label}>
              {editItem?.student_detail?.full_name} · {editItem?.subject_detail?.code}
            </Text>
            <View style={{ gap:8, marginTop:10 }}>
              {STATUSES.map(st => {
                const ss = STATUS_STYLE[st]
                return (
                  <TouchableOpacity key={st} onPress={() => setEditStatus(st)}
                    style={[ms.statusOption, editStatus === st && { backgroundColor: ss.bg, borderColor: ss.text }]}>
                    <Text style={[ms.statusOptionText, editStatus === st && { color: ss.text }]}>
                      {st.charAt(0).toUpperCase() + st.slice(1)}
                    </Text>
                    {editStatus === st && <Text style={[ms.checkmark, { color: ss.text }]}>✓</Text>}
                  </TouchableOpacity>
                )
              })}
            </View>
            <TouchableOpacity style={[ms.saveBtn, { marginTop:16 }, saving && ms.saveBtnDisabled]}
              onPress={handleSaveEdit} disabled={saving}>
              <Text style={ms.saveBtnText}>{saving ? 'Saving...' : 'Save Status'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:'#0D1117' },
  header:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingHorizontal:16, paddingTop:16, paddingBottom:12 },
  title:       { fontSize:20, fontWeight:'bold', color:'#FFF' },
  addBtn:      { backgroundColor:'#F59E0B', paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  addBtnText:  { color:'#000', fontWeight:'700', fontSize:13 },
  empty:       { color:'#4B5563', textAlign:'center', marginTop:40, fontSize:13 },
  card:        { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:14, marginBottom:10 },
  cardTop:     { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:4 },
  studentName: { color:'#FFF', fontWeight:'600', fontSize:14, flex:1 },
  badge:       { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  badgeText:   { fontSize:10, fontWeight:'700', textTransform:'capitalize' },
  sectionText: { color:'#F59E0B', fontSize:12, fontWeight:'600', marginBottom:2 },
  subjectName: { color:'#9CA3AF', fontSize:12, marginBottom:8 },
  cardBottom:  { flexDirection:'row', justifyContent:'space-between', marginBottom:10 },
  units:       { color:'#6B7280', fontSize:11 },
  date:        { color:'#6B7280', fontSize:11 },
  cardActions: { flexDirection:'row', gap:8, paddingTop:10, borderTopWidth:1, borderTopColor:'#1F2937' },
  editBtn:     { backgroundColor:'rgba(99,102,241,0.15)', paddingHorizontal:14, paddingVertical:6, borderRadius:8 },
  editBtnText: { color:'#818CF8', fontSize:12, fontWeight:'600' },
  delBtn:      { backgroundColor:'rgba(244,63,94,0.1)', paddingHorizontal:14, paddingVertical:6, borderRadius:8 },
  delBtnText:  { color:'#FB7185', fontSize:12, fontWeight:'600' },
})

const ms = StyleSheet.create({
  overlay:           { flex:1, backgroundColor:'rgba(0,0,0,0.7)', justifyContent:'flex-end' },
  sheet:             { backgroundColor:'#111827', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'90%' },
  pickerSheet:       { backgroundColor:'#111827', borderTopLeftRadius:24, borderTopRightRadius:24, padding:24, maxHeight:'80%', minHeight:200 },
  sheetHeader:       { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:20 },
  sheetTitle:        { color:'#FFF', fontSize:18, fontWeight:'bold' },
  closeBtn:          { color:'#6B7280', fontSize:20 },
  label:             { color:'#9CA3AF', fontSize:12, marginBottom:6 },
  picker:            { backgroundColor:'#1F2937', borderWidth:1, borderColor:'#374151', borderRadius:10, paddingHorizontal:14, paddingVertical:13, marginBottom:14, flexDirection:'row', justifyContent:'space-between', alignItems:'center' },
  pickerValue:       { color:'#FFF', fontSize:14, flex:1 },
  pickerPlaceholder: { color:'#4B5563', fontSize:14, flex:1 },
  pickerArrow:       { color:'#6B7280', fontSize:18 },
  preview:           { backgroundColor:'#1F2937', borderRadius:12, padding:12, marginBottom:14 },
  previewHeader:     { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  previewTitle:      { color:'#FFF', fontSize:12, fontWeight:'600' },
  previewUnits:      { color:'#14B8A6', fontSize:12, fontWeight:'700' },
  previewRow:        { flexDirection:'row', alignItems:'center', paddingVertical:5, borderBottomWidth:1, borderBottomColor:'#374151', gap:8 },
  previewCode:       { color:'#F59E0B', fontSize:11, fontWeight:'700', width:50 },
  previewName:       { color:'#D1D5DB', fontSize:11, flex:1 },
  previewU:          { color:'#14B8A6', fontSize:11, fontWeight:'700' },
  listItem:          { padding:14, borderBottomWidth:1, borderBottomColor:'#1F2937' },
  listItemMain:      { color:'#FFF', fontSize:14, fontWeight:'500', marginBottom:2 },
  listItemSub:       { color:'#6B7280', fontSize:11 },
  noSubMsg:          { color:'#4B5563', padding:16, textAlign:'center', fontSize:13 },
  statusOption:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:14, borderRadius:10, borderWidth:1, borderColor:'#374151', backgroundColor:'#1F2937' },
  statusOptionText:  { color:'#9CA3AF', fontSize:14, fontWeight:'500', textTransform:'capitalize' },
  checkmark:         { fontSize:16, fontWeight:'bold' },
  saveBtn:           { backgroundColor:'#F59E0B', borderRadius:12, paddingVertical:14, alignItems:'center', marginBottom:16 },
  saveBtnDisabled:   { opacity:0.5 },
  saveBtnText:       { color:'#000', fontWeight:'700', fontSize:15 },
})
