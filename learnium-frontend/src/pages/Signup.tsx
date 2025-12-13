import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Mail, Lock, User, Calendar, Eye, EyeOff, BookOpen, Award, Target, Sparkles, Star } from 'lucide-react';
import { signUpWithEmail, signInWithGoogle, signInWithFacebook } from '../services/auth.service';
import { initializeSession } from '../api/userApi';

export const Signup: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: '',
    parentEmail: '',
  });

  const [errors, setErrors] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
    grade: '',
    parentEmail: '',
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    let isValid = true;
    const newErrors = {
      fullName: '',
      email: '',
      password: '',
      confirmPassword: '',
      grade: '',
      parentEmail: '',
    };

    if (!formData.fullName || formData.fullName.trim().length < 2) {
      newErrors.fullName = 'Please enter your full name';
      isValid = false;
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    if (!formData.grade) {
      newErrors.grade = 'Please select your grade';
      isValid = false;
    }

    // Parent email is optional but should be valid if provided
    if (formData.parentEmail && !/\S+@\S+\.\S+/.test(formData.parentEmail)) {
      newErrors.parentEmail = 'Please enter a valid email';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      setIsLoading(true);
      try {
        // Sign up with Firebase
        await signUpWithEmail({
          email: formData.email,
          password: formData.password,
          fullName: formData.fullName,
          grade: formData.grade,
          parentEmail: formData.parentEmail,
        });
        
        // CRITICAL: Backend creates user profile in database
        // This is where user data is persisted and validated
        const sessionData = await initializeSession();
        
        // Route based on onboarding status
        if (sessionData.onboardingRequired) {
          navigate('/onboarding');
        } else {
          navigate('/dashboard');
        }
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'An error occurred';
        if (errorMessage.includes('Network Error') || errorMessage.includes('Failed to initialize session')) {
          setErrors(prev => ({ 
            ...prev, 
            email: '⚠️ Backend server is not running. Please start the Spring Boot backend on ' +
                   (import.meta.env.VITE_API_HOST || 'http://localhost:8080')
          }));
        } else {
          setErrors(prev => ({ ...prev, email: errorMessage }));
        }
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleGoogleSignup = async () => {
    setIsLoading(true);
    try {
      // Sign up with Google
      await signInWithGoogle();
      
      // CRITICAL: Backend creates user profile in database
      const sessionData = await initializeSession();
      
      // Route based on onboarding status
      if (sessionData.onboardingRequired) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error.message.includes('Network Error') || error.message.includes('Failed to initialize session')) {
        setErrors(prev => ({ 
          ...prev, 
          email: '⚠️ Backend server is not running. Please start the Spring Boot backend on http://localhost:8080'
        }));
      } else {
        setErrors(prev => ({ ...prev, email: error.message }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFacebookSignup = async () => {
    setIsLoading(true);
    try {
      // Sign up with Facebook
      await signInWithFacebook();
      
      // CRITICAL: Backend creates user profile in database
      const sessionData = await initializeSession();
      
      // Route based on onboarding status
      if (sessionData.onboardingRequired) {
        navigate('/onboarding');
      } else {
        navigate('/dashboard');
      }
    } catch (error: any) {
      if (error.message.includes('Network Error') || error.message.includes('Failed to initialize session')) {
        setErrors(prev => ({ 
          ...prev, 
          email: '⚠️ Backend server is not running. Please start the Spring Boot backend on http://localhost:8080'
        }));
      } else {
        setErrors(prev => ({ ...prev, email: error.message }));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Illustration */}
      <div className="hidden lg:flex lg:w-3/5 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 relative overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute inset-0">
          {/* Floating circles */}
          <div className="absolute top-10 left-10 w-20 h-20 bg-white/10 rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-white/10 rounded-full animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Stars */}
          <Star className="absolute top-1/4 right-1/4 w-6 h-6 text-yellow-300 animate-pulse" />
          <Star className="absolute bottom-1/3 left-1/3 w-4 h-4 text-yellow-200 animate-pulse" style={{ animationDelay: '0.5s' }} />
          <Star className="absolute top-1/2 right-1/3 w-5 h-5 text-yellow-100 animate-pulse" style={{ animationDelay: '1.5s' }} />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col justify-center items-center w-full p-12 text-white">
          <div className="mb-8">
            <div className="flex items-center justify-center w-24 h-24 bg-white/20 backdrop-blur-sm rounded-3xl mb-6">
              <BookOpen className="w-12 h-12 text-white" />
            </div>
          </div>
          
          <h1 className="text-5xl font-bold mb-4 text-center">Join Learnium</h1>
          <p className="text-xl text-white/90 text-center mb-12 max-w-md">
            Start Your Learning Adventure Today!
          </p>

          {/* Feature Icons */}
          <div className="grid grid-cols-3 gap-8 max-w-lg">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
                <BookOpen className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Interactive Learning</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
                <Award className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Earn Badges</p>
            </div>
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mb-3">
                <Target className="w-8 h-8" />
              </div>
              <p className="text-sm font-medium">Track Progress</p>
            </div>
          </div>

          {/* Decorative illustration */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-6 py-3 rounded-full">
              <Sparkles className="w-5 h-5" />
              <span className="font-medium">Join 10,000+ Young Learners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Signup Form */}
      <div className="w-full lg:w-2/5 flex items-center justify-center p-8 bg-gray-50">
        <div className="max-w-md w-full">
          {/* Logo for mobile */}
          <div className="lg:hidden text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl mb-4">
              <BookOpen className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Learnium</h1>
          </div>

          {/* Signup Card */}
          <div className="bg-white rounded-3xl shadow-2xl p-8 lg:p-10">
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Create Account</h2>
              <p className="text-gray-600">Join us and start your learning journey</p>
            </div>

            {/* Social Signup Button */}
            <div className="mb-6">
              <button
                type="button"
                onClick={handleGoogleSignup}
                className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-gray-300 rounded-xl hover:border-gray-400 hover:bg-gray-50 transition-all font-medium text-gray-700"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>
            </div>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500 font-medium">Or sign up with email</span>
              </div>
            </div>

            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <User className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.fullName ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-500">{errors.fullName}</p>
                )}
              </div>

              {/* Email Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="your.email@example.com"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-500">{errors.email}</p>
                )}
              </div>

              {/* Grade Dropdown */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Grade
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <select
                    name="grade"
                    value={formData.grade}
                    onChange={handleChange}
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.grade ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select your grade</option>
                    <option value="1">Grade 1</option>
                    <option value="2">Grade 2</option>
                    <option value="3">Grade 3</option>
                    <option value="4">Grade 4</option>
                    <option value="5">Grade 5</option>
                    <option value="6">Grade 6</option>
                    <option value="7">Grade 7</option>
                    <option value="8">Grade 8</option>
                    <option value="9">Grade 9</option>
                    <option value="10">Grade 10</option>
                    <option value="11">Grade 11</option>
                    <option value="12">Grade 12</option>
                  </select>
                </div>
                {errors.grade && (
                  <p className="mt-1 text-sm text-red-500">{errors.grade}</p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password (min 6 characters)"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-500">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Re-enter your password"
                    className={`w-full pl-12 pr-12 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.confirmPassword}</p>
                )}
              </div>

              {/* Parent Email Input (Optional) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Parent's Email <span className="text-gray-400 text-xs">(Optional)</span>
                </label>
                <div className="relative">
                  <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <Mail className="w-5 h-5" />
                  </div>
                  <input
                    type="email"
                    name="parentEmail"
                    value={formData.parentEmail}
                    onChange={handleChange}
                    placeholder="parent@example.com"
                    className={`w-full pl-12 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.parentEmail ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                </div>
                {errors.parentEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.parentEmail}</p>
                )}
              </div>

              {/* Terms and Conditions */}
              <div className="flex items-start">
                <input
                  type="checkbox"
                  required
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mt-1"
                />
                <span className="ml-2 text-sm text-gray-600">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:text-blue-700 font-medium">
                    Terms & Conditions
                  </a>
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-200"
              >
                Create Account
              </button>
            </form>

            {/* Sign In Link */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{' '}
                <Link to="/login" className="text-blue-600 hover:text-blue-700 font-semibold">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-gray-500 text-sm mt-6">
            By signing up, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms</a>
            {' '}and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  );
};
