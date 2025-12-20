import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { ArrowLeft, BookOpen, Layers, Edit3, Gamepad2, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { ExamService, type ExamMode } from "../../services";

interface TestSelectionProps {
  grade: string;
  subject: string;
  subjectName: string;
  topic: string;
  topicName: string;
  onBack: () => void;
  onSelectType: (type: "quiz" | "flashcard" | "input" | "games" | "fill_blanks", examModeId: string) => void;
  onNavigateToSubjects?: () => void;
  onNavigateToTopics?: () => void;
}

// Icon mapping for dynamic icon rendering
const iconMap: { [key: string]: any } = {
  BookOpen,
  Layers,
  Edit3,
  Gamepad2
};

// Default configuration for fallback values
const getDefaultExamMode = (testType: string): Partial<ExamMode> => {
  const defaults: Record<string, Partial<ExamMode>> = {
    quiz: {
      title: 'Quiz Test',
      description: 'Multiple choice questions with timer',
      icon: 'BookOpen',
      gradientFrom: '#1D4ED8',
      gradientTo: '#60A5FA',
      buttonColor: '#2563EB',
      hoverBorderColor: 'indigo-300',
      features: ['Timed test environment', 'Multiple choice questions', 'Flag questions for review', 'Detailed score analysis'],
      buttonText: 'Start Quiz Test'
    },
    flashcard: {
      title: 'Flashcard',
      description: 'Learn at your own pace with flashcards',
      icon: 'Layers',
      gradientFrom: '#7C3AED',
      gradientTo: '#A855F7',
      buttonColor: '#7C3AED',
      hoverBorderColor: 'purple-300',
      features: ['Self-paced learning', 'Flip cards to see answers', 'Mark cards as learned', 'Review difficult concepts'],
      buttonText: 'Start Flashcards'
    },
    input: {
      title: 'Fill in the Blank',
      description: 'Type your answers directly',
      icon: 'Edit3',
      gradientFrom: '#059669',
      gradientTo: '#10B981',
      buttonColor: '#059669',
      hoverBorderColor: 'green-300',
      features: ['Type numerical answers', 'One-word responses', 'Instant feedback', 'Perfect for math problems'],
      buttonText: 'Start Practice'
    },
    fill_blanks: {
      title: 'Fill in the Blanks',
      description: 'Complete missing values to strengthen recall',
      icon: 'Edit3',
      gradientFrom: '#15803D',
      gradientTo: '#86EFAC',
      buttonColor: '#16A34A',
      hoverBorderColor: 'green-300',
      features: ['Quick practice', 'Great for fundamentals', 'Hints optional'],
      buttonText: 'Practice'
    },
    games: {
      title: 'Learning Games',
      description: 'Fun interactive educational games',
      icon: 'Gamepad2',
      gradientFrom: '#EA580C',
      gradientTo: '#FB923C',
      buttonColor: '#EA580C',
      hoverBorderColor: 'orange-300',
      features: ['Interactive gameplay', 'Learn through play', 'Engaging challenges', 'Earn bonus points'],
      buttonText: 'Play Games'
    }
  };
  return defaults[testType] || defaults.quiz;
};

// Helper function to apply fallback values to exam mode
const applyFallbacks = (examMode: any, index: number): ExamMode => {
  const testType = examMode.testType || 'quiz';
  const defaults = getDefaultExamMode(testType);
  
  return {
    examModeId: examMode.examModeId || `${testType}-${index}`,
    testType: testType as 'quiz' | 'flashcard' | 'input' | 'games' | 'fill_blanks',
    title: examMode.title || defaults.title || 'Test',
    description: examMode.description || defaults.description || 'Practice questions',
    icon: examMode.icon || defaults.icon || 'BookOpen',
    gradientFrom: examMode.gradientFrom || defaults.gradientFrom || '#1D4ED8',
    gradientTo: examMode.gradientTo || defaults.gradientTo || '#60A5FA',
    buttonColor: examMode.buttonColor || defaults.buttonColor || '#2563EB',
    hoverBorderColor: examMode.hoverBorderColor || defaults.hoverBorderColor || 'indigo-300',
    features: examMode.features && examMode.features.length > 0 ? examMode.features : defaults.features || ['Practice questions'],
    buttonText: examMode.buttonText || defaults.buttonText || 'Start Test',
    sortOrder: examMode.sortOrder || 0
  };
};

export function TestSelection({ grade, subject, subjectName, topic, topicName, onBack, onSelectType, onNavigateToSubjects, onNavigateToTopics }: TestSelectionProps) {
  const [examModes, setExamModes] = useState<ExamMode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch exam modes when component mounts or parameters change
  useEffect(() => {
    const fetchExamModes = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const examModesData = await ExamService.getExamModes(grade, subject, topic);
        // Apply fallbacks to ensure all required fields are present
        const examModesWithFallbacks = examModesData.map((mode, index) => applyFallbacks(mode, index));
        setExamModes(examModesWithFallbacks);
      } catch (error: any) {
        console.error('Error fetching exam modes:', error);
        setError(error.message || 'Failed to load exam modes');
        // Fallback to empty array if API fails
        setExamModes([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchExamModes();
  }, [grade, subject, topic]);

  // Helper function to get icon component from string
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || BookOpen; // Default to BookOpen if icon not found
  };

  // Helper function to get proper CSS classes from hex colors
  const getGradientClasses = (from: string, to: string) => {
    // Return inline styles for hex colors
    return { background: `linear-gradient(135deg, ${from}, ${to})` };
  };

  const getButtonColorStyles = (color: string) => {
    // Return inline styles for hex colors
    return { backgroundColor: color };
  };

  const getHoverBorderClass = (borderColor: string) => {
    const borderColorMap: Record<string, string> = {
      'indigo-300': 'hover:border-indigo-300',
      'purple-300': 'hover:border-purple-300',
      'green-300': 'hover:border-green-300',
      'orange-300': 'hover:border-orange-300',
      'blue-300': 'hover:border-blue-300',
      'red-300': 'hover:border-red-300',
      'yellow-300': 'hover:border-yellow-300',
      'pink-300': 'hover:border-pink-300',
      'teal-300': 'hover:border-teal-300'
    };
    return borderColorMap[borderColor] || 'hover:border-indigo-300';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToSubjects?.();
                }}
                className="flex items-center gap-1"
              >
                <Home className="h-4 w-4" />
                Subjects
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onNavigateToTopics?.();
                }}
              >
                {subjectName || 'Subject'}
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{topicName || 'Topic'}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl mb-2">Choose Your Test Type</h1>
          <p className="text-muted-foreground">Select how you'd like to practice {subjectName || 'this subject'}</p>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading test types...</p>
            </div>
          </div>
        ) : examModes.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-xl mb-2">No test types available</h3>
            <p className="text-muted-foreground">No test types found for this topic</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {examModes.map((examMode: ExamMode) => {
              const Icon = getIconComponent(examMode.icon || 'BookOpen');
              const safeExamMode = {
                ...examMode,
                features: examMode.features || ['Practice questions'],
                buttonText: examMode.buttonText || 'Start Test'
              };
              return (
                <Card 
                  key={examMode.examModeId || `fallback-${examMode.testType}`}
                  className={`cursor-pointer hover:shadow-lg transition-all ${getHoverBorderClass(examMode.hoverBorderColor || 'indigo-300')}`}
                  onClick={() => onSelectType(examMode.testType, examMode.examModeId)}
                >
                  <CardHeader>
                    <div 
                      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                      style={getGradientClasses(examMode.gradientFrom || '#1D4ED8', examMode.gradientTo || '#60A5FA')}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{examMode.title || 'Test'}</CardTitle>
                    <CardDescription>{examMode.description || 'Practice questions'}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2 text-sm text-muted-foreground">
                      {safeExamMode.features.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <div 
                            className="w-1.5 h-1.5 rounded-full"
                            style={{ backgroundColor: examMode.buttonColor || '#2563EB' }}
                          ></div>
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                    <Button 
                      className="w-full mt-4 text-white"
                      style={getButtonColorStyles(examMode.buttonColor || '#2563EB')}
                      onClick={() => onSelectType(examMode.testType, examMode.examModeId)}
                    >
                      {safeExamMode.buttonText}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}