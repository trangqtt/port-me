import { useSyncExternalStore } from "react";

// The intro overlay ends on a full-screen #0e0803 panel, which is also the
// hero's background — so the handover is not a transition between two things
// but the hero revealing its own content underneath a colour that never
// changed. That needs the hero to know when the overlay is finished.
//
// Module scope rather than context: the overlay finishes synchronously under
// prefers-reduced-motion, before the hero has subscribed to anything, and a
// plain event fired then would be sent to an empty room. A stored flag can
// still be read late.
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
