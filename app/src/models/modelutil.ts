import {
    CombinedError
} from "@urql/core";
import { types } from "mobx-state-tree";


export const extractErrorMessage = (error?: CombinedError) =>
  error ? error.graphQLErrors.map((e) => e.message).join("\n") : "";

export function primitiveObject<T>(name: string) {
  type R = T | null | undefined;
  return types.custom<T, R>({
    name,
    fromSnapshot(value: T) {
      return value as R;
    },
    toSnapshot(value: R) {
      return value as T;
    },
    isTargetType(value: T | T): boolean {
      return true;
    },
    getValidationMessage(value: T): string {
      return ""; // OK
    },
  });
}
