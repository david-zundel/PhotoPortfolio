import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isSignUp) {
      const { error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Sign up failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/admin");
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) {
        toast({ title: "Login failed", description: error.message, variant: "destructive" });
      } else {
        navigate("/admin");
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-6">
        <h1 className="text-3xl font-bold font-display text-center gradient-text">
          {isSignUp ? "Create Account" : "Admin Login"}
        </h1>
        <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <Input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <Button type="submit" className="w-full bg-[hsl(210,50%,42%)] text-primary-foreground hover:bg-[hsl(210,50%,35%)]" disabled={loading}>
          {loading ? "Please wait..." : isSignUp ? "Sign Up" : "Sign In"}
        </Button>
        <p className="text-center text-sm text-muted-foreground">
          {isSignUp ? "Already have an account?" : "Need an account?"}{" "}
          <button type="button" onClick={() => setIsSignUp(!isSignUp)} className="text-[hsl(210,50%,42%)] underline font-medium">
            {isSignUp ? "Sign in" : "Sign up"}
          </button>
        </p>
      </form>
    </div>
  );
};

export default Login;
