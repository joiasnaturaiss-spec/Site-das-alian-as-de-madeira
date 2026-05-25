import React, { createContext, useContext, useState, useEffect } from 'react';

interface EditorContextType {
  isEditMode: boolean;
  setIsEditMode: (value: boolean) => void;
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
}

const EditorContext = createContext<EditorContextType | undefined>(undefined);

export function EditorProvider({ children }: { children: React.ReactNode }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Clear selection when exiting edit mode
  useEffect(() => {
    if (!isEditMode) {
      setSelectedElementId(null);
    }
  }, [isEditMode]);

  return (
    <EditorContext.Provider value={{ isEditMode, setIsEditMode, selectedElementId, setSelectedElementId }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const context = useContext(EditorContext);
  if (context === undefined) {
    throw new Error('useEditor must be used within an EditorProvider');
  }
  return context;
}
