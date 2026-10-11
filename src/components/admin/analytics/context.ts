import { createContext, useContext } from "react";
import type { TabKey } from "./insights";
import type { DrillTarget } from "./types";

/** Opens the drill-down drawer for a page, channel, country… from anywhere on the page. */
export const DrillContext = createContext<(t: DrillTarget) => void>(() => {});
export const useOpenDrill = () => useContext(DrillContext);

/** Switches tab, so an insight can point at the panel that explains it. */
export const TabContext = createContext<(t: TabKey) => void>(() => {});
export const useGoToTab = () => useContext(TabContext);
