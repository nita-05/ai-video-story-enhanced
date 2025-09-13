import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Mail, Lock, Eye, EyeOff, Shield, Sparkles, ArrowRight } from 'lucide-react';
import { getRedirectResult } from 'firebase/auth';
import axios from 'axios';
import { VITE_BACKEND_URL, VITE_GOOGLE_CLIENT_ID } from '../googleConfig';

const LoginModal = ({ isOpen, onClose, onLogin, onGoogleLogin, isGoogleLoading = false }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const isPromptingRef = useRef(false);

  useEffect(() => {
    const checkRedirect = async () => {
      try {
        const result = await getRedirectResult(auth);
        if (result && result.user) {
          const user = result.user;
          const u = {
            userId: user.uid,
            email: user.email || '',
            name: user.displayName || (user.email ? user.email.split('@')[0] : 'User'),
            picture: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || user.email || 'User')}&background=3b82f6&color=ffffff&size=150`,
          };
          localStorage.setItem('user', JSON.stringify(u));
          onLogin && onLogin(u);
          onClose && onClose();
        }
      } catch (_) {}
    };
    checkRedirect();
  }, [onLogin, onClose]);

  const handleGoogleLogin = async () => {
    try {
      if (window.google && VITE_GOOGLE_CLIENT_ID) {
        if (isPromptingRef.current) return;
        isPromptingRef.current = true;
        window.google.accounts.id.initialize({
          client_id: VITE_GOOGLE_CLIENT_ID,
          callback: async (response) => {
            try {
              await axios.post(`${VITE_BACKEND_URL}/auth/google`, { credential: response.credential }, { withCredentials: true });
              const me = await axios.get(`${VITE_BACKEND_URL}/auth/me`, { withCredentials: true });
              if (me.data?.authenticated && me.data.user) {
                localStorage.setItem('user', JSON.stringify(me.data.user));
                onLogin && onLogin(me.data.user);
                onClose && onClose();
              } else {
                alert('Google login failed. Please try again.');
              }
            } catch (err) {
              alert('Google login failed. Please try again.');
            } finally {
              isPromptingRef.current = false;
            }
          },
        });
        window.google.accounts.id.prompt();
        return;
      }
      alert('Google sign-in is not available. Check your Client ID env and script tag.');
    } catch (e) {
      alert('Google sign-in failed. Please try again.');
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      if (isLogin) {
        if (!formData.email || !formData.password) {
          throw new Error('Email and password are required');
        }
      } else {
        if (!formData.name) throw new Error('Name is required');
        if (formData.password !== formData.confirmPassword) throw new Error('Passwords do not match');
      }

      const safeName = (formData.name || formData.email.split('@')[0] || 'User').trim();
      const userData = {
        userId: `${formData.email.toLowerCase()}-${Date.now()}`,
        email: formData.email,
        name: safeName,
        picture: `https://ui-avatars.com/api/?name=${encodeURIComponent(safeName)}&background=3b82f6&color=ffffff&size=150`
      };

      localStorage.setItem('user', JSON.stringify(userData));
      onLogin(userData);
      setFormData({
        name: '',
        email: '',
        password: '',
        confirmPassword: ''
      });
      onClose();
    } catch (error) {
      console.error('Login/Register error:', error);
      alert(error?.message || 'Invalid credentials. Only admin is allowed now.');
    } finally {
      setIsLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Premium Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-xl"
        onClick={onClose}
      />
      
      {/* Premium Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 30 }}
        transition={{ type: "spring", damping: 30, stiffness: 400 }}
        className="relative bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden border border-white/30"
      >
        {/* Premium Header */}
        <div className="bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 p-8 text-white relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-white/20 via-white/5 to-transparent"></div>
          {/* Floating elements */}
          <div className="absolute top-4 right-20 w-8 h-8 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute bottom-6 left-16 w-6 h-6 bg-white/10 rounded-full animate-pulse" style={{animationDelay: '1s'}}></div>
          
          <motion.button
            onClick={onClose}
            className="absolute top-6 right-6 p-3 hover:bg-white/20 rounded-full transition-all duration-300 hover:scale-110 z-10"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>
          <div className="text-center relative z-10">
            <motion.div 
              className="w-20 h-20 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl border border-white/30"
              whileHover={{ scale: 1.1, rotate: 10 }}
              transition={{ duration: 0.3 }}
              animate={{ rotate: [0, 5, -5, 0] }}
            >
              <User className="w-10 h-10" />
            </motion.div>
            <motion.h2 
              className="text-3xl font-bold mb-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              {isLogin ? 'Welcome Back' : 'Join Footage Flow'}
            </motion.h2>
            <motion.p 
              className="text-blue-100 text-lg font-light"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {isLogin ? 'Sign in to continue your journey' : 'Create your account to get started'}
            </motion.p>
          </div>
        </div>

        {/* Premium Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Full Name
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gray-50 focus:bg-white text-lg"
                  placeholder="Enter your full name"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Mail className="w-4 h-4 text-blue-600" />
              Email Address
            </label>
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gray-50 focus:bg-white text-lg"
                placeholder="Enter your email"
              />
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5 }}
          >
            <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4 text-blue-600" />
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                required
                className="w-full pl-12 pr-14 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gray-50 focus:bg-white text-lg"
                placeholder="Enter your password"
              />
              <motion.button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </motion.button>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
            </div>
          </motion.div>

          {!isLogin && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-600" />
                Confirm Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors duration-300" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required={!isLogin}
                  className="w-full pl-12 pr-4 py-4 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300 hover:border-blue-400 bg-gray-50 focus:bg-white text-lg"
                  placeholder="Confirm your password"
                />
                <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/10 to-indigo-500/10 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
              </div>
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={isLoading}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-700 text-white py-4 rounded-xl font-bold hover:from-blue-700 hover:to-indigo-800 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-xl hover:shadow-2xl relative overflow-hidden group text-lg"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10">
              {isLoading ? (
                <div className="flex items-center justify-center gap-3">
                  <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isLogin ? 'Signing In...' : 'Creating Account...'}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-3">
                  {isLogin ? (
                    <>
                      <Shield className="w-5 h-5" />
                      Sign In
                      <ArrowRight className="w-5 h-5" />
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Create Account
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.button>

          {/* Premium Divider */}
          <motion.div 
            className="relative my-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300/50" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-6 bg-white text-gray-500 font-semibold text-base">Or continue with</span>
            </div>
          </motion.div>

          {/* Premium Google Sign-In Button */}
          <motion.div 
            className="flex justify-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <motion.button
              type="button"
              onClick={handleGoogleLogin}
              className="w-full px-6 py-4 rounded-xl bg-white text-gray-700 border border-gray-300 shadow-lg hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-4 font-semibold hover:shadow-xl hover:border-blue-300 text-lg"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              Continue with Google
            </motion.button>
          </motion.div>

          <motion.div 
            className="text-center mt-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.0 }}
          >
            <button
              type="button"
              onClick={toggleMode}
              className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline text-lg"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </motion.div>
        </form>

        {/* Premium Footer */}
        <motion.div 
          className="bg-gradient-to-r from-gray-50 via-blue-50 to-gray-50 px-8 py-6 text-center border-t border-gray-200/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
        >
          <div className="flex items-center justify-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-semibold text-blue-800">Secure & Private</span>
          </div>
          <p className="text-sm text-gray-600 leading-relaxed">
            By {isLogin ? 'signing in' : 'creating an account'}, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors hover:underline">
              Privacy Policy
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default LoginModal;
