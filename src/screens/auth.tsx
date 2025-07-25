import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../lib/instant';

interface AuthScreenProps {
  onAuthSuccess: () => void;
}

export default function AuthScreen({ onAuthSuccess }: AuthScreenProps) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendCode = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    setIsLoading(true);
    try {
      await db.auth.sendMagicCode({ email: email.trim() });
      setStep('code');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code.trim()) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setIsLoading(true);
    try {
      await db.auth.signInWithMagicCode({ email: email.trim(), code: code.trim() });
      onAuthSuccess();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Invalid verification code');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToEmail = () => {
    setStep('email');
    setCode('');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { paddingTop: insets.top }]}
    >
      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {step === 'email' ? 'Welcome' : 'Verify Code'}
          </Text>
          <Text style={styles.subtitle}>
            {step === 'email' 
              ? 'Enter your email to get started' 
              : `We sent a code to ${email}`
            }
          </Text>
        </View>

        {step === 'email' ? (
          /* Email Step */
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Email Address
              </Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.input}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={isLoading}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Sending...' : 'Continue'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          /* Code Step */
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>
                Verification Code
              </Text>
              <TextInput
                value={code}
                onChangeText={setCode}
                placeholder="Enter 6-digit code"
                keyboardType="number-pad"
                maxLength={6}
                style={[styles.input, styles.codeInput]}
                placeholderTextColor="#9CA3AF"
              />
            </View>

            <TouchableOpacity
              onPress={handleVerifyCode}
              disabled={isLoading}
              style={[styles.button, isLoading && styles.buttonDisabled]}
            >
              <Text style={styles.buttonText}>
                {isLoading ? 'Verifying...' : 'Verify'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleBackToEmail}
              disabled={isLoading}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                Back to email
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleSendCode}
              disabled={isLoading}
              style={styles.linkButton}
            >
              <Text style={styles.linkText}>
                Resend code
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By continuing, you agree to our Terms of Service
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#111827',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  input: {
    width: '100%',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    fontSize: 16,
    color: '#111827',
  },
  codeInput: {
    textAlign: 'center',
    fontSize: 24,
    letterSpacing: 4,
  },
  button: {
    width: '100%',
    paddingVertical: 16,
    backgroundColor: '#000000',
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: '#D1D5DB',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  linkButton: {
    width: '100%',
    paddingVertical: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#6B7280',
    fontSize: 16,
  },
  footer: {
    marginTop: 48,
  },
  footerText: {
    fontSize: 14,
    color: '#9CA3AF',
    textAlign: 'center',
  },
});