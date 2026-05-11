import React, { useState } from "react";
import { db } from "../firebase";
import { doc, updateDoc, query, collection, where, getDocs, setDoc } from "firebase/firestore";
import { User } from "firebase/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface OnboardingProps {
  user: User;
  onComplete: (username: string) => void;
}

export const Onboarding = ({ user, onComplete }: OnboardingProps) => {
  const [username, setUsername] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    // 1. Sanitize: Lowercase and remove spaces/special chars
    const cleanName = username.toLowerCase().trim().replace(/[^a-z0-9_]/g, "");

    if (cleanName.length < 3) {
      setError("Username must be at least 3 characters.");
      setLoading(false);
      return;
    }

    try {
      // 2. Uniqueness Check: Query 'users' collection for this username
      const q = query(collection(db, "users"), where("username", "==", cleanName));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        setError("This username is already taken.");
      } else {
        // 3. Update User Document
        // Ensure the doc exists for this user
        await setDoc(doc(db, "users", user.uid), {
          username: cleanName,
        }, { merge: true });
        
        onComplete(cleanName);
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold text-gray-900">Claim your link</h2>
        <p className="text-gray-500 mt-2">This will be your public URL.</p>
        
        <form onSubmit={handleClaim} className="mt-6">
          <div className="flex items-center border-2 rounded-lg p-2 focus-within:border-indigo-500">
            <span className="text-gray-400 mr-1">portfol.io/</span>
            <input 
              type="text" 
              className="outline-none w-full"
              placeholder="yourname"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />
          </div>
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
          <Button 
            disabled={loading}
            className="w-full mt-6 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
          >
            {loading ? "Checking..." : "Claim Username"}
          </Button>
        </form>
      </div>
    </div>
  );
};
