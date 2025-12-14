import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { ArrowLeft, Trophy, RotateCcw, CheckCircle, XCircle } from "lucide-react";

interface WordPair {
  sentence: string;
  correctWord: string;
  incorrectWord: string;
  explanation: string;
}

interface ConfusedWordsGameProps {
  onBack: () => void;
}

const wordPairs: WordPair[] = [
  {
    sentence: "_____ going to the park today.",
    correctWord: "They're",
    incorrectWord: "Their",
    explanation: "They're = They are. Their shows possession. There refers to a place."
  },
  {
    sentence: "The dog buried _____ bone in the yard.",
    correctWord: "its",
    incorrectWord: "it's",
    explanation: "Its shows possession (belonging to it). It's = It is."
  },
  {
    sentence: "I need to go _____ the store.",
    correctWord: "to",
    incorrectWord: "too",
    explanation: "To shows direction. Too means 'also' or 'excessive'."
  },
  {
    sentence: "_____ are my favorite cookies.",
    correctWord: "These",
    incorrectWord: "Those",
    explanation: "These refers to things nearby. Those refers to things farther away."
  },
  {
    sentence: "I _____ my homework yesterday.",
    correctWord: "did",
    incorrectWord: "done",
    explanation: "Did is the past tense. Done requires a helping verb (have done)."
  },
  {
    sentence: "Can you _____ my advice?",
    correctWord: "accept",
    incorrectWord: "except",
    explanation: "Accept means to receive. Except means to exclude."
  },
  {
    sentence: "The weather _____ my plans.",
    correctWord: "affects",
    incorrectWord: "effects",
    explanation: "Affect is a verb (to influence). Effect is usually a noun (the result)."
  },
  {
    sentence: "I _____ you were coming.",
    correctWord: "knew",
    incorrectWord: "new",
    explanation: "Knew is past tense of know. New means not old."
  },
  {
    sentence: "Please sit _____ me.",
    correctWord: "beside",
    incorrectWord: "besides",
    explanation: "Beside means next to. Besides means in addition to."
  },
  {
    sentence: "She runs _____ than me.",
    correctWord: "faster",
    incorrectWord: "more fast",
    explanation: "Faster is the correct comparative form. We don't say 'more fast'."
  },
];

export function ConfusedWordsGame({ onBack }: ConfusedWordsGameProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [shuffledQuestions, setShuffledQuestions] = useState<WordPair[]>([]);

  useEffect(() => {
    startNewGame();
  }, []);

  const startNewGame = () => {
    const shuffled = [...wordPairs].sort(() => Math.random() - 0.5);
    setShuffledQuestions(shuffled);
    setCurrentQuestion(0);
    setScore(0);
    setLives(3);
    setSelectedAnswer(null);
    setShowExplanation(false);
    setGameOver(false);
    setGameWon(false);
  };

  const handleAnswer = (word: string) => {
    if (selectedAnswer) return; // Already answered

    setSelectedAnswer(word);
    setShowExplanation(true);

    const isCorrect = word === shuffledQuestions[currentQuestion].correctWord;

    if (isCorrect) {
      setScore(score + 10);
      setTimeout(() => {
        if (currentQuestion + 1 >= shuffledQuestions.length) {
          setGameWon(true);
        } else {
          nextQuestion();
        }
      }, 2000);
    } else {
      const newLives = lives - 1;
      setLives(newLives);
      if (newLives <= 0) {
        setTimeout(() => {
          setGameOver(true);
        }, 2000);
      } else {
        setTimeout(() => {
          nextQuestion();
        }, 2000);
      }
    }
  };

  const nextQuestion = () => {
    setCurrentQuestion(currentQuestion + 1);
    setSelectedAnswer(null);
    setShowExplanation(false);
  };

  if (shuffledQuestions.length === 0) {
    return <div>Loading...</div>;
  }

  const current = shuffledQuestions[currentQuestion];

  // Game Over Screen
  if (gameOver || gameWon) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
        <div className="max-w-2xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto w-20 h-20 bg-gradient-to-br from-purple-400 to-pink-500 rounded-full flex items-center justify-center mb-4">
                {gameWon ? <Trophy className="h-10 w-10 text-white" /> : <XCircle className="h-10 w-10 text-white" />}
              </div>
              <CardTitle className="text-3xl">
                {gameWon ? "Congratulations! 🎉" : "Game Over"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <div className="text-6xl mb-2">{score}</div>
                <p className="text-muted-foreground">Final Score</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Questions Answered</p>
                  <p className="text-2xl">{currentQuestion}</p>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                  <Trophy className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">Score</p>
                  <p className="text-2xl">{score}</p>
                </div>
              </div>

              {gameWon && (
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200 rounded-lg p-4 text-center">
                  <div className="text-4xl mb-2">🏆</div>
                  <p>Perfect! You're a word master!</p>
                  <Badge variant="default" className="mt-2">+{score} XP Earned</Badge>
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={startNewGame} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Play Again
                </Button>
                <Button onClick={onBack} variant="outline" className="flex-1">
                  Back to Games
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Shuffle answer options
  const answerOptions = [current.correctWord, current.incorrectWord].sort(() => Math.random() - 0.5);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-pink-50 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <Button variant="ghost" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="text-lg px-4 py-2">
              Question {currentQuestion + 1}/{shuffledQuestions.length}
            </Badge>
            <Badge variant="default" className="text-lg px-4 py-2">
              Score: {score}
            </Badge>
          </div>
        </div>

        {/* Lives */}
        <div className="mb-6 flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              className={`text-3xl ${i < lives ? 'opacity-100' : 'opacity-20'}`}
            >
              ❤️
            </div>
          ))}
        </div>

        <Card className="mb-6">
          <CardHeader className="text-center">
            <div className="text-5xl mb-2">🦴</div>
            <CardTitle className="text-2xl">Game of Bones: Confused Words</CardTitle>
            <p className="text-muted-foreground">
              Help the dog choose the correct word bone!
            </p>
          </CardHeader>
        </Card>

        {/* Question Card */}
        <Card className="mb-6">
          <CardContent className="pt-8">
            <div className="text-center mb-8">
              <p className="text-2xl mb-6">
                {current.sentence.split("_____")[0]}
                <span className="text-indigo-600 font-bold px-2">_____</span>
                {current.sentence.split("_____")[1]}
              </p>
            </div>

            {/* Answer Options */}
            <div className="grid md:grid-cols-2 gap-4 max-w-2xl mx-auto">
              {answerOptions.map((word) => {
                const isCorrect = word === current.correctWord;
                const isSelected = word === selectedAnswer;
                
                let className = "p-6 rounded-xl border-4 transition-all text-xl ";
                
                if (!selectedAnswer) {
                  className += "border-purple-300 hover:border-purple-500 hover:bg-purple-50 cursor-pointer hover:scale-105";
                } else if (isSelected) {
                  className += isCorrect 
                    ? "border-green-500 bg-green-50 scale-105" 
                    : "border-red-500 bg-red-50 scale-105";
                } else if (isCorrect && selectedAnswer) {
                  className += "border-green-500 bg-green-50";
                } else {
                  className += "border-slate-200 bg-slate-50 opacity-50";
                }

                return (
                  <button
                    key={word}
                    onClick={() => handleAnswer(word)}
                    disabled={selectedAnswer !== null}
                    className={className}
                  >
                    <div className="flex items-center justify-center gap-3">
                      <span className="text-3xl">🦴</span>
                      <span>{word}</span>
                      {isSelected && (
                        isCorrect ? <CheckCircle className="h-6 w-6 text-green-600" /> : <XCircle className="h-6 w-6 text-red-600" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className={`mt-6 p-4 rounded-lg border-2 ${
                selectedAnswer === current.correctWord
                  ? "bg-green-50 border-green-300"
                  : "bg-red-50 border-red-300"
              }`}>
                <p className="text-center">
                  <strong>
                    {selectedAnswer === current.correctWord ? "Correct! 🎉" : "Not quite! 💭"}
                  </strong>
                </p>
                <p className="text-center mt-2 text-sm">
                  {current.explanation}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tips */}
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="pt-6">
            <p className="text-sm text-center">
              <strong>🐕 Tip:</strong> Read the sentence carefully and think about the meaning of each word!
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
