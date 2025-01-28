export type SalesPerson = {
  id: string;
  name: string;
  email: string;
  target: {
    meetings: number;
    deals: number;
  };
  current: {
    meetings: number;
    deals: number;
  };
};

export type Meeting = {
  id: string;
  salesPersonId: string;
  clientName: string;
  date: string;
  notes?: string;
};

export type Deal = {
  id: string;
  salesPersonId: string;
  clientName: string;
  value: number;
  closedDate: string;
  status: 'won' | 'lost';
}; 