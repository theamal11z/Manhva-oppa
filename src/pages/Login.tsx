import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { AlertCircle, ArrowRight, LogIn, Mail, Eye, EyeOff } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string })?.from || '/';
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      await signIn(email, password);
      navigate(from, { replace: true });
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.message || 'Failed to sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="pt-20 pb-16 min-h-screen flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-8 bg-gray-800/40 manga-panel relative overflow-hidden">
        <div className="absolute inset-0 screen-tone pointer-events-none" />
        
        <div className="relative z-10">
          <div className="text-center">
            <h2 className="manga-title text-3xl mb-1 transform -rotate-1">Welcome Back</h2>
            <p className="text-gray-400">Sign in to continue your manga journey</p>
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
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="password" className="block text-sm font-medium">
                  Password
                </label>
                <Link 
                  to="/reset-password" 
                  className="text-sm text-red-400 hover:text-red-300 transform hover:translate-x-1 transition-transform inline-flex items-center"
                >
                  Forgot password? <ArrowRight className="w-3 h-3 ml-1" />
                </Link>
              </div>
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
                    <LogIn className="w-5 h-5" />
                    <span>Sign In</span>
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-8 text-center">
            <p className="text-gray-400">
              Don't have an account?{' '}
              <Link
                to="/signup"
                className="text-red-400 hover:text-red-300 font-medium hover:underline"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
