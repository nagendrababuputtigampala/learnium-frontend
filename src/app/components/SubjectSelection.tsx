import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Calculator, FlaskConical, Book, Globe, Atom, Languages, Palette, Music } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useState } from "react";

interface Subject {
  id: string;
  name: string;
  icon: any;
  color: string;
  description: string;
  availableGrades: number[];
}

interface SubjectSelectionProps {
  grade: number;
  onBack: () => void;
  onSelectSubject: (subject: string) => void;
  onGradeChange?: (grade: number) => void;
}

const subjects: Subject[] = [
  {
    id: "math",
    name: "Mathematics",
    icon: Calculator,
    color: "from-blue-500 to-cyan-600",
    description: "Numbers, algebra, geometry, and more",
    availableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "science",
    name: "Science",
    icon: FlaskConical,
    color: "from-green-500 to-emerald-600",
    description: "Explore the natural world",
    availableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "physics",
    name: "Physics",
    icon: Atom,
    color: "from-purple-500 to-indigo-600",
    description: "Motion, energy, and forces",
    availableGrades: [6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "english",
    name: "English",
    icon: Book,
    color: "from-orange-500 to-red-600",
    description: "Reading, writing, and grammar",
    availableGrades: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "geography",
    name: "Geography",
    icon: Globe,
    color: "from-teal-500 to-cyan-600",
    description: "Countries, maps, and cultures",
    availableGrades: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
  },
  {
    id: "language",
    name: "Languages",
    icon: Languages,
    color: "from-pink-500 to-rose-600",
    description: "Learn new languages",
    availableGrades: [6, 7, 8, 9, 10, 11, 12]
  },
];

export function SubjectSelection({ grade, onBack, onSelectSubject, onGradeChange }: SubjectSelectionProps) {
  const [currentGrade, setCurrentGrade] = useState(grade);

  const availableSubjects = subjects.filter(subject => 
    subject.availableGrades.includes(currentGrade)
  );

  const handleGradeChange = (newGrade: string) => {
    const gradeNum = parseInt(newGrade);
    setCurrentGrade(gradeNum);
    if (onGradeChange) {
      onGradeChange(gradeNum);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between flex-wrap gap-3">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Grade:</span>
            <Select value={currentGrade.toString()} onValueChange={handleGradeChange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Select grade" />
              </SelectTrigger>
              <SelectContent>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <SelectItem key={g} value={g.toString()}>
                    Grade {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">Choose a Subject</h1>
          <p className="text-lg text-muted-foreground">Select the subject you want to practice for Grade {currentGrade}</p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableSubjects.map((subject) => {
            const Icon = subject.icon;
            return (
              <Card 
                key={subject.id}
                className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
                onClick={() => onSelectSubject(subject.id)}
              >
                <CardHeader>
                  <div className={`w-16 h-16 bg-gradient-to-br ${subject.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                    <Icon className="h-8 w-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">{subject.name}</CardTitle>
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
      </div>
    </div>
  );
}