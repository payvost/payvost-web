export type WorkspaceType = 'PERSONAL' | 'BUSINESS';

export type CardStatus = 'ACTIVE' | 'FROZEN' | 'TERMINATED';
export type CardNetwork = 'VISA' | 'MASTERCARD';
export type CardType = 'VIRTUAL' | 'PHYSICAL';
export type SpendingInterval = 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY' | 'ALL_TIME';

export type CardControls = {
  version: number;
  spendLimitAmount: number | string | null;
  spendLimitInterval: SpendingInterval;
  allowedCountries: string[];
  blockedCountries: string[];
  allowedMcc: string[];
  blockedMcc: string[];
  merchantAllowlist: string[];
  merchantBlocklist: string[];
  onlineAllowed: boolean;
  atmAllowed: boolean;
  contactlessAllowed: boolean;
  updatedAt: string;
};

export type CardSummary = {
  id: string;
  workspaceId: string;
  accountId: string;
  label: string;
  status: CardStatus;
  network: CardNetwork;
  type: CardType;
  currency: string;
  last4: string;
  expMonth?: number | null;
  expYear?: number | null;
  assignedToUserId?: string | null;
  createdAt: string;
  updatedAt: string;
  controls?: CardControls | null;
};

export type ListCardsResponse = {
  workspaceId: string;
  cards: CardSummary[];
};

export type CreateCardRequest = {
  workspaceId?: string;
  workspaceType?: WorkspaceType;
  accountId: string;
  label: string;
  network: CardNetwork;
  type?: CardType;
  assignedToUserId?: string;
  controls?: Partial<Omit<CardControls, 'version' | 'updatedAt'>>;
};

export type CreateCardResponse = {
  card: CardSummary;
  idempotent?: boolean;
};

export type RevealCardResponse = {
  pan?: string;
  cvv?: string;
  expMonth?: number | null;
  expYear?: number | null;
  expiresAt: string;
};

export type CardTransaction = {
  id: string;
  cardId: string;
  providerTxId: string;
  kind: 'AUTH' | 'CLEARING' | 'REFUND' | 'REVERSAL';
  amount: string | number;
  currency: string;
  merchantName?: string | null;
  merchantCountry?: string | null;
  mcc?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'DECLINED' | 'REVERSED';
  happenedAt: string;
  createdAt: string;
};

export type ListCardTransactionsResponse = {
  transactions: CardTransaction[];
};

export type CardAuditItem = {
  kind: 'EVENT' | 'REVEAL';
  id: string;
  type: string;
  actorUserId: string | null;
  createdAt: string;
  payload?: any;
};

export type ListCardEventsResponse = {
  events: CardAuditItem[];
};
