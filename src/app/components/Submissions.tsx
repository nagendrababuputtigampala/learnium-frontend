import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { CheckCircle2, XCircle, Clock, Calendar, Trophy, Target } from "lucide-react";

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

interface Submission {
  id: string;
  testName: string;
  subject: string;
  topic: string;
  type: "Quiz" | "Flashcard" | "Fill in the Blank" | "Game";
  score: number;
  totalQuestions: number;
  timeSpent: string;
  date: string;
  passed: boolean;
}

interface SubmissionsProps {
  user: UserData;
  onNavigate: (view: "dashboard" | "profile" | "submissions") => void;
  onLogout: () => void;
}

// Mock submission data
const mockSubmissions: Submission[] = [
  {
    id: "1",
    testName: "Test 1",
    subject: "Mathematics",
    topic: "Addition & Subtraction",
    type: "Quiz",
    score: 18,
    totalQuestions: 20,
    timeSpent: "12:45",
    date: "2024-12-14",
    passed: true
  },
  {
    id: "2",
    testName: "Test 2",
    subject: "Mathematics",
    topic: "Fractions",
    type: "Fill in the Blank",
    score: 8,
    totalQuestions: 10,
    timeSpent: "08:30",
    date: "2024-12-13",
    passed: true
  },
  {
    id: "3",
    testName: "Flipping Pancakes",
    subject: "Mathematics",
    topic: "Fractions",
    type: "Game",
    score: 150,
    totalQuestions: 0,
    timeSpent: "15:20",
    date: "2024-12-13",
    passed: true
  },
  {
    id: "4",
    testName: "Test 1",
    subject: "Physics",
    topic: "Motion & Forces",
    type: "Quiz",
    score: 14,
    totalQuestions: 20,
    timeSpent: "18:15",
    date: "2024-12-12",
    passed: true
  },
  {
    id: "5",
    testName: "Vocabulary Set 1",
    subject: "English",
    topic: "Vocabulary Building",
    type: "Flashcard",
    score: 0,
    totalQuestions: 25,
    timeSpent: "10:00",
    date: "2024-12-12",
    passed: true
  },
  {
    id: "6",
    testName: "Test 3",
    subject: "Mathematics",
    topic: "Algebra Introduction",
    type: "Quiz",
    score: 12,
    totalQuestions: 20,
    timeSpent: "22:30",
    date: "2024-12-11",
    passed: false
  },
];

export function Submissions({ user, onNavigate, onLogout }: SubmissionsProps) {
  const totalSubmissions = mockSubmissions.length;
  const averageScore = mockSubmissions
    .filter(s => s.totalQuestions > 0)
    .reduce((acc, s) => acc + (s.score / s.totalQuestions) * 100, 0) / 
    mockSubmissions.filter(s => s.totalQuestions > 0).length;
  const passedTests = mockSubmissions.filter(s => s.passed).length;

  const getScoreColor = (score: number, total: number) => {
    if (total === 0) return "text-blue-600"; // For games or flashcards
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBadge = (score: number, total: number) => {
    if (total === 0) return null; // For games or flashcards
    const percentage = (score / total) * 100;
    if (percentage >= 80) return "default";
    if (percentage >= 60) return "secondary";
    return "destructive";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header user={user} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flex-1 max-w-6xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">My Submissions</h1>
          <p className="text-muted-foreground">Track your test history and performance</p>
        </div>

        {/* Statistics Cards */}
        <div className="grid sm:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Tests</p>
                  <p className="text-3xl">{totalSubmissions}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Average Score</p>
                  <p className="text-3xl">{Math.round(averageScore)}%</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Tests Passed</p>
                  <p className="text-3xl">{passedTests}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <CheckCircle2 className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Submissions List */}
        <Card>
          <CardHeader>
            <CardTitle>Test History</CardTitle>
            <CardDescription>Your recent test submissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {mockSubmissions.map((submission) => (
                <div
                  key={submission.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-slate-50 transition-colors gap-4"
                >
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      {submission.passed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-medium mb-1">
                          {submission.subject} - {submission.topic}
                        </h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          {submission.testName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">{submission.type}</Badge>
                          {submission.totalQuestions > 0 ? (
                            <Badge variant={getScoreBadge(submission.score, submission.totalQuestions) as any}>
                              {submission.score}/{submission.totalQuestions}
                            </Badge>
                          ) : (
                            <Badge variant="secondary">Score: {submission.score}</Badge>
                          )}
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {submission.timeSpent}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(submission.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {submission.totalQuestions > 0 && (
                      <div className="text-right">
                        <p className={`text-2xl ${getScoreColor(submission.score, submission.totalQuestions)}`}>
                          {Math.round((submission.score / submission.totalQuestions) * 100)}%
                        </p>
                      </div>
                    )}
                    <Button variant="outline" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {mockSubmissions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No submissions yet. Start taking tests!</p>
                <Button onClick={() => onNavigate("dashboard")} className="mt-4">
                  Go to Dashboard
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
}
