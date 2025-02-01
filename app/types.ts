export interface SalesPerson {
  id: string;
  name: string;
  email: string;
  current: {
    meetings: number;
    deals: number;
  };
  target: {
    meetings: number;
    deals: number;
  };
}

export interface Meeting {
  id: string;
  salesPersonId: string;
  clientName: string;
  date: string;
  notes: string;
  outcome?: string;
}

export interface Deal {
  id: string;
  salesPersonId: string;
  clientName: string;
  value: number;
  closedDate: string;
  status: 'won' | 'lost';
} 