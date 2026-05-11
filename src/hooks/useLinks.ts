import { useState, useEffect } from "react";
import { db } from "../firebase";
import { collection, query, where, onSnapshot, addDoc, deleteDoc, doc, serverTimestamp } from "firebase/firestore";

export const useLinks = (userId: string | undefined) => {
  const [links, setLinks] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const q = query(collection(db, "links"), where("owner", "==", userId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const linksData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as any[];
      // Sort by the 'order' field locally
      setLinks(linksData.sort((a, b) => (a.order || 0) - (b.order || 0)));
    });

    return unsubscribe;
  }, [userId]);

  const addLink = async (title: string, url: string) => {
    if (!userId) return;
    await addDoc(collection(db, "links"), {
      title,
      url,
      owner: userId,
      order: links.length,
      createdAt: serverTimestamp()
    });
  };

  const removeLink = async (linkId: string) => {
    await deleteDoc(doc(db, "links", linkId));
  };

  return { links, addLink, removeLink };
};
