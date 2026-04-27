import type { Spec } from "axe-core";

export const axeConfig: Spec = {
  rules: [
    { id: "color-contrast", enabled: true },
    { id: "label", enabled: true },
    { id: "button-name", enabled: true },
    { id: "link-name", enabled: true },
    { id: "image-alt", enabled: true },
    { id: "aria-required-attr", enabled: true },
    { id: "aria-valid-attr", enabled: true },
    { id: "aria-valid-attr-value", enabled: true },
    { id: "focus-order-semantics", enabled: true },
    { id: "keyboard", enabled: true },
  ],
};
