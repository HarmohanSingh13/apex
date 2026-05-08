// Inline ANSI helpers — no chalk dependency needed
const ESC = '\x1b[';
export const bold   = (s: string) => `${ESC}1m${s}${ESC}0m`;
export const dim    = (s: string) => `${ESC}2m${s}${ESC}0m`;
export const green  = (s: string) => `${ESC}32m${s}${ESC}0m`;
export const yellow = (s: string) => `${ESC}33m${s}${ESC}0m`;
export const cyan   = (s: string) => `${ESC}36m${s}${ESC}0m`;
