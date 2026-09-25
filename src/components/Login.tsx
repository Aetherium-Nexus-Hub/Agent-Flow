import { useState } from "react";
import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Sparkles, ArrowRight } from "lucide-react";

export const Login = () => {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      console.error("Error logging in:", err);
      setError(err.message || "Failed to sign in with Google.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-zinc-50">
      <div className="max-w-md w-full p-8 bg-white rounded-2xl shadow-sm border border-zinc-200 text-center">
        <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Sparkles className="w-6 h-6" />
        </div>
        <h1 className="text-3xl font-extrabold text-zinc-900 mb-2">AgendaFlow</h1>
        <p className="text-sm text-zinc-600 mb-6 leading-relaxed">
          Transform any document or meeting transcript into a structured, time-stamped meeting agenda and stakeholder map using AI.
        </p>

        {error && (
          <div className="p-3 mb-4 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-700 text-left">
            {error}
          </div>
        )}

        <div className="space-y-3">
          <Button 
            onClick={handleLogin} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2.5 rounded-xl shadow-xs"
          >
            {loading ? "Signing in..." : "Sign in with Google"}
          </Button>

          <Button 
            variant="outline" 
            onClick={() => navigate("/dashboard")}
            className="w-full border-zinc-200 text-zinc-700 hover:bg-zinc-50 font-semibold py-2.5 rounded-xl"
          >
            Continue as Guest <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </div>
      </div>
    </div>
  );
};
