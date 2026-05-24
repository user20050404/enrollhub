import { useEffect, useState } from 'react'
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, RefreshControl } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import api from '../../src/api/axios'

export default function Dashboard() {
  const [summary,    setSummary]    = useState(null)
  const [sections,   setSections]   = useState([])
  const [loading,    setLoading]    = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const [s, sec] = await Promise.all([
        api.get('/enrollments/summary/'),
        api.get('/sections/'),
      ])
      setSummary(s.data)
      setSections((sec.data.results || sec.data).slice(0, 6))
    } finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() }, [])

  const stats = summary ? [
    { label:'Students',  value:summary.total_students, color:'#F59E0B' },
    { label:'Enrolled',  value:summary.total_enrolled, color:'#14B8A6' },
    { label:'Pending',   value:summary.total_pending,  color:'#F43F5E' },
    { label:'Sections',  value:sections.length,        color:'#6366F1' },
  ] : []

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView
        style={s.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load() }} tintColor="#F59E0B"/>}
      >
        <View style={s.header}>
          <View style={s.logoBox}><Text style={s.logoLetter}>E</Text></View>
          <View>
            <Text style={s.headerTitle}>EnrollHub</Text>
            <Text style={s.headerSub}>AY 2025–2026</Text>
          </View>
        </View>

        {loading ? <ActivityIndicator color="#F59E0B" style={{ marginTop:60 }}/> : (
          <>
            <View style={s.statsGrid}>
              {stats.map(st => (
                <View key={st.label} style={s.statCard}>
                  <Text style={[s.statValue, { color:st.color }]}>{st.value}</Text>
                  <Text style={s.statLabel}>{st.label}</Text>
                </View>
              ))}
            </View>

            <Text style={s.sectionTitle}>Section Capacity</Text>
            {sections.length === 0 && <Text style={s.empty}>No sections yet</Text>}
            {sections.map(sec => {
              const pct      = sec.max_capacity > 0 ? Math.min((sec.enrolled_count / sec.max_capacity) * 100, 100) : 0
              const barColor = pct >= 100 ? '#F43F5E' : pct >= 80 ? '#F59E0B' : '#14B8A6'
              return (
                <View key={sec.id} style={s.capCard}>
                  <View style={s.capRow}>
                    <Text style={s.capCode}>{sec.code}</Text>
                    <Text style={s.capNums}>{sec.enrolled_count}/{sec.max_capacity}</Text>
                  </View>
                  <View style={s.barBg}>
                    <View style={[s.barFill, { width:`${pct}%`, backgroundColor:barColor }]}/>
                  </View>
                </View>
              )
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  )
}

const s = StyleSheet.create({
  safe:        { flex:1, backgroundColor:'#0D1117' },
  scroll:      { flex:1, padding:16 },
  header:      { flexDirection:'row', alignItems:'center', gap:12, marginBottom:24 },
  logoBox:     { width:40, height:40, borderRadius:10, backgroundColor:'#F59E0B', alignItems:'center', justifyContent:'center' },
  logoLetter:  { fontSize:18, fontWeight:'bold', color:'#000' },
  headerTitle: { fontSize:18, fontWeight:'bold', color:'#FFF' },
  headerSub:   { fontSize:11, color:'#6B7280' },
  statsGrid:   { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:24 },
  statCard:    { flex:1, minWidth:'45%', backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:14, padding:16 },
  statValue:   { fontSize:28, fontWeight:'bold', marginBottom:4 },
  statLabel:   { fontSize:11, color:'#6B7280', textTransform:'uppercase', letterSpacing:0.5 },
  sectionTitle:{ fontSize:14, fontWeight:'600', color:'#FFF', marginBottom:12 },
  empty:       { color:'#4B5563', textAlign:'center', fontSize:13, marginBottom:12 },
  capCard:     { backgroundColor:'#111827', borderWidth:1, borderColor:'#1F2937', borderRadius:12, padding:14, marginBottom:8 },
  capRow:      { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  capCode:     { color:'#FFF', fontSize:13, fontWeight:'600' },
  capNums:     { color:'#6B7280', fontSize:12 },
  barBg:       { height:5, backgroundColor:'#1F2937', borderRadius:3, overflow:'hidden' },
  barFill:     { height:'100%', borderRadius:3 },
})