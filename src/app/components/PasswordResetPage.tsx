import { useState, useEffect } from "react";
import { confirmPasswordReset, verifyPasswordResetCode } from "firebase/auth";
import { auth } from "../../firebase";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Eye, EyeOff } from "lucide-react";

interface PasswordResetPageProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export function PasswordResetPage({ onSuccess, onCancel }: PasswordResetPageProps) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [email, setEmail] = useState<string>("");
  const [validationErrors, setValidationErrors] = useState<{[key: string]: string}>({});

  useEffect(() => {
    // Get the reset code from URL parameters (handle both Firebase default and custom formats)
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get('oobCode');
    const mode = urlParams.get('mode');
    
    if (oobCode && (mode === 'resetPassword' || urlParams.get('action') === 'resetPassword')) {
      // Verify the reset code and get the email
      verifyPasswordResetCode(auth, oobCode)
        .then((email) => {
          setEmail(email);
        })
        .catch((error) => {
          console.error("Invalid or expired reset code:", error);
          setError("This password reset link is invalid or has expired. Please request a new password reset.");
        });
    } else {
      setError("No password reset code found. Please use the link from your email.");
    }
  }, []);

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

  const validateForm = () => {
    const errors: {[key: string]: string} = {};
    
    if (!password) errors.password = "Password is required";
    if (!confirmPassword) errors.confirmPassword = "Please confirm your password";
    if (password !== confirmPassword) errors.confirmPassword = "Passwords do not match";
    
    const passwordErrors = validatePassword(password);
    if (passwordErrors.length > 0) {
      errors.password = `Password must contain ${passwordErrors.join(", ")}`;
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const urlParams = new URLSearchParams(window.location.search);
    const oobCode = urlParams.get('oobCode');
    
    if (!oobCode) {
      setError("No password reset code found. Please use the link from your email.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);
    
    try {
      await confirmPasswordReset(auth, oobCode, password);
      setSuccessMessage("Your password has been successfully reset! You can now log in with your new password.");
      
      // Redirect to login after a delay
      setTimeout(() => {
        onSuccess();
      }, 3000);
      
    } catch (error: any) {
      console.error("Password reset error:", error);
      
      let errorMessage = error.message;
      
      if (error.code === 'auth/invalid-action-code') {
        errorMessage = 'This password reset link is invalid or has expired. Please request a new password reset.';
      } else if (error.code === 'auth/expired-action-code') {
        errorMessage = 'This password reset link has expired. Please request a new password reset.';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'Password is too weak. Please choose a stronger password.';
      } else {
        errorMessage = 'Failed to reset password. Please try again or request a new password reset.';
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
              Reset Your
              <br />
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                Password
              </span>
            </h1>
            <p className="text-lg text-white/80 mb-2">
              Choose a strong password to secure your account
            </p>
          </div>

          {/* Footer */}
          <div className="text-sm text-white/60">
            Powered by Education Technology
          </div>
        </div>
      </div>

      {/* Right Side - Reset Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 bg-white">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
              <span className="text-2xl">🎓</span>
            </div>
            <span className="text-xl">Learnium</span>
          </div>

          <div className="mb-8">
            <h2 className="text-3xl mb-2">Reset Password</h2>
            <p className="text-xl text-muted-foreground">Create a new password for your account</p>
          </div>

          {email && (
            <p className="text-sm text-muted-foreground mb-6">
              Resetting password for: <strong>{email}</strong>
            </p>
          )}

          <form onSubmit={handlePasswordReset} className="space-y-5">
            <div className="relative">
              <Input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="New Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`h-12 pr-10 ${validationErrors.password ? 'border-red-500' : ''}`}
                required
                disabled={isLoading}
                autoComplete="new-password"
                autoFocus
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
              {password && (
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
                id="confirm-new-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm New Password"
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

            <Button 
              type="submit" 
              className="w-full h-12 bg-indigo-600 hover:bg-indigo-700" 
              disabled={isLoading}
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </Button>
          </form>

          {error && <p className="text-center text-sm text-red-500 mt-4">{error}</p>}
          {successMessage && <p className="text-center text-sm text-green-500 mt-4">{successMessage}</p>}

          <p className="text-center text-sm text-muted-foreground mt-6">
            Remember your password?{" "}
            <button
              type="button"
              onClick={onCancel}
              className="text-indigo-600 hover:underline"
            >
              Back to login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}