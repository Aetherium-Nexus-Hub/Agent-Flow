import { auth, googleProvider } from "../firebase";
import { signInWithPopup } from "firebase/auth";
import { Button } from "@/components/ui/button";

export const Login = () => {
  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error("Error logging in:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-4xl font-bold mb-8">Welcome to Portfol.io</h1>
      <Button onClick={handleLogin}>Sign in with Google</Button>
    </div>
  );
};
