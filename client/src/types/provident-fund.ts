export interface ProvidentFundSettings {
  id: string;
  minServiceMonths: number;
  employeeContributionRate: number;
  employerContributionRate: number;
  contributionFrequency: string;
  calculationBasis: string;
  withdrawalRules: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface UpdateProvidentFundSettingsPayload {
  minServiceMonths?: number;
  employeeContributionRate?: number;
  employerContributionRate?: number;
  contributionFrequency?: string;
  calculationBasis?: string;
  withdrawalRules?: string;
}
