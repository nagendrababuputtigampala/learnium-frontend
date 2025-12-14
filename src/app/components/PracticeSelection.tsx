import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, GraduationCap, BookOpen, Target } from "lucide-react";

interface PracticeSelectionProps {
  onBack: () => void;
  onSelectGrade: (grade: number) => void;
}

export function PracticeSelection({ onBack, onSelectGrade }: PracticeSelectionProps) {
  const gradeGroups = [
    { title: "Primary School", grades: [1, 2, 3, 4, 5], color: "from-green-400 to-emerald-600" },
    { title: "Middle School", grades: [6, 7, 8], color: "from-blue-400 to-indigo-600" },
    { title: "High School", grades: [9, 10, 11, 12], color: "from-purple-400 to-pink-600" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl mb-4">
            <GraduationCap className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-4xl mb-2">Practice & Prepare</h1>
          <p className="text-lg text-muted-foreground">Select your grade to start learning</p>
        </div>

        <div className="space-y-6">
          {gradeGroups.map((group) => (
            <Card key={group.title}>
              <CardHeader>
                <CardTitle className="text-xl">{group.title}</CardTitle>
                <CardDescription>Choose your current grade level</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {group.grades.map((grade) => (
                    <button
                      key={grade}
                      onClick={() => onSelectGrade(grade)}
                      className="group relative overflow-hidden rounded-xl p-6 bg-white border-2 border-slate-200 hover:border-indigo-400 transition-all hover:shadow-lg"
                    >
                      <div className={`absolute inset-0 bg-gradient-to-br ${group.color} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                      <div className="relative">
                        <div className="text-3xl mb-2">Grade {grade}</div>
                        <p className="text-xs text-muted-foreground">Click to select</p>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-8">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <Target className="h-8 w-8 text-indigo-600 mb-3" />
              <h3 className="mb-2">Targeted Practice</h3>
              <p className="text-sm text-muted-foreground">
                Focus on specific topics you want to improve
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="pt-6">
              <BookOpen className="h-8 w-8 text-purple-600 mb-3" />
              <h3 className="mb-2">Multiple Formats</h3>
              <p className="text-sm text-muted-foreground">
                Practice with quizzes, flashcards, and interactive games
              </p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="pt-6">
              <GraduationCap className="h-8 w-8 text-green-600 mb-3" />
              <h3 className="mb-2">Track Progress</h3>
              <p className="text-sm text-muted-foreground">
                Monitor your improvement with detailed analytics
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
