import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, LogIn, Mail, Eye, EyeOff, User, CheckCircle } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const Signup = () => {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Password strength validation
  const isPasswordStrong = password.length >= 8 && 
    /[A-Z]/.test(password) && 
    /[a-z]/.test(password) && 
    /[0-9]/.test(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Form validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }
    
    if (!isPasswordStrong) {
      setError("Password must be at least 8 characters and include uppercase, lowercase, and numbers");
      return;
    }
    
    setLoading(true);
    
    try {
      await signUp(email, password);
      setSuccess(true);
      
      // We don't immediately navigate since we want to show the success message
      // Supabase by default requires email confirmation
      setTimeout(() => {
        navigate('/login');
      }, 5000);
    } catch (err: any) {
      console.error('Signup error:', err);
      setError(err.message || 'Failed to sign up');
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
              <h2 className="manga-title text-3xl mb-1 transform -rotate-1">Account Created!</h2>
              <p className="text-gray-300 mb-4">
                We've sent you an email to verify your account. Please check your inbox to complete the signup process.
              </p>
              <p className="text-gray-400">
                You'll be redirected to the login page in a few seconds...
              </p>
              <Link 
                to="/login" 
                className="mt-4 inline-block manga-border px-4 py-2 hover:text-red-500 transition-all transform hover:scale-105"
              >
                Go to Login
              </Link>
            </div>
          ) : (
            <>
              <div className="text-center">
                <h2 className="manga-title text-3xl mb-1 transform -rotate-1">Join MangaVerse</h2>
                <p className="text-gray-400">Create an account to start your manga adventure</p>
              </div>
              
              {error && (
                <div className="mt-4 bg-red-900/30 text-red-200 p-3 rounded-md flex items-center space-x-2">
                  <AlertCircle className="w-5 h-5 flex-shrink-0" />
                  <p className="text-sm">{error}</p>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                <div>
                  <label htmlFor="username" className="block text-sm font-medium mb-1">
                    Username
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      required
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      className="block w-full manga-panel py-3 pl-10 pr-3 bg-black/30 focus:ring-red-500 focus:border-red-500"
                      placeholder="coolmangareader"
                    />
                  </div>
                </div>
                
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
                  <label htmlFor="password" className="block text-sm font-medium mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LogIn className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full manga-panel py-3 pl-10 pr-10 bg-black/30 focus:ring-red-500 focus:border-red-500"
                      placeholder="••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-white" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                  <div className="mt-1">
                    <div className={`text-xs ${isPasswordStrong ? 'text-green-400' : 'text-gray-400'}`}>
                      Password must have at least 8 characters with uppercase, lowercase, and numbers
                    </div>
                  </div>
                </div>
                
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <LogIn className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      type={showPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`block w-full manga-panel py-3 pl-10 pr-10 bg-black/30 focus:ring-red-500 focus:border-red-500 ${
                        confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
                      }`}
                      placeholder="••••••••"
                    />
                  </div>
                  {confirmPassword && password !== confirmPassword && (
                    <p className="mt-1 text-xs text-red-400">Passwords don't match</p>
                  )}
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
                      <>
                        <User className="w-5 h-5" />
                        <span>Create Account</span>
                      </>
                    )}
                  </button>
                </div>
              </form>

              <div className="mt-8 text-center">
                <p className="text-gray-400">
                  Already have an account?{' '}
                  <Link
                    to="/login"
                    className="text-red-400 hover:text-red-300 font-medium hover:underline"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Signup;
