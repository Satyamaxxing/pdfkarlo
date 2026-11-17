"use client";

import React, { createContext, useContext, useState } from "react";

interface WorkspaceUIContextType {
  isWorkspaceActive: boolean;
  setIsWorkspaceActive: (active: boolean) => void;
}

const WorkspaceUIContext = createContext<WorkspaceUIContextType>({
  isWorkspaceActive: false,
  setIsWorkspaceActive: () => {},
});

export const WorkspaceUIProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isWorkspaceActive, setIsWorkspaceActive] = useState(false);
  return (
    <WorkspaceUIContext.Provider value={{ isWorkspaceActive, setIsWorkspaceActive }}>
      {children}
    </WorkspaceUIContext.Provider>
  );
};

export const useWorkspaceUI = () => useContext(WorkspaceUIContext);
