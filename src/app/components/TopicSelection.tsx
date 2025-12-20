import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage, BreadcrumbSeparator } from "./ui/breadcrumb";
import { ArrowLeft, CheckCircle, Lock, Play, Home } from "lucide-react";
import { useState, useEffect } from "react";
import { ExamService, type ExamTopic, type Grade } from "../../services";

interface TopicSelectionProps {
  grade: string;
  subject: string;
  subjectName: string;
  grades: Grade[];
  onBack: () => void;
  onSelectTopic: (topic: string, topicName?: string) => void;
  onNavigateToSubjects?: () => void;
}

export function TopicSelection({ grade, subject, subjectName, grades: initialGrades, onBack, onSelectTopic, onNavigateToSubjects }: TopicSelectionProps) {
  const [topics, setTopics] = useState<ExamTopic[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [grades, setGrades] = useState<Grade[]>(initialGrades || []);
  const [gradesLoading, setGradesLoading] = useState(false);

  // Update grades when initialGrades prop changes
  useEffect(() => {
    if (initialGrades && initialGrades.length > 0) {
      setGrades(initialGrades);
    }
  }, [initialGrades]);

  // Fetch grades if not available
  useEffect(() => {
    const fetchGrades = async () => {
      if (!grades || grades.length === 0) {
        try {
          setGradesLoading(true);
          console.log('Fetching grades because grades array is empty');
          const gradesData = await ExamService.getGrades();
          console.log('Grades fetched:', gradesData);
          setGrades(gradesData);
        } catch (error) {
          console.error('Error fetching grades:', error);
        } finally {
          setGradesLoading(false);
        }
      }
    };

    fetchGrades();
  }, [grades]);

  // Fetch topics when component mounts or grade/subject changes
  useEffect(() => {
    const fetchTopics = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('TopicSelection useEffect triggered with:', {
          grade,
          subject,
          subjectName
        });
        
        console.log('Making API call to fetch topics with:', {
          gradeId: grade,
          subjectId: subject,
          endpoint: 'GET_TOPICS_BY_GRADE_CODE_SUBJECT'
        });
        
        const topicsData = await ExamService.getTopicsByGradeCodeAndSubject(grade, subject);
        console.log('Topics API response:', topicsData);
        console.log('Setting topics state with', topicsData.length, 'topics');
        setTopics(topicsData);
      } catch (error: any) {
        console.error('Error fetching topics:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          statusText: error.response?.statusText
        });
        setError(error.message || 'Failed to load topics');
        // Fallback to empty array if API fails
        setTopics([]);
      } finally {
        console.log('Setting isLoading to false');
        setIsLoading(false);
      }
    };

    if (grade && subject) {
      console.log('Conditions met, calling fetchTopics');
      fetchTopics();
    } else {
      console.log('Conditions not met:', {
        grade,
        subject,
        hasGrade: !!grade,
        hasSubject: !!subject,
        allConditions: grade && subject
      });
      setIsLoading(false); // Important: Set loading to false if conditions aren't met
    }
  }, [grade, subject]);

  // Get subject name for display - now passed from parent
  const getSubjectDisplayName = () => {
    return subjectName || 'Selected Subject';
  };

  // Get grade name for display
  const getGradeDisplayName = () => {
    if (!grades || grades.length === 0) {
      // If grades are still loading, show a loading state
      if (gradesLoading) {
        return 'Loading...';
      }
      // If no grades available, try to extract grade from ID or show fallback
      if (grade) {
        // Try to parse grade code (e.g., "G8" -> "Grade 8")
        const gradeMatch = grade.match(/G(\d+)/);
        if (gradeMatch) {
          return `Grade ${gradeMatch[1]}`;
        }
        // If it's a UUID, show a generic label
        if (grade.includes('-')) {
          return 'Selected Grade';
        }
        // Otherwise use the grade value directly
        return `Grade ${grade}`;
      }
      return 'Unknown Grade';
    }
    
    const selectedGrade = grades.find(g => g.gradeId === grade);
    if (selectedGrade) {
      return selectedGrade.name;
    }
    
    // If grade not found in array, try to parse grade code
    const gradeMatch = grade.match(/G(\d+)/);
    if (gradeMatch) {
      return `Grade ${gradeMatch[1]}`;
    }
    
    return `Grade ${grade}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-2">
            <Badge variant="outline">{getGradeDisplayName()}</Badge>
            <Badge variant="outline">{getSubjectDisplayName()}</Badge>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">Choose a Topic</h1>
          <p className="text-lg text-muted-foreground">
            Select a topic to start practicing {getSubjectDisplayName()}
          </p>
          {error && (
            <p className="text-red-500 mt-2">{error}</p>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading topics...</p>
            </div>
          </div>
        ) : topics.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl mb-2">No topics available</h3>
            <p className="text-muted-foreground">No topics found for {getGradeDisplayName()} - {getSubjectDisplayName()}</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topics.map((topic) => (
              <Card 
                key={topic.topicId}
                className={`cursor-pointer transition-all ${
                  topic.locked 
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:shadow-xl hover:scale-105'
                }`}
                onClick={() => !topic.locked && onSelectTopic(topic.topicId)}
              >
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {topic.completed && (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      )}
                      {topic.locked && (
                        <Lock className="h-5 w-5 text-slate-400" />
                      )}
                    </div>
                  </div>
                  <CardTitle className="text-xl">{topic.topicName}</CardTitle>
                  <CardDescription>{topic.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button 
                      className="w-full" 
                      disabled={topic.locked}
                      variant={topic.locked ? "outline" : "default"}
                    >
                      {topic.locked ? (
                        <>
                          <Lock className="h-4 w-4 mr-2" />
                          Locked
                        </>
                      ) : (
                        <>
                          <Play className="h-4 w-4 mr-2" />
                          Start Practice
                        </>
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
