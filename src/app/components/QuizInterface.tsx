import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Progress } from "./ui/progress";
import { Badge } from "./ui/badge";
import { ArrowLeft, CheckCircle2, XCircle, Clock, Trophy } from "lucide-react";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface QuizInterfaceProps {
  subject: string;
  onBack: () => void;
  onComplete: (score: number) => void;
}

// Mock quiz questions
const mathQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is 15 × 12?",
    options: ["150", "180", "200", "175"],
    correctAnswer: 1,
    explanation: "15 × 12 = 180. You can break it down as (15 × 10) + (15 × 2) = 150 + 30 = 180"
  },
  {
    id: 2,
    question: "If a triangle has angles of 60° and 80°, what is the third angle?",
    options: ["30°", "40°", "50°", "60°"],
    correctAnswer: 1,
    explanation: "The sum of angles in a triangle is 180°. So 180° - 60° - 80° = 40°"
  },
  {
    id: 3,
    question: "What is the value of √144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    explanation: "√144 = 12, because 12 × 12 = 144"
  },
  {
    id: 4,
    question: "What is 25% of 200?",
    options: ["25", "50", "75", "100"],
    correctAnswer: 1,
    explanation: "25% of 200 = (25/100) × 200 = 0.25 × 200 = 50"
  },
  {
    id: 5,
    question: "If x + 7 = 15, what is the value of x?",
    options: ["6", "7", "8", "9"],
    correctAnswer: 2,
    explanation: "x + 7 = 15, so x = 15 - 7 = 8"
  },
];

const physicsQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the SI unit of force?",
    options: ["Joule", "Newton", "Watt", "Pascal"],
    correctAnswer: 1,
    explanation: "The SI unit of force is Newton (N), named after Sir Isaac Newton"
  },
  {
    id: 2,
    question: "What is the speed of light in vacuum?",
    options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁷ m/s", "3 × 10⁹ m/s"],
    correctAnswer: 0,
    explanation: "The speed of light in vacuum is approximately 3 × 10⁸ m/s or 300,000 km/s"
  },
  {
    id: 3,
    question: "According to Newton's First Law, an object at rest will:",
    options: ["Start moving", "Stay at rest unless acted upon by a force", "Accelerate", "Decelerate"],
    correctAnswer: 1,
    explanation: "Newton's First Law states that an object at rest stays at rest unless acted upon by an external force"
  },
  {
    id: 4,
    question: "What type of energy does a stretched rubber band have?",
    options: ["Kinetic", "Potential", "Thermal", "Chemical"],
    correctAnswer: 1,
    explanation: "A stretched rubber band has elastic potential energy stored in it"
  },
  {
    id: 5,
    question: "If you double the mass of an object, its weight will:",
    options: ["Stay the same", "Double", "Triple", "Quadruple"],
    correctAnswer: 1,
    explanation: "Weight = mass × gravity. If mass doubles, weight also doubles (assuming gravity is constant)"
  },
];

export function QuizInterface({ subject, onBack, onComplete }: QuizInterfaceProps) {
  const questions = subject === "Math" ? mathQuestions : physicsQuestions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState(0);

  const handleAnswer = (optionIndex: number) => {
    setSelectedAnswer(optionIndex);
  };

  const handleNext = () => {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (selectedAnswer === questions[currentQuestion].correctAnswer) {
      setScore(score + 1);
    }

    setShowResult(true);
  };

  const handleContinue = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizCompleted(true);
    }
  };

  const handleRetry = () => {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setAnswers(Array(questions.length).fill(null));
    setQuizCompleted(false);
    setTimeElapsed(0);
  };

  const handleFinish = () => {
    const finalScore = Math.round((score / questions.length) * 100);
    onComplete(finalScore);
    onBack();
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;
  const finalPercentage = Math.round((score / questions.length) * 100);

  if (quizCompleted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-2xl">Quiz Completed! 🎉</CardTitle>
              <CardDescription>Great job on finishing the {subject} quiz</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-2">{finalPercentage}%</div>
                <p className="text-muted-foreground">
                  You got {score} out of {questions.length} questions correct
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-2xl">{score}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                  <p className="text-2xl">{questions.length - score}</p>
                </div>
              </div>

              {finalPercentage >= 80 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p className="text-sm">Excellent Performance!</p>
                  <Badge variant="default" className="mt-2">+50 XP</Badge>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleRetry} className="flex-1">
                  Retry Quiz
                </Button>
                <Button onClick={handleFinish} className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant="outline">{subject} Quiz</Badge>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">
              Question {currentQuestion + 1} of {questions.length}
            </span>
            <span className="text-sm text-muted-foreground">
              Score: {score}/{currentQuestion + (showResult ? 1 : 0)}
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              {questions[currentQuestion].question}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {questions[currentQuestion].options.map((option, index) => {
                const isCorrect = index === questions[currentQuestion].correctAnswer;
                const isSelected = selectedAnswer === index;
                
                let buttonVariant: "outline" | "default" | "destructive" = "outline";
                let buttonClass = "";
                
                if (showResult) {
                  if (isCorrect) {
                    buttonClass = "border-green-500 bg-green-50 text-green-700";
                  } else if (isSelected && !isCorrect) {
                    buttonClass = "border-red-500 bg-red-50 text-red-700";
                  }
                } else if (isSelected) {
                  buttonClass = "border-indigo-500 bg-indigo-50";
                }

                return (
                  <button
                    key={index}
                    onClick={() => !showResult && handleAnswer(index)}
                    disabled={showResult}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md disabled:cursor-not-allowed ${buttonClass}`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{option}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="h-5 w-5 text-red-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {showResult && (
              <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm">
                  <strong>Explanation:</strong> {questions[currentQuestion].explanation}
                </p>
              </div>
            )}

            <div className="flex justify-end pt-4">
              {!showResult ? (
                <Button
                  onClick={handleNext}
                  disabled={selectedAnswer === null}
                >
                  Submit Answer
                </Button>
              ) : (
                <Button onClick={handleContinue}>
                  {currentQuestion < questions.length - 1 ? "Next Question" : "View Results"}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
