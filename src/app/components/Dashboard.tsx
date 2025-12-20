import { useEffect, useState } from "react";
import { getDashboardData } from "../../services/api";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Header } from "./Header";
import { Footer } from "./Footer";
import {
  Award,
  BookOpen,
  Brain,
  ChevronRight,
  Crown,
  FlaskConical,
  LogOut,
  Medal,
  Star,
  Target,
  TrendingUp,
  Trophy,
  Users,
  GraduationCap,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from "recharts";

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

interface DashboardData {
  subjectProgress: { subject: string; score: number; total: number; icon: string; comingSoon?: boolean }[];
  recentActivity: { id: number; title: string; subject: string; score: number; date: string }[];
  performanceData: { month: string; math: number; physics: number }[];
  skillsData: { skill: string; value: number }[];
  achievements: { id: number; name: string; description: string; icon: string; unlocked: boolean }[];
}

interface DashboardProps {
  user: UserData;
  onNavigate: (view: "dashboard" | "profile" | "submissions") => void;
  onLogout: () => void;
  onStartQuiz: (subject: string) => void;
  onStartPractice: () => void;
}

export function Dashboard({ user, onNavigate, onLogout, onStartQuiz, onStartPractice }: DashboardProps) {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const data = await getDashboardData();
        setDashboardData(data);
      } catch (err) {
        setError("Failed to load dashboard data.");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="text-2xl">Loading Dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="text-2xl text-red-500">{error}</div>
      </div>
    );
  }
  
  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col items-center justify-center">
        <div className="text-2xl">No dashboard data available.</div>
      </div>
    );
  }

  const { subjectProgress, recentActivity, performanceData, skillsData, achievements } = dashboardData;
  const levelProgress = (user.xp / user.totalXp) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header user={user} onNavigate={onNavigate} onLogout={onLogout} />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl mb-2">Welcome back, {user.name}! 👋</h2>
          <p className="text-muted-foreground">Ready to continue your learning journey?</p>
        </div>

        {/* Practice & Prepare Section */}
        <Card className="mb-6 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center">
                  <GraduationCap className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl mb-2">Practice & Prepare</h3>
                  <p className="text-white/90">
                    Choose your grade and topic for targeted practice with multiple learning modes
                  </p>
                </div>
              </div>
              <Button 
                size="lg" 
                className="bg-white text-indigo-600 hover:bg-white/90 shrink-0"
                onClick={onStartPractice}
              >
                Start Practice
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          {/* Level Progress */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Level</CardTitle>
                <Crown className="h-5 w-5 text-yellow-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl">Level {user.level}</span>
                  <span className="text-muted-foreground text-sm">{user.xp}/{user.totalXp} XP</span>
                </div>
                <Progress value={levelProgress} className="h-3" />
                <p className="text-xs text-muted-foreground">
                  {user.totalXp - user.xp} XP to next level
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Percentile */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Your Ranking</CardTitle>
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl">{user.percentile}th</span>
                  <span className="text-muted-foreground text-sm">Percentile</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  You're performing better than {user.percentile}% of students in your grade
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Count */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Achievements</CardTitle>
                <Trophy className="h-5 w-5 text-orange-500" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl">{achievements.filter(a => a.unlocked).length}/{achievements.length}</span>
                  <span className="text-muted-foreground text-sm">Unlocked</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Keep learning to unlock more badges!
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Subjects */}
          <Card>
            <CardHeader>
              <CardTitle>Your Subjects</CardTitle>
              <CardDescription>Continue learning where you left off</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {subjectProgress.map((subject) => (
                <div key={subject.subject} className="flex items-center gap-4">
                  <div className="text-3xl">{subject.icon}</div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <span>{subject.subject}</span>
                      {subject.comingSoon ? (
                        <Badge variant="outline">Coming Soon</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">
                          {subject.score}%
                        </span>
                      )}
                    </div>
                    <Progress value={subject.score} className="h-2" />
                  </div>
                  {!subject.comingSoon && (
                    <Button
                      size="sm"
                      onClick={() => onStartQuiz(subject.subject)}
                    >
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Your latest quiz results</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm">{activity.title}</p>
                      <p className="text-xs text-muted-foreground">{activity.subject} • {activity.date}</p>
                    </div>
                  </div>
                  <Badge variant={activity.score >= 90 ? "default" : "secondary"}>
                    {activity.score}%
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Performance Chart */}
          <Card>
            <CardHeader>
              <CardTitle>Performance Trends</CardTitle>
              <CardDescription>Your progress over the last 5 months</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="math" fill="#6366f1" name="Math" />
                  <Bar dataKey="physics" fill="#8b5cf6" name="Physics" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Skills Radar */}
          <Card>
            <CardHeader>
              <CardTitle>Skills Assessment</CardTitle>
              <CardDescription>Your strength in different areas</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <RadarChart data={skillsData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  <Radar name="Skills" dataKey="value" stroke="#6366f1" fill="#6366f1" fillOpacity={0.6} />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle>Achievements & Badges</CardTitle>
            <CardDescription>Unlock badges by completing challenges</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {achievements.map((achievement) => (
                <div
                  key={achievement.id}
                  className={`flex flex-col items-center text-center p-4 rounded-lg border-2 transition-all ${
                    achievement.unlocked
                      ? "bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200"
                      : "bg-slate-50 border-slate-200 opacity-60"
                  }`}
                >
                  <div className="text-4xl mb-2">{achievement.icon}</div>
                  <p className="text-sm mb-1">{achievement.name}</p>
                  <p className="text-xs text-muted-foreground">{achievement.description}</p>
                  {achievement.unlocked && (
                    <Badge variant="default" className="mt-2 text-xs">Unlocked</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
}