export interface FestivalBonusRule {
  id: string;
  minServiceMonths: number;
  maxServiceMonths: number;
  bonusPercentage: number;
  isProRata: boolean;
  description: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFestivalBonusRulePayload {
  minServiceMonths: number;
  maxServiceMonths: number;
  bonusPercentage: number;
  isProRata?: boolean;
  description?: string;
}

export interface UpdateFestivalBonusRulePayload {
  minServiceMonths?: number;
  maxServiceMonths?: number;
  bonusPercentage?: number;
  isProRata?: boolean;
  description?: string;
}
