// Lever: friction-on-destruction reversed — make sign-in as cheap as possible.
// Copy framework: BAB (Before-After-Bridge) — type your email, type the code.
// Two-step OTP: no deep links, no email-client previews burning the token, no
// localhost confusion. Same Supabase signInWithOtp endpoint, verified in-app.
import { Button } from '@/src/components/Button';
import { HeaderBar } from '@/src/components/HeaderBar';
import { Input } from '@/src/components/Input';
import { Screen } from '@/src/components/Screen';
import { Text } from '@/src/components/Text';
import { useToast } from '@/src/components/Toast';
import { requestEmailOtp, verifyEmailOtp } from '@/src/features/auth/useAuth';
import {
  emailSchema,
  otpSchema,
  type EmailFormValues,
  type OtpFormValues,
} from '@/src/schemas/auth';
import { spacing } from '@/src/theme/spacing';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import Animated, { FadeIn, FadeInRight } from 'react-native-reanimated';

const RESEND_SECONDS = 30;

export default function AuthScreen() {
  const router = useRouter();
  const { show } = useToast();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [pendingEmail, setPendingEmail] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const emailForm = useForm<EmailFormValues>({
    resolver: zodResolver(emailSchema),
    defaultValues: { email: '' },
  });

  const otpForm = useForm<OtpFormValues>({
    resolver: zodResolver(otpSchema),
    defaultValues: { token: '' },
  });

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startResendCooldown = () => {
    setResendIn(RESEND_SECONDS);
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setResendIn((n) => {
        if (n <= 1 && intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        return Math.max(0, n - 1);
      });
    }, 1000);
  };

  const submitEmail = async (values: EmailFormValues) => {
    try {
      await requestEmailOtp(values.email);
      setPendingEmail(values.email);
      setStep('code');
      otpForm.reset({ token: '' });
      startResendCooldown();
      show({
        title: 'Code sent',
        body: 'Open your inbox and type the code we just emailed.',
        tone: 'success',
      });
    } catch (error) {
      show({
        title: "We couldn't send that code",
        body: error instanceof Error ? error.message : 'Try again in a moment.',
        tone: 'danger',
      });
    }
  };

  const submitCode = async (values: OtpFormValues) => {
    try {
      await verifyEmailOtp(pendingEmail, values.token);
      show({ title: 'Signed in', body: 'Welcome back.', tone: 'success' });
      router.replace('/');
    } catch (error) {
      show({
        title: "That code didn't work",
        body: error instanceof Error ? error.message : 'Double-check the digits or request a new code.',
        tone: 'danger',
      });
      otpForm.setError('token', { message: 'Code did not match — try again.' });
    }
  };

  const resendCode = async () => {
    if (resendIn > 0 || !pendingEmail) return;
    try {
      await requestEmailOtp(pendingEmail);
      startResendCooldown();
      show({ title: 'New code sent', body: 'Use the most recent code from your inbox.', tone: 'info' });
    } catch (error) {
      show({
        title: 'Resend failed',
        body: error instanceof Error ? error.message : 'Try again shortly.',
        tone: 'danger',
      });
    }
  };

  const useDifferentEmail = () => {
    setStep('email');
    setPendingEmail('');
    otpForm.reset({ token: '' });
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <HeaderBar title="Sign in" subtitle="One code. No password to forget." showBack />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <View style={{ gap: spacing.lg, marginTop: spacing.lg }}>
          {step === 'email' ? (
            <Animated.View entering={FadeIn.duration(220)} style={{ gap: spacing.lg }}>
              <Controller
                control={emailForm.control}
                name="email"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Work email"
                    placeholder="ranger@wwf.org.pk"
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoComplete="email"
                    textContentType="emailAddress"
                    value={value}
                    onChangeText={onChange}
                    onBlur={onBlur}
                    onSubmitEditing={emailForm.handleSubmit(submitEmail)}
                    returnKeyType="send"
                    error={emailForm.formState.errors.email?.message}
                  />
                )}
              />
              <Button
                label="Email me a code"
                onPress={emailForm.handleSubmit(submitEmail)}
                size="lg"
                fullWidth
                loading={emailForm.formState.isSubmitting}
              />
              <Text variant="caption" tone="tertiary">
                Your role is set by your WWF admin. Codes expire 10 minutes after they're sent.
              </Text>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeInRight.duration(240)} style={{ gap: spacing.lg }}>
              <View style={{ gap: spacing.xs }}>
                <Text variant="bodyMD" tone="secondary">
                  We sent your sign-in code to
                </Text>
                <Text variant="titleSM">{pendingEmail}</Text>
              </View>
              <Controller
                control={otpForm.control}
                name="token"
                render={({ field: { value, onChange, onBlur } }) => (
                  <Input
                    label="Verification code"
                    placeholder="123456"
                    keyboardType="number-pad"
                    autoComplete="one-time-code"
                    textContentType="oneTimeCode"
                    maxLength={8}
                    autoFocus
                    value={value}
                    onChangeText={(next) => {
                      const digits = next.replace(/\D/gu, '').slice(0, 8);
                      onChange(digits);
                      // Auto-submit at 6 or 8 — the two common Supabase OTP lengths.
                      if (digits.length === 6 || digits.length === 8) {
                        void otpForm.handleSubmit(submitCode)();
                      }
                    }}
                    onBlur={onBlur}
                    onSubmitEditing={otpForm.handleSubmit(submitCode)}
                    returnKeyType="done"
                    error={otpForm.formState.errors.token?.message}
                  />
                )}
              />
              <Button
                label="Verify and sign in"
                onPress={otpForm.handleSubmit(submitCode)}
                size="lg"
                fullWidth
                loading={otpForm.formState.isSubmitting}
              />
              <View style={{ gap: spacing.sm }}>
                <Button
                  label={resendIn > 0 ? `Resend code in ${resendIn}s` : 'Send a new code'}
                  variant="ghost"
                  onPress={resendCode}
                  disabled={resendIn > 0}
                  fullWidth
                />
                <Button label="Use a different email" variant="ghost" size="sm" onPress={useDifferentEmail} fullWidth />
              </View>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}
