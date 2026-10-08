import { da, type AppText } from "./da";

// The internal platform is Danish for now. When an English dictionary exists,
// pick it here based on useLanguage().language — components don't need to change.
export function useAppText(): AppText {
    return da;
}
