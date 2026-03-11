import { create } from "zustand";

interface NavbarFilterState {
  activeFilter: string;
  setActiveFilter: (filter: string) => void;
}

export const useNavbarFilterStore = create<NavbarFilterState>((set) => ({
  activeFilter: "",
  setActiveFilter: (filter) => set({ activeFilter: filter }),
}));
