import { create } from "zustand";
// import { createSettingSlice, SettingState } from "./setting";
import { AuthState, createAuthSlice } from "./auth";
import { devtools, persist } from "zustand/middleware";

type AppState = AuthState;

const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        // ...createSettingSlice(...a),
        ...createAuthSlice(...a),
      }),
      {
        name: "schooly",
      }
    )
  )
);

export default useAppStore;
