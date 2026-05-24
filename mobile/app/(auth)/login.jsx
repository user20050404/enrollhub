import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../src/context/AuthContext'

export default function Login() {
  const { login } = useAuth()
  const router = useRouter()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter your email and password.')
      return
    }

    setLoading(true)

    try {
      const user = await login(email.trim().toLowerCase(), password)

      router.replace(
        user.role === 'student'
          ? '/(tabs)/enrollment'
          : '/(tabs)/dashboard'
      )
    } catch (err) {
      Alert.alert(
        'Login Failed',
        err.response?.data?.error || 'Invalid credentials.'
      )
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={s.container}
        contentContainerStyle={s.content}
        keyboardShouldPersistTaps="handled"
      >
        <View style={s.logoRow}>
          <View style={s.logoBox}>
            <Text style={s.logoLetter}>E</Text>
          </View>

          <View>
            <Text style={s.logoText}>EnrollHub</Text>
            <Text style={s.logoSub}>
              Student Enrollment System
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Welcome back</Text>

          <Text style={s.subtitle}>
            Sign in to your account
          </Text>

          <Text style={s.label}>Email address</Text>

          <TextInput
            style={s.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Email"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Password</Text>

          <TextInput
            style={s.input}
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#4B5563"
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={s.btnText}>Sign in</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => router.push('/(auth)/register')}
          >
            <Text style={s.link}>
              Don't have an account?{' '}
              <Text style={s.linkHL}>Register</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1117',
  },

  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },

  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 40,
    justifyContent: 'center',
  },

  logoBox: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
  },

  logoLetter: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },

  logoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
  },

  logoSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  card: {
    backgroundColor: '#111827',
    borderWidth: 1,
    borderColor: '#1F2937',
    borderRadius: 22,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
  },

  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },

  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 24,
  },

  label: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 6,
  },

  input: {
    backgroundColor: '#1F2937',
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: '#FFF',
    fontSize: 15,
    marginBottom: 18,
  },

  btn: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 6,
    marginBottom: 18,
  },

  btnDisabled: {
    opacity: 0.5,
  },

  btnText: {
    color: '#000',
    fontWeight: '700',
    fontSize: 15,
  },

  link: {
    color: '#6B7280',
    fontSize: 14,
    textAlign: 'center',
  },

  linkHL: {
    color: '#F59E0B',
    fontWeight: '600',
  },
})