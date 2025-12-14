import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { ArrowLeft, Gamepad2 } from "lucide-react";
import { FractionPancakeGame } from "./games/FractionPancakeGame";
import { ConfusedWordsGame } from "./games/ConfusedWordsGame";

interface GamesHubProps {
  subject: string;
  onBack: () => void;
}

interface Game {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
  subject: string;
}

const games: Game[] = [
  {
    id: "fraction-pancake",
    title: "Flipping Pancakes Fractions",
    description: "Stack pancakes in order from smallest to largest fraction!",
    icon: "🥞",
    color: "from-yellow-400 to-orange-500",
    subject: "math"
  },
  {
    id: "confused-words",
    title: "Game of Bones: Confused Words",
    description: "Help the dog find the correct word bones!",
    icon: "🦴",
    color: "from-purple-400 to-pink-500",
    subject: "english"
  },
];

export function GamesHub({ subject, onBack }: GamesHubProps) {
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  const availableGames = games.filter(game => 
    subject.toLowerCase().includes(game.subject) || 
    game.subject === "all"
  );

  if (selectedGame === "fraction-pancake") {
    return <FractionPancakeGame onBack={() => setSelectedGame(null)} />;
  }

  if (selectedGame === "confused-words") {
    return <ConfusedWordsGame onBack={() => setSelectedGame(null)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>

        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl mb-4">
            <Gamepad2 className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-4xl mb-2">Learning Games</h1>
          <p className="text-lg text-muted-foreground">Choose a game to play and learn!</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          {availableGames.map((game) => (
            <Card 
              key={game.id}
              className="cursor-pointer hover:shadow-xl transition-all hover:scale-105 group"
              onClick={() => setSelectedGame(game.id)}
            >
              <CardHeader>
                <div className={`w-20 h-20 bg-gradient-to-br ${game.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <span className="text-4xl">{game.icon}</span>
                </div>
                <CardTitle className="text-2xl">{game.title}</CardTitle>
                <CardDescription className="text-base">{game.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full" size="lg">
                  Play Game
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {availableGames.length === 0 && (
          <Card className="text-center p-12">
            <CardContent>
              <p className="text-lg text-muted-foreground">
                No games available for this subject yet. Check back soon!
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
