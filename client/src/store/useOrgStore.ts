import { create } from "zustand";

interface OrgState {
  activeTab: string;
  deptSearch: string;
  desgSearch: string;
  deptPage: number;
  desgPage: number;
  
  setActiveTab: (tab: string) => void;
  setDeptSearch: (search: string) => void;
  setDesgSearch: (search: string) => void;
  setDeptPage: (page: number) => void;
  setDesgPage: (page: number) => void;
  resetFilters: () => void;
}

export const useOrgStore = create<OrgState>((set) => ({
  activeTab: "departments",
  deptSearch: "",
  desgSearch: "",
  deptPage: 1,
  desgPage: 1,

  setActiveTab: (activeTab) => set({ activeTab }),
  setDeptSearch: (deptSearch) => set({ deptSearch, deptPage: 1 }), // Reset to page 1 on search
  setDesgSearch: (desgSearch) => set({ desgSearch, desgPage: 1 }), // Reset to page 1 on search
  setDeptPage: (deptPage) => set({ deptPage }),
  setDesgPage: (desgPage) => set({ desgPage }),
  resetFilters: () =>
    set({
      deptSearch: "",
      desgSearch: "",
      deptPage: 1,
      desgPage: 1,
    }),
}));
