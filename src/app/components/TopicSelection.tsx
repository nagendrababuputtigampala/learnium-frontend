import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, CheckCircle, Lock, Play } from "lucide-react";

interface Topic {
  id: string;
  name: string;
  description: string;
  difficulty: "Easy" | "Medium" | "Hard";
  questionsCount: number;
  completed: boolean;
  locked: boolean;
}

interface TopicSelectionProps {
  grade: number;
  subject: string;
  onBack: () => void;
  onSelectTopic: (topic: string) => void;
}

// Mock topic data based on subject
const topicsBySubject: Record<string, Topic[]> = {
  math: [
    {
      id: "addition-subtraction",
      name: "Addition & Subtraction",
      description: "Master basic arithmetic operations",
      difficulty: "Easy",
      questionsCount: 25,
      completed: false,
      locked: false
    },
    {
      id: "multiplication-division",
      name: "Multiplication & Division",
      description: "Learn times tables and division",
      difficulty: "Medium",
      questionsCount: 30,
      completed: false,
      locked: false
    },
    {
      id: "fractions",
      name: "Fractions",
      description: "Understanding parts of a whole",
      difficulty: "Medium",
      questionsCount: 20,
      completed: false,
      locked: false
    },
    {
      id: "geometry",
      name: "Geometry Basics",
      description: "Shapes, angles, and measurements",
      difficulty: "Medium",
      questionsCount: 28,
      completed: false,
      locked: false
    },
    {
      id: "algebra",
      name: "Algebra Introduction",
      description: "Variables and equations",
      difficulty: "Hard",
      questionsCount: 22,
      completed: false,
      locked: false
    },
    {
      id: "square-roots",
      name: "Square Roots & Powers",
      description: "Understanding exponents and roots",
      difficulty: "Hard",
      questionsCount: 18,
      completed: false,
      locked: false
    },
  ],
  science: [
    {
      id: "plants-animals",
      name: "Plants & Animals",
      description: "Learn about living organisms",
      difficulty: "Easy",
      questionsCount: 24,
      completed: false,
      locked: false
    },
    {
      id: "human-body",
      name: "Human Body",
      description: "Explore organs and systems",
      difficulty: "Medium",
      questionsCount: 26,
      completed: false,
      locked: false
    },
    {
      id: "matter-materials",
      name: "Matter & Materials",
      description: "Solids, liquids, and gases",
      difficulty: "Medium",
      questionsCount: 20,
      completed: false,
      locked: false
    },
    {
      id: "ecosystems",
      name: "Ecosystems",
      description: "Food chains and habitats",
      difficulty: "Medium",
      questionsCount: 22,
      completed: false,
      locked: false
    },
  ],
  physics: [
    {
      id: "motion-forces",
      name: "Motion & Forces",
      description: "Newton's laws and movement",
      difficulty: "Medium",
      questionsCount: 25,
      completed: false,
      locked: false
    },
    {
      id: "energy",
      name: "Energy",
      description: "Types and transformations",
      difficulty: "Medium",
      questionsCount: 20,
      completed: false,
      locked: false
    },
    {
      id: "electricity",
      name: "Electricity",
      description: "Circuits and current",
      difficulty: "Hard",
      questionsCount: 22,
      completed: false,
      locked: false
    },
    {
      id: "light-sound",
      name: "Light & Sound",
      description: "Waves and properties",
      difficulty: "Medium",
      questionsCount: 18,
      completed: false,
      locked: false
    },
  ],
  english: [
    {
      id: "vocabulary",
      name: "Vocabulary Building",
      description: "Expand your word knowledge",
      difficulty: "Easy",
      questionsCount: 30,
      completed: false,
      locked: false
    },
    {
      id: "grammar",
      name: "Grammar Rules",
      description: "Parts of speech and sentence structure",
      difficulty: "Medium",
      questionsCount: 28,
      completed: false,
      locked: false
    },
    {
      id: "commonly-confused",
      name: "Commonly Confused Words",
      description: "Their, there, they're and more",
      difficulty: "Medium",
      questionsCount: 20,
      completed: false,
      locked: false
    },
    {
      id: "reading-comprehension",
      name: "Reading Comprehension",
      description: "Understanding texts",
      difficulty: "Hard",
      questionsCount: 15,
      completed: false,
      locked: false
    },
  ],
  geography: [
    {
      id: "continents-oceans",
      name: "Continents & Oceans",
      description: "Learn world geography",
      difficulty: "Easy",
      questionsCount: 20,
      completed: false,
      locked: false
    },
    {
      id: "countries-capitals",
      name: "Countries & Capitals",
      description: "Major countries and cities",
      difficulty: "Medium",
      questionsCount: 25,
      completed: false,
      locked: false
    },
    {
      id: "climate-weather",
      name: "Climate & Weather",
      description: "Understanding weather patterns",
      difficulty: "Medium",
      questionsCount: 18,
      completed: false,
      locked: false
    },
  ],
  language: [
    {
      id: "basics",
      name: "Language Basics",
      description: "Common phrases and greetings",
      difficulty: "Easy",
      questionsCount: 20,
      completed: false,
      locked: false
    },
    {
      id: "vocabulary",
      name: "Essential Vocabulary",
      description: "Everyday words and expressions",
      difficulty: "Medium",
      questionsCount: 25,
      completed: false,
      locked: false
    },
  ],
};

export function TopicSelection({ grade, subject, onBack, onSelectTopic }: TopicSelectionProps) {
  const topics = topicsBySubject[subject] || [];
  const subjectName = subject.charAt(0).toUpperCase() + subject.slice(1);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-100 text-green-700 border-green-300";
      case "Medium":
        return "bg-yellow-100 text-yellow-700 border-yellow-300";
      case "Hard":
        return "bg-red-100 text-red-700 border-red-300";
      default:
        return "bg-slate-100 text-slate-700 border-slate-300";
    }
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
            <Badge variant="outline">Grade {grade}</Badge>
            <Badge variant="outline">{subjectName}</Badge>
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-4xl mb-2">Choose a Topic</h1>
          <p className="text-lg text-muted-foreground">
            Select a topic to start practicing {subjectName}
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {topics.map((topic) => (
            <Card 
              key={topic.id}
              className={`cursor-pointer transition-all ${
                topic.locked 
                  ? 'opacity-50 cursor-not-allowed' 
                  : 'hover:shadow-xl hover:scale-105'
              }`}
              onClick={() => !topic.locked && onSelectTopic(topic.id)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-2">
                  <Badge className={`${getDifficultyColor(topic.difficulty)} border`}>
                    {topic.difficulty}
                  </Badge>
                  {topic.completed && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                  {topic.locked && (
                    <Lock className="h-5 w-5 text-slate-400" />
                  )}
                </div>
                <CardTitle className="text-xl">{topic.name}</CardTitle>
                <CardDescription>{topic.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Questions</span>
                    <span>{topic.questionsCount}</span>
                  </div>
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
      </div>
    </div>
  );
}
