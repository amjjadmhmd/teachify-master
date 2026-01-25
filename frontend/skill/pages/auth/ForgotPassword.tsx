import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Mail, ArrowLeft, AlertCircle } from 'lucide-react';
import { Button, Card, Input } from '../../components/UI';
import apiClient from '../../api/config';

interface ForgotPasswordProps {
  onBack: () => void;
  onNext: (email: string) => void;
}

const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onBack, onNext }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Please enter your email');
      return;
    }

    setLoading(true);
    try {
      await apiClient.post('/api/accounts/forgot-password/', { email });
      toast.success('Reset code sent to your email!');
      onNext(email);
    } catch (err: any) {
      const errorMsg = err.response?.data?.error || err.message || 'Error sending code';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

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
          Back to Login
        </button>

        <div className="text-center mb-8">
          <div className="bg-blue-100 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-blue-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Forgot Password?</h1>
          <p className="text-gray-600">
            Enter your email to receive a password reset code
          </p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            type="email"
            label="Email Address"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            required
            disabled={loading}
          />

          <Button
            type="submit"
            loading={loading}
            disabled={loading}
            className="w-full"
          >
            Send Reset Code
          </Button>
        </form>
      </Card>
    </motion.div>
  );
};

export default ForgotPassword;
