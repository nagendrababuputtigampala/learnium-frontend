import { useState } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../../firebase";
import { signIn } from "../../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Facebook, Mail } from "lucide-react";

interface AuthPageProps {
  onLogin: (data: { userProfile: any, onboardingRequired: boolean }) => void;
}

export function AuthPage({ onLogin }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const performAuth = async (authAction: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    try {
      await authAction();
      const data = await signIn();
      onLogin(data);
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    performAuth(() => signInWithEmailAndPassword(auth, email, password));
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    // Note: The new flow syncs the user, so separate profile creation on frontend is removed.
    // The backend will handle creating the user on first sync.
    performAuth(() => createUserWithEmailAndPassword(auth, email, password));
  };

  const handleSocialLogin = (provider: string) => {
    const authProvider = provider === 'google' ? new GoogleAuthProvider() : null;
    if (!authProvider) {
        setError("This social provider is not supported.");
        return;
    }
    performAuth(() => signInWithPopup(auth, authProvider));
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div 
        className="hidden lg:flex lg:w-1/2 bg-cover bg-center relative"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1741795746033-d50d48dc1da5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxlZHVjYXRpb24lMjBjb2xvcmZ1bCUyMGJvb2tzfGVufDF8fHx8MTc2NTU3NDgwOXww&ixlib=rb-4.1.0&q=80&w=1080')`
        }}
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/95 to-purple-900/95"></div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between p-12 text-white w-full">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 backdrop-blur-sm rounded-lg flex items-center justify-center border border-white/20">
              <span className="text-2xl">🎓</span>
            </div>
            <span className="text-xl">Learnium</span>
          </div>

          {/* Welcome Message */}
          <div>
            <h1 className="text-5xl mb-6 leading-tight">
              Welcome to
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Learnium Platform
              </span>
            </h1>
            <p className="text-lg text-white/80 mb-2">
              Your place to test and enhance your knowledge
            </p>
            <button className="text-blue-300 hover:text-blue-200 underline text-sm">
              Learn more
            </button>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/60">
            Powered by Education Technology
          </div>
        </div>
      </div>

      {/* Right Side - Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <span className="text-xl">Learnium</span>
          </div>

          {isLogin ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl mb-2">Welcome back!</h2>
                <p className="text-xl text-muted-foreground">Login to your account</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                It's nice to see you again. Ready to learn?
              </p>

              <form onSubmit={handleLogin} className="space-y-5">
                <div>
                  <Input
                    id="email"
                    type="email"
                    placeholder="Your username or email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <Label htmlFor="remember" className="text-sm cursor-pointer">
                      Remember me
                    </Label>
                  </div>
                  <button type="button" className="text-sm text-indigo-600 hover:underline">
                    Forgot password?
                  </button>
                </div>

                <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                  {isLoading ? 'Logging in...' : 'Log In'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={true} // Temporarily disable facebook
                >
                  <Facebook className="mr-2 h-5 w-5" />
                  Continue with Facebook
                </Button>
              </div>

              {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(false)}
                  className="text-indigo-600 hover:underline"
                >
                  Sign up
                </button>
              </p>
            </>
          ) : (
            <>
              <div className="mb-8">
                <h2 className="text-3xl mb-2">Create Account</h2>
                <p className="text-xl text-muted-foreground">Join Learnium today</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                Start your learning journey with us!
              </p>

              <form onSubmit={handleSignUp} className="space-y-4">
                <div>
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Input
                    id="grade"
                    type="number"
                    placeholder="Grade (1-12)"
                    min="1"
                    max="12"
                    value={grade}
                    onChange={(e) => setGrade(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </div>
                <div>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                  />
                </div>

                <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                  {isLoading ? 'Creating Account...' : 'Create Account'}
                </Button>
              </form>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-white px-2 text-muted-foreground">or</span>
                </div>
              </div>

              <div className="space-y-3">
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => handleSocialLogin("google")}
                  disabled={isLoading}
                >
                  <Mail className="mr-2 h-5 w-5" />
                  Continue with Google
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full h-12"
                  onClick={() => handleSocialLogin("facebook")}
                  disabled={true} // Temporarily disable facebook
                >
                  <Facebook className="mr-2 h-5 w-5" />
                  Continue with Facebook
                </Button>
              </div>

             {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => setIsLogin(true)}
                  className="text-indigo-600 hover:underline"
                >
                  Log in
                </button>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}