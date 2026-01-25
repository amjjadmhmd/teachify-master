import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Lock, Clock, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import apiClient from '../../api/config';

interface ResetPasswordProps {
  email: string;
  onBack: () => void;
  onSuccess: () => void;
}

const ResetPassword: React.FC<ResetPasswordProps> = ({ email, onBack, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60 * 60); // 1 hour

  useEffect(() => {
    if (timeLeft <= 0) return;
    const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}m ${secs}s`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!otp || !newPassword || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/accounts/reset-password/', {
        otp,
        new_password: newPassword,
        confirm_password: confirmPassword
      });
      setSuccess(true);
      toast.success('Password reset successfully!');
      setTimeout(onSuccess, 2000);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to reset password';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
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
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Reset!</h2>
          <p className="text-gray-600 mb-6">
            Your password has been reset successfully. Redirecting to login...
          </p>
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
        <button
          onClick={onBack}
          className="flex items-center text-blue-600 hover:text-blue-700 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </button>

        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h1>
          <p className="text-gray-600 text-sm">Reset code sent to {email}</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="text"
            label="Reset Code"
            placeholder="000000"
            value={otp}
            onChange={(e) => {
              const val = e.target.value.replace(/\D/g, '').slice(0, 6);
              setOtp(val);
            }}
            maxLength={6}
            required
            disabled={loading}
          />

          <Input
            type="password"
            label="New Password"
            placeholder="••••••••"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            disabled={loading}
          />

          <Input
            type="password"
            label="Confirm Password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            disabled={loading}
          />

          <div className="flex items-center justify-center text-sm text-gray-600">
            <Clock className="w-4 h-4 mr-2" />
            Code expires in: <span className="font-medium ml-2">{formatTime(timeLeft)}</span>
          </div>

          <Button
            type="submit"
            loading={loading}
            disabled={loading || otp.length !== 6}
            className="w-full"
          >
            Reset Password
          </Button>
        </form>

        <button
          onClick={onBack}
          className="w-full mt-4 text-sm text-blue-600 hover:text-blue-700"
        >
          Back to Login
        </button>
      </Card>
    </motion.div>
  );
};

export default ResetPassword;
