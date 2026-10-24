export type OutletType = 'Outlet' | 'Branch';
export type OutletStatus = 'Active' | 'Draft' | 'Closed';
export interface Outlet {
  id: string; name: string; type: OutletType; city: string; address: string; phone: string; manager: string;
  opens: string; closes: string; days: string; stock: number; lowItems: number; sales: number; status: OutletStatus; photo: number;
  staff: { name: string; role: string }[];
}
export interface RecentOrder { id: string; customer: string; amount: number; when: string }

const S = (a: [string, string][]) => a.map(([name, role]) => ({ name, role }));
export const SEED: Outlet[] = [
  { id: 'o1', name: 'Richiva New Road', type: 'Outlet', city: 'Kathmandu', address: 'New Road, Kathmandu 44600', phone: '+977 9801-234567', manager: 'Sunita Maharjan', opens: '10:00', closes: '20:00', days: 'Every day', stock: 1840, lowItems: 6, sales: 185000, status: 'Active', photo: 3, staff: S([['Sunita Maharjan', 'Manager'], ['Pema Sherpa', 'Sales'], ['Rojina Karki', 'Cashier']]) },
  { id: 'o2', name: 'Richiva Durbarmarg', type: 'Outlet', city: 'Kathmandu', address: 'Durbarmarg, Kathmandu 44600', phone: '+977 9802-345678', manager: 'Anil Basnet', opens: '10:30', closes: '20:30', days: 'Every day', stock: 1520, lowItems: 3, sales: 242500, status: 'Active', photo: 8, staff: S([['Anil Basnet', 'Manager'], ['Mina Gurung', 'Stylist'], ['Suman Tamang', 'Sales']]) },
  { id: 'o3', name: 'Richiva Pulchowk', type: 'Branch', city: 'Lalitpur', address: 'Pulchowk Road, Lalitpur 44700', phone: '+977 9841-456789', manager: 'Binita Shakya', opens: '10:00', closes: '19:30', days: 'Sun to Fri', stock: 940, lowItems: 9, sales: 96000, status: 'Active', photo: 12, staff: S([['Binita Shakya', 'Manager'], ['Nisha Rai', 'Sales']]) },
  { id: 'o4', name: 'Richiva Jawalakhel', type: 'Branch', city: 'Lalitpur', address: 'Jawalakhel Chowk, Lalitpur 44700', phone: '+977 9851-567890', manager: 'Prakash Joshi', opens: '10:00', closes: '19:00', days: 'Sun to Fri', stock: 780, lowItems: 4, sales: 72500, status: 'Active', photo: 5, staff: S([['Prakash Joshi', 'Manager'], ['Kabita Lama', 'Sales']]) },
  { id: 'o5', name: 'Richiva Lakeside', type: 'Outlet', city: 'Pokhara', address: 'Lakeside Road, Pokhara 33700', phone: '+977 9846-678901', manager: 'Dipika Gurung', opens: '09:30', closes: '20:00', days: 'Every day', stock: 1210, lowItems: 5, sales: 125000, status: 'Active', photo: 15, staff: S([['Dipika Gurung', 'Manager'], ['Ramesh Thapa', 'Sales'], ['Sabina Pun', 'Cashier']]) },
  { id: 'o6', name: 'Richiva Bhaktapur', type: 'Branch', city: 'Bhaktapur', address: 'Durbar Square Road, Bhaktapur 44800', phone: '+977 9803-789012', manager: 'Sarita Suwal', opens: '10:00', closes: '18:30', days: 'Every day', stock: 610, lowItems: 2, sales: 58000, status: 'Active', photo: 20, staff: S([['Sarita Suwal', 'Manager'], ['Kiran Prajapati', 'Sales']]) },
  { id: 'o7', name: 'Richiva Biratnagar', type: 'Branch', city: 'Biratnagar', address: 'Main Road, Biratnagar 56613', phone: '+977 9852-890123', manager: 'Manisha Yadav', opens: '10:00', closes: '19:00', days: 'Sun to Fri', stock: 520, lowItems: 11, sales: 0, status: 'Draft', photo: 24, staff: S([['Manisha Yadav', 'Manager']]) },
  { id: 'o8', name: 'Richiva Butwal', type: 'Branch', city: 'Butwal', address: 'Traffic Chowk, Butwal 32907', phone: '+977 9847-901234', manager: 'Gita Pokharel', opens: '10:00', closes: '19:00', days: 'Sun to Fri', stock: 430, lowItems: 7, sales: 41500, status: 'Active', photo: 28, staff: S([['Gita Pokharel', 'Manager'], ['Bishal Khadka', 'Sales']]) },
  { id: 'o9', name: 'Richiva Thamel Pop-up', type: 'Outlet', city: 'Kathmandu', address: 'Thamel Marg, Kathmandu 44600', phone: '+977 9808-012345', manager: 'Tashi Lama', opens: '11:00', closes: '21:00', days: 'Every day', stock: 0, lowItems: 0, sales: 0, status: 'Closed', photo: 31, staff: S([['Tashi Lama', 'Manager']]) },
  { id: 'o10', name: 'Richiva Chitwan', type: 'Branch', city: 'Bharatpur', address: 'Narayangadh Road, Bharatpur 44200', phone: '+977 9855-123456', manager: 'Reema Bhandari', opens: '10:00', closes: '19:00', days: 'Sun to Fri', stock: 300, lowItems: 1, sales: 0, status: 'Draft', photo: 35, staff: [] },
];

const NAMES = ['Aarati Sharma', 'Pooja Khadka', 'Sushmita Rana', 'Nirmala Dahal', 'Anjana Magar', 'Sapana Neupane', 'Rekha Poudel'];
export const recentOrders = (o: Outlet): RecentOrder[] => o.sales === 0 ? [] : NAMES.slice(0, 4).map((n, i) => ({
  id: `RCV-${10480 - i * 7 - o.id.length * 3 - Number(o.id.slice(1))}`, customer: n, amount: Math.round((o.sales / (6 + i)) / 100) * 100, when: ['12 min ago', '48 min ago', '2 hours ago', '3 hours ago'][i],
}));
