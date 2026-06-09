import { useState, useEffect } from 'react';
import { collection, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase';

export function useFirestoreCollection<T>(collectionName: string) {
  const [data, setData] = useState<T[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(collection(db, collectionName), (snapshot) => {
      const docs = snapshot.docs.map(d => ({
        ...d.data(),
        id: d.id
      })) as T[];
      setData(docs);
    });
    return unsubscribe;
  }, [collectionName]);

  const addOrUpdate = async (item: T & { id: string }) => {
    await setDoc(doc(db, collectionName, item.id), item);
  };

  const remove = async (id: string) => {
    await deleteDoc(doc(db, collectionName, id));
  };

  return { data, addOrUpdate, remove };
}
