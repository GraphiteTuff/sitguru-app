/**
 * Dashboard-facing helpers for international profile / address fields.
 * Wraps lib/i18n/regional-config for form components under components/dashboard.
 */

export {
  formatFlexiblePhone,
  formatRegionalMoney,
  getRegionalConfig,
  isValidInternationalPhone,
  isValidPostalCode,
  listSupportedExpansionCountries,
  REGIONAL_CONFIGS,
  resolveRegionalConfig,
  type RegionalConfig,
  type RegionalCountryCode,
} from "@/lib/i18n/regional-config";
