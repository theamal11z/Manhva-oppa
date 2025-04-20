import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Mail, CheckCircle } from 'lucide-react';
import { resetPassword } from '../lib/supabaseClient';

const ResetPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const { error } = await resetPassword(email);
      if (error) throw error;
      
      setSuccess(true);
    } catch (err: any) {
      console.error('Password reset error:', err);
      setError(err.message || 'Failed to send password reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-16 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/40 manga-panel relative overflow-hidden">
        <div className="absolute inset-0 screen-tone pointer-events-none" />
        
        <div className="relative z-10">
          {success ? (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <h2 className="manga-title text-3xl mb-1 transform -rotate-1">Email Sent!</h2>
              <p className="text-gray-300 mb-4">
                We've sent password reset instructions to <strong>{email}</strong>. Please check your inbox to reset your password.
              </p>
              <Link 
                to="/login" 
                className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105 flex items-center justify-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="manga-title text-3xl mb-1 transform -rotate-1">Reset Password</h2>
                <p className="text-gray-400">Enter your email to receive password reset instructions</p>
              </div>
              
              {error && (
                <div className="mt-4 bg-red-900/30 text-red-200 p-3 rounded-md flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full manga-panel py-3 pl-10 pr-3 bg-black/30 focus:ring-red-500 focus:border-red-500"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>
                
                <div>
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full manga-gradient manga-border px-4 py-3 flex justify-center items-center space-x-2 font-medium transform hover:scale-105 transition-transform ${
                      loading ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {loading ? (
                      <div className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                    ) : (
                      <span>Send Reset Instructions</span>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <Link
                  to="/login"
                  className="text-red-400 hover:text-red-300 font-medium hover:underline flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
