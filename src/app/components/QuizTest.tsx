import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  ArrowLeft, 
  ArrowRight, 
  Flag, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  RotateCcw
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  image?: string;
  type: "text" | "image";
}

interface QuizTestProps {
  subject: string;
  onBack: () => void;
  onComplete: (score: number) => void;
}

// Mock quiz questions with some having images
const mathQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is 15 × 12?",
    options: ["150", "180", "200", "175"],
    correctAnswer: 1,
    explanation: "15 × 12 = 180. You can break it down as (15 × 10) + (15 × 2) = 150 + 30 = 180",
    type: "text"
  },
  {
    id: 2,
    question: "If a triangle has angles of 60° and 80°, what is the third angle?",
    options: ["30°", "40°", "50°", "60°"],
    correctAnswer: 1,
    explanation: "The sum of angles in a triangle is 180°. So 180° - 60° - 80° = 40°",
    type: "text"
  },
  {
    id: 3,
    question: "What is the area of a circle with radius 7 cm? (Use π ≈ 22/7)",
    options: ["154 cm²", "144 cm²", "164 cm²", "174 cm²"],
    correctAnswer: 0,
    explanation: "Area = πr² = (22/7) × 7 × 7 = 154 cm²",
    type: "text"
  },
  {
    id: 4,
    question: "What is 25% of 200?",
    options: ["25", "50", "75", "100"],
    correctAnswer: 1,
    explanation: "25% of 200 = (25/100) × 200 = 0.25 × 200 = 50",
    type: "text"
  },
  {
    id: 5,
    question: "If x + 7 = 15, what is the value of x?",
    options: ["6", "7", "8", "9"],
    correctAnswer: 2,
    explanation: "x + 7 = 15, so x = 15 - 7 = 8",
    type: "text"
  },
  {
    id: 6,
    question: "What is the value of √144?",
    options: ["10", "11", "12", "13"],
    correctAnswer: 2,
    explanation: "√144 = 12, because 12 × 12 = 144",
    type: "text"
  },
  {
    id: 7,
    question: "Solve: 3(x + 4) = 24",
    options: ["x = 4", "x = 6", "x = 8", "x = 10"],
    correctAnswer: 0,
    explanation: "3(x + 4) = 24 → x + 4 = 8 → x = 4",
    type: "text"
  },
  {
    id: 8,
    question: "What is the perimeter of a rectangle with length 8 cm and width 5 cm?",
    options: ["13 cm", "26 cm", "40 cm", "52 cm"],
    correctAnswer: 1,
    explanation: "Perimeter = 2(length + width) = 2(8 + 5) = 2(13) = 26 cm",
    type: "text"
  },
];

const physicsQuestions: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the SI unit of force?",
    options: ["Joule", "Newton", "Watt", "Pascal"],
    correctAnswer: 1,
    explanation: "The SI unit of force is Newton (N), named after Sir Isaac Newton",
    type: "text"
  },
  {
    id: 2,
    question: "What is the speed of light in vacuum?",
    options: ["3 × 10⁸ m/s", "3 × 10⁶ m/s", "3 × 10⁷ m/s", "3 × 10⁹ m/s"],
    correctAnswer: 0,
    explanation: "The speed of light in vacuum is approximately 3 × 10⁸ m/s or 300,000 km/s",
    type: "text"
  },
  {
    id: 3,
    question: "According to Newton's First Law, an object at rest will:",
    options: ["Start moving", "Stay at rest unless acted upon by a force", "Accelerate", "Decelerate"],
    correctAnswer: 1,
    explanation: "Newton's First Law states that an object at rest stays at rest unless acted upon by an external force",
    type: "text"
  },
  {
    id: 4,
    question: "What type of energy does a stretched rubber band have?",
    options: ["Kinetic", "Potential", "Thermal", "Chemical"],
    correctAnswer: 1,
    explanation: "A stretched rubber band has elastic potential energy stored in it",
    type: "text"
  },
  {
    id: 5,
    question: "If you double the mass of an object, its weight will:",
    options: ["Stay the same", "Double", "Triple", "Quadruple"],
    correctAnswer: 1,
    explanation: "Weight = mass × gravity. If mass doubles, weight also doubles (assuming gravity is constant)",
    type: "text"
  },
  {
    id: 6,
    question: "What is the formula for kinetic energy?",
    options: ["KE = mv", "KE = ½mv²", "KE = mgh", "KE = mv²"],
    correctAnswer: 1,
    explanation: "Kinetic energy is given by KE = ½mv², where m is mass and v is velocity",
    type: "text"
  },
  {
    id: 7,
    question: "What happens to the volume of a gas when pressure increases (temperature constant)?",
    options: ["Increases", "Decreases", "Stays same", "Doubles"],
    correctAnswer: 1,
    explanation: "According to Boyle's Law, when pressure increases, volume decreases (at constant temperature)",
    type: "text"
  },
  {
    id: 8,
    question: "What is the unit of electrical resistance?",
    options: ["Volt", "Ampere", "Ohm", "Watt"],
    correctAnswer: 2,
    explanation: "The SI unit of electrical resistance is Ohm (Ω)",
    type: "text"
  },
];

export function QuizTest({ subject, onBack, onComplete }: QuizTestProps) {
  const questions = subject === "Math" ? mathQuestions : physicsQuestions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>(Array(questions.length).fill(null));
  const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>(Array(questions.length).fill(false));
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);

  // Timer effect
  useEffect(() => {
    if (isSubmitted) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isSubmitted]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleAnswerSelect = (optionIndex: number) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[currentQuestion] = optionIndex;
    setSelectedAnswers(newAnswers);
  };

  const handleFlagToggle = () => {
    const newFlagged = [...flaggedQuestions];
    newFlagged[currentQuestion] = !newFlagged[currentQuestion];
    setFlaggedQuestions(newFlagged);
  };

  const handleNext = () => {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    setIsSubmitted(true);
    setShowSubmitDialog(false);
    const score = selectedAnswers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
    const percentage = Math.round((score / questions.length) * 100);
    onComplete(percentage);
  };

  const calculateScore = () => {
    return selectedAnswers.reduce((acc, answer, index) => {
      return answer === questions[index].correctAnswer ? acc + 1 : acc;
    }, 0);
  };

  const getQuestionStatus = (index: number) => {
    if (selectedAnswers[index] !== null) {
      if (isSubmitted) {
        return selectedAnswers[index] === questions[index].correctAnswer ? "correct" : "incorrect";
      }
      return "answered";
    }
    if (flaggedQuestions[index]) return "flagged";
    return "unanswered";
  };

  // Results View
  if (isSubmitted && !showReview) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    const correctCount = score;
    const incorrectCount = questions.length - score;
    const unansweredCount = selectedAnswers.filter(a => a === null).length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4">
                <CheckCircle2 className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl">Test Completed! 🎉</CardTitle>
              <CardDescription>Here's how you performed in {subject}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-2">{percentage}%</div>
                <p className="text-muted-foreground">
                  You got {score} out of {questions.length} questions correct
                </p>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Correct</p>
                  <p className="text-2xl">{correctCount}</p>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                  <XCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Incorrect</p>
                  <p className="text-2xl">{incorrectCount}</p>
                </div>
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 text-center">
                  <AlertCircle className="h-8 w-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Skipped</p>
                  <p className="text-2xl">{unansweredCount}</p>
                </div>
              </div>

              {percentage >= 80 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>Excellent Performance!</p>
                  <Badge variant="default" className="mt-2">+{percentage} XP Earned</Badge>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={() => setShowReview(true)} className="flex-1">
                  Review Answers
                </Button>
                <Button onClick={onBack} className="flex-1">
                  Back to Dashboard
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review Mode
  if (showReview) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setShowReview(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
            <Badge variant="outline">Review Mode</Badge>
          </div>

          <div className="space-y-6">
            {questions.map((question, index) => {
              const userAnswer = selectedAnswers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              const wasAnswered = userAnswer !== null;

              return (
                <Card key={question.id} className={wasAnswered ? (isCorrect ? "border-green-300" : "border-red-300") : "border-slate-300"}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">Question {index + 1}</Badge>
                          {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                          {!isCorrect && wasAnswered && <XCircle className="h-5 w-5 text-red-600" />}
                          {!wasAnswered && <AlertCircle className="h-5 w-5 text-slate-400" />}
                        </div>
                        <CardTitle className="text-lg">{question.question}</CardTitle>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {question.image && (
                      <div className="rounded-lg overflow-hidden border">
                        <ImageWithFallback 
                          src={question.image} 
                          alt="Question diagram"
                          className="w-full max-h-64 object-contain bg-white"
                        />
                      </div>
                    )}

                    <div className="space-y-2">
                      {question.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex;
                        const isCorrectOption = optionIndex === question.correctAnswer;
                        
                        let className = "w-full text-left p-4 rounded-lg border-2 ";
                        if (isCorrectOption) {
                          className += "border-green-500 bg-green-50";
                        } else if (isUserAnswer && !isCorrectOption) {
                          className += "border-red-500 bg-red-50";
                        } else {
                          className += "border-slate-200 bg-white";
                        }

                        return (
                          <div key={optionIndex} className={className}>
                            <div className="flex items-center justify-between">
                              <span>{option}</span>
                              <div className="flex items-center gap-2">
                                {isCorrectOption && <Badge className="bg-green-600">Correct Answer</Badge>}
                                {isUserAnswer && !isCorrectOption && <Badge variant="destructive">Your Answer</Badge>}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                      <p className="text-sm">
                        <strong>Explanation:</strong> {question.explanation}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={onBack} size="lg">
              Back to Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Test Taking View
  const currentQ = questions[currentQuestion];
  const progress = ((currentQuestion + 1) / questions.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => setShowSubmitDialog(true)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Exit
              </Button>
              <Badge variant="outline">{subject} Quiz</Badge>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-indigo-600" />
                <span className={`text-lg ${timeRemaining < 300 ? 'text-red-600' : ''}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>
              <Button onClick={() => setShowSubmitDialog(true)} variant="default">
                Submit Test
              </Button>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-sm mb-2">
              <span>Question {currentQuestion + 1} of {questions.length}</span>
              <span>{selectedAnswers.filter(a => a !== null).length} Answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          {/* Main Question Area */}
          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge>Question {currentQuestion + 1}</Badge>
                      {flaggedQuestions[currentQuestion] && (
                        <Badge variant="outline" className="text-orange-600 border-orange-600">
                          <Flag className="h-3 w-3 mr-1 fill-orange-600" />
                          Flagged
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-xl">{currentQ.question}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleFlagToggle}
                    className={flaggedQuestions[currentQuestion] ? "text-orange-600" : ""}
                  >
                    <Flag className={`h-5 w-5 ${flaggedQuestions[currentQuestion] ? 'fill-orange-600' : ''}`} />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {currentQ.image && (
                  <div className="rounded-lg overflow-hidden border bg-white">
                    <ImageWithFallback 
                      src={currentQ.image} 
                      alt="Question diagram"
                      className="w-full max-h-96 object-contain p-4"
                    />
                  </div>
                )}

                <div className="space-y-3">
                  {currentQ.options.map((option, index) => {
                    const isSelected = selectedAnswers[currentQuestion] === index;
                    
                    return (
                      <button
                        key={index}
                        onClick={() => handleAnswerSelect(index)}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-all hover:shadow-md ${
                          isSelected 
                            ? 'border-indigo-500 bg-indigo-50' 
                            : 'border-slate-200 bg-white hover:border-indigo-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-indigo-600 bg-indigo-600' : 'border-slate-300'
                          }`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                          </div>
                          <span>{option}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Navigation Buttons */}
                <div className="flex items-center justify-between pt-4 border-t">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestion === 0}
                  >
                    <ChevronLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>
                  <Button
                    onClick={handleNext}
                    disabled={currentQuestion === questions.length - 1}
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Question Palette */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardHeader>
                <CardTitle className="text-lg">Question Palette</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {questions.map((_, index) => {
                    const status = getQuestionStatus(index);
                    let className = "w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ";
                    
                    if (index === currentQuestion) {
                      className += "ring-2 ring-indigo-600 ";
                    }
                    
                    if (status === "answered") {
                      className += "bg-green-100 border-2 border-green-500 text-green-700";
                    } else if (status === "flagged") {
                      className += "bg-orange-100 border-2 border-orange-500 text-orange-700";
                    } else {
                      className += "bg-slate-100 border-2 border-slate-300 text-slate-600";
                    }

                    return (
                      <button
                        key={index}
                        onClick={() => setCurrentQuestion(index)}
                        className={className}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="space-y-2 text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-green-100 border border-green-500"></div>
                    <span>Answered</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-orange-100 border border-orange-500"></div>
                    <span>Flagged</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300"></div>
                    <span>Not Answered</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {selectedAnswers.filter(a => a !== null).length} out of {questions.length} questions.
              {selectedAnswers.filter(a => a === null).length > 0 && (
                <span className="block mt-2 text-orange-600">
                  {selectedAnswers.filter(a => a === null).length} question(s) are unanswered.
                </span>
              )}
              <span className="block mt-2">
                Are you sure you want to submit your test?
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Continue Test</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit Test</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
