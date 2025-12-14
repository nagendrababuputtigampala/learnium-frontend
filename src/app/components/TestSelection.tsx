import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { ArrowLeft, BookOpen, Layers, Edit3, Gamepad2 } from "lucide-react";

interface TestSelectionProps {
  subject: string;
  onBack: () => void;
  onSelectType: (type: "quiz" | "flashcard" | "input" | "games") => void;
}

export function TestSelection({ subject, onBack, onSelectType }: TestSelectionProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">Choose Your Test Type</h1>
          <p className="text-muted-foreground">Select how you'd like to practice {subject}</p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Quiz Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-indigo-300" onClick={() => onSelectType("quiz")}>
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Quiz Test</CardTitle>
              <CardDescription>Multiple choice questions with timer</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span>Timed test environment</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span>Multiple choice questions</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span>Flag questions for review</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                  <span>Detailed score analysis</span>
                </div>
              </div>
              <Button className="w-full mt-4" onClick={() => onSelectType("quiz")}>
                Start Quiz Test
              </Button>
            </CardContent>
          </Card>

          {/* Flashcard Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-purple-300" onClick={() => onSelectType("flashcard")}>
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Flashcard</CardTitle>
              <CardDescription>Learn at your own pace with flashcards</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Self-paced learning</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Flip cards to see answers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Mark cards as learned</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-purple-500 rounded-full"></div>
                  <span>Review difficult concepts</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-purple-600 hover:bg-purple-700" onClick={() => onSelectType("flashcard")}>
                Start Flashcards
              </Button>
            </CardContent>
          </Card>

          {/* User Input Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-green-300" onClick={() => onSelectType("input")}>
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mb-4">
                <Edit3 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Fill in the Blank</CardTitle>
              <CardDescription>Type your answers directly</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Type numerical answers</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>One-word responses</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Instant feedback</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div>
                  <span>Perfect for math problems</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={() => onSelectType("input")}>
                Start Practice
              </Button>
            </CardContent>
          </Card>

          {/* Games Card */}
          <Card className="cursor-pointer hover:shadow-lg transition-all hover:border-orange-300" onClick={() => onSelectType("games")}>
            <CardHeader>
              <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center mb-4">
                <Gamepad2 className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl">Learning Games</CardTitle>
              <CardDescription>Fun interactive educational games</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Interactive gameplay</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Learn through play</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Engaging challenges</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-orange-500 rounded-full"></div>
                  <span>Earn bonus points</span>
                </div>
              </div>
              <Button className="w-full mt-4 bg-orange-600 hover:bg-orange-700" onClick={() => onSelectType("games")}>
                Play Games
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}