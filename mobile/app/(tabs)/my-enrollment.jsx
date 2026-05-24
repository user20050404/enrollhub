import { useEffect, useState } from 'react'
import {
  View, Text, ScrollView, StyleSheet, ActivityIndicator,
  RefreshControl, TouchableOpacity, Modal, Alert
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

const STATUS_STYLE = {
  enrolled: { bg:'rgba(34,197,94,0.1)',   text:'#4ADE80' },
  pending:  { bg:'rgba(245,158,11,0.1)',  text:'#FBB24F' },
  dropped:  { bg:'rgba(100,100,100,0.1)', text:'#9CA3AF' },
  blocked:  { bg:'rgba(244,63,94,0.1)',   text:'#FB7185' },
}

export default function MyEnrollment() {
  const [data,       setData]       = useState(null)
  const [sections,   setSections]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [showModal,  setShowModal]  = useState(false)
  const [selSection, setSelSection] = useState(null)
  const [preview,    setPreview]    = useState(null)
  const [enrolling,  setEnrolling]  = useState(false)
  const [showPicker, setShowPicker] = useState(false)

  const load = async () => {
    try {
      const [meRes, secRes] = await Promise.allSettled([
        api.get('/enrollments/me/'),
        api.get('/sections/'),
      ])
      if (meRes.status === 'fulfilled')  setData(meRes.value.data)
      if (secRes.status === 'fulfilled') setSections(secRes.value.data.results || secRes.value.data)
    } finally { setLoading(false); setRefreshing(false) }
  }
  useEffect(() => { load() }, [])

  const handleSelectSection = (sec) => {
    setSelSection(sec)
    setPreview(sec)
    setShowPicker(false)
  }

  const handleEnroll = async () => {
    if (!selSection) { Alert.alert('Error', 'Please select a section.'); return }
    setEnrolling(true)
    try {
      const res = await api.post('/enrollments/self-enroll/', { section: selSection.id })
      setShowModal(false)
      setSelSection(null)
      setPreview(null)
      load()
      Alert.alert('Success!', res.data.message)
    } catch (err) {
      const d = err.response?.data
      Alert.alert('Error', typeof d === 'object' ? Object.values(d).flat().join('\n') : 'Enrollment failed.')
    } finally { setEnrolling(false) }
  }

  const grouped = {}
  data?.enrollments?.forEach(e => {
    const code = e.section_detail?.code || 'Unknown'
    if (!grouped[code]) grouped[code] = { section: e.section_detail, subjects:[] }
    grouped[code].subjects.push(e)
  })

  const student    = data?.student
  const totalUnits = student?.total_enrolled_units || 0

  const enrolledSectionIds = [...new Set(data?.enrollments?.map(e => e.section) || [])]
  const availableSections  = sections.filter(s => !s.is_full && !enrolledSectionIds.includes(s.id))

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
        contentContainerStyle={{ paddingBottom: 32 }}
      >
        <View style={s.header}>
          <View>
            <Text style={s.title}>My Enrollment</Text>
            <Text style={s.subtitle}>Current semester subjects</Text>
          </View>
          <TouchableOpacity style={s.addBtn} onPress={() => { setShowModal(true); setSelSection(null); setPreview(null) }}>
            <Text style={s.addBtnText}>+ Enroll</Text>
          </TouchableOpacity>
        </View>

        {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:60 }}/> : (
          <View style={{ paddingHorizontal:16 }}>
            {student && (
              <>
                <View style={s.statsGrid}>
                  <View style={s.statCard}>
                    <Text style={s.statValue}>{student.student_id}</Text>
                    <Text style={s.statLabel}>Student ID</Text>
                  </View>
                  <View style={s.statCard}>
                    <Text style={[s.statValue, { color:'#14B8A6' }]}>{totalUnits}/{student.max_units}</Text>
                    <Text style={s.statLabel}>Units</Text>
                  </View>
                  <View style={s.statCard}>
                    <Text style={s.statValue}>{student.course}</Text>
                    <Text style={s.statLabel}>Course</Text>
                  </View>
                  <View style={s.statCard}>
                    <Text style={s.statValue}>Year {student.year_level}</Text>
                    <Text style={s.statLabel}>Year Level</Text>
                  </View>
                </View>

                <View style={s.progressCard}>
                  <View style={s.progressHeader}>
                    <Text style={s.progressLabel}>Unit Load</Text>
                    <Text style={s.progressCount}>{totalUnits} / {student.max_units}</Text>
                  </View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width:`${Math.min((totalUnits/student.max_units)*100,100)}%` }]}/>
                  </View>
                </View>
              </>
            )}

            {Object.keys(grouped).length === 0 ? (
              <View style={s.emptyCard}>
                <Text style={s.emptyText}>No enrollments yet</Text>
                <Text style={s.emptySubText}>Tap "+ Enroll" to enroll in a section</Text>
              </View>
            ) : (
              Object.entries(grouped).map(([code, group]) => (
                <View key={code} style={s.sectionCard}>
                  <View style={s.sectionHeader}>
                    <Text style={s.sectionCode}>{code}</Text>
                    <Text style={s.sectionUnits}>
                      {group.subjects.reduce((sum,e) => sum+(e.subject_detail?.units||0),0)} units
                    </Text>
                  </View>
                  {group.subjects.map(e => {
                    const ss = STATUS_STYLE[e.status] || STATUS_STYLE.pending
                    return (
                      <View key={e.id} style={s.subjectRow}>
                        <View style={{ flex:1 }}>
                          <Text style={s.subjectCode}>{e.subject_detail?.code}</Text>
                          <Text style={s.subjectName}>{e.subject_detail?.name}</Text>
                          {e.subject_detail?.schedule ? <Text style={s.subjectMeta}>🕐 {e.subject_detail.schedule}</Text> : null}
                          {e.subject_detail?.room     ? <Text style={s.subjectMeta}>📍 {e.subject_detail.room}</Text>     : null}
                        </View>
                        <View style={{ alignItems:'flex-end', gap:4 }}>
                          <Text style={s.subjectUnits}>{e.subject_detail?.units}u</Text>
                          <View style={[s.badge, { backgroundColor:ss.bg }]}>
                            <Text style={[s.badgeText, { color:ss.text }]}>{e.status}</Text>
                          </View>
                        </View>
                      </View>
                    )
                  })}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>

      {/* Enroll Modal */}
      <Modal visible={showModal} animationType="slide" transparent onRequestClose={() => setShowModal(false)}>
        <View style={ms.overlay}>
          <View style={ms.sheet}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Enroll in Section</Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={ms.label}>Select Section</Text>
              <TouchableOpacity style={ms.picker} onPress={() => setShowPicker(true)}>
                <Text style={selSection ? ms.pickerValue : ms.pickerPlaceholder}>
                  {selSection ? `${selSection.code} (${selSection.available_slots} slots left)` : 'Choose a section…'}
                </Text>
                <Text style={ms.pickerArrow}>›</Text>
              </TouchableOpacity>

              {preview && preview.subjects_detail?.length > 0 && (
                <View style={ms.preview}>
                  <View style={ms.previewHeader}>
                    <Text style={ms.previewTitle}>You will be enrolled in:</Text>
                    <Text style={ms.previewUnits}>{preview.total_units} total units</Text>
                  </View>
                  {preview.subjects_detail.map(sub => (
                    <View key={sub.id} style={ms.previewRow}>
                      <View style={{ flex:1 }}>
                        <Text style={ms.previewCode}>{sub.code} — {sub.name}</Text>
                        {sub.schedule ? <Text style={ms.previewMeta}>🕐 {sub.schedule}{sub.room ? ` · 📍 ${sub.room}` : ''}</Text> : null}
                      </View>
                      <Text style={ms.previewU}>{sub.units}u</Text>
                    </View>
                  ))}
                </View>
              )}

              <TouchableOpacity
                style={[ms.saveBtn, (enrolling || !selSection || !preview?.subjects_detail?.length) && ms.saveBtnDisabled]}
                onPress={handleEnroll}
                disabled={enrolling || !selSection || !preview?.subjects_detail?.length}
              >
                <Text style={ms.saveBtnText}>
                  {enrolling ? 'Enrolling...' : `Enroll in ${preview?.subjects_detail?.length || 0} Subject(s)`}
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ✅ Section Picker — ScrollView+map instead of FlatList to fix iOS modal rendering bug */}
      <Modal visible={showPicker} animationType="slide" transparent onRequestClose={() => setShowPicker(false)}>
        <View style={ms.overlay}>
          <View style={ms.pickerSheet}>
            <View style={ms.sheetHeader}>
              <Text style={ms.sheetTitle}>Choose Section</Text>
              <TouchableOpacity onPress={() => setShowPicker(false)}>
                <Text style={ms.closeBtn}>✕</Text>
              </TouchableOpacity>
            </View>
            {availableSections.length === 0 ? (
              <Text style={ms.noSectMsg}>No available sections right now</Text>
            ) : (
              <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                {availableSections.map(sec => (
                  <TouchableOpacity key={sec.id} style={ms.listItem} onPress={() => handleSelectSection(sec)}>
                    <Text style={ms.listItemMain}>{sec.code}</Text>
                    <Text style={ms.listItemSub}>
                      {sec.available_slots} slots · {sec.subjects_detail?.map(s => s.code).join(', ')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:          { flex:1, backgroundColor:'#0D1117' },
  header:        { flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingBottom:8 },
  title:         { fontSize:20, fontWeight:'bold', color:'#FFF' },
  subtitle:      { fontSize:11, color:'#6B7280', marginTop:2 },
  addBtn:        { backgroundColor:'#F59E0B', paddingHorizontal:14, paddingVertical:7, borderRadius:8 },
  addBtnText:    { color:'#000', fontWeight:'700', fontSize:13 },
  statsGrid:     { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:12 },
  statCard:      { flex:1, minWidth:'45%', backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:12, padding:12 },
  statValue:     { color:'#F59E0B', fontWeight:'bold', fontSize:15, marginBottom:2 },
  statLabel:     { color:'#6B7280', fontSize:10, textTransform:'uppercase' },
  progressCard:  { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:12, padding:14, marginBottom:16 },
  progressHeader:{ flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  progressLabel: { color:'#FFF', fontSize:13, fontWeight:'500' },
  progressCount: { color:'#6B7280', fontSize:12 },
  barBg:         { height:6, backgroundColor:'#1F2937', borderRadius:3, overflow:'hidden' },
  barFill:       { height:'100%', borderRadius:3, backgroundColor:'#F59E0B' },
  emptyCard:     { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:30, alignItems:'center' },
  emptyText:     { color:'#6B7280', fontSize:14, fontWeight:'500', marginBottom:4 },
  emptySubText:  { color:'#4B5563', fontSize:12 },
  sectionCard:   { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, marginBottom:12, overflow:'hidden' },
  sectionHeader: { flexDirection:'row', justifyContent:'space-between', alignItems:'center', backgroundColor:'#1F2937', padding:12 },
  sectionCode:   { color:'#F59E0B', fontWeight:'700', fontSize:14 },
  sectionUnits:  { color:'#14B8A6', fontSize:12, fontWeight:'600' },
  subjectRow:    { flexDirection:'row', padding:12, borderBottomWidth:1, borderBottomColor:'#1F2937' },
  subjectCode:   { color:'#FFF', fontWeight:'700', fontSize:13, marginBottom:2 },
  subjectName:   { color:'#9CA3AF', fontSize:12, marginBottom:3 },
  subjectMeta:   { color:'#6B7280', fontSize:11, marginBottom:1 },
  subjectUnits:  { color:'#14B8A6', fontSize:12, fontWeight:'700' },
  badge:         { paddingHorizontal:8, paddingVertical:3, borderRadius:20 },
  badgeText:     { fontSize:10, fontWeight:'700', textTransform:'capitalize' },
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
  previewRow:        { flexDirection:'row', alignItems:'flex-start', paddingVertical:6, borderBottomWidth:1, borderBottomColor:'#374151', gap:8 },
  previewCode:       { color:'#F59E0B', fontSize:11, fontWeight:'600' },
  previewMeta:       { color:'#6B7280', fontSize:10, marginTop:2 },
  previewU:          { color:'#14B8A6', fontSize:11, fontWeight:'700', marginTop:2 },
  listItem:          { padding:14, borderBottomWidth:1, borderBottomColor:'#1F2937' },
  listItemMain:      { color:'#FFF', fontSize:14, fontWeight:'500', marginBottom:2 },
  listItemSub:       { color:'#6B7280', fontSize:11 },
  noSectMsg:         { color:'#4B5563', padding:16, textAlign:'center', fontSize:13 },
  saveBtn:           { backgroundColor:'#F59E0B', borderRadius:12, paddingVertical:14, alignItems:'center', marginBottom:16 },
  saveBtnDisabled:   { opacity:0.5 },
  saveBtnText:       { color:'#000', fontWeight:'700', fontSize:15 },
})
