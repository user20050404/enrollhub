import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native'

import { useRouter } from 'expo-router'
import api from '../../src/api/axios'

export default function Register() {
  const router = useRouter()

  const [form, setForm] = useState({
    email: '',
    first_name: '',
    last_name: '',
    password: '',
    password2: '',
    role: 'student',
  })

  const [loading, setLoading] = useState(false)

  const set = (key, val) =>
    setForm(f => ({ ...f, [key]: val }))

  const handleRegister = async () => {
    if (
      !form.email ||
      !form.first_name ||
      !form.password
    ) {
      Alert.alert(
        'Error',
        'Please fill in all required fields.'
      )
      return
    }

    if (form.password !== form.password2) {
      Alert.alert('Error', 'Passwords do not match.')
      return
    }

    setLoading(true)

    try {
      await api.post('/auth/register/', form)

      Alert.alert(
        'Success',
        'Account created! Check your email for the verification link.',
        [
          {
            text: 'OK',
            onPress: () =>
              router.replace('/(auth)/login'),
          },
        ]
      )
    } catch (err) {
      const d = err.response?.data

      Alert.alert(
        'Error',
        typeof d === 'object'
          ? Object.values(d).flat().join('\n')
          : 'Registration failed.'
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
              Create your account
            </Text>
          </View>
        </View>

        <View style={s.card}>
          <Text style={s.title}>Create account</Text>

          <View style={s.row}>
            <View style={{ flex: 1 }}>
              <Text style={s.label}>First name</Text>

              <TextInput
                style={s.input}
                value={form.first_name}
                onChangeText={v =>
                  set('first_name', v)
                }
                placeholder="First Name"
                placeholderTextColor="#4B5563"
              />
            </View>

            <View style={{ width: 12 }} />

            <View style={{ flex: 1 }}>
              <Text style={s.label}>Last name</Text>

              <TextInput
                style={s.input}
                value={form.last_name}
                onChangeText={v =>
                  set('last_name', v)
                }
                placeholder="Last Name"
                placeholderTextColor="#4B5563"
              />
            </View>
          </View>

          <Text style={s.label}>Email</Text>

          <TextInput
            style={s.input}
            value={form.email}
            onChangeText={v => set('email', v)}
            placeholder="Email"
            placeholderTextColor="#4B5563"
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={s.label}>Role</Text>

          <View style={s.roleRow}>
            {['student', 'staff', 'admin'].map(r => (
              <TouchableOpacity
                key={r}
                onPress={() => set('role', r)}
                style={[
                  s.roleBtn,
                  form.role === r &&
                    s.roleBtnActive,
                ]}
              >
                <Text
                  style={[
                    s.roleBtnText,
                    form.role === r &&
                      s.roleBtnTextActive,
                  ]}
                >
                  {r}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={s.label}>Password</Text>

          <TextInput
            style={s.input}
            value={form.password}
            onChangeText={v => set('password', v)}
            placeholder="Password"
            placeholderTextColor="#4B5563"
            secureTextEntry
          />

          <Text style={s.label}>Confirm password</Text>

          <TextInput
            style={s.input}
            value={form.password2}
            onChangeText={v => set('password2', v)}
            placeholder="Password"
            placeholderTextColor="#4B5563"
            secureTextEntry
          />

          <TouchableOpacity
            style={[s.btn, loading && s.btnDisabled]}
            onPress={handleRegister}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={s.btnText}>
                Create account
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              router.replace('/(auth)/login')
            }
          >
            <Text style={s.link}>
              Already have an account?{' '}
              <Text style={s.linkHL}>
                Sign in
              </Text>
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
    marginBottom: 32,
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 20,
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
    marginBottom: 16,
  },

  row: {
    flexDirection: 'row',
  },

  roleRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },

  roleBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#374151',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },

  roleBtnActive: {
    backgroundColor: '#F59E0B',
    borderColor: '#F59E0B',
  },

  roleBtnText: {
    color: '#9CA3AF',
    fontSize: 13,
    textTransform: 'capitalize',
  },

  roleBtnTextActive: {
    color: '#000',
    fontWeight: '700',
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