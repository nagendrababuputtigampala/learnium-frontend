import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { getDetailedProfile } from '../api/userApi';
import type { ProfileResponse } from '../api/userApi';

export const Profile: React.FC = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [profileData, setProfileData] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'about' | 'achievements' | 'certificates' | 'education' | 'links'>('about');

  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await getDetailedProfile();
      setProfileData(response);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <p className="text-red-600 mb-4">{error || 'Failed to load profile data'}</p>
        <button
          onClick={fetchProfileData}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-gray-600 hover:text-gray-900"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Completion Alert */}
        {!profileData.isProfileComplete && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-yellow-400 mr-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-yellow-800">
                    Profile {profileData.completionPercentage}% complete
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Add your missing details to unlock more features
                  </p>
                </div>
              </div>
              <button className="px-4 py-2 bg-yellow-600 text-white text-sm font-medium rounded-lg hover:bg-yellow-700 transition-colors">
                Complete Profile
              </button>
            </div>
            <div className="mt-3 w-full bg-yellow-200 rounded-full h-2">
              <div 
                className="bg-yellow-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${profileData.completionPercentage}%` }}
              ></div>
            </div>
          </div>
        )}

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Sidebar - Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              {/* Cover Image */}
              <div className="h-24 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              
              {/* Profile Info */}
              <div className="px-6 pb-6">
                <div className="flex flex-col items-center -mt-12">
                  <div className="w-24 h-24 rounded-full border-4 border-white bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                    {profileData.avatar ? (
                      <img src={profileData.avatar} alt="Profile" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      profileData.displayName.charAt(0).toUpperCase()
                    )}
                  </div>
                  
                  <h2 className="mt-4 text-xl font-bold text-gray-900">{profileData.displayName}</h2>
                  <p className="text-sm text-gray-600">{profileData.email}</p>
                  <span className="mt-2 px-3 py-1 bg-indigo-100 text-indigo-800 text-xs font-medium rounded-full">
                    Grade {profileData.grade}
                  </span>
                  
                  {profileData.bio && (
                    <p className="mt-4 text-sm text-gray-600 text-center">{profileData.bio}</p>
                  )}
                  
                  <button className="mt-4 w-full px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                    Edit Profile
                  </button>
                </div>

                {/* Stats */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Statistics</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Points</span>
                      <span className="text-sm font-semibold text-gray-900">{profileData.totalPoints}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Current Streak</span>
                      <span className="text-sm font-semibold text-orange-600">{profileData.currentStreak} days</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Problems Solved</span>
                      <span className="text-sm font-semibold text-gray-900">{profileData.problemsSolved}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Badges Earned</span>
                      <span className="text-sm font-semibold text-gray-900">{profileData.badgesEarned}</span>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  <h3 className="text-sm font-semibold text-gray-900 mb-4">Contact Information</h3>
                  <div className="space-y-3">
                    {profileData.phone && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        {profileData.phone}
                      </div>
                    )}
                    {profileData.city && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        {profileData.city}, {profileData.state}
                      </div>
                    )}
                    {profileData.school && (
                      <div className="flex items-center text-sm text-gray-600">
                        <svg className="w-4 h-4 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {profileData.school}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content Area */}
          <div className="lg:col-span-2">
            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-md mb-6">
              <div className="border-b border-gray-200">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('about')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'about'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('achievements')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'achievements'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    My Achievements
                  </button>
                  <button
                    onClick={() => setActiveTab('certificates')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'certificates'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    My Certificates
                  </button>
                  <button
                    onClick={() => setActiveTab('education')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'education'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Education
                  </button>
                  <button
                    onClick={() => setActiveTab('links')}
                    className={`px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === 'links'
                        ? 'border-indigo-600 text-indigo-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    Links
                  </button>
                </nav>
              </div>

              <div className="p-6">
                {/* About Tab */}
                {activeTab === 'about' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">Skills</h3>
                      <div className="space-y-4">
                        {profileData.skills?.map((skill) => (
                          <div key={skill.name}>
                            <div className="flex justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{skill.name}</span>
                              <span className="text-sm text-gray-600">{skill.level}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${skill.level}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Achievements Tab */}
                {activeTab === 'achievements' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Achievements & Badges</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {[...Array(profileData.badgesEarned || 0)].map((_, i) => (
                        <div key={i} className="flex flex-col items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-2xl mb-2">
                            🏆
                          </div>
                          <p className="text-xs font-medium text-gray-900 text-center">Badge {i + 1}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Certificates Tab */}
                {activeTab === 'certificates' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">My Certificates</h3>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        + Add Certificate
                      </button>
                    </div>
                    <div className="space-y-4">
                      {profileData.certificates?.map((cert) => (
                        <div key={cert.id} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-12 h-12 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">{cert.title}</h4>
                            <p className="text-xs text-gray-600 mt-1">{cert.issuer}</p>
                            <p className="text-xs text-gray-500 mt-1">{new Date(cert.date).toLocaleDateString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education Tab */}
                {activeTab === 'education' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Education</h3>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        + Add Education
                      </button>
                    </div>
                    <div className="space-y-4">
                      {profileData.education?.map((edu) => (
                        <div key={edu.id} className="flex items-start p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5zm0 0l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14zm-4 6v-7.5l4-2.222" />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="text-sm font-semibold text-gray-900">{edu.institution}</h4>
                            {edu.degree && <p className="text-xs text-gray-600 mt-1">{edu.degree}</p>}
                            {edu.grade && <p className="text-xs text-gray-600 mt-1">{edu.grade}</p>}
                            <p className="text-xs text-gray-500 mt-1">
                              {edu.startDate} - {edu.current ? 'Present' : edu.endDate}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Links Tab */}
                {activeTab === 'links' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-900">Social Links</h3>
                      <button className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
                        + Add Link
                      </button>
                    </div>
                    <div className="space-y-4">
                      {profileData.links?.map((link) => (
                        <div key={link.id} className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                          <div className="flex-shrink-0 w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                          </div>
                          <div className="ml-4 flex-1">
                            <p className="text-sm font-medium text-gray-900">{link.platform}</p>
                            <a href={link.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800">
                              {link.url}
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
