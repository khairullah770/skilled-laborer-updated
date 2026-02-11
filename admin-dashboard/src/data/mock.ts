export interface Laborer {
  id: string;
  name: string;
  email: string;
  phone: string;
  category: string;
  status: 'Verified' | 'Pending' | 'Rejected';
  joinedDate: string;
  completedJobs: number;
  rating: number;
  verificationDetails?: {
    idType: string;
    idNumber: string;
    experience: string;
    certificateUrl?: string;
  };
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  joinedDate: string;
  totalBookings: number;
}

export interface ServiceCategory {
  id: string;
  name: string;
  subcategories: {
    id: string;
    name: string;
    price: number;
  }[];
}

export interface Booking {
  id: string;
  customerName: string;
  laborerName: string;
  service: string;
  status: 'Pending' | 'Ongoing' | 'Completed' | 'Cancelled';
  date: string;
  amount: number;
}

export const MOCK_LABORERS: Laborer[] = [
  {
    id: 'L1',
    name: 'John Doe',
    email: 'john@example.com',
    phone: '+1 234 567 8900',
    category: 'Plumbing',
    status: 'Verified',
    joinedDate: '2023-01-15',
    completedJobs: 45,
    rating: 4.8,
  },
  {
    id: 'L2',
    name: 'Mike Smith',
    email: 'mike@example.com',
    phone: '+1 234 567 8901',
    category: 'Electrical',
    status: 'Pending',
    joinedDate: '2023-10-20',
    completedJobs: 0,
    rating: 0,
    verificationDetails: {
      idType: 'National ID',
      idNumber: 'A123456789',
      experience: '5 Years',
    }
  },
  {
    id: 'L3',
    name: 'Sarah Wilson',
    email: 'sarah@example.com',
    phone: '+1 234 567 8902',
    category: 'Cleaning',
    status: 'Verified',
    joinedDate: '2023-03-10',
    completedJobs: 120,
    rating: 4.9,
  },
  {
    id: 'L4',
    name: 'David Brown',
    email: 'david@example.com',
    phone: '+1 234 567 8903',
    category: 'Carpentry',
    status: 'Rejected',
    joinedDate: '2023-09-01',
    completedJobs: 0,
    rating: 0,
  },
];

export const MOCK_CUSTOMERS: Customer[] = [
  {
    id: 'C1',
    name: 'Alice Johnson',
    email: 'alice@example.com',
    phone: '+1 987 654 3210',
    joinedDate: '2023-02-01',
    totalBookings: 12,
  },
  {
    id: 'C2',
    name: 'Robert Davis',
    email: 'robert@example.com',
    phone: '+1 987 654 3211',
    joinedDate: '2023-05-15',
    totalBookings: 3,
  },
];

export const MOCK_CATEGORIES: ServiceCategory[] = [
  {
    id: 'CAT1',
    name: 'Plumbing',
    subcategories: [
      { id: 'SUB1', name: 'Leak Repair', price: 50 },
      { id: 'SUB2', name: 'Pipe Installation', price: 100 },
    ],
  },
  {
    id: 'CAT2',
    name: 'Electrical',
    subcategories: [
      { id: 'SUB3', name: 'Wiring', price: 80 },
      { id: 'SUB4', name: 'Switch Replacement', price: 30 },
    ],
  },
];

export const MOCK_BOOKINGS: Booking[] = [
  {
    id: 'B1',
    customerName: 'Alice Johnson',
    laborerName: 'John Doe',
    service: 'Leak Repair',
    status: 'Completed',
    date: '2023-10-25',
    amount: 50,
  },
  {
    id: 'B2',
    customerName: 'Robert Davis',
    laborerName: 'Sarah Wilson',
    service: 'Home Cleaning',
    status: 'Ongoing',
    date: '2023-10-27',
    amount: 120,
  },
  {
    id: 'B3',
    customerName: 'Alice Johnson',
    laborerName: 'Mike Smith',
    service: 'Wiring',
    status: 'Pending',
    date: '2023-10-28',
    amount: 80,
  },
];
