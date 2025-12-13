import { useAuth } from '../context/AuthContext';
import { logout } from '../services/auth.service';
import { useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';

export const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement>(null);

  // Close profile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target as Node)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // You can implement actual dark mode logic here
  };

  return (
    <div className={`min-h-screen ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header className={`${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border-b`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <h1 className={`text-2xl font-bold ${isDarkMode ? 'text-white' : 'text-indigo-600'}`}>
                Learnium
              </h1>
            </div>

            {/* Right Side: Notification, Dark Mode, Profile */}
            <div className="flex items-center gap-4">
              {/* Notification Icon */}
              <button className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'} transition-colors relative`}>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {/* Notification Badge */}
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {/* Dark Mode Toggle */}
              <button 
                onClick={toggleDarkMode}
                className={`p-2 rounded-lg hover:bg-gray-100 ${isDarkMode ? 'hover:bg-gray-700 text-gray-300' : 'text-gray-600'} transition-colors`}
              >
                {isDarkMode ? (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                )}
              </button>

              {/* Profile Dropdown */}
              <div className="relative" ref={profileMenuRef}>
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-indigo-600 flex items-center justify-center text-white font-semibold">
                    {currentUser?.displayName?.charAt(0).toUpperCase() || currentUser?.email?.charAt(0).toUpperCase()}
                  </div>
                </button>

                {/* Dropdown Menu */}
                {showProfileMenu && (
                  <div className={`absolute right-0 mt-2 w-56 rounded-lg shadow-lg ${isDarkMode ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} z-50`}>
                    <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'}`}>
                      <p className={`text-sm font-medium ${isDarkMode ? 'text-white' : 'text-gray-900'}`}>
                        {currentUser?.displayName || 'User'}
                      </p>
                      <p className={`text-xs ${isDarkMode ? 'text-gray-400' : 'text-gray-500'} truncate`}>
                        {currentUser?.email}
                      </p>
                    </div>
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          navigate('/profile');
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Profile
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Navigate to leaderboard
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                        </svg>
                        Leaderboard
                      </button>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          // Navigate to settings
                        }}
                        className={`w-full text-left px-4 py-2 text-sm ${isDarkMode ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Settings
                      </button>
                      <div className={`border-t ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} my-2`}></div>
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          handleLogout();
                        }}
                        className={`w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 ${isDarkMode ? 'hover:bg-red-900/20' : ''} transition-colors flex items-center gap-2`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8 mb-6`}>
          <h2 className={`text-3xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-2`}>
            Welcome, {currentUser?.displayName || currentUser?.email}! 🎉
          </h2>
          <p className={`${isDarkMode ? 'text-gray-400' : 'text-gray-600'} mb-6`}>
            You've successfully logged in. The backend is still under development.
          </p>

          <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className={`text-sm ${isDarkMode ? 'text-yellow-300' : 'text-yellow-700'}`}>
                  <strong>Development Mode:</strong> Backend API is not yet available. Full features will be enabled once the Spring Boot backend is ready.
                </p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-gradient-to-br from-purple-500 to-indigo-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Current Streak</h3>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm opacity-90 mt-1">Days</p>
            </div>

            <div className="bg-gradient-to-br from-green-500 to-teal-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Total Points</h3>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm opacity-90 mt-1">XP</p>
            </div>

            <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-2">Badges Earned</h3>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm opacity-90 mt-1">Achievements</p>
            </div>
          </div>
        </div>

        <div className={`${isDarkMode ? 'bg-gray-800' : 'bg-white'} rounded-lg shadow-md p-8`}>
          <h3 className={`text-xl font-bold ${isDarkMode ? 'text-white' : 'text-gray-900'} mb-4`}>User Information</h3>
          <dl className="grid grid-cols-1 gap-4">
            <div>
              <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email</dt>
              <dd className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{currentUser?.email}</dd>
            </div>
            <div>
              <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Display Name</dt>
              <dd className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>{currentUser?.displayName || 'Not set'}</dd>
            </div>
            <div>
              <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>User ID</dt>
              <dd className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'} font-mono text-xs`}>{currentUser?.uid}</dd>
            </div>
            <div>
              <dt className={`text-sm font-medium ${isDarkMode ? 'text-gray-400' : 'text-gray-500'}`}>Email Verified</dt>
              <dd className={`mt-1 text-sm ${isDarkMode ? 'text-gray-300' : 'text-gray-900'}`}>
                {currentUser?.emailVerified ? (
                  <span className="text-green-600">✓ Verified</span>
                ) : (
                  <span className="text-yellow-600">⚠ Not verified</span>
                )}
              </dd>
            </div>
          </dl>
        </div>
      </main>
    </div>
  );
};
