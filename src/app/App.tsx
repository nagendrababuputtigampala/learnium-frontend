import { useState } from "react";
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
  const [currentView, setCurrentView] = useState<AppView>("auth");
  const [user, setUser] = useState<UserData | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number>(0);
  const [selectedSubject, setSelectedSubject] = useState<string>("");
  const [selectedTopic, setSelectedTopic] = useState<string>("");
  const [selectedTestType, setSelectedTestType] = useState<"quiz" | "flashcard" | "input" | "games">("quiz");
  const [selectedTestId, setSelectedTestId] = useState<number>(1);

  const handleLogin = (data: { userProfile: UserData, onboardingRequired: boolean }) => {
    const { userProfile, onboardingRequired } = data;
    console.log("Onboarding required:", onboardingRequired);
    setUser({
      ...userProfile,
      name: userProfile.displayName,
      grade: userProfile.gradeLevel,
    });
    setCurrentView("dashboard");
  };

  const handleLogout = () => {
    setUser(null);
    setCurrentView("auth");
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
    }
  };

  if (currentView === "auth") {
    return <AuthPage onLogin={handleLogin} />;
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

  if (currentView === "test-list" && user) {
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