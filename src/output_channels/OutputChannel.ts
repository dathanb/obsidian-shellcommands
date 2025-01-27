/**
 * Designed additional values for later: "modal" | "specific-file-top" | "specific-file-bottom" | "specific-file-caret" (if possible)
 * See discussion: https://github.com/Taitava/obsidian-shellcommands/discussions/16
 */
export type OutputChannel = "ignore" | "notification" | "current-file-caret" | "current-file-top" | "current-file-bottom" | "status-bar" | "clipboard";

export type OutputChannelOrder = "stdout-first" | "stderr-first";

export type OutputStream = "stdout" | "stderr";