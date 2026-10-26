"use client";

import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { BranchId, CategoryType, BRANCHES, CATEGORIES } from "@/types/branch";

interface BranchContextType {
  selectedBranch: BranchId;
  selectedCategory: CategoryType;
  setSelectedBranch: (branch: BranchId) => void;
  setSelectedCategory: (category: CategoryType) => void;
  activeBranchInfo: typeof BRANCHES["south_bopal"] | null;
  activeCategoryInfo: typeof CATEGORIES["laptop_general"] | null;
  isFiltered: boolean;
  clearFilters: () => void;
}

const BranchContext = createContext<BranchContextType | undefined>(undefined);

const LOCAL_STORAGE_BRANCH_KEY = "robuzta_selected_branch_v1";
const LOCAL_STORAGE_CATEGORY_KEY = "robuzta_selected_category_v1";

export function BranchProvider({ children }: { children: React.ReactNode }) {
  const [selectedBranch, setSelectedBranchState] = useState<BranchId>("all");
  const [selectedCategory, setSelectedCategoryState] = useState<CategoryType>("all");

  useEffect(() => {
    try {
      const savedBranch = localStorage.getItem(LOCAL_STORAGE_BRANCH_KEY) as BranchId;
      if (savedBranch && ["all", "south_bopal", "tragad"].includes(savedBranch)) {
        setSelectedBranchState(savedBranch);
      }
      const savedCategory = localStorage.getItem(LOCAL_STORAGE_CATEGORY_KEY) as CategoryType;
      if (savedCategory && ["all", "laptop_general", "drone"].includes(savedCategory)) {
        setSelectedCategoryState(savedCategory);
      }
    } catch {
      // Ignore localStorage errors if SSR or restricted
    }
  }, []);

  const setSelectedBranch = (branch: BranchId) => {
    setSelectedBranchState(branch);
    try {
      localStorage.setItem(LOCAL_STORAGE_BRANCH_KEY, branch);
    } catch {
      // Ignore error
    }
  };

  const setSelectedCategory = (category: CategoryType) => {
    setSelectedCategoryState(category);
    try {
      localStorage.setItem(LOCAL_STORAGE_CATEGORY_KEY, category);
    } catch {
      // Ignore error
    }
  };

  const clearFilters = () => {
    setSelectedBranch("all");
    setSelectedCategory("all");
  };

  const activeBranchInfo = useMemo(() => {
    return selectedBranch !== "all" ? BRANCHES[selectedBranch] : null;
  }, [selectedBranch]);

  const activeCategoryInfo = useMemo(() => {
    return selectedCategory !== "all" ? CATEGORIES[selectedCategory] : null;
  }, [selectedCategory]);

  const isFiltered = selectedBranch !== "all" || selectedCategory !== "all";

  const contextValue = React.useMemo(
    () => ({
      selectedBranch,
      selectedCategory,
      setSelectedBranch,
      setSelectedCategory,
      activeBranchInfo,
      activeCategoryInfo,
      isFiltered,
      clearFilters,
    }),
    [selectedBranch, selectedCategory, activeBranchInfo, activeCategoryInfo, isFiltered]
  );

  return (
    <BranchContext.Provider value={contextValue}>
      {children}
    </BranchContext.Provider>
  );
}

export function useBranchContext() {
  const context = useContext(BranchContext);
  if (!context) {
    throw new Error("useBranchContext must be used within a BranchProvider");
  }
  return context;
}
