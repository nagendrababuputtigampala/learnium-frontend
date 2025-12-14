import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, Trophy, RotateCcw } from "lucide-react";

interface Pancake {
  id: number;
  numerator: number;
  denominator: number;
  value: number;
  color: string;
}

interface FractionPancakeGameProps {
  onBack: () => void;
}

const pancakeColors = [
  "#FFD700", // Gold
  "#FFA500", // Orange
  "#FF6347", // Tomato
  "#8B4513", // Brown
  "#CD853F", // Peru
  "#DEB887", // BurlyWood
];

export function FractionPancakeGame({ onBack }: FractionPancakeGameProps) {
  const [pancakes, setPancakes] = useState<Pancake[]>([]);
  const [stack, setStack] = useState<Pancake[]>([]);
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    startNewRound();
  }, [level]);

  const generatePancakes = (count: number): Pancake[] => {
    const fractions: Pancake[] = [];
    const denominators = [2, 3, 4, 5, 6, 8];
    
    for (let i = 0; i < count; i++) {
      const denominator = denominators[Math.floor(Math.random() * denominators.length)];
      const numerator = Math.floor(Math.random() * denominator) + 1;
      
      fractions.push({
        id: i,
        numerator,
        denominator,
        value: numerator / denominator,
        color: pancakeColors[i % pancakeColors.length],
      });
    }
    
    // Shuffle the pancakes
    return fractions.sort(() => Math.random() - 0.5);
  };

  const startNewRound = () => {
    const pancakeCount = Math.min(3 + level, 6);
    setPancakes(generatePancakes(pancakeCount));
    setStack([]);
    setMessage("");
    setGameOver(false);
  };

  const addToStack = (pancake: Pancake) => {
    const newStack = [...stack, pancake];
    setStack(newStack);
    setPancakes(pancakes.filter(p => p.id !== pancake.id));

    if (newStack.length === pancakes.length + newStack.length) {
      // Check if correctly ordered
      const isCorrect = newStack.every((p, i) => 
        i === 0 || p.value >= newStack[i - 1].value
      );

      if (isCorrect) {
        setMessage("Perfect! 🎉");
        setScore(score + (level * 10));
        setTimeout(() => {
          setLevel(level + 1);
        }, 1500);
      } else {
        setMessage("Oops! Try again! The fractions should be ordered from smallest to largest.");
        setGameOver(true);
      }
    }
  };

  const resetGame = () => {
    setLevel(1);
    setScore(0);
    startNewRound();
  };

  const getPancakeWidth = (value: number) => {
    return 60 + (value * 140); // Width between 60px and 200px based on fraction value
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-yellow-50 to-orange-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Level {level}
            </Badge>
            <Badge variant="default" className="text-lg px-4 py-2">
              Score: {score}
            </Badge>
          </div>
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="text-5xl mb-2">🥞</div>
            <CardTitle className="text-3xl">Flipping Pancakes Fractions</CardTitle>
            <p className="text-muted-foreground">
              Click the pancakes to stack them from smallest to largest fraction!
            </p>
          </CardHeader>
        </Card>

        {/* Message */}
        {message && (
          <div className={`text-center mb-6 p-4 rounded-lg ${
            message.includes("Perfect") 
              ? "bg-green-100 border-2 border-green-300 text-green-700" 
              : "bg-red-100 border-2 border-red-300 text-red-700"
          }`}>
            <p className="text-xl">{message}</p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* Available Pancakes */}
          <Card>
            <CardHeader>
              <CardTitle>Available Pancakes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 min-h-[300px]">
                {pancakes.map((pancake) => (
                  <button
                    key={pancake.id}
                    onClick={() => !gameOver && addToStack(pancake)}
                    className="w-full transition-all hover:scale-105 disabled:opacity-50"
                    disabled={gameOver && !message.includes("Perfect")}
                  >
                    <div 
                      className="mx-auto rounded-full shadow-lg hover:shadow-xl transition-shadow relative"
                      style={{
                        width: `${getPancakeWidth(pancake.value)}px`,
                        height: "50px",
                        background: `linear-gradient(180deg, ${pancake.color} 0%, ${pancake.color}dd 100%)`,
                        border: "3px solid #8B4513"
                      }}
                    >
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-white font-bold text-xl drop-shadow-lg">
                          {pancake.numerator}/{pancake.denominator}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stack */}
          <Card>
            <CardHeader>
              <CardTitle>Your Stack (Small to Large)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 min-h-[300px] flex flex-col-reverse">
                {stack.map((pancake, index) => (
                  <div 
                    key={pancake.id}
                    className="transition-all duration-300 mx-auto"
                    style={{
                      width: `${getPancakeWidth(pancake.value)}px`,
                      height: "50px",
                      background: `linear-gradient(180deg, ${pancake.color} 0%, ${pancake.color}dd 100%)`,
                      border: "3px solid #8B4513",
                      borderRadius: "50%",
                      position: "relative",
                      transform: `translateY(${-index * 2}px)`,
                    }}
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-white font-bold text-xl drop-shadow-lg">
                        {pancake.numerator}/{pancake.denominator}
                      </span>
                    </div>
                  </div>
                ))}
                {stack.length === 0 && (
                  <div className="text-center text-muted-foreground py-12">
                    Click pancakes to add them to the stack
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Controls */}
        <div className="mt-6 flex justify-center gap-3">
          {gameOver && (
            <Button onClick={startNewRound} size="lg">
              <RotateCcw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          )}
          <Button onClick={resetGame} variant="outline" size="lg">
            Reset Game
          </Button>
        </div>

        {/* Tips */}
        <Card className="mt-6 bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm">
              <strong>💡 Tip:</strong> To compare fractions, remember: 1/2 = 0.5, 1/3 ≈ 0.33, 1/4 = 0.25. 
              The pancake size represents the fraction value!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
