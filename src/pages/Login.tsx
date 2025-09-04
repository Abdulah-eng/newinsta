import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link } from "react-router-dom";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // TODO: Implement Supabase authentication
    alert("Login functionality coming with Supabase integration!");
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-6">
      <Card className="w-full max-w-md bg-charcoal border-gold/20">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-serif text-gold">Welcome Back</CardTitle>
          <CardDescription className="text-white/70">
            Sign in to access your Echelon Texas membership
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black border-gold/30 text-white focus:border-gold"
                placeholder="your@email.com"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-black border-gold/30 text-white focus:border-gold"
                placeholder="••••••••"
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-gold hover:bg-gold-light text-black font-semibold"
            >
              Sign In
            </Button>
          </form>
          
          <div className="mt-6 text-center space-y-2">
            <Link 
              to="/forgot-password" 
              className="text-gold hover:text-gold-light text-sm"
            >
              Forgot your password?
            </Link>
            <div className="text-white/60 text-sm">
              Don't have an account?{" "}
              <Link to="/membership" className="text-gold hover:text-gold-light">
                Join Echelon TX
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;