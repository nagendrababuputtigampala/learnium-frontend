import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Progress } from "./ui/progress";
import { 
  ArrowLeft, 
  ChevronLeft, 
  ChevronRight, 
  RotateCcw, 
  Check, 
  X,
  Trophy
} from "lucide-react";

interface FlashCard {
  id: number;
  question: string;
  answer: string;
  hint?: string;
}

interface FlashCardTestProps {
  subject: string;
  onBack: () => void;
  onComplete: () => void;
}

const mathFlashCards: FlashCard[] = [
  {
    id: 1,
    question: "What is the Pythagorean theorem?",
    answer: "In a right triangle, a² + b² = c², where c is the hypotenuse",
    hint: "It relates the three sides of a right triangle"
  },
  {
    id: 2,
    question: "What is the formula for the area of a triangle?",
    answer: "Area = ½ × base × height",
    hint: "Think about half of a rectangle"
  },
  {
    id: 3,
    question: "What is the quadratic formula?",
    answer: "x = (-b ± √(b² - 4ac)) / 2a",
    hint: "Used to solve equations of form ax² + bx + c = 0"
  },
  {
    id: 4,
    question: "What is the sum of angles in a triangle?",
    answer: "180 degrees",
    hint: "This is constant for all triangles"
  },
  {
    id: 5,
    question: "What is the formula for circumference of a circle?",
    answer: "C = 2πr or C = πd",
    hint: "Uses pi and the radius or diameter"
  },
  {
    id: 6,
    question: "What is the slope formula?",
    answer: "m = (y₂ - y₁) / (x₂ - x₁)",
    hint: "Rise over run between two points"
  },
  {
    id: 7,
    question: "What is the volume of a cube?",
    answer: "V = s³ (side length cubed)",
    hint: "All sides are equal"
  },
  {
    id: 8,
    question: "What are prime numbers?",
    answer: "Numbers greater than 1 that have only two factors: 1 and themselves",
    hint: "Examples: 2, 3, 5, 7, 11, 13..."
  },
];

const physicsFlashCards: FlashCard[] = [
  {
    id: 1,
    question: "State Newton's Second Law of Motion",
    answer: "Force = Mass × Acceleration (F = ma)",
    hint: "It relates force, mass, and acceleration"
  },
  {
    id: 2,
    question: "What is the Law of Conservation of Energy?",
    answer: "Energy cannot be created or destroyed, only transformed from one form to another",
    hint: "Total energy in a closed system remains constant"
  },
  {
    id: 3,
    question: "What is the formula for work?",
    answer: "Work = Force × Distance (W = F × d)",
    hint: "Work is done when a force moves an object"
  },
  {
    id: 4,
    question: "What is Ohm's Law?",
    answer: "Voltage = Current × Resistance (V = I × R)",
    hint: "Relates three electrical quantities"
  },
  {
    id: 5,
    question: "What is the formula for density?",
    answer: "Density = Mass / Volume (ρ = m/V)",
    hint: "How much matter is packed in a space"
  },
  {
    id: 6,
    question: "What are the three states of matter?",
    answer: "Solid, Liquid, and Gas (plus Plasma)",
    hint: "Think about ice, water, and steam"
  },
  {
    id: 7,
    question: "What is acceleration?",
    answer: "The rate of change of velocity with time (a = Δv/Δt)",
    hint: "How quickly velocity changes"
  },
  {
    id: 8,
    question: "What is the unit of power?",
    answer: "Watt (W), where 1 Watt = 1 Joule/second",
    hint: "Named after James Watt"
  },
];

export function FlashCardTest({ subject, onBack, onComplete }: FlashCardTestProps) {
  const cards = subject === "Math" ? mathFlashCards : physicsFlashCards;
  const [currentCard, setCurrentCard] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [learnedCards, setLearnedCards] = useState<boolean[]>(Array(cards.length).fill(false));
  const [showHint, setShowHint] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    setShowHint(false);
  };

  const handleMarkLearned = (learned: boolean) => {
    const newLearned = [...learnedCards];
    newLearned[currentCard] = learned;
    setLearnedCards(newLearned);
    
    // Auto-advance to next card
    if (currentCard < cards.length - 1) {
      setTimeout(() => {
        setCurrentCard(currentCard + 1);
        setIsFlipped(false);
        setShowHint(false);
      }, 300);
    } else {
      // All cards reviewed
      setIsComplete(true);
    }
  };

  const handleNext = () => {
    if (currentCard < cards.length - 1) {
      setCurrentCard(currentCard + 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setCurrentCard(currentCard - 1);
      setIsFlipped(false);
      setShowHint(false);
    }
  };

  const handleReset = () => {
    setCurrentCard(0);
    setIsFlipped(false);
    setLearnedCards(Array(cards.length).fill(false));
    setShowHint(false);
    setIsComplete(false);
  };

  const learnedCount = learnedCards.filter(l => l).length;
  const progress = (learnedCount / cards.length) * 100;

  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
        <div className="max-w-2xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
                <Trophy className="h-10 w-10 text-white" />
              </div>
              <CardTitle className="text-3xl">Flashcards Complete! 🎉</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-2">{learnedCount}/{cards.length}</div>
                <p className="text-muted-foreground">
                  You marked {learnedCount} out of {cards.length} cards as learned
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <Check className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Learned</p>
                  <p className="text-2xl">{learnedCount}</p>
                </div>
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 text-center">
                  <X className="h-8 w-8 text-orange-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Need Review</p>
                  <p className="text-2xl">{cards.length - learnedCount}</p>
                </div>
              </div>

              {learnedCount === cards.length && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">🌟</div>
                  <p>Perfect! You've learned all the cards!</p>
                  <Badge variant="default" className="mt-2">+30 XP Earned</Badge>
                </div>
              )}

              <div className="flex gap-3">
                <Button variant="outline" onClick={handleReset} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Review Again
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

  const currentCardData = cards[currentCard];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Badge variant="outline">{subject} Flashcards</Badge>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm">
              Card {currentCard + 1} of {cards.length}
            </span>
            <span className="text-sm text-muted-foreground">
              {learnedCount} cards learned
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Flashcard */}
        <div className="mb-6">
          <div 
            className="relative w-full h-96 cursor-pointer perspective-1000"
            onClick={handleFlip}
          >
            <div 
              className={`absolute inset-0 transition-all duration-500 transform-style-3d ${
                isFlipped ? 'rotate-y-180' : ''
              }`}
              style={{
                transformStyle: 'preserve-3d',
                transition: 'transform 0.6s'
              }}
            >
              {/* Front of card */}
              <Card 
                className={`absolute inset-0 backface-hidden ${!isFlipped ? 'block' : 'hidden'}`}
              >
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <Badge className="mb-4">Question</Badge>
                  <p className="text-2xl text-center mb-8">{currentCardData.question}</p>
                  <p className="text-sm text-muted-foreground">Click to reveal answer</p>
                </CardContent>
              </Card>

              {/* Back of card */}
              <Card 
                className={`absolute inset-0 backface-hidden bg-indigo-50 ${isFlipped ? 'block' : 'hidden'}`}
              >
                <CardContent className="h-full flex flex-col items-center justify-center p-8">
                  <Badge className="mb-4 bg-indigo-600">Answer</Badge>
                  <p className="text-xl text-center mb-8">{currentCardData.answer}</p>
                  <p className="text-sm text-muted-foreground">Click to see question again</p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Hint */}
          {!isFlipped && currentCardData.hint && (
            <div className="mt-4 text-center">
              {showHint ? (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm">💡 {currentCardData.hint}</p>
                </div>
              ) : (
                <Button variant="outline" size="sm" onClick={() => setShowHint(true)}>
                  Show Hint
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {isFlipped && (
          <div className="grid grid-cols-2 gap-4 mb-6">
            <Button 
              variant="outline" 
              size="lg"
              onClick={() => handleMarkLearned(false)}
              className="border-orange-300 hover:bg-orange-50"
            >
              <X className="h-5 w-5 mr-2" />
              Need More Practice
            </Button>
            <Button 
              size="lg"
              onClick={() => handleMarkLearned(true)}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-5 w-5 mr-2" />
              Got It!
            </Button>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentCard === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous
          </Button>

          <div className="text-sm text-muted-foreground">
            {currentCard + 1} / {cards.length}
          </div>

          <Button
            variant="outline"
            onClick={handleNext}
            disabled={currentCard === cards.length - 1}
          >
            Next
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        </div>

        {/* Card Status Grid */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-8 gap-2">
              {cards.map((_, index) => {
                let className = "w-10 h-10 rounded-lg flex items-center justify-center text-sm cursor-pointer transition-all ";
                
                if (index === currentCard) {
                  className += "ring-2 ring-indigo-600 ";
                }
                
                if (learnedCards[index]) {
                  className += "bg-green-100 border-2 border-green-500 text-green-700";
                } else {
                  className += "bg-slate-100 border-2 border-slate-300 text-slate-600";
                }

                return (
                  <button
                    key={index}
                    onClick={() => {
                      setCurrentCard(index);
                      setIsFlipped(false);
                      setShowHint(false);
                    }}
                    className={className}
                  >
                    {learnedCards[index] ? <Check className="h-4 w-4" /> : index + 1}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
