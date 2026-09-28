import { useSyncExternalStore } from "react";

// The overlay ends on the hero's own #0e0803, so the hero must know when it is done; a module flag, not context or an event, because under reduced motion it finishes before anyone subscribes.
let introDone = false;
const listeners = new Set<() => void>();

export const markIntroDone = () => {
  if (introDone) return;
  introDone = true;
  for (const listener of listeners) listener();
};

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  return () => {
    listeners.delete(onStoreChange);
  };
};

const getSnapshot = () => introDone;

export const useIntroDone = () => useSyncExternalStore(subscribe, getSnapshot);
