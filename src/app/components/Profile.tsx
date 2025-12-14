import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Badge } from "./ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";
import { User, Mail, GraduationCap, Lock, Save, Trophy } from "lucide-react";
import { Header } from "./Header";
import { Footer } from "./Footer";

interface UserData {
  id: string;
  name: string;
  email: string;
  grade: number;
  avatar: string | null;
  level: number;
  xp: number;
  totalXp: number;
  percentile: number;
  badges: string[];
}

interface ProfileProps {
  user: UserData;
  onNavigate: (view: "dashboard" | "profile" | "submissions") => void;
  onLogout: () => void;
  onUpdateProfile: (updatedUser: Partial<UserData>) => void;
}

export function Profile({ user, onNavigate, onLogout, onUpdateProfile }: ProfileProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [grade, setGrade] = useState(user.grade.toString());
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");

  const initials = user.name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const handleSaveProfile = () => {
    setIsSaving(true);
    setMessage("");

    // Simulate API call
    setTimeout(() => {
      onUpdateProfile({
        name,
        email,
        grade: parseInt(grade),
      });
      setIsSaving(false);
      setMessage("Profile updated successfully!");
      setTimeout(() => setMessage(""), 3000);
    }, 1000);
  };

  const handleChangePassword = () => {
    if (newPassword !== confirmPassword) {
      setMessage("Passwords don't match!");
      return;
    }

    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters!");
      return;
    }

    setIsSaving(true);
    setMessage("");

    // Simulate API call
    setTimeout(() => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setIsSaving(false);
      setMessage("Password changed successfully!");
      setTimeout(() => setMessage(""), 3000);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex flex-col">
      <Header user={user} onNavigate={onNavigate} onLogout={onLogout} />

      <div className="flex-1 max-w-5xl mx-auto px-4 py-8 w-full">
        <div className="mb-6">
          <h1 className="text-3xl mb-2">Profile & Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences</p>
        </div>

        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes("success") 
              ? "bg-green-50 border border-green-200 text-green-700" 
              : "bg-red-50 border border-red-200 text-red-700"
          }`}>
            {message}
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Profile Summary Card */}
          <Card className="md:col-span-1">
            <CardContent className="pt-6">
              <div className="text-center">
                <Avatar className="h-24 w-24 mx-auto mb-4 border-4 border-indigo-200">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-2xl">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <h3 className="text-xl mb-1">{user.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{user.email}</p>
                
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                    <span className="text-sm">Level</span>
                    <Badge variant="secondary">{user.level}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <span className="text-sm">XP</span>
                    <Badge variant="secondary">{user.xp}/{user.totalXp}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-200">
                    <span className="text-sm">Percentile</span>
                    <Badge variant="secondary">Top {user.percentile}%</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs for Profile and Settings */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Account Settings</CardTitle>
              <CardDescription>Update your personal information and security settings</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="profile" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="profile">Profile</TabsTrigger>
                  <TabsTrigger value="security">Security</TabsTrigger>
                </TabsList>

                {/* Profile Tab */}
                <TabsContent value="profile" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10"
                        placeholder="Enter your email"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="grade">Current Grade</Label>
                    <div className="relative">
                      <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <select
                        id="grade"
                        value={grade}
                        onChange={(e) => setGrade(e.target.value)}
                        className="flex h-10 w-full rounded-md border border-input bg-background pl-10 pr-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                      >
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                          <option key={g} value={g}>
                            Grade {g}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <Button onClick={handleSaveProfile} disabled={isSaving} className="w-full mt-4">
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? "Saving..." : "Save Changes"}
                  </Button>
                </TabsContent>

                {/* Security Tab */}
                <TabsContent value="security" className="space-y-4 mt-6">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="current-password"
                        type="password"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Enter current password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Enter new password"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                        placeholder="Confirm new password"
                      />
                    </div>
                  </div>

                  <Button onClick={handleChangePassword} disabled={isSaving} className="w-full mt-4">
                    <Lock className="h-4 w-4 mr-2" />
                    {isSaving ? "Updating..." : "Change Password"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
}
