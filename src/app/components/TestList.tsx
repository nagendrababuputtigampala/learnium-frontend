import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Play, Clock, Target, Trophy, Lock, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { ExamService, type Test } from "../../services";

interface UserData {
  email: string;
  displayName: string;
  name: string;
  gradeName: string;
  gradeId: string;
  grade: string;
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

interface TestListProps {
  user: UserData;
  grade: string;
  subject: string;
  subjectName: string;
  topic: string | null;
  topicName: string;
  testType: "quiz" | "flashcard" | "input" | "fill_blanks";
  examModeId: string;
  examModeName: string;
  onNavigate: (view: "dashboard" | "profile" | "submissions") => void;
  onLogout: () => void;
  onBack: () => void;
  onSelectTest: (testId: string) => void;
  onNavigateToSubjects?: () => void;
  onNavigateToTopics?: () => void;
  onNavigateToTestSelection?: () => void;
}

export function TestList({ 
  user, 
  grade,
  subject,
  subjectName, 
  topic,
  topicName,
  testType,
  examModeId,
  examModeName,
  onNavigate,
  onLogout,
  onBack,
  onSelectTest,
  onNavigateToSubjects,
  onNavigateToTopics,
  onNavigateToTestSelection
}: TestListProps) {
  const [tests, setTests] = useState<Test[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch tests when component mounts or parameters change
  useEffect(() => {
    const fetchTests = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        if (!topic) {
          throw new Error('Topic is required to fetch tests');
        }
        
        console.log('Fetching tests with parameters:', {
          grade,
          subject,
          topic,
          examModeId
        });
        
        const testsData = await ExamService.getTests(grade, subject, topic, examModeId);
        console.log('Tests data received:', testsData);
        setTests(testsData);
      } catch (error: any) {
        console.error('Error fetching tests:', error);
        setError(error.message || 'Failed to load tests');
        setTests([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchTests();
  }, [grade, subject, topic, examModeId]);

  const getDifficultyColor = (difficulty?: string | null) => {
    if (!difficulty) return "bg-slate-100 text-slate-700 border-slate-300";
    
    const lower = difficulty.toLowerCase();
    switch (lower) {
      case "easy":
        return "bg-green-100 text-green-700 border-green-300";
      case "medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "hard":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
  };

  const getDifficultyText = (difficulty?: string | null) => {
    if (!difficulty) return "Medium";
    
    const lower = difficulty.toLowerCase();
    if (lower === "easy") return "Easy";
    if (lower === "hard") return "Hard";
    return "Medium";
  };

  const getTestTypeLabel = () => {
    switch (testType) {
      case "quiz":
        return "Quiz";
      case "flashcard":
        return "Flashcard";
      case "input":
        return "Fill in the Blank";
      default:
        return "Test";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header user={user} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Button variant="ghost" onClick={onBack} className="mb-4">
            ← Back to Test Types
          </Button>
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <Badge variant="outline">{subject}</Badge>
            <span className="text-muted-foreground">›</span>
            <Badge variant="outline">{topic || 'All Topics'}</Badge>
            <span className="text-muted-foreground">›</span>
            <Badge variant="outline">{getTestTypeLabel()}</Badge>
          </div>
          <h1 className="text-3xl mb-2">Choose a Test</h1>
          <p className="text-muted-foreground">Select a test to begin your practice session</p>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading tests...</p>
            </div>
          </div>
        ) : tests.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl mb-2">No tests available</h3>
            <p className="text-muted-foreground">No tests found for this topic and mode</p>
          </div>
        ) : (
          /* Tests Grid */
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tests.map((test) => (
              <Card 
                key={test.examTemplateId}
                className={`transition-all ${
                  test.locked 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:shadow-xl hover:scale-105 cursor-pointer'
                }`}
                onClick={() => !test.locked && onSelectTest(test.examTemplateId)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        test.locked 
                          ? 'bg-slate-100' 
                          : 'bg-gradient-to-br from-indigo-500 to-purple-600'
                      }`}>
                        {test.locked ? (
                          <Lock className="h-6 w-6 text-slate-400" />
                        ) : (
                          <span className="text-2xl text-white">{test.testId || 1}</span>
                        )}
                      </div>
                    <Badge className={`${getDifficultyColor(test.difficulty)} border`}>
                      {getDifficultyText(test.difficulty)}
                    </Badge>
                  </div>
                  {test.bestScore && (
                    <div className="text-right">
                      <Trophy className="h-4 w-4 text-amber-500 inline mr-1" />
                      <span className="text-sm text-muted-foreground">{test.bestScore}%</span>
                    </div>
                  )}
                </div>
                  <CardTitle className="text-2xl">{test.templateName || test.testName || 'Test'}</CardTitle>
                  <CardDescription>
                    {test.locked ? "Complete previous tests to unlock" : (test.description || `Practice your ${typeof subject === 'string' ? subject.toLowerCase() : 'subject'} skills`)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>Questions</span>
                      </div>
                      <span>{test.totalQuestions || test.questionsCount || 0}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>Time</span>
                      </div>
                      <span>{test.estimatedTime}</span>
                    </div>
                  </div>
                  <Button 
                    className="w-full" 
                    disabled={test.locked}
                    variant={test.locked ? "outline" : "default"}
                  >
                    {test.locked ? (
                      <>
                        <Lock className="h-4 w-4 mr-2" />
                        Locked
                      </>
                    ) : (
                      <>
                        <Play className="h-4 w-4 mr-2" />
                        Start Test
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Info Card */}
        <Card className="mt-8 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>💡 Tip:</strong> Complete tests in order to unlock harder challenges! 
              Each test is designed to build upon previous knowledge.
            </p>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
