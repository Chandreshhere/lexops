import { create } from "zustand";
import { persist } from "zustand/middleware";

export type UserRole = "admin" | "partner" | "associate" | "paralegal" | "accountant";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: UserRole;
  designation: string;
  department: string;
  avatar?: string;
  dateOfJoining: string;
  barCouncilNumber?: string;
  qualification: string;
  password: string;
}

export interface RolePermissions {
  canManageUsers: boolean;
  canAssignRoles: boolean;
  canViewFinance: boolean;
  canEditFinance: boolean;
  canManageCases: boolean;
  canDeleteCases: boolean;
  canViewReports: boolean;
  canExportReports: boolean;
  canManageEmployees: boolean;
  canManageSettings: boolean;
  canViewAllCases: boolean;
  canViewClients: boolean;
  canViewDashboard: boolean;
}

export const roleDescriptions: Record<UserRole, string> = {
  admin: "Full system access. Can manage users, roles, settings, and all modules.",
  partner: "Manages team, views finances, full case access. Cannot change system settings.",
  associate: "Handles assigned cases, views finance summary. Limited admin access.",
  paralegal: "Supports cases with document tasks. View-only access to assigned work.",
  accountant: "Full finance module access. Can generate financial reports and invoices.",
};

export const roleLabels: Record<UserRole, string> = {
  admin: "Administrator",
  partner: "Partner",
  associate: "Associate",
  paralegal: "Paralegal",
  accountant: "Accountant",
};

const rolePermissionsMap: Record<UserRole, RolePermissions> = {
  admin: {
    canManageUsers: true, canAssignRoles: true, canViewFinance: true, canEditFinance: true,
    canManageCases: true, canDeleteCases: true, canViewReports: true, canExportReports: true,
    canManageEmployees: true, canManageSettings: true, canViewAllCases: true, canViewClients: true, canViewDashboard: true,
  },
  partner: {
    canManageUsers: true, canAssignRoles: true, canViewFinance: true, canEditFinance: true,
    canManageCases: true, canDeleteCases: true, canViewReports: true, canExportReports: true,
    canManageEmployees: true, canManageSettings: false, canViewAllCases: true, canViewClients: true, canViewDashboard: true,
  },
  associate: {
    canManageUsers: false, canAssignRoles: false, canViewFinance: true, canEditFinance: false,
    canManageCases: true, canDeleteCases: false, canViewReports: true, canExportReports: false,
    canManageEmployees: false, canManageSettings: false, canViewAllCases: false, canViewClients: true, canViewDashboard: true,
  },
  paralegal: {
    canManageUsers: false, canAssignRoles: false, canViewFinance: false, canEditFinance: false,
    canManageCases: false, canDeleteCases: false, canViewReports: false, canExportReports: false,
    canManageEmployees: false, canManageSettings: false, canViewAllCases: false, canViewClients: false, canViewDashboard: true,
  },
  accountant: {
    canManageUsers: false, canAssignRoles: false, canViewFinance: true, canEditFinance: true,
    canManageCases: false, canDeleteCases: false, canViewReports: true, canExportReports: true,
    canManageEmployees: false, canManageSettings: false, canViewAllCases: false, canViewClients: false, canViewDashboard: true,
  },
};

const defaultUsers: UserProfile[] = [
  {
    id: "USR-001", name: "Priya Mehta", email: "priya@lexops.in", phone: "+91 99887 76655",
    role: "admin", designation: "Managing Partner", department: "Admin",
    dateOfJoining: "2018-04-01", barCouncilNumber: "MP/1234/2018",
    qualification: "LLB, LLM (Constitutional Law)", password: "admin123",
  },
  {
    id: "USR-002", name: "Rohan Gupta", email: "rohan@lexops.in", phone: "+91 88776 65544",
    role: "partner", designation: "RERA Senior Associate", department: "RERA",
    dateOfJoining: "2020-07-15", barCouncilNumber: "MP/2345/2020",
    qualification: "LLB, Diploma in Real Estate Law", password: "partner123",
  },
  {
    id: "USR-003", name: "Sneha Patel", email: "sneha@lexops.in", phone: "+91 77665 54433",
    role: "associate", designation: "TNCP Associate", department: "TNCP",
    dateOfJoining: "2021-01-10", barCouncilNumber: "MP/3456/2021",
    qualification: "LLB, MCom", password: "associate123",
  },
  {
    id: "USR-004", name: "Anil Verma", email: "anil@lexops.in", phone: "+91 66554 43322",
    role: "associate", designation: "Litigation Associate", department: "Litigation",
    dateOfJoining: "2019-09-01", barCouncilNumber: "MP/4567/2019",
    qualification: "LLB, LLM (Criminal Law)", password: "associate123",
  },
  {
    id: "USR-005", name: "Rahul Tiwari", email: "rahul@lexops.in", phone: "+91 55443 32211",
    role: "associate", designation: "Financial Services Associate", department: "Financial Services",
    dateOfJoining: "2023-03-15", barCouncilNumber: "MP/5678/2023",
    qualification: "LLB, MBA (Finance)", password: "associate123",
  },
  {
    id: "USR-006", name: "Meera Sharma", email: "meera@lexops.in", phone: "+91 44332 21100",
    role: "associate", designation: "IDA Associate", department: "IDA",
    dateOfJoining: "2022-06-01", barCouncilNumber: "MP/6789/2022",
    qualification: "BA LLB", password: "associate123",
  },
  {
    id: "USR-007", name: "Vikash Singh", email: "vikash@lexops.in", phone: "+91 22110 98877",
    role: "associate", designation: "IMC Associate", department: "IMC",
    dateOfJoining: "2022-09-01", barCouncilNumber: "MP/7890/2022",
    qualification: "LLB, Diploma in Municipal Law", password: "associate123",
  },
  {
    id: "USR-008", name: "Deepak Rawat", email: "deepak@lexops.in", phone: "+91 11009 87766",
    role: "associate", designation: "Revenue Associate", department: "Revenue",
    dateOfJoining: "2023-01-15", barCouncilNumber: "MP/8901/2023",
    qualification: "LLB, LLM (Revenue Law)", password: "associate123",
  },
  {
    id: "USR-009", name: "Sanjay Kushwaha", email: "sanjay@lexops.in", phone: "+91 33221 10099",
    role: "accountant", designation: "Accountant", department: "Admin",
    dateOfJoining: "2021-08-15", qualification: "BCom, CA Inter", password: "accountant123",
  },
];

interface AuthState {
  isAuthenticated: boolean;
  user: UserProfile | null;
  permissions: RolePermissions | null;
  allUsers: UserProfile[];
  login: (email: string, password: string) => { success: boolean; error?: string };
  loginAsRole: (role: UserRole) => void;
  logout: () => void;
  setUser: (user: Partial<UserProfile>) => void;
  setRole: (userId: string, role: UserRole) => void;
  getPermissions: () => RolePermissions | null;
  hasPermission: (permission: keyof RolePermissions) => boolean;
  addUser: (user: UserProfile) => void;
  updateUser: (id: string, data: Partial<UserProfile>) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      user: null,
      permissions: null,
      allUsers: defaultUsers,

      login: (email, password) => {
        const users = get().allUsers;
        const found = users.find(
          (u) => u.email.toLowerCase() === email.toLowerCase() && u.password === password
        );
        if (!found) return { success: false, error: "Invalid email or password" };
        set({ isAuthenticated: true, user: found, permissions: rolePermissionsMap[found.role] });
        return { success: true };
      },

      loginAsRole: (role) => {
        const found = get().allUsers.find((u) => u.role === role);
        if (found) {
          set({ isAuthenticated: true, user: found, permissions: rolePermissionsMap[found.role] });
        }
      },

      logout: () => set({ isAuthenticated: false, user: null, permissions: null }),

      setUser: (data) =>
        set((state) => {
          if (!state.user) return state;
          const updated = { ...state.user, ...data };
          return { user: updated, permissions: rolePermissionsMap[updated.role] };
        }),

      setRole: (userId, role) =>
        set((state) => {
          const allUsers = state.allUsers.map((u) => (u.id === userId ? { ...u, role } : u));
          const user = state.user?.id === userId && state.user ? { ...state.user, role } : state.user;
          return { allUsers, user, permissions: user ? rolePermissionsMap[user.role] : null };
        }),

      getPermissions: () => get().permissions,
      hasPermission: (permission) => get().permissions?.[permission] ?? false,

      addUser: (user) => set((state) => ({ allUsers: [...state.allUsers, user] })),

      updateUser: (id, data) =>
        set((state) => ({
          allUsers: state.allUsers.map((u) => (u.id === id ? { ...u, ...data } : u)),
          user: state.user?.id === id && state.user ? { ...state.user, ...data } : state.user,
        })),
    }),
    { name: "lexops-auth" }
  )
);

export { rolePermissionsMap };
