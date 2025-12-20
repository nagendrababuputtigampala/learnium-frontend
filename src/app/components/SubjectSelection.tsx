import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbPage } from "./ui/breadcrumb";
import { ArrowLeft, Calculator, FlaskConical, Book, Globe, Atom, Languages, Palette, Music, Home } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState, useEffect } from "react";
import { ExamService, type Grade, type ExamSubject } from "../../services";

// Icon mapping for dynamic icon rendering
const iconMap: { [key: string]: any } = {
  Calculator,
  FlaskConical,
  Book,
  Globe,
  Atom,
  Languages,
  Palette,
  Music
};

interface SubjectSelectionProps {
  grade: string; // Changed from number to string
  grades?: Grade[]; // Optional grades data from parent
  onBack: () => void;
  onSelectSubject: (subjectId: string, subjectName: string) => void;
  onGradeChange?: (grade: string) => void; // Changed from number to string
  onNavigateToDashboard?: () => void;
}

export function SubjectSelection({ grade, grades: gradesFromProps, onBack, onSelectSubject, onGradeChange, onNavigateToDashboard }: SubjectSelectionProps) {
  // Default to first available grade if grade is empty or missing
  const [currentGrade, setCurrentGrade] = useState<string>(grade || "");
  const [grades, setGrades] = useState<Grade[]>(gradesFromProps || []);
  const [isLoadingGrades, setIsLoadingGrades] = useState(!gradesFromProps || gradesFromProps.length === 0);
  const [gradesError, setGradesError] = useState<string | null>(null);
  
  // New state for subjects
  const [subjects, setSubjects] = useState<ExamSubject[]>([]);
  const [isLoadingSubjects, setIsLoadingSubjects] = useState(true);
  const [subjectsError, setSubjectsError] = useState<string | null>(null);

  // Fetch grades from API only if not provided via props
  useEffect(() => {
    const fetchGrades = async () => {
      // Skip if grades are already provided via props
      if (gradesFromProps && gradesFromProps.length > 0) {
        setIsLoadingGrades(false);
        return;
      }
      
      try {
        setIsLoadingGrades(true);
        setGradesError(null);
        
        const gradesData = await ExamService.getGrades();
        setGrades(gradesData);
      } catch (error: any) {
        console.error('Error fetching grades:', error);
        setGradesError(error.message || 'Failed to load grades');
        // Set empty array on error
        setGrades([]);
      } finally {
        setIsLoadingGrades(false);
      }
    };

    fetchGrades();
  }, [gradesFromProps]); // Include gradesFromProps in dependencies  // Update currentGrade when grade prop changes
  useEffect(() => {
    if (grade && grade !== currentGrade) {
      setCurrentGrade(grade);
    }
  }, [grade, currentGrade]);

  // Fetch subjects when grade changes
  useEffect(() => {
    const fetchSubjects = async () => {
      try {
        setIsLoadingSubjects(true);
        setSubjectsError(null);
        
        // Find the grade object to get the grade code
        const selectedGradeObj = grades.find(g => g.gradeId === currentGrade);
        if (!selectedGradeObj) {
          throw new Error('Grade not found');
        }
        
        // Use the new API with grade code
        const subjectsData = await ExamService.getSubjectsByGradeCode(selectedGradeObj.code);
        setSubjects(subjectsData);
      } catch (error: any) {
        console.error('Error fetching subjects:', error);
        setSubjectsError(error.message || 'Failed to load subjects');
        // Fallback to empty subjects if API fails
        setSubjects([]);
      } finally {
        setIsLoadingSubjects(false);
      }
    };

    // Only fetch if we have a current grade and grades data
    if (currentGrade && grades.length > 0) {
      fetchSubjects();
    }
  }, [currentGrade, grades]);

  // Helper function to get icon component from string
  const getIconComponent = (iconName: string) => {
    return iconMap[iconName] || Calculator; // Default to Calculator if icon not found
  };

  const handleGradeChange = (newGrade: string) => {
    setCurrentGrade(newGrade);
    if (onGradeChange) {
      onGradeChange(newGrade);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb className="mb-4">
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbPage className="flex items-center gap-1">
                <Home className="h-4 w-4" />
                Subjects
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Grade:</span>
            <Select 
              value={currentGrade} 
              onValueChange={handleGradeChange}
              disabled={isLoadingGrades}
            >
              <SelectTrigger className="w-32">
                <SelectValue placeholder={isLoadingGrades ? "Loading..." : "Select grade"} />
              </SelectTrigger>
              <SelectContent>
                {grades.map((grade) => (
                  <SelectItem key={grade.gradeId} value={grade.gradeId}>
                    {grade.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {gradesError && (
              <span className="text-xs text-red-500">Failed to load grades</span>
            )}
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">Choose a Subject</h1>
          <p className="text-lg text-muted-foreground">
            Select the subject you want to practice for {
              grades.find(g => g.gradeId === currentGrade)?.name || 'Selected Grade'
            }
          </p>
          {subjectsError && (
            <p className="text-red-500 mt-2">{subjectsError}</p>
          )}
        </div>

        {isLoadingSubjects ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
              <p className="text-muted-foreground">Loading subjects...</p>
            </div>
          </div>
        ) : subjects.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-xl mb-2">No subjects available</h3>
            <p className="text-muted-foreground">
              No subjects found for {grades.find(g => g.gradeId === currentGrade)?.name || 'Selected Grade'}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {subjects.map((subject) => {
              const Icon = getIconComponent(subject.icon);
              return (
                <Card 
                  key={subject.subjectId}
                  className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
                  onClick={() => onSelectSubject(subject.subjectId, subject.subjectName)}
                >
                  <CardHeader>
                    <div 
                      className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                      style={{
                        background: subject.gradientFrom && subject.gradientTo 
                          ? `linear-gradient(135deg, ${subject.gradientFrom}, ${subject.gradientTo})`
                          : subject.color || '#6366f1'
                      }}
                    >
                      <Icon className="h-8 w-8 text-white" />
                    </div>
                    <CardTitle className="text-2xl">{subject.subjectName}</CardTitle>
                    <CardDescription>{subject.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Button className="w-full" variant="outline">
                      Start Learning
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