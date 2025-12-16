import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "../firebase";
import { signIn } from "../services/api";
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
  id: string;
  displayName: string;
  name: string;
  email: string;
  gradeLevel: number;
  grade: number;
  avatar: string | null;
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
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<"quiz" | "flashcard" | "input" | "games">("quiz");
  const [selectedTestId, setSelectedTestId] = useState<number>(1);

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
            grade: userProfile.gradeLevel,
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

  const handleLogin = (data: { userProfile: UserData, onboardingRequired: boolean }) => {
    const { userProfile, onboardingRequired } = data;
    console.log("Onboarding required:", onboardingRequired);
    setUser({
      ...userProfile,
      name: userProfile.displayName,
      grade: userProfile.gradeLevel,
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
      setSelectedGrade(user.grade); // Set default grade from user profile
      setCurrentView("subject-selection");
    }
  };

  const handleSelectGrade = (grade: number) => {
    setSelectedGrade(grade);
  };

  const handleSelectSubject = (subject: string) => {
    setSelectedSubject(subject);
    setCurrentView("topic-selection");
  };

  const handleSelectTopic = (topic: string) => {
    setSelectedTopic(topic);
    setCurrentView("test-selection");
  };

  const handleSelectTestType = (type: "quiz" | "flashcard" | "input" | "games") => {
    setSelectedTestType(type);
    if (type === "games") {
      setCurrentView("games");
    } else {
      setCurrentView("test-list");
    }
  };

  const handleSelectTestId = (id: number) => {
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
    setCurrentView("subject-selection");
  };

  const handleBackToTopicSelection = () => {
    setCurrentView("topic-selection");
  };

  const handleBackToTestSelection = () => {
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
        onBack={handleBackToDashboard}
        onSelectSubject={handleSelectSubject}
        onGradeChange={handleSelectGrade}
      />
    );
  }

  if (currentView === "topic-selection" && user) {
    return (
      <TopicSelection
        grade={selectedGrade}
        subject={selectedSubject}
        onBack={handleBackToSubjectSelection}
        onSelectTopic={handleSelectTopic}
      />
    );
  }

  if (currentView === "test-selection" && user) {
    return (
      <TestSelection
        subject={selectedSubject}
        onBack={handleBackToTopicSelection}
        onSelectType={handleSelectTestType}
      />
    );
  }

  if (currentView === "test-list" && user && selectedTestType !== "games") {
    return (
      <TestList
        user={user}
        subject={selectedSubject}
        topic={selectedTopic}
        testType={selectedTestType}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        onBack={handleBackToTestSelection}
        onSelectTest={handleSelectTestId}
      />
    );
  }

  if (currentView === "quiz" && user) {
    return (
      <QuizTest
        subject={selectedSubject}
        onBack={handleBackToTestSelection}
        onComplete={handleQuizComplete}
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