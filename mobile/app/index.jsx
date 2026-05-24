import { Redirect } from 'expo-router'
import { useAuth } from '../src/context/AuthContext'
import { View, ActivityIndicator } from 'react-native'

export default function Index() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex:1, backgroundColor:'#0D1117', alignItems:'center', justifyContent:'center' }}>
        <ActivityIndicator color="#F59E0B" size="large" />
      </View>
    )
  }

  return <Redirect href={user ? '/(tabs)/dashboard' : '/(auth)/login'} />
}