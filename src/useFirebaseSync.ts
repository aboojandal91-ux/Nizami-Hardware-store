import { useEffect, useRef } from 'react';
import { doc, setDoc, deleteDoc, writeBatch } from 'firebase/firestore';
import { db } from './firebase';

export function useFirebaseSync<T extends { id: string }>(
  collectionName: string, 
  items: T[], 
  subcollections?: string[]
) {
  const prevItemsRef = useRef<T[]>();

  useEffect(() => {
    const prevItems = prevItemsRef.current || [];
    const prevMap = new Map(prevItems.map(item => [item.id, JSON.stringify(item)]));
    const currentMap = new Map(items.map(item => [item.id, JSON.stringify(item)]));

    const addedOrUpdated: T[] = [];
    const deletedIds: string[] = [];

    items.forEach(item => {
      const currentStr = JSON.stringify(item);
      if (!prevMap.has(item.id) || prevMap.get(item.id) !== currentStr) {
        addedOrUpdated.push(item);
      }
    });

    prevItems.forEach(item => {
      if (!currentMap.has(item.id)) {
        deletedIds.push(item.id);
      }
    });

    const syncChanges = async () => {
      if (addedOrUpdated.length === 0 && deletedIds.length === 0) return;
      
      const batch = writeBatch(db);
      let count = 0;

      addedOrUpdated.forEach(item => {
        let dbItem = { ...item } as any;
        if (subcollections) {
          subcollections.forEach(sub => {
            delete dbItem[sub];
          });
        }
        
        // Write main doc
        batch.set(doc(db, collectionName, item.id), dbItem);
        count++;

        // Write subcollections
        if (subcollections) {
          subcollections.forEach(sub => {
            if ((item as any)[sub]) {
              (item as any)[sub].forEach((subItem: any) => {
                const subRef = doc(db, `${collectionName}/${item.id}/${sub}`, subItem.id);
                batch.set(subRef, subItem);
                count++;
              });
            }
          });
        }
      });

      deletedIds.forEach(id => {
        batch.delete(doc(db, collectionName, id));
        count++;
      });

      if (count > 0 && count <= 500) {
        try {
          await batch.commit();
          console.log(`Synced ${count} changes to ${collectionName}`);
        } catch(e) {
          console.error("Firebase sync error:", e);
        }
      } else if (count > 500) {
        console.error("Too many changes to batch commit");
      }
    };

    if (prevItemsRef.current !== undefined) {
      syncChanges();
    }
    
    prevItemsRef.current = items;
  }, [items, collectionName, subcollections]);
}
