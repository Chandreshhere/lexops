import { create } from "zustand";

export interface Department {
  id: string;
  name: string;
  color: string;
}

const defaultDepartments: Department[] = [
  { id: "dept-1", name: "Litigation", color: "#2563EB" },
  { id: "dept-2", name: "RERA", color: "#16A34A" },
  { id: "dept-3", name: "TNCP", color: "#D97706" },
  { id: "dept-4", name: "IMC", color: "#7C3AED" },
  { id: "dept-5", name: "IDA", color: "#DC2626" },
  { id: "dept-6", name: "Revenue", color: "#0891B2" },
  { id: "dept-7", name: "Financial Services", color: "#DB2777" },
];

const departmentColors = [
  "#2563EB", "#16A34A", "#D97706", "#7C3AED", "#DC2626",
  "#0891B2", "#DB2777", "#059669", "#9333EA", "#EA580C",
  "#4F46E5", "#0D9488", "#E11D48", "#CA8A04", "#6366F1",
];

interface DepartmentState {
  departments: Department[];
  selectedDepartment: string; // "" means "All Departments"
  addDepartment: (name: string) => void;
  editDepartment: (id: string, name: string) => void;
  deleteDepartment: (id: string) => void;
  setSelectedDepartment: (id: string) => void;
}

export const useDepartmentStore = create<DepartmentState>((set, get) => ({
  departments: defaultDepartments,
  selectedDepartment: "",

  addDepartment: (name: string) => {
    const { departments } = get();
    const colorIndex = departments.length % departmentColors.length;
    const newDept: Department = {
      id: `dept-${Date.now()}`,
      name,
      color: departmentColors[colorIndex],
    };
    set({ departments: [...departments, newDept] });
  },

  editDepartment: (id: string, name: string) => {
    set((state) => ({
      departments: state.departments.map((d) =>
        d.id === id ? { ...d, name } : d
      ),
    }));
  },

  deleteDepartment: (id: string) => {
    set((state) => ({
      departments: state.departments.filter((d) => d.id !== id),
      selectedDepartment:
        state.selectedDepartment === id ? "" : state.selectedDepartment,
    }));
  },

  setSelectedDepartment: (id: string) => set({ selectedDepartment: id }),
}));
