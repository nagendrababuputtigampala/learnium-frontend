import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { Play, Clock, Target, Trophy, Lock } from "lucide-react";

interface UserData {
  id: string;
  name: string;
  email: string;
  grade: number;
  avatar: string | null;
  level: number;
  xp: number;
  totalXp: number;
  percentile: number;
  badges: string[];
}

interface Test {
  id: number;
  name: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionsCount: number;
  estimatedTime: string;
  locked: boolean;
  bestScore?: number;
}

interface TestListProps {
  user: UserData;
  subject: string;
  topic: string;
  testType: "quiz" | "flashcard" | "input";
  onNavigate: (view: "dashboard" | "profile" | "submissions") => void;
  onLogout: () => void;
  onBack: () => void;
  onSelectTest: (testId: number) => void;
}

export function TestList({ 
  user, 
  subject, 
  topic, 
  testType,
  onNavigate, 
  onLogout, 
  onBack, 
  onSelectTest 
}: TestListProps) {
  // Generate mock tests based on type
  const tests: Test[] = [
    {
      id: 1,
      name: "Test 1",
      difficulty: "Easy",
      questionsCount: testType === "flashcard" ? 15 : 20,
      estimatedTime: testType === "flashcard" ? "10 mins" : "15 mins",
      locked: false,
      bestScore: 85
    },
    {
      id: 2,
      name: "Test 2",
      difficulty: "Easy",
      questionsCount: testType === "flashcard" ? 15 : 20,
      estimatedTime: testType === "flashcard" ? "10 mins" : "15 mins",
      locked: false,
      bestScore: 92
    },
    {
      id: 3,
      name: "Test 3",
      difficulty: "Medium",
      questionsCount: testType === "flashcard" ? 20 : 25,
      estimatedTime: testType === "flashcard" ? "15 mins" : "20 mins",
      locked: false,
      bestScore: 78
    },
    {
      id: 4,
      name: "Test 4",
      difficulty: "Medium",
      questionsCount: testType === "flashcard" ? 20 : 25,
      estimatedTime: testType === "flashcard" ? "15 mins" : "20 mins",
      locked: false
    },
    {
      id: 5,
      name: "Test 5",
      difficulty: "Hard",
      questionsCount: testType === "flashcard" ? 25 : 30,
      estimatedTime: testType === "flashcard" ? "20 mins" : "30 mins",
      locked: false
    },
    {
      id: 6,
      name: "Test 6",
      difficulty: "Hard",
      questionsCount: testType === "flashcard" ? 25 : 30,
      estimatedTime: testType === "flashcard" ? "20 mins" : "30 mins",
      locked: true
    },
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 border-green-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Hard":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
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
            <Badge variant="outline">{topic}</Badge>
            <span className="text-muted-foreground">›</span>
            <Badge variant="outline">{getTestTypeLabel()}</Badge>
          </div>
          <h1 className="text-3xl mb-2">Choose a Test</h1>
          <p className="text-muted-foreground">Select a test to begin your practice session</p>
        </div>

        {/* Tests Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tests.map((test) => (
            <Card 
              key={test.id}
              className={`transition-all ${
                test.locked 
                  ? 'opacity-60 cursor-not-allowed' 
                  : 'hover:shadow-xl hover:scale-105 cursor-pointer'
              }`}
              onClick={() => !test.locked && onSelectTest(test.id)}
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
                        <span className="text-2xl text-white">{test.id}</span>
                      )}
                    </div>
                    <Badge className={`${getDifficultyColor(test.difficulty)} border`}>
                      {test.difficulty}
                    </Badge>
                  </div>
                  {test.bestScore && (
                    <div className="text-right">
                      <Trophy className="h-4 w-4 text-amber-500 inline mr-1" />
                      <span className="text-sm text-muted-foreground">{test.bestScore}%</span>
                    </div>
                  )}
                </div>
                <CardTitle className="text-2xl">{test.name}</CardTitle>
                <CardDescription>
                  {test.locked ? "Complete previous tests to unlock" : `Practice your ${topic.toLowerCase()} skills`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Target className="h-4 w-4" />
                      <span>Questions</span>
                    </div>
                    <span>{test.questionsCount}</span>
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
