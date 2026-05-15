/**
 * HubSpot Forms API Type Definitions
 */

interface HubSpotFormConfig {
  portalId: string;
  formId: string;
  target?: string;
  region?: string;
  onFormReady?: ($form: HTMLFormElement) => void;
  onFormSubmit?: ($form: HTMLFormElement, data: Record<string, unknown>) => void;
}

interface HubSpotForms {
  create(config: HubSpotFormConfig): void;
}

interface Window {
  hbspt?: {
    forms: HubSpotForms;
  };
  /** lsgo_ac school-autocomplete initialiser (lsgo_ac_global_v4) */
  lsgoACinit?: () => void;
}
