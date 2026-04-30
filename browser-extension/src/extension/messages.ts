import type { SiteActivationState } from "../core/index.js";

export type RuntimeRequest =
  | {
      type: "GET_SITE_STATUS";
      url: string;
    }
  | {
      type: "SET_SITE_STATUS";
      url: string;
      enabled: boolean;
    };

export type RuntimeResponse =
  | {
      ok: true;
      state: SiteActivationState;
    }
  | {
      ok: false;
      error: string;
    };

export interface SiteStatusChangedMessage {
  type: "SITE_STATUS_CHANGED";
  origin: string;
  state: SiteActivationState;
}
