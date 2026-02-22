export interface Person {
  id: string;
  name: string;
  email?: string;
}

export interface Group {
  id: string;
  name: string;
  memberIds: string[];
}

export type SplitType = 'equal' | 'percentage' | 'exact';

export interface Split {
  personId: string;
  amount: number;
  percentage?: number;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  date: string;
  paidById: string;
  groupId?: string;
  splits: Split[];
  splitType: SplitType;
}

export interface Balance {
  personId: string;
  amount: number; // Positive means they are owed, negative means they owe
}
