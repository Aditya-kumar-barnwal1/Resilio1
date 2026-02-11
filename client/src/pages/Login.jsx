import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldAlert, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';
import axios from 'axios'; // 1. Import Axios

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // 2. Use axios.post instead of fetch
      const response = await axios.post('https://resilio-tbts.onrender.com/api/v1/login', {
        email, 
        password
      });

      // Axios automatically throws an error for 4xx/5xx responses, 
      // so we don't need the "if (!response.ok)" check manually.

      const data = response.data;

      // 3. Store the JWT token & User info
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));

      // 4. Navigate to command center
      navigate('/dashboard');

    } catch (err) {
      // Axios stores the server response error in err.response
      const errorMessage = err.response?.data?.message || 'Invalid credentials. Server connection failed.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-xl border-t-8 border-red-600 p-8">
        
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-red-100 rounded-full mb-4">
            <ShieldAlert className="h-10 w-10 text-red-600" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Resilio</h1>
          <p className="text-slate-500 mt-2 font-medium">Authority Command Center</p>
        </div>

        {/* Error Message Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700 text-sm animate-pulse">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Official Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Mail size={18} />
              </span>
              <input 
                type="email" 
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50"
                placeholder="officer@agency.gov"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
                <Lock size={18} />
              </span>
              <input 
                type="password" 
                required
                className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all disabled:opacity-50"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold py-3 px-4 rounded-lg shadow-lg hover:shadow-red-200 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 size={20} className="animate-spin" /> Verifying Credentials...
              </>
            ) : (
              "Authorize Access"
            )}
          </button>
        </form>

        <p className="mt-8 text-center text-xs text-slate-400 uppercase tracking-widest">
          [cite_start]Secured by Resilio AI Systems [cite: 52]
        </p>
      </div>
      
      <div className="mt-6 text-slate-400 text-sm">
        Authorized Personnel Only • Audit Logging Enabled 
      </div>
    </div>
  );
};

export default Login;