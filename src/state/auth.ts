import { User } from "@/services/user/type";

export type AuthState = {
  accessToken?: string;
  user?: User;
  setAccessToken: (accessToken?: string) => void;
  setUser: (user?: User) => void;
  logout: () => void;
};

export const createAuthSlice = (set: any, get: any, api: any) => ({
  accessToken: undefined,
  user: undefined,
  setAccessToken: (accessToken?: string) => set({ accessToken }),
  setUser: (user?: User) => set({ user }),
  logout: () =>
    set(
      (state: AuthState) => ({
        ...state,
        accessToken: undefined,
        user: undefined,
      }),
      true
    ),
});
