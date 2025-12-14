import { Heart } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-white border-t mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Logo and Tagline */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span className="text-lg">🎓</span>
            </div>
            <div>
              <p className="text-sm">Learnium</p>
              <p className="text-xs text-muted-foreground">Empowering young minds</p>
            </div>
          </div>

          {/* Links */}
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-indigo-600 transition-colors">About</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Help</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Privacy</a>
            <a href="#" className="hover:text-indigo-600 transition-colors">Terms</a>
          </div>

          {/* Copyright */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>Made with</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>for students worldwide</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
