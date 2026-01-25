/**
 * Email Verification Page
 * Handles email verification after signup
 */
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, CheckCircle, AlertCircle, Clock, ArrowLeft } from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import { authService } from '../../api/services';
import { toast } from 'sonner';

interface VerifyEmailProps {
  email?: string;
  onBack: () => void;
  onSuccess: () => void;
}

const VerifyEmailPage: React.FC<VerifyEmailProps> = ({ 
  email: initialEmail,
  onBack, 
  onSuccess 
}) => {
  const [email, setEmail] = useState(initialEmail || '');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ otp?: string; general?: string }>({});
  const [verified, setVerified] = useState(false);
  const [timeLeft, setTimeLeft] = useState(24 * 60 * 60); // 24 hours
  const [canResend, setCanResend] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) {
      setCanResend(true);
      return;
    }
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours}h ${minutes}m ${secs}s`;
  };

  const handleVerifyWithOTP = async () => {
    if (!otp || otp.length !== 6) {
      setErrors({ otp: 'Please enter a valid 6-digit code' });
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      // Send OTP code to backend
      const response = await fetch('http://localhost:8000/api/accounts/verify-email/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ otp: otp })
      });
      
      const text = await response.text();
      
      if (!response.ok) {
        let errorMsg = 'Verification failed';
        try {
          const errorData = JSON.parse(text);
          errorMsg = errorData.error || errorData.otp?.[0] || errorData.detail || 'Invalid OTP code';
        } catch (e) {
          errorMsg = text || 'Server error';
        }
        throw new Error(errorMsg);
      }
      
      // Parse success response
      const data = JSON.parse(text);
      
      setVerified(true);
      toast.success('Email verified successfully!');
      setTimeout(onSuccess, 2000);
    } catch (error: any) {
      const errorMsg = error.message || 'Verification failed';
      setErrors({ otp: errorMsg });
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendEmail = async () => {
    if (!email) {
      setErrors({ general: 'Please enter your email' });
      return;
    }

    setResendLoading(true);
    setErrors({});

    try {
      await authService.resendVerificationEmail(email);
      setTimeLeft(24 * 60 * 60);
      setCanResend(false);
      toast.success('Verification email sent. Check your inbox!');
    } catch (error: any) {
      const errorMsg = error.response?.data?.message || error.message || 'Failed to resend email';
      setErrors({ general: errorMsg });
      toast.error(errorMsg);
    } finally {
      setResendLoading(false);
    }
  };

  if (verified) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50 p-4"
      >
        <Card className="w-full max-w-md p-8 text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-6"
          >
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
          </motion.div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Email Verified!</h2>
          <p className="text-gray-600 mb-6">
            Your email has been verified successfully. Redirecting to login...
          </p>
          <Button onClick={onSuccess} className="w-full">
            Continue to Login
          </Button>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-50 p-4"
    >
      <Card className="w-full max-w-md p-8">
        {/* Header */}
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Verify Your Email</h1>
          <p className="text-gray-600">
            Enter the 6-digit code we sent to your email.
          </p>
        </div>

        {/* Error Messages */}
        {errors.general && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{errors.general}</p>
          </motion.div>
        )}

        {/* OTP Input */}
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Code
            </label>
            <Input
              type="text"
              value={otp}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                setOtp(val);
              }}
              placeholder="000000"
              maxLength={6}
              className="text-center text-2xl tracking-widest font-mono"
              error={errors.otp}
            />
            {errors.otp && (
              <p className="text-sm text-red-600 mt-1">{errors.otp}</p>
            )}
          </div>

          {/* Timer */}
          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            Code expires in: <span className="font-medium ml-2">{formatTime(timeLeft)}</span>
          </div>

          {/* Verify Button */}
          <Button
            onClick={handleVerifyWithOTP}
            loading={loading}
            disabled={otp.length !== 6}
            className="w-full"
          >
            Verify
          </Button>

          {/* Resend */}
          <div className="pt-4 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-600 mb-3">
              Didn't receive a code?
            </p>
            {canResend ? (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-gray-700">
                  Enter your email to resend:
                </label>
                <div className="flex gap-2">
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="flex-1"
                  />
                  <Button
                    onClick={handleResendEmail}
                    loading={resendLoading}
                    variant="outline"
                    className="whitespace-nowrap"
                  >
                    Resend
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-500">
                You can resend in {Math.ceil(timeLeft / 60)} minute(s)
              </p>
            )}
          </div>
        </div>

        {/* Help Text */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Check your spam folder if you don't see the email. 
            It may take a few minutes to arrive.
          </p>
        </div>
      </Card>
    </motion.div>
  );
};

export default VerifyEmailPage;
