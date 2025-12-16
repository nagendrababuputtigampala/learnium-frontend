import { useState, useEffect } from "react";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  fetchSignInMethodsForEmail,
  updateProfile,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "../../firebase";
import { signIn, createUserProfile } from "../../services/api";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";
import { Facebook, Mail, Eye, EyeOff } from "lucide-react";

interface AuthPageProps {
  onLogin: (data: { userProfile: any, onboardingRequired: boolean }) => void;
  onSignupStart: () => void;
}

export function AuthPage({ onLogin, onSignupStart }: AuthPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");

  // Auto-focus email field when switching between login/signup
  useEffect(() => {
    const emailInput = document.getElementById(isLogin ? 'email' : 'signup-email');
    if (emailInput) {
      emailInput.focus();
    }
  }, [isLogin]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + S to switch between login and signup
      if (e.altKey && e.key === 's') {
        e.preventDefault();
        setIsLogin(!isLogin);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLogin]);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!resetEmail.trim()) {
      setError("Please enter your email address");
      return;
    }
    
    if (!validateEmail(resetEmail)) {
      setError("Please enter a valid email address");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      // Configure custom action URL to redirect to our custom page
      const actionCodeSettings = {
        url: `${window.location.origin}/?action=resetPassword`, // This will redirect back to our app
        handleCodeInApp: true,
      };
      
      await sendPasswordResetEmail(auth, resetEmail.trim(), actionCodeSettings);
      setSuccessMessage(
        `Password reset email sent to ${resetEmail}. Please check your inbox and follow the instructions to reset your password.`
      );
      
      // Optionally switch back to login after a delay
      setTimeout(() => {
        setShowForgotPassword(false);
        setResetEmail("");
        setSuccessMessage(null);
      }, 5000);
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = error.message;
      
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email address. Please check your email or create a new account.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many reset attempts. Please wait a moment and try again.';
      } else {
        errorMessage = 'Failed to send password reset email. Please try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDuplicateUserError = async () => {
    console.log('Handling duplicate user error - user exists in database but Firebase auth succeeded');
    
    setError('Account already exists. Attempting to sign you in...');
    
    try {
      // Try to sync with existing user data
      const data = await signIn();
      console.log("Existing user sync successful:", data);
      setSuccessMessage("Welcome back! Logging you in...");
      onLogin(data);
    } catch (syncError: any) {
      console.error('Failed to sync existing user:', syncError);
      
      // Provide specific guidance based on the error
      if (syncError.response?.status === 404) {
        setError('Account mismatch detected. Please try logging in with your existing credentials instead.');
      } else if (syncError.response?.status === 401) {
        setError('Authentication failed. Please try logging in again.');
      } else {
        setError('Unable to complete signup. This email may already be registered. Please try logging in instead.');
      }
      
      // Suggest switching to login
      setTimeout(() => {
        const shouldLogin = window.confirm(
          "It looks like you already have an account. Would you like to try logging in instead?"
        );
        if (shouldLogin) {
          setIsLogin(true);
          setError(null);
          setValidationErrors({});
        }
      }, 2000);
    }
  };

  const handleLoginError = async (error: any) => {
    // Check if this might be a new user trying to login
    if ((error.code === 'auth/invalid-credential' || 
         error.code === 'auth/invalid-login-credentials' || 
         error.message?.includes('INVALID_LOGIN_CREDENTIALS')) && 
        validateEmail(email)) {
      
      try {
        // Show checking message
        setError('Checking account status...');
        
        // Check if email exists in Firebase
        const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());
        
        if (signInMethods.length === 0) {
          // Email doesn't exist
          setError(`No account found with this email. Would you like to create an account instead?`);
          
          setTimeout(() => {
            const shouldSignUp = window.confirm(
              "It looks like this email isn't registered yet. Would you like to create a new account?"
            );
            if (shouldSignUp) {
              setIsLogin(false);
              setError(null);
              setValidationErrors({});
            }
          }, 100);
        } else {
          // Email exists but password is wrong
          setError('Incorrect password. Please try again or use "Forgot password" if you need help.');
        }
      } catch (checkError) {
        // If we can't check, fall back to generic error
        setError('Invalid email or password. Please check your credentials and try again.');
      }
    } else {
      // Handle other error types normally
      throw error;
    }
  };

  const validatePassword = (password: string) => {
    const errors = [];
    if (password.length < 8) errors.push("at least 8 characters");
    if (!/[A-Z]/.test(password)) errors.push("one uppercase letter");
    if (!/[a-z]/.test(password)) errors.push("one lowercase letter");
    if (!/\d/.test(password)) errors.push("one number");
    return errors;
  };

  const getPasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "", color: "" };
    
    let score = 0;
    const checks = [
      password.length >= 8,
      /[A-Z]/.test(password),
      /[a-z]/.test(password),
      /\d/.test(password),
      /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    ];
    
    score = checks.filter(Boolean).length;
    
    if (score < 2) return { strength: score, label: "Weak", color: "bg-red-500" };
    if (score < 4) return { strength: score, label: "Medium", color: "bg-yellow-500" };
    return { strength: score, label: "Strong", color: "bg-green-500" };
  };

  const validateLoginForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }
    
    if (!password.trim()) {
      errors.password = "Password is required";
    } else if (password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateSignUpForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!name.trim()) errors.name = "Full name is required";
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!validateEmail(email)) {
      errors.email = "Please enter a valid email address";
    }
    if (!grade) errors.grade = "Grade is required";
    if (!password) errors.password = "Password is required";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    if (!acceptTerms) errors.terms = "You must accept the terms and conditions";
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = `Password must contain ${passwordErrors.join(", ")}`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const performSignUpWithProfile = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    // Notify parent that signup has started to prevent automatic signin
    onSignupStart();
    
    // Prepare profile data outside try block for better scoping
    const profileData = {
      email: email.trim(),
      password: password, // Backend needs this for validation
      displayName: name.trim(),
      gradeLevel: parseInt(grade)
    };
    
    try {
      // Step 1: Create Firebase account
      setSuccessMessage("Creating your account...");
      const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
      
      console.log("Firebase auth successful:", {
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        isNewUser: userCredential.additionalUserInfo?.isNewUser
      });
      
      // Step 2: Update Firebase profile with displayName
      setSuccessMessage("Setting up your profile...");
      await updateProfile(userCredential.user, {
        displayName: name.trim()
      });
      

      
      // Step 3: Create backend profile with all required fields
      setSuccessMessage("Finalizing your account...");
      

      
      const data = await createUserProfile(profileData);
      console.log("Backend profile creation successful:", data);
      
      setSuccessMessage("Account created successfully! Welcome to Learnium!");
      onLogin(data);
      
    } catch (error: any) {
      console.error("Signup error:", error);
      
      let errorMessage = error.message;
      
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'An account with this email already exists. Please try logging in instead.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false)
    }
  };

  const performAuth = async (authAction: () => Promise<any>) => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const userCredential = await authAction();
      console.log("Firebase auth successful:", {
        email: userCredential.user.email,
        uid: userCredential.user.uid,
        isNewUser: userCredential.additionalUserInfo?.isNewUser,
        providerId: userCredential.user.providerData[0]?.providerId
      });
      
      // Show success message
      setSuccessMessage("Login successful! Redirecting to dashboard...");
      
      // Call backend to sync user and get profile
      const data = await signIn();
      console.log("Backend sync successful:", data);
      
      onLogin(data);
    } catch (error: any) {
      // Try to handle login-specific errors first
      try {
        await handleLoginError(error);
        return; // If handleLoginError succeeds, exit early
      } catch (handledError) {
        error = handledError; // Continue with normal error handling
      }
      
      console.error("Auth error details:", {
        code: error.code,
        message: error.message,
        customData: error.customData,
        stack: error.stack
      });
      let errorMessage = error.message;
      
      // Handle backend sync errors (user already exists in database)
      if (error.message && (
          error.message.includes('duplicate key value violates unique constraint') ||
          error.message.includes('users_firebase_uid_key')
        )) {
        await handleDuplicateUserError();
        return; // Exit early after handling
      }
      
      // Provide user-friendly error messages for login
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'No account found with this email. Please check your email or sign up for a new account.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password. Please try again or use "Forgot password" to reset it.';
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/invalid-login-credentials') {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please wait a moment and try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else if (error.code === 'auth/user-disabled') {
        errorMessage = 'This account has been disabled. Please contact support for assistance.';
      } else if (error.message && error.message.includes('INVALID_LOGIN_CREDENTIALS')) {
        errorMessage = 'Invalid email or password. Please double-check your credentials and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous errors
    setValidationErrors({});
    setError(null);
    setSuccessMessage(null);
    
    // Validate form before attempting login
    if (!validateLoginForm()) {
      return;
    }
    
    performAuth(() => signInWithEmailAndPassword(auth, email.trim(), password));
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear previous validation errors
    setValidationErrors({});
    setError(null);
    
    // Validate form
    if (!validateSignUpForm()) {
      return;
    }
    

    
    // First check if the email already exists
    try {
      setIsLoading(true);
      setError('Checking if email is available...');
      
      const signInMethods = await fetchSignInMethodsForEmail(auth, email.trim());
      
      if (signInMethods.length > 0) {
        // Email already exists
        setError('An account with this email already exists. Please try logging in instead.');
        setIsLoading(false);
        
        setTimeout(() => {
          const shouldLogin = window.confirm(
            "This email is already registered. Would you like to go to the login page?"
          );
          if (shouldLogin) {
            setIsLogin(true);
            setError(null);
            setValidationErrors({});
          }
        }, 100);
        return;
      }
      
      setError(null);
      setIsLoading(false);
      
      // Create account with complete profile setup
      await performSignUpWithProfile();
    } catch (checkError) {
      console.error('Error checking email:', checkError);
      setIsLoading(false);
      // If check fails, proceed with account creation anyway
      await performSignUpWithProfile();
    }
  };

  const handleSocialLogin = async (provider: string) => {
    const authProvider = provider === 'google' ? new GoogleAuthProvider() : null;
    if (!authProvider) {
        setError("This social provider is not supported.");
        return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      const userCredential = await signInWithPopup(auth, authProvider);
      console.log("Social auth successful:", {
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        uid: userCredential.user.uid,
        isNewUser: userCredential.additionalUserInfo?.isNewUser
      });
      
      setSuccessMessage("Social login successful! Redirecting to dashboard...");
      
      // For social login, we use the regular signIn endpoint
      // The backend should handle profile creation for social users
      const data = await signIn();
      console.log("Backend sync successful:", data);
      
      onLogin(data);
    } catch (error: any) {
      console.error("Social login error:", error);
      
      if (error.message && (
          error.message.includes('duplicate key value violates unique constraint') ||
          error.message.includes('users_firebase_uid_key')
        )) {
        await handleDuplicateUserError();
        return;
      }
      
      let errorMessage = error.message;
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled. Please try again.';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups and try again.';
      }
      
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

          {showForgotPassword ? (
            <>
              <div className="mb-8">
                <h2 className="text-3xl mb-2">Reset Password</h2>
                <p className="text-xl text-muted-foreground">Enter your email to reset your password</p>
              </div>

              <p className="text-sm text-muted-foreground mb-6">
                We'll send you a link to reset your password.
              </p>

              <form onSubmit={handleForgotPassword} className="space-y-5">
                <div>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="Your email address"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-12"
                    required
                    disabled={isLoading}
                    autoComplete="email"
                    autoFocus
                  />
                </div>

                <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" disabled={isLoading}>
                  {isLoading ? 'Sending...' : 'Send Reset Email'}
                </Button>
              </form>

              {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}
              {successMessage && <p className="text-center text-sm text-green-500 mt-4">{successMessage}</p>}

              <p className="text-center text-sm text-muted-foreground mt-6">
                Remember your password?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false);
                    setResetEmail("");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-indigo-600 hover:underline"
                >
                  Back to login
                </button>
              </p>
            </>
          ) : isLogin ? (
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
                    className={`h-12 ${validationErrors.email ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {validationErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                  )}
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
                  <button 
                    type="button" 
                    className="text-sm text-indigo-600 hover:underline"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setResetEmail(email); // Pre-fill with current email
                      setError(null);
                      setSuccessMessage(null);
                    }}
                  >
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
              {successMessage && <p className="text-center text-sm text-green-500 mt-4">{successMessage}</p>}
              
              {error && error.includes('Invalid email or password') && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-800 text-center">
                    <strong>Troubleshooting:</strong><br/>
                    • Make sure your email is spelled correctly<br/>
                    • Check that Caps Lock is off<br/>
                    • Try copying and pasting your password<br/>
                    • If you're new, click "Sign up" below
                  </p>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-6">
                Don't have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(false);
                    setShowForgotPassword(false);
                    setError(null);
                    setSuccessMessage(null);
                    setValidationErrors({});
                    setPassword("");
                    setConfirmPassword("");
                    setResetEmail("");
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
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
                    className={`h-12 ${validationErrors.name ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="name"
                  />
                  {validationErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.name}</p>
                  )}
                </div>
                <div>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`h-12 ${validationErrors.email ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="email"
                  />
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
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
                    className={`h-12 ${validationErrors.grade ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                  />
                  {validationErrors.grade && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.grade}</p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`h-12 pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {password && !isLogin && (
                    <div className="mt-2">
                      <div className="flex items-center gap-2 mb-1">
                        <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full transition-all duration-300 ${getPasswordStrength(password).color}`}
                            style={{ width: `${(getPasswordStrength(password).strength / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-600">
                          {getPasswordStrength(password).label}
                        </span>
                      </div>
                    </div>
                  )}
                  {validationErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`h-12 pr-10 ${validationErrors.confirmPassword ? 'border-red-500' : ''}`}
                    required
                    disabled={isLoading}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    disabled={isLoading}
                    aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                <div className="flex items-start gap-2">
                  <Checkbox 
                    id="terms" 
                    checked={acceptTerms}
                    onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                    disabled={isLoading}
                    className={validationErrors.terms ? 'border-red-500' : ''}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <Label htmlFor="terms" className="text-sm cursor-pointer">
                      I accept the{" "}
                      <button type="button" className="text-indigo-600 hover:underline">
                        Terms of Service
                      </button>{" "}
                      and{" "}
                      <button type="button" className="text-indigo-600 hover:underline">
                        Privacy Policy
                      </button>
                    </Label>
                    {validationErrors.terms && (
                      <p className="text-red-500 text-xs">{validationErrors.terms}</p>
                    )}
                  </div>
                </div>

                <Button type="submit" className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" disabled={isLoading || !acceptTerms}>
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
             {successMessage && <p className="text-center text-sm text-green-500 mt-4">{successMessage}</p>}

             {error && error.includes('Account already exists') && (
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                  <p className="text-xs text-yellow-800 text-center">
                    <strong>Note:</strong> This email is already registered. You can log in using your existing password.
                  </p>
                </div>
              )}

              <p className="text-center text-sm text-muted-foreground mt-6">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    setIsLogin(true);
                    setShowForgotPassword(false);
                    setError(null);
                    setSuccessMessage(null);
                    setValidationErrors({});
                    setPassword("");
                    setConfirmPassword("");
                    setName("");
                    setGrade("");
                    setAcceptTerms(false);
                    setResetEmail("");
                    setShowPassword(false);
                    setShowConfirmPassword(false);
                  }}
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