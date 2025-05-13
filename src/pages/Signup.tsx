import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, ArrowLeft, Eye, EyeOff, AlertCircle, Mail, User, Lock } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const Signup: React.FC = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verificationSent, setVerificationSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Validate form
    if (!email || !password || !username) {
      setError('Please fill in all fields');
      return;
    }
    
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password);
      // Update user profile with username
      setVerificationSent(true);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to create account');
      setLoading(false);
    }
  };

  if (verificationSent) {
    return (
      <div className="pt-20 min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full px-4">
          <div className="manga-panel p-6 bg-black/30 transform rotate-1">
            <div className="text-center mb-8">
              <h1 className="manga-title text-3xl transform -rotate-2 mb-2">Verification Email Sent!</h1>
              <div className="flex justify-center my-8">
                <Mail className="w-20 h-20 text-red-400" />
              </div>
              <p className="text-gray-300 mb-4">We've sent a verification email to:</p>
              <p className="text-white font-bold mb-6 text-xl">{email}</p>
              <p className="text-gray-400 mb-8">Please check your inbox and click the verification link to complete your registration.</p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => navigate('/login')}
                className="w-full manga-gradient manga-border px-4 py-3 flex justify-center items-center space-x-2 font-medium transform hover:scale-105 transition-transform"
              >
                <LogIn className="w-5 h-5" />
                <span>Go to Login</span>
              </button>
              
              <button
                onClick={() => setVerificationSent(false)}
                className="w-full manga-border px-4 py-3 flex justify-center items-center space-x-2 font-medium transform hover:scale-105 transition-transform"
              >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Signup</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen flex items-center justify-center">
      <div className="max-w-md w-full px-4">
        <div className="manga-panel p-6 bg-black/30 transform -rotate-1">
          <div className="text-center mb-8">
            <h1 className="manga-title text-3xl transform rotate-2 mb-2">Join MangaVerse</h1>
            <p className="text-gray-400">Create your account to start your manga journey</p>
          </div>
          
          {error && (
            <div className="mb-6 manga-panel p-4 bg-red-500/20 transform rotate-1">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500" />
                <p className="font-medium text-red-400">{error}</p>
              </div>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-400 mb-1 manga-title transform -rotate-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full manga-panel bg-black/30 pl-10 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="your.email@example.com"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-400 mb-1 manga-title transform -rotate-1">
                Username
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full manga-panel bg-black/30 pl-10 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="Choose a username"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-400 mb-1 manga-title transform -rotate-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full manga-panel bg-black/30 pl-10 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            
            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-400 mb-1 manga-title transform -rotate-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type={showPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full manga-panel bg-black/30 pl-10 p-3 focus:outline-none focus:ring-2 focus:ring-red-500"
                  placeholder="••••••••"
                  disabled={loading}
                  required
                />
              </div>
            </div>
            
            {/* Submit Button */}
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
                  <>
                    <LogIn className="w-5 h-5" />
                    <span>Create Account</span>
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-8 text-center">
            <p className="text-gray-400 mb-4">
              Already have an account?
            </p>
            <Link
              to="/login"
              className="text-red-400 hover:text-red-300 font-medium hover:underline flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Login
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
