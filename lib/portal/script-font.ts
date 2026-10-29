import { Caveat } from "next/font/google";

/** One Caveat load. Turbopack rejects the same Google font called from more than one file. */
export const deskScriptFont = Caveat({ subsets: ["latin"], weight: ["600", "700"] });
