import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { User, Settings, FileText, LogOut, Trophy, Star } from "lucide-react";

interface UserData {
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
  // Computed fields for compatibility
  level: number;
  xp: number;
  totalXp: number;
  percentile: number;
  badges: string[];
}

interface HeaderProps {
  user: UserData;
  onNavigate: (view: "dashboard" | "profile" | "submissions") => void;
  onLogout: () => void;
}

export function Header({ user, onNavigate, onLogout }: HeaderProps) {
  const initials = (user.name || user.displayName || user.email || "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  return (
    <header className="bg-white border-b sticky top-0 z-50 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <button 
            onClick={() => onNavigate("dashboard")}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
          >
            <div className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <div>
              <h1 className="text-xl">Learnium</h1>
              <p className="text-xs text-muted-foreground">Your place to test and enhance your knowledge</p>
            </div>
          </button>

          {/* User Menu */}
          <div className="flex items-center gap-4">
            {/* Level Badge */}
            <div className="hidden sm:flex items-center gap-2 bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-full px-4 py-2">
              <Trophy className="h-4 w-4 text-amber-600" />
              <span className="text-sm">Level {user.level}</span>
              <Badge variant="secondary" className="ml-1">
                {user.xp} XP
              </Badge>
            </div>

            {/* Profile Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 hover:bg-slate-50 rounded-full pr-4 transition-colors">
                  <Avatar className="h-10 w-10 border-2 border-indigo-200">
                    <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden md:block text-left">
                    <p className="text-sm">{user.name || user.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.gradeName}</p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium">{user.name || user.displayName || 'User'}</p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => onNavigate("profile")} className="cursor-pointer">
                  <User className="mr-2 h-4 w-4" />
                  <span>Profile & Settings</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onNavigate("submissions")} className="cursor-pointer">
                  <FileText className="mr-2 h-4 w-4" />
                  <span>My Submissions</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </header>
  );
}
