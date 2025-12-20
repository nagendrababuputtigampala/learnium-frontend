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
  RotateCcw,
  Target,
  Trophy,
  Medal,
  Star,
  ThumbsUp,
  Frown
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { ExamService, type Question, type ProcessedQuestion, type TestWithQuestions, type SubmissionAnswer, type SubmissionRequest, type SubmissionResponse, type ReviewResponse, type ReviewQuestionAttempt, submitExamAttempt, getExamAttemptReview } from "../../services";

interface UserData {
  userId?: string; // Make userId optional
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
  userId: string;
  level: number;
  xp: number;
  totalXp: number;
  percentile: number;
  badges: string[];
}
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

// QuizQuestion interface replaced by ProcessedQuestion from services

interface QuizTestProps {
  grade: string;
  subject: string;
  topic: string;
  examModeId: string;
  examId: string; // This is actually the examTemplateId from the new API
  user: UserData;
  onBack: () => void;
  onComplete: (score: number) => void;
  onBackToDashboard: () => void; // Add new prop for dashboard navigation
}

// Note: Questions are now loaded dynamically from API

export function QuizTest({ grade, subject, topic, examModeId, examId, user, onBack, onComplete, onBackToDashboard }: QuizTestProps) {
  // Helper function to process API questions into UI-compatible format
  const processQuestion = (apiQuestion: Question, index: number): ProcessedQuestion => {
    // Handle the new nested payload structure
    const payload = apiQuestion.payload;
    
    if (payload.type === 'MCQ' && payload.options) {
      // Multiple Choice Question
      const correctAnswerIndex = payload.options.findIndex((option: any) => option.isCorrect);
      
      return {
        id: apiQuestion.questionId,
        question: payload.stem || `Question ${index + 1}`,
        options: payload.options.map((option: any) => option.text || 'Option'),
        correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
        explanation: payload.explanation || 'No explanation available',
        type: 'MCQ'
      };
    } else if (payload.type === 'FIB' && payload.blanks) {
      // Fill in the Blank Question
      return {
        id: apiQuestion.questionId,
        question: payload.stem || `Question ${index + 1}`,
        options: [], // FIB doesn't have multiple choice options
        correctAnswer: -1, // FIB doesn't have a single correct answer index
        explanation: payload.explanation || 'No explanation available',
        type: 'FIB',
        blanks: payload.blanks
      };
    } else {
      // Fallback for legacy format or unknown question types
      console.warn('Unknown or legacy question type:', payload.type, apiQuestion);
      
      // Try to handle legacy format
      const legacyOptions = (apiQuestion as any).options;
      if (legacyOptions && Array.isArray(legacyOptions)) {
        const correctAnswerIndex = legacyOptions.findIndex((option: any) => option.isCorrect);
        return {
          id: apiQuestion.questionId,
          question: (apiQuestion as any).questionText || payload.stem || `Question ${index + 1}`,
          options: legacyOptions.map((option: any) => option.optionText || option.text || 'Option'),
          correctAnswer: correctAnswerIndex >= 0 ? correctAnswerIndex : 0,
          explanation: (apiQuestion as any).answerExplanation || payload.explanation || 'No explanation available',
          type: 'text'
        };
      }
      
      return {
        id: apiQuestion.questionId,
        question: payload.stem || 'Question not available',
        options: [],
        correctAnswer: -1,
        explanation: "Question format not supported.",
        type: 'unknown'
      };
    }
  };

  const [questions, setQuestions] = useState<ProcessedQuestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<(number | null)[]>([]);
  const [flaggedQuestions, setFlaggedQuestions] = useState<boolean[]>([]);
  const [timeRemaining, setTimeRemaining] = useState(30 * 60); // 30 minutes in seconds
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showSubmitDialog, setShowSubmitDialog] = useState(false);
  const [showReview, setShowReview] = useState(false);
  const [showQuestionPalette, setShowQuestionPalette] = useState(false);
  
  // New state for submission tracking
  const [examAttemptId] = useState<string>(() => crypto.randomUUID()); // Generate unique attempt ID
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [questionTimeSpent, setQuestionTimeSpent] = useState<number[]>([]);
  const [testMetadata, setTestMetadata] = useState<TestWithQuestions | null>(null);
  const [totalTestTime, setTotalTestTime] = useState<number>(0);
  const [submissionResult, setSubmissionResult] = useState<any>(null);
  const [reviewData, setReviewData] = useState<ReviewResponse | null>(null);
  const [reviewLoading, setReviewLoading] = useState<boolean>(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Function to load review data from API
  const loadReviewData = async () => {
    if (!submissionResult?.attemptId) {
      console.error('No attempt ID available for review');
      setReviewError('No attempt ID available for review');
      return;
    }

    try {
      setReviewLoading(true);
      setReviewError(null);
      
      console.log('Loading review data for attempt:', submissionResult.attemptId);
      const reviewResponse = await getExamAttemptReview(submissionResult.attemptId);
      
      console.log('Review data loaded successfully:', reviewResponse);
      setReviewData(reviewResponse);
    } catch (error: any) {
      console.error('Error loading review data:', error);
      setReviewError(error.message || 'Failed to load review data');
    } finally {
      setReviewLoading(false);
    }
  };

  // Function to get icon and styling based on performance
  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 90) {
      return {
        icon: Trophy,
        color: "text-yellow-500",
        bgColor: "bg-yellow-100",
        title: "Excellent!",
        message: "Outstanding performance! You're a star!"
      };
    } else if (percentage >= 80) {
      return {
        icon: Medal,
        color: "text-blue-500",
        bgColor: "bg-blue-100",
        title: "Great Job!",
        message: "Very good performance! Keep it up!"
      };
    } else if (percentage >= 70) {
      return {
        icon: Star,
        color: "text-green-500",
        bgColor: "bg-green-100",
        title: "Well Done!",
        message: "Good work! You're on the right track!"
      };
    } else if (percentage >= 60) {
      return {
        icon: ThumbsUp,
        color: "text-orange-500",
        bgColor: "bg-orange-100",
        title: "Good Effort!",
        message: "Nice try! A little more practice will help!"
      };
    } else if (percentage >= 40) {
      return {
        icon: Target,
        color: "text-red-400",
        bgColor: "bg-red-100",
        title: "Keep Trying!",
        message: "Don't give up! Practice makes perfect!"
      };
    } else {
      return {
        icon: Frown,
        color: "text-red-500",
        bgColor: "bg-red-100",
        title: "Need More Practice",
        message: "Review the material and try again!"
      };
    }
  };

  // Load questions from API when component mounts
  useEffect(() => {
    const fetchQuestions = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('Fetching test with questions for examTemplateId:', examId);
        
        // Use the new API method that gets test metadata and questions together
        const testWithQuestions = await ExamService.getTestWithQuestions(examId);
        
        console.log('Received test with questions:', testWithQuestions);
        
        // Store test metadata for submission
        setTestMetadata(testWithQuestions);
        
        // Process API questions into UI-compatible format
        const processedQuestions = testWithQuestions.questions.map((apiQuestion, index) => 
          processQuestion(apiQuestion, index)
        );
        
        console.log('Processed questions:', processedQuestions);
        
        setQuestions(processedQuestions);
        
        // Set timer based on test duration (convert seconds to seconds)
        if (testWithQuestions.durationSeconds) {
          setTimeRemaining(testWithQuestions.durationSeconds);
          setTotalTestTime(testWithQuestions.durationSeconds);
        }
        
        // Initialize arrays based on question count
        setSelectedAnswers(Array(processedQuestions.length).fill(null));
        setFlaggedQuestions(Array(processedQuestions.length).fill(false));
        setQuestionTimeSpent(Array(processedQuestions.length).fill(0));
        
        // Reset start time for first question
        setQuestionStartTime(Date.now());
      } catch (error: any) {
        console.error('Error fetching questions:', error);
        setError(error.message || 'Failed to load questions');
        // Set empty arrays for error state
        setQuestions([]);
        setSelectedAnswers([]);
        setFlaggedQuestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [examId]);

  // Timer effect - only start after questions are loaded
  useEffect(() => {
    if (isSubmitted || isLoading || error || questions.length === 0) return;

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
  }, [isSubmitted, isLoading, error, questions.length]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  // Track time spent on current question
  const recordQuestionTime = () => {
    const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
    const newTimeSpent = [...questionTimeSpent];
    newTimeSpent[currentQuestion] = (newTimeSpent[currentQuestion] || 0) + timeSpent;
    setQuestionTimeSpent(newTimeSpent);
    setQuestionStartTime(Date.now());
  };

  // Navigate to a different question
  const navigateToQuestion = (newQuestionIndex: number) => {
    if (newQuestionIndex >= 0 && newQuestionIndex < questions.length && newQuestionIndex !== currentQuestion) {
      recordQuestionTime(); // Record time spent on current question
      setCurrentQuestion(newQuestionIndex);
    }
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
      navigateToQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      navigateToQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      // Record final question time
      recordQuestionTime();
      
      if (!testMetadata) {
        throw new Error('Test metadata not available');
      }

      // Calculate total duration spent
      const totalDuration = totalTestTime - timeRemaining;
      
      // Prepare submission answers
      const submissionAnswers: SubmissionAnswer[] = questions.map((question, index) => {
        const selectedAnswer = selectedAnswers[index];
        const timeSpent = questionTimeSpent[index] || 0;
        
        // Create answer object based on question type
        let answerObj: { selectedOptionId?: string; text?: string } = {};
        
        if (question.type === 'MCQ' && selectedAnswer !== null) {
          // For MCQ, use option letters (A, B, C, D)
          const optionLetters = ['A', 'B', 'C', 'D'];
          answerObj.selectedOptionId = optionLetters[selectedAnswer];
        } else if (question.type === 'FIB') {
          // For FIB, would need text input (not implemented in current UI)
          answerObj.text = ''; // TODO: Implement FIB answer collection
        }
        
        return {
          questionId: question.id.toString(), // Convert to string
          answer: answerObj,
          timeSpentSec: timeSpent
        };
      });

      const submissionRequest: SubmissionRequest = {
        userId: user.userId || user.email, // Use userId if available, fallback to email for backward compatibility
        examTemplateId: testMetadata.examTemplateId,
        durationSec: totalDuration,
        answers: submissionAnswers
      };

      console.log('Submitting exam attempt:', {
        examAttemptId,
        submissionRequest
      });

      // Submit to backend
      const result = await submitExamAttempt(examAttemptId, submissionRequest);
      
      console.log('Submission successful:', result);
      
      // Store the submission result to display completion screen
      setSubmissionResult(result);
      setIsSubmitted(true);
      setShowSubmitDialog(false);
      
    } catch (error: any) {
      console.error('Error submitting exam:', error);
      
      // Fallback: create a mock result with local scoring if submission fails
      const localScore = calculateScore();
      const localPercentage = Math.round((localScore / questions.length) * 100);
      
      const fallbackResult: SubmissionResponse = {
        attemptId: examAttemptId,
        status: "SUBMITTED",
        totalQuestions: questions.length,
        attempted: selectedAnswers.filter(answer => answer !== null).length,
        correct: localScore,
        wrong: selectedAnswers.filter((answer, index) => answer !== null && answer !== questions[index].correctAnswer).length,
        skipped: selectedAnswers.filter(answer => answer === null).length,
        score: localScore,
        percentage: localPercentage,
        submittedAt: new Date().toISOString()
      };
      
      setSubmissionResult(fallbackResult);
      setIsSubmitted(true);
      setShowSubmitDialog(false);
    }
  };

  const calculateScore = (): number => {
    return selectedAnswers.reduce((acc: number, answer, index) => {
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

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">Loading Questions...</CardTitle>
            <CardDescription className="text-center">Please wait while we prepare your {subject} quiz</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center text-red-600">Error Loading Questions</CardTitle>
            <CardDescription className="text-center">{error}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <Button onClick={onBack} variant="outline" className="w-full">
              Back to Tests
            </Button>
            <Button 
              onClick={() => window.location.reload()} 
              className="w-full"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // No questions state
  if (questions.length === 0 && !isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-center">No Questions Available</CardTitle>
            <CardDescription className="text-center">This quiz doesn't have any questions yet.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} className="w-full">
              Back to Tests
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Test Completion Screen - Show submission results
  if (isSubmitted && !showReview && submissionResult) {
    const formatDate = (dateString: string) => {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' at ' + date.toLocaleTimeString();
    };

    const getScoreColor = (percentage: number) => {
      if (percentage >= 80) return 'text-green-600';
      if (percentage >= 60) return 'text-yellow-600';
      return 'text-red-600';
    };

    const getScoreBadgeColor = (percentage: number) => {
      if (percentage >= 80) return 'bg-gradient-to-br from-green-400 to-green-500';
      if (percentage >= 60) return 'bg-gradient-to-br from-yellow-400 to-yellow-500';
      return 'bg-gradient-to-br from-red-400 to-red-500';
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              {(() => {
                const performance = getPerformanceIcon(submissionResult.percentage);
                const PerformanceIcon = performance.icon;
                return (
                  <>
                    <div className={`mx-auto w-20 h-20 ${performance.bgColor} rounded-full flex items-center justify-center mb-4`}>
                      <PerformanceIcon className={`h-10 w-10 ${performance.color}`} />
                    </div>
                    <CardTitle className="text-3xl">{performance.title}</CardTitle>
                    <CardDescription>{performance.message}</CardDescription>
                  </>
                );
              })()}
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* Score Display */}
              <div className="text-center">
                <div className={`text-6xl font-bold mb-2 ${getScoreColor(submissionResult.percentage)}`}>
                  {submissionResult.percentage.toFixed(1)}%
                </div>
                <div className="text-lg text-slate-600">
                  {submissionResult.correct} out of {submissionResult.totalQuestions} questions correct
                </div>
                <div className="text-sm text-slate-500 mt-2">
                  Attempt ID: {submissionResult.attemptId}
                </div>
                <div className="text-sm text-slate-500">
                  Submitted: {formatDate(submissionResult.submittedAt)}
                </div>
              </div>

              {/* Detailed Breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 border-green-200 bg-green-50">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                    <span className="font-medium text-green-700">Correct</span>
                  </div>
                  <div className="text-2xl font-bold text-green-600">{submissionResult.correct}</div>
                </Card>
                
                <Card className="p-4 border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-2">
                    <XCircle className="h-5 w-5 text-red-600" />
                    <span className="font-medium text-red-700">Wrong</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">{submissionResult.wrong}</div>
                </Card>
                
                <Card className="p-4 border-gray-200 bg-gray-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="h-5 w-5 text-gray-600" />
                    <span className="font-medium text-gray-700">Skipped</span>
                  </div>
                  <div className="text-2xl font-bold text-gray-600">{submissionResult.skipped}</div>
                </Card>
                
                <Card className="p-4 border-blue-200 bg-blue-50">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="h-5 w-5 text-blue-600" />
                    <span className="font-medium text-blue-700">Attempted</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">{submissionResult.attempted}</div>
                </Card>
              </div>

              {/* Performance Message */}
              <Card className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50">
                <div className="text-center">
                  <h3 className="font-semibold text-lg mb-2">
                    {submissionResult.percentage >= 80 ? "Excellent Work! 🌟" :
                     submissionResult.percentage >= 60 ? "Good Job! 👍" :
                     "Keep Practicing! 💪"}
                  </h3>
                  <p className="text-slate-600">
                    {submissionResult.percentage >= 80 ? "Outstanding performance! You've mastered this topic." :
                     submissionResult.percentage >= 60 ? "Good understanding! A bit more practice and you'll be perfect." :
                     "Don't worry! Practice makes perfect. Review the topics and try again."}
                  </p>
                </div>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={() => {
                    loadReviewData();
                    setShowReview(true);
                  }}
                  variant="outline" 
                  className="flex-1"
                  disabled={reviewLoading}
                >
                  {reviewLoading ? 'Loading Review...' : 'Review Answers'}
                </Button>
                <Button 
                  onClick={onBackToDashboard}
                  className="flex-1"
                >
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
    // Show loading state while fetching review data
    if (reviewLoading) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
          <Card className="w-96">
            <CardHeader>
              <CardTitle className="text-center">Loading Review...</CardTitle>
              <CardDescription className="text-center">Please wait while we load your review data</CardDescription>
            </CardHeader>
            <CardContent className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </CardContent>
          </Card>
        </div>
      );
    }

    // Show error state if review data failed to load
    if (reviewError && !reviewData) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
          <div className="max-w-4xl mx-auto">
            <div className="mb-6 flex items-center justify-between">
              <Button variant="ghost" onClick={() => setShowReview(false)}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Results
              </Button>
              <Badge variant="outline" className="text-red-600">Review Error</Badge>
            </div>
            
            <Card className="p-6">
              <CardHeader>
                <CardTitle className="text-red-600">Error Loading Review</CardTitle>
                <CardDescription>{reviewError}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p>We couldn't load the detailed review from the server. You can still see a basic review below.</p>
                  <Button onClick={() => {
                    setReviewError(null);
                    loadReviewData();
                  }}>
                    Try Again
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
        <div className="max-w-4xl mx-auto">
          <div className="mb-6 flex items-center justify-between">
            <Button variant="ghost" onClick={() => setShowReview(false)}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
            <Badge variant="outline">{reviewData ? 'API Review Mode' : 'Local Review Mode'}</Badge>
          </div>

          <div className="space-y-6">
            {/* Use API data if available, otherwise fall back to local data */}
            {reviewData && reviewData.questions ? (
              // API-based review rendering
              reviewData.questions.map((questionAttempt, index) => {
                const isCorrect = questionAttempt.correct;
                const wasAnswered = questionAttempt.userAnswer !== null;
                const question = questionAttempt.questionPayload;

                return (
                  <Card key={questionAttempt.questionId} className={wasAnswered ? (isCorrect ? "border-green-300" : "border-red-300") : "border-slate-300"}>
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline">Question {index + 1}</Badge>
                            {isCorrect && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                            {!isCorrect && wasAnswered && <XCircle className="h-5 w-5 text-red-600" />}
                            {!wasAnswered && <AlertCircle className="h-5 w-5 text-slate-400" />}
                          </div>
                          <CardTitle className="text-lg">{question.stem}</CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {question.type === 'MCQ' && question.options && (
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => {
                            const isUserAnswer = questionAttempt.userAnswer?.selectedOptionId === option.id;
                            const isCorrectOption = questionAttempt.correctOptionId === option.id;
                            
                            let className = "w-full text-left p-4 rounded-lg border-2 ";
                            if (isCorrectOption) {
                              className += "border-green-500 bg-green-50";
                            } else if (isUserAnswer && !isCorrectOption) {
                              className += "border-red-500 bg-red-50";
                            } else {
                              className += "border-slate-200 bg-white";
                            }

                            return (
                              <div key={option.id} className={className}>
                                <div className="flex items-center justify-between">
                                  <span>{option.text}</span>
                                  <div className="flex items-center gap-2">
                                    {isCorrectOption && <Badge className="bg-green-600">Correct Answer</Badge>}
                                    {isUserAnswer && !isCorrectOption && <Badge variant="destructive">Your Answer</Badge>}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}

                      {question.type === 'FIB' && (
                        <div className="space-y-2">
                          <p><strong>Your Answer:</strong> {questionAttempt.userAnswer?.text || 'Not answered'}</p>
                          <p><strong>Correct Answer:</strong> {questionAttempt.acceptedAnswers.join(', ')}</p>
                        </div>
                      )}

                      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm">
                          <strong>Points:</strong> {questionAttempt.points} | <strong>Difficulty:</strong> {questionAttempt.difficulty}
                        </p>
                      </div>
                      
                      <div className="text-sm text-slate-500">
                        Time spent: {questionAttempt.timeSpentSec} seconds
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            ) : (
              // Local data fallback review rendering
              questions.map((question, index) => {
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
                        {question.options.map((option: string, optionIndex: number) => {
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
              })
            )}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={onBackToDashboard} size="lg">
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
                  {currentQ.options.map((option: string, index: number) => {
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
                        onClick={() => navigateToQuestion(index)}
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
