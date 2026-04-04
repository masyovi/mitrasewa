export interface PriceData {
  id: string;
  item: string;
  label: string;
  unit: string;
  price: number;
  billingType: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockData {
  item: string;
  label: string;
  unit: string;
  total: number;
  disewa: number;
  perbaikan: number;
  tersedia: number;
}

export interface RentalItem {
  id: string;
  rentalId: string;
  item: string;
  label: string;
  jumlah: number;
  harga: number;
  billingType: string;
  multiplier: number;
  subtotal: number;
}

export interface RentalWithItems {
  id: string;
  namaPenyewa: string;
  noHp: string;
  alamat: string;
  tanggalSewa: string;
  tanggalKembali: string;
  lamaSewa: number;
  status: string;
  totalHarga: number;
  createdAt: string;
  updatedAt: string;
  items: RentalItem[];
  isOverdue?: boolean;
  daysOverdue?: number;
}
