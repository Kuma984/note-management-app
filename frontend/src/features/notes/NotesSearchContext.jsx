import { createContext, useContext, useState } from 'react';

const NotesSearchContext = createContext(null);

export function NotesSearchProvider({ children }) {
  const [query, setQuery] = useState('');
  return <NotesSearchContext.Provider value={{ query, setQuery }}>{children}</NotesSearchContext.Provider>;
}

export function useNotesSearch() {
  const context = useContext(NotesSearchContext);
  if (!context) throw new Error('NotesSearchProvider is required.');
  return context;
}
