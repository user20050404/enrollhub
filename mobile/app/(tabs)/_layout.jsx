import { Tabs } from 'expo-router'
import { Text } from 'react-native'
import { useAuth } from '../../src/context/AuthContext'

function TabIcon({ label, color }) {
  return <Text style={{ fontSize:16, color }}>{label}</Text>
}

export default function TabsLayout() {
  const { user } = useAuth()
  const isStudent = user?.role === 'student'

  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: { backgroundColor:'#111827', borderTopColor:'#1F2937', height:60, paddingBottom:8 },
      tabBarActiveTintColor:   '#F59E0B',
      tabBarInactiveTintColor: '#6B7280',
      tabBarLabelStyle: { fontSize:10 },
    }}>
      <Tabs.Screen name="dashboard"
        options={{
          title:'Dashboard',
          href: isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="◈" color={color}/>
        }}
      />
      <Tabs.Screen name="students"
        options={{
          title:'Students',
          href: isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="◉" color={color}/>
        }}
      />
      <Tabs.Screen name="subjects"
        options={{
          title:'Subjects',
          href: isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="◑" color={color}/>
        }}
      />
      <Tabs.Screen name="sections"
        options={{
          title:'Sections',
          href: isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="⊞" color={color}/>
        }}
      />
      <Tabs.Screen name="enrollment"
        options={{
          title:'Enrollment',
          href: isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="✦" color={color}/>
        }}
      />
      <Tabs.Screen name="my-enrollment"
        options={{
          title:'My Subjects',
          href: !isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="✦" color={color}/>
        }}
      />
      <Tabs.Screen name="users"
        options={{
          title:'Users',
          href: isStudent ? null : undefined,
          tabBarIcon:({ color }) => <TabIcon label="◍" color={color}/>
        }}
      />
      <Tabs.Screen name="profile"
        options={{
          title:'Profile',
          tabBarIcon:({ color }) => <TabIcon label="◎" color={color}/>
        }}
      />
    </Tabs>
  )
}