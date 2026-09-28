import { createContext, useContext } from "react";

// Scrolled state must reach the contact details and status dot deep inside the bar; a context beats prop-cloning or extra listeners, and its own module keeps the component file Fast Refresh safe.
export const NavbarScrolledContext = createContext(false);

export const useNavbarScrolled = () => useContext(NavbarScrolledContext);
