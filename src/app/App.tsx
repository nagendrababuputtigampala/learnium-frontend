import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { signIn } from "../services";
import { Grade } from "../services/examService";
import { AuthPage } from "./components/AuthPage";
import { Dashboard } from "./components/Dashboard";
import { Profile } from "./components/Profile";
import { Submissions } from "./components/Submissions";
import { PracticeSelection } from "./components/PracticeSelection";
import { SubjectSelection } from "./components/SubjectSelection";
import { TopicSelection } from "./components/TopicSelection";
import { TestSelection } from "./components/TestSelection";
import { TestList } from "./components/TestList";
import { QuizTest } from "./components/QuizTest";
import { FlashCardTest } from "./components/FlashCardTest";
import { UserInputTest } from "./components/UserInputTest";
import { GamesHub } from "./components/GamesHub";
import { PasswordResetPage } from "./components/PasswordResetPage";

interface UserData {
  userId?: string; // Add userId field
  email: string;
  displayName: string;
  name: string;
  gradeName: string;
  gradeId: string; // Changed to string for UUID
  grade: string; // Changed to string for UUID
  onboardingDone: boolean;
  role: string;
  status: string;
  school: string | null;
  bio: string | null;
  avatar: string | null;
  phone: string | null;
  city: string | null;
  state: string | null;
  country: string | null;
  totalPoints: number;
  currentStreak: number;
  longestStreak: number;
  problemsSolved: number;
  badgesEarned: number;
  completionPercentage: number;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
  // Computed fields for compatibility
  level: number;
  xp: number;
  totalXp: number;
  percentile: number;
  badges: string[];
}

type AppView = 
  | "auth" 
  | "password-reset"
  | "dashboard" 
  | "profile" 
  | "submissions" 
  | "practice-selection" 
  | "subject-selection" 
  | "topic-selection" 
  | "test-selection" 
  | "test-list"
  | "quiz" 
  | "flashcard" 
  | "input" 
  | "games";

export default function App() {
  // Check if this is a password reset link - handle both Firebase default format and custom format
  const urlParams = new URLSearchParams(window.location.search);
  const mode = urlParams.get('mode');
  const oobCode = urlParams.get('oobCode');
  const action = urlParams.get('action');
  
  const isPasswordReset = Boolean(
    (mode === 'resetPassword' && oobCode) || // Firebase default format
    (action === 'resetPassword' && oobCode) // Custom format
  );
  
  const [currentView, setCurrentView] = useState<AppView>(isPasswordReset ? "password-reset" : "auth");
  const [user, setUser] = useState<UserData | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isSignupInProgress, setIsSignupInProgress] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>("");
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedSubjectName, setSelectedSubjectName] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedTopicName, setSelectedTopicName] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<"quiz" | "flashcard" | "input" | "games" | "fill_blanks">('quiz');
  const [selectedExamModeId, setSelectedExamModeId] = useState<string>("");
  const [selectedExamModeName, setSelectedExamModeName] = useState<string>("");
  const [selectedTestId, setSelectedTestId] = useState<string>("");
  const [grades, setGrades] = useState<Grade[]>([]);

  // Listen for Firebase auth state changes to handle page refresh
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Skip automatic signin if user is already set OR signup is in progress
        if (user || isSignupInProgress) {
          setIsAuthLoading(false);
          return;
        }
        
        try {
          // User is signed in, fetch their profile from backend
          const data = await signIn();
          const { userProfile } = data;
          setUser({
            ...userProfile,
            name: userProfile.displayName,
            grade: userProfile.gradeId,
            // Computed fields for compatibility
            level: Math.floor(userProfile.totalPoints / 100) + 1,
            xp: userProfile.totalPoints,
            totalXp: (Math.floor(userProfile.totalPoints / 100) + 1) * 100,
            percentile: Math.min(95, Math.max(5, userProfile.completionPercentage)),
            badges: Array(userProfile.badgesEarned).fill('badge'),
          });
          setCurrentView("dashboard");
        } catch (error: any) {
          console.error("Error restoring user session:", error);
          
          // If this is a signup-in-progress error, just wait for manual signin
          if (error.message && error.message.includes('Signup in progress')) {
            console.log('Signup in progress - waiting for manual signin completion');
            setIsAuthLoading(false);
            return;
          }
          
          // If backend call fails for other reasons, sign out the user
          await auth.signOut();
          setUser(null);
          // Don't override currentView if we're on password reset flow
          if (!isPasswordReset) {
            setCurrentView("auth");
          }
        }
      } else {
        // User is signed out
        setUser(null);
        // Don't override currentView if we're on password reset flow
        if (!isPasswordReset) {
          setCurrentView("auth");
        }
        setIsSignupInProgress(false); // Reset signup flag when user signs out
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, [user, isSignupInProgress]);

  const handleLogin = (data: { userProfile: any, onboardingRequired: boolean, grades?: Grade[] }) => {
    const { userProfile, onboardingRequired, grades: gradesData } = data;
    console.log("Onboarding required:", onboardingRequired);
    
    // Store grades data if provided
    if (gradesData && Array.isArray(gradesData)) {
      setGrades(gradesData);
    }
    
    setUser({
      ...userProfile,
      name: userProfile.displayName,
      grade: userProfile.gradeId,
      // Computed fields for compatibility
      level: Math.floor(userProfile.totalPoints / 100) + 1,
      xp: userProfile.totalPoints,
      totalXp: (Math.floor(userProfile.totalPoints / 100) + 1) * 100,
      percentile: Math.min(95, Math.max(5, userProfile.completionPercentage)),
      badges: Array(userProfile.badgesEarned).fill('badge'),
    });
    setCurrentView("dashboard");
    setIsSignupInProgress(false); // Clear signup flag on successful login
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
      setUser(null);
      setCurrentView("auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  const handleNavigate = (view: "dashboard" | "profile" | "submissions") => {
    setCurrentView(view);
  };

  const handleUpdateProfile = (updatedFields: Partial<UserData>) => {
    if (user) {
      setUser({ ...user, ...updatedFields });
    }
  };

  const handleStartQuiz = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView("test-selection");
  };

  const handleStartPractice = () => {
    if (user) {
      // Set default grade from user profile, fallback to empty string if missing
      const defaultGrade = user.gradeId ? user.gradeId.toString() : "";
      setSelectedGrade(defaultGrade);
      setCurrentView("subject-selection");
    }
  };

  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade);
  };

  const handleSelectSubject = (subjectId: string, subjectName: string) => {
    setSelectedSubject(subjectId);
    setSelectedSubjectName(subjectName);
    setCurrentView("topic-selection");
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic || "");
    setCurrentView("test-selection");
  };



  const handleSelectTestId = (id: string) => {
    setSelectedTestId(id);
    setCurrentView(selectedTestType);
  };

  const handleBackToDashboard = () => {
    setCurrentView("dashboard");
  };

  const handleBackToPracticeSelection = () => {
    setCurrentView("practice-selection");
  };

  const handleBackToSubjectSelection = () => {
    setSelectedSubject("");
    setSelectedSubjectName("");
    setSelectedTopic("");
    setSelectedTopicName("");
    setCurrentView("subject-selection");
  };

  const handleBackToTopicSelection = () => {
    setSelectedTopic("");
    setSelectedTopicName("");
    setSelectedTestType('quiz');
    setSelectedExamModeId("");
    setSelectedExamModeName("");
    setCurrentView("topic-selection");
  };

  const handleBackToTestSelection = () => {
    setSelectedTestType('quiz');
    setSelectedExamModeId("");
    setSelectedExamModeName("");
    setCurrentView("test-selection");
  };

  const handleQuizComplete = (score: number) => {
    // In production with Supabase, this would update the user's progress in the database
    if (user) {
      setUser({
        ...user,
        xp: user.xp + Math.floor(score / 2), // Award XP based on score
      });
    };
  };

  // Show loading screen while checking authentication state
  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
            <span className="text-2xl">🎓</span>
          </div>
          <span className="text-2xl font-semibold text-gray-800">Learnium</span>
        </div>
        <div className="text-lg text-gray-600">Loading...</div>
      </div>
    );
  }

  if (currentView === "auth") {
    return <AuthPage onLogin={handleLogin} onSignupStart={() => setIsSignupInProgress(true)} />;
  }

  if (currentView === "password-reset") {
    return (
      <PasswordResetPage 
        onSuccess={() => {
          // Clear URL parameters and go to auth page
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView("auth");
        }}
        onCancel={() => {
          // Clear URL parameters and go to auth page
          window.history.replaceState({}, document.title, window.location.pathname);
          setCurrentView("auth");
        }}
      />
    );
  }

  if (currentView === "practice-selection" && user) {
    return (
      <PracticeSelection
        onBack={handleBackToDashboard}
        onSelectGrade={handleSelectGrade}
      />
    );
  }

  if (currentView === "subject-selection" && user) {
    return (
      <SubjectSelection
        grade={selectedGrade}
        grades={grades}
        onBack={handleBackToDashboard}
        onSelectSubject={handleSelectSubject}
        onGradeChange={handleSelectGrade}
        onNavigateToDashboard={handleBackToDashboard}
      />
    );
  }

  if (currentView === "topic-selection" && user) {
    return (
      <TopicSelection
        grade={selectedGrade}
        subject={selectedSubject}
        subjectName={selectedSubjectName}
        grades={grades}
        onBack={handleBackToSubjectSelection}
        onNavigateToSubjects={() => setCurrentView('subject-selection')}
        onSelectTopic={handleSelectTopic}
      />
    );
  }

  if (currentView === "test-selection" && user) {
    return (
      <TestSelection
        grade={selectedGrade}
        subject={selectedSubject}
        subjectName={selectedSubjectName}
        topic={selectedTopic}
        topicName={selectedTopicName}
        onBack={handleBackToTopicSelection}
        onNavigateToSubjects={() => setCurrentView('subject-selection')}
        onNavigateToTopics={() => setCurrentView('topic-selection')}
        onSelectType={(testType, examModeId) => {
          setSelectedTestType(testType);
          setSelectedExamModeId(examModeId);
          setSelectedExamModeName(testType); // For now, use testType as exam mode name
          if (testType === "games") {
            setCurrentView("games");
          } else {
            setCurrentView("test-list");
          }
        }}
      />
    );
  }

  if (currentView === "test-list" && user && selectedTestType !== "games") {
    return (
      <TestList
        user={user}
        grade={selectedGrade}
        subject={selectedSubject}
        subjectName={selectedSubjectName}
        topic={selectedTopic}
        topicName={selectedTopicName}
        examModeId={selectedExamModeId}
        examModeName={selectedExamModeName}
        testType={selectedTestType}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onBack={handleBackToTestSelection}
        onNavigateToSubjects={() => setCurrentView('subject-selection')}
        onNavigateToTopics={() => setCurrentView('topic-selection')}
        onNavigateToTestSelection={() => setCurrentView('test-selection')}
        onSelectTest={handleSelectTestId}
      />
    );
  }

  if (currentView === "quiz" && user) {
    return (
      <QuizTest
        grade={selectedGrade}
        subject={selectedSubject}
        topic={selectedTopic || ""}
        examModeId={selectedExamModeId}
        examId={selectedTestId}
        user={user}
        onBack={handleBackToTestSelection}
        onComplete={handleQuizComplete}
        onBackToDashboard={handleBackToDashboard}
      />
    );
  }

  if (currentView === "flashcard" && user) {
    return (
      <FlashCardTest
        subject={selectedSubject}
        onBack={handleBackToTestSelection}
        onComplete={handleBackToDashboard}
      />
    );
  }

  if (currentView === "input" && user) {
    return (
      <UserInputTest
        subject={selectedSubject}
        examAttemptId="7fff1aaa-5ce6-486a-b4c8-20e64e4b818d" // Sample attempt ID for testing
        onBack={handleBackToTestSelection}
        onComplete={handleQuizComplete}
      />
    );
  }

  if (currentView === "games" && user) {
    return (
      <GamesHub
        subject={selectedSubject}
        onBack={handleBackToTestSelection}
      />
    );
  }

  if (currentView === "dashboard" && user) {
    return (
      <Dashboard
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onStartQuiz={handleStartQuiz}
        onStartPractice={handleStartPractice}
      />
    );
  }

  if (currentView === "profile" && user) {
    return (
      <Profile
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onUpdateProfile={handleUpdateProfile}
      />
    );
  }

  if (currentView === "submissions" && user) {
    return (
      <Submissions
        user={user}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
      />
    );
  }

  return null;
}