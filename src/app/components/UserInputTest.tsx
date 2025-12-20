import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { api } from "../../services";
import { 
  ArrowLeft, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Trophy
} from "lucide-react";
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

interface InputQuestion {
  id: number;
  question: string;
  correctAnswer: string;
  acceptableAnswers?: string[]; // Alternative acceptable answers
  explanation: string;
  hint?: string;
  type: "number" | "word";
}

// API Response interfaces for review data
interface QuestionAttempt {
  questionAttemptId: string;
  questionId: string;
  questionType: string;
  difficulty: number;
  questionPayload: {
    stem: string;
    tags: string[];
    type: string;
    options?: {
      id: string;
      text: string;
    }[];
  };
  userAnswer: {
    selectedOptionId?: string;
    text?: string;
  };
  correct: boolean;
  points: number;
  timeSpentSec: number;
}

interface ExamAttemptResponse {
  attemptId: string;
  examTemplateId: string;
  templateName: string;
  templateVersion: number;
  gradeId: string;
  subjectId: string;
  topicId: string;
  examModeId: string;
  status: string;
  durationSec: number;
  totalQuestions: number;
  attempted: number;
  correct: number;
  wrong: number;
  skipped: number;
  score: number;
  percentage: number;
  startedAt: string;
  submittedAt: string;
  questions: QuestionAttempt[];
}

interface UserInputTestProps {
  subject: string;
  examAttemptId?: string; // Add attempt ID for API calls
  onBack: () => void;
  onComplete: (score: number) => void;
}

const mathInputQuestions: InputQuestion[] = [
  {
    id: 1,
    question: "What is 15 + 27?",
    correctAnswer: "42",
    explanation: "15 + 27 = 42",
    type: "number"
  },
  {
    id: 2,
    question: "What is 12 × 8?",
    correctAnswer: "96",
    explanation: "12 × 8 = 96",
    type: "number"
  },
  {
    id: 3,
    question: "What is the square root of 64?",
    correctAnswer: "8",
    explanation: "√64 = 8 because 8 × 8 = 64",
    hint: "What number multiplied by itself equals 64?",
    type: "number"
  },
  {
    id: 4,
    question: "If x + 5 = 13, what is x?",
    correctAnswer: "8",
    explanation: "x + 5 = 13, so x = 13 - 5 = 8",
    type: "number"
  },
  {
    id: 5,
    question: "What is 100 - 37?",
    correctAnswer: "63",
    explanation: "100 - 37 = 63",
    type: "number"
  },
  {
    id: 6,
    question: "Complete the sequence: 2, 4, 6, 8, __",
    correctAnswer: "10",
    explanation: "The sequence increases by 2 each time, so after 8 comes 10",
    hint: "Look for the pattern in the numbers",
    type: "number"
  },
  {
    id: 7,
    question: "What is 7²? (7 squared)",
    correctAnswer: "49",
    explanation: "7² = 7 × 7 = 49",
    type: "number"
  },
  {
    id: 8,
    question: "How many sides does a hexagon have?",
    correctAnswer: "6",
    acceptableAnswers: ["six"],
    explanation: "A hexagon has 6 sides",
    type: "number"
  },
  {
    id: 9,
    question: "What is 144 ÷ 12?",
    correctAnswer: "12",
    explanation: "144 ÷ 12 = 12",
    type: "number"
  },
  {
    id: 10,
    question: "What is 25% of 80?",
    correctAnswer: "20",
    explanation: "25% of 80 = 0.25 × 80 = 20",
    type: "number"
  },
];

const englishInputQuestions: InputQuestion[] = [
  {
    id: 1,
    question: "What is the opposite of 'hot'?",
    correctAnswer: "cold",
    explanation: "The opposite of hot is cold",
    type: "word"
  },
  {
    id: 2,
    question: "What is the plural of 'child'?",
    correctAnswer: "children",
    explanation: "The plural form of child is children",
    type: "word"
  },
  {
    id: 3,
    question: "What is the past tense of 'run'?",
    correctAnswer: "ran",
    explanation: "The past tense of run is ran",
    type: "word"
  },
  {
    id: 4,
    question: "Complete: I ___ happy. (am/is/are)",
    correctAnswer: "am",
    explanation: "The correct form is 'I am happy'",
    type: "word"
  },
  {
    id: 5,
    question: "What is a word that rhymes with 'cat'?",
    correctAnswer: "hat",
    acceptableAnswers: ["bat", "mat", "rat", "sat", "fat", "pat"],
    explanation: "Common words that rhyme with cat include: hat, bat, mat, rat, sat",
    hint: "Think of common objects or animals",
    type: "word"
  },
];

export function UserInputTest({ subject, examAttemptId, onBack, onComplete }: UserInputTestProps) {
  const questions = subject === "Math" || subject === "math" ? mathInputQuestions : englishInputQuestions;
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [userAnswers, setUserAnswers] = useState<string[]>(Array(questions.length).fill(""));
  const [currentInput, setCurrentInput] = useState("");
  const [timeRemaining, setTimeRemaining] = useState(20 * 60); // 20 minutes
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showReview, setShowReview] = useState(false);
  
  // API-related state
  const [examAttemptData, setExamAttemptData] = useState<ExamAttemptResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Load exam attempt data from API when review is requested
  const loadExamAttemptData = async (attemptId: string) => {
    try {
      setReviewLoading(true);
      setReviewError(null);
      
      const endpoint = `/v1/exam-attempts/${attemptId}`;
      console.log('Loading exam attempt data for:', attemptId);
      console.log('API endpoint:', endpoint);
      console.log('Full URL will be:', `${api.defaults.baseURL}${endpoint}`);
      
      const response = await api.get<ExamAttemptResponse>(endpoint);
      
      console.log('Exam attempt data loaded:', response.data);
      
      setExamAttemptData(response.data);
    } catch (error: any) {
      console.error('Error loading exam attempt data:', error);
      console.error('Request details:', {
        url: error.config?.url,
        method: error.config?.method,
        status: error.response?.status,
        statusText: error.response?.statusText
      });
      setReviewError(error.response?.data?.message || 'Failed to load exam attempt data');
    } finally {
      setReviewLoading(false);
    }
  };

  // Handle review button click
  const handleShowReview = async () => {
    console.log('Review button clicked, examAttemptId:', examAttemptId);
    
    if (examAttemptId) {
      console.log('Calling loadExamAttemptData with attemptId:', examAttemptId);
      await loadExamAttemptData(examAttemptId);
    } else {
      console.warn('No examAttemptId provided, using local data for review');
    }
    setShowReview(true);
  };

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

  // Load saved answer when navigating
  useEffect(() => {
    setCurrentInput(userAnswers[currentQuestion]);
    setShowHint(false);
  }, [currentQuestion]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const normalizeAnswer = (answer: string) => {
    return answer.toLowerCase().trim();
  };

  const checkAnswer = (userAnswer: string, question: InputQuestion) => {
    const normalized = normalizeAnswer(userAnswer);
    const correctNormalized = normalizeAnswer(question.correctAnswer);
    
    if (normalized === correctNormalized) return true;
    
    if (question.acceptableAnswers) {
      return question.acceptableAnswers.some(
        acceptable => normalizeAnswer(acceptable) === normalized
      );
    }
    
    return false;
  };

  const handleInputChange = (value: string) => {
    setCurrentInput(value);
    const newAnswers = [...userAnswers];
    newAnswers[currentQuestion] = value;
    setUserAnswers(newAnswers);
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
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    onComplete(percentage);
  };

  const calculateScore = () => {
    return userAnswers.reduce((acc, answer, index) => {
      return checkAnswer(answer, questions[index]) ? acc + 1 : acc;
    }, 0);
  };

  const getQuestionStatus = (index: number) => {
    if (userAnswers[index].trim() !== "") {
      if (isSubmitted) {
        return checkAnswer(userAnswers[index], questions[index]) ? "correct" : "incorrect";
      }
      return "answered";
    }
    return "unanswered";
  };

  const progress = ((currentQuestion + 1) / questions.length) * 100;

  // Results View
  if (isSubmitted && !showReview) {
    const score = calculateScore();
    const percentage = Math.round((score / questions.length) * 100);
    const correctCount = score;
    const incorrectCount = questions.length - score;
    const unansweredCount = userAnswers.filter(a => a.trim() === "").length;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-green-400 to-teal-500 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl">Test Completed! 🎉</CardTitle>
              <CardDescription>Here's how you performed</CardDescription>
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
                <div className="bg-gradient-to-r from-green-50 to-teal-50 border-2 border-green-200 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>Outstanding Performance!</p>
                  <Badge variant="default" className="mt-2">+{percentage} XP Earned</Badge>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleShowReview} className="flex-1">
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
    // Show loading state while fetching API data
    if (reviewLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center">Loading Review Data...</CardTitle>
                <CardDescription className="text-center">Please wait while we fetch your exam results</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Show error state if API call failed
    if (reviewError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <div className="max-w-4xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-center text-red-600">Error Loading Review Data</CardTitle>
                <CardDescription className="text-center">{reviewError}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button onClick={() => setShowReview(false)} variant="outline" className="w-full">
                  Back to Results
                </Button>
                <Button onClick={() => examAttemptId && loadExamAttemptData(examAttemptId)} className="w-full">
                  Try Again
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    // Use API data if available, fallback to local data
    const reviewData = examAttemptData?.questions || [];
    const hasApiData = examAttemptData !== null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setShowReview(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
            <Badge variant="outline">
              {hasApiData ? 'Review Mode (API Data)' : 'Review Mode (Local Data)'}
            </Badge>
          </div>

          {hasApiData ? (
            // API-based review
            <div className="space-y-6">
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle>Exam Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{examAttemptData.correct}</div>
                      <div className="text-sm text-gray-600">Correct</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-red-600">{examAttemptData.wrong}</div>
                      <div className="text-sm text-gray-600">Wrong</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">{examAttemptData.skipped}</div>
                      <div className="text-sm text-gray-600">Skipped</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{examAttemptData.percentage}%</div>
                      <div className="text-sm text-gray-600">Score</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {reviewData.map((questionAttempt, index) => {
                const isCorrect = questionAttempt.correct;
                const userAnswer = questionAttempt.userAnswer;
                const wasAnswered = userAnswer.selectedOptionId || userAnswer.text;

                return (
                  <Card key={questionAttempt.questionAttemptId} className={wasAnswered ? (isCorrect ? "border-green-300" : "border-red-300") : "border-slate-300"}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Question {index + 1}</Badge>
                            <Badge variant="outline">Difficulty {questionAttempt.difficulty}</Badge>
                            {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            {!isCorrect && wasAnswered && <XCircle className="h-5 w-5 text-red-600" />}
                            {!wasAnswered && <AlertCircle className="h-5 w-5 text-slate-400" />}
                          </div>
                          <CardTitle className="text-lg">{questionAttempt.questionPayload.stem}</CardTitle>
                          <div className="text-sm text-gray-600 mt-2">
                            Time spent: {questionAttempt.timeSpentSec}s | Points: {questionAttempt.points}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {questionAttempt.questionType === 'MCQ' && questionAttempt.questionPayload.options && (
                        <div className="space-y-2">
                          {questionAttempt.questionPayload.options.map((option) => {
                            const isUserChoice = userAnswer.selectedOptionId === option.id;
                            // Note: We don't have correct answer info in the API response
                            // This would need to be added to the API response to show correct answers
                            
                            let className = "w-full text-left p-3 rounded-lg border-2 ";
                            if (isUserChoice) {
                              className += isCorrect ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50";
                            } else {
                              className += "border-slate-200 bg-white";
                            }

                            return (
                              <div key={option.id} className={className}>
                                <div className="flex items-center justify-between">
                                  <span>{option.id}. {option.text}</span>
                                  <div className="flex items-center gap-2">
                                    {isUserChoice && isCorrect && <Badge className="bg-green-600">Your Correct Answer</Badge>}
                                    {isUserChoice && !isCorrect && <Badge variant="destructive">Your Wrong Answer</Badge>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {questionAttempt.questionType === 'FIB' && (
                        <div className="grid md:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-lg border-2 ${
                            wasAnswered && !isCorrect ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                          }`}>
                            <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                            <p className="text-lg">{userAnswer.text || "(Not answered)"}</p>
                          </div>
                          <div className="p-4 rounded-lg border-2 border-green-300 bg-green-50">
                            <p className="text-sm text-muted-foreground mb-1">Result:</p>
                            <p className="text-lg">{isCorrect ? "Correct" : "Incorrect"}</p>
                          </div>
                        </div>
                      )}

                      {questionAttempt.questionPayload.tags && (
                        <div className="flex flex-wrap gap-1">
                          {questionAttempt.questionPayload.tags.map((tag, tagIndex) => (
                            <Badge key={tagIndex} variant="secondary" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          ) : (
            // Fallback to local data review (existing logic)
            <div className="space-y-6">
              {questions.map((question, index) => {
                const userAnswer = userAnswers[index];
                const isCorrect = checkAnswer(userAnswer, question);
                const wasAnswered = userAnswer.trim() !== "";

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
                      <div className="grid md:grid-cols-2 gap-4">
                        <div className={`p-4 rounded-lg border-2 ${
                          wasAnswered && !isCorrect ? 'border-red-300 bg-red-50' : 'border-slate-200 bg-slate-50'
                        }`}>
                          <p className="text-sm text-muted-foreground mb-1">Your Answer:</p>
                          <p className="text-lg">{userAnswer || "(Not answered)"}</p>
                        </div>
                        <div className="p-4 rounded-lg border-2 border-green-300 bg-green-50">
                          <p className="text-sm text-muted-foreground mb-1">Correct Answer:</p>
                          <p className="text-lg">{question.correctAnswer}</p>
                        </div>
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
          )}

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
              <Badge variant="outline">Fill in the Blank</Badge>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-green-600" />
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
              <span>{userAnswers.filter(a => a.trim() !== "").length} Answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2 mb-3">
              <Badge>Question {currentQuestion + 1}</Badge>
            </div>
            <CardTitle className="text-2xl mb-4">{currentQ.question}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <label className="block text-sm mb-2">Your Answer:</label>
              <Input
                type="text"
                value={currentInput}
                onChange={(e) => handleInputChange(e.target.value)}
                placeholder="Type your answer here..."
                className="text-lg h-14"
                autoFocus
              />
            </div>

            {/* Hint */}
            {currentQ.hint && (
              <div className="text-center">
                {showHint ? (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm">💡 {currentQ.hint}</p>
                  </div>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
                    Show Hint
                  </Button>
                )}
              </div>
            )}

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

        {/* Question Palette */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Question Navigator</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
              {questions.map((_, index) => {
                const status = getQuestionStatus(index);
                let className = "w-10 h-10 rounded-lg flex items-center justify-center text-sm transition-all cursor-pointer ";
                
                if (index === currentQuestion) {
                  className += "ring-2 ring-green-600 ";
                }
                
                if (status === "answered") {
                  className += "bg-green-100 border-2 border-green-500 text-green-700";
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
          </CardContent>
        </Card>
      </div>

      {/* Submit Confirmation Dialog */}
      <AlertDialog open={showSubmitDialog} onOpenChange={setShowSubmitDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Submit Test?</AlertDialogTitle>
            <AlertDialogDescription>
              You have answered {userAnswers.filter(a => a.trim() !== "").length} out of {questions.length} questions.
              {userAnswers.filter(a => a.trim() === "").length > 0 && (
                <span className="block mt-2 text-orange-600">
                  {userAnswers.filter(a => a.trim() === "").length} question(s) are unanswered.
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
