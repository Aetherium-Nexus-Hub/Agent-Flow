import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp, orderBy } from "firebase/firestore";

export interface Stakeholder {
  name: string;
  role: string;
  department: string;
  influence: "High" | "Medium" | "Low";
  interest: "High" | "Medium" | "Low";
  alignment: "Champion" | "Supportive" | "Neutral" | "Skeptical" | "Blocker";
  contributions: string[];
  actionItems: string[];
}

export interface TimelineSegment {
  title: string;
  duration: number;
  time: string;
  description: string;
  presenter: string;
}

export interface Meeting {
  id?: string;
  title: string;
  objective: string;
  markdownAgenda: string;
  notes: string;
  owner: string;
  createdAt: any;
  stakeholders: Stakeholder[];
  timeline: TimelineSegment[];
  completedTasks?: { [stakeholderName: string]: { [taskIndex: number]: boolean } };
}

export const useMeetings = (userId: string | undefined) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setMeetings([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, "meetings"),
      where("owner", "==", userId),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meetingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Meeting[];
      setMeetings(meetingsData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Loading Error in useMeetings:", error);
      setLoading(false);
    });

    return unsubscribe;
  }, [userId]);

  const addMeeting = async (meeting: Omit<Meeting, "owner" | "createdAt">) => {
    if (!userId) return null;
    try {
      const docRef = await addDoc(collection(db, "meetings"), {
        ...meeting,
        owner: userId,
        createdAt: serverTimestamp()
      });
      return docRef.id;
    } catch (error) {
      console.error("Error adding meeting to Firestore:", error);
      throw error;
    }
  };

  const removeMeeting = async (meetingId: string) => {
    try {
      await deleteDoc(doc(db, "meetings", meetingId));
    } catch (error) {
      console.error("Error removing meeting from Firestore:", error);
      throw error;
    }
  };

  const updateMeeting = async (meetingId: string, updates: Partial<Meeting>) => {
    try {
      const { updateDoc } = await import("firebase/firestore");
      await updateDoc(doc(db, "meetings", meetingId), updates);
    } catch (error) {
      console.error("Error updating meeting in Firestore:", error);
      throw error;
    }
  };

  return { meetings, loading, addMeeting, removeMeeting, updateMeeting };
};
