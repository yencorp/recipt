
export interface Receipt {
  id: string;
  store: string;
  date: string;
  total: number;
  imageUrl: string;
}

export interface Project {
  id: string;
  name: string;
  receipts: Receipt[];
}

export interface ExtractedReceiptData {
    store: string;
    date: string; // YYYY-MM-DD
    total: number;
}
