// Shilpi Prototype Data & Types matching prototype-logic.js exactly

export interface Client {
  id: number;
  name: string;
  phone: string;
  bookings: number;
  sales: number;
  profit: number;
  history: { date: string; pkg: string; amount: number }[];
  photoUri?: string;
  notes?: string;
}

export interface BookingItem {
  name: string;
  price: number;
}

export interface Booking {
  id: string;
  ref: string;
  client: string;
  day: number;
  month: string;
  dateLong: string;
  time: string;
  meridiem: string;
  today?: boolean;
  items: BookingItem[];
  travel: number;
  advance: number;
  status: 'Upcoming' | 'Completed' | 'Closed';
  venue: string;
  address: string;
  notes: string;
}

export interface PackageItem {
  name: string;
  price: number;
}

export interface PackageGroup {
  name: string;
  items: PackageItem[];
}

export interface NotificationItem {
  id: string;
  glyph: string;
  title: string;
  body: string;
  time: string;
  to: string;
}

export interface PlanItem {
  months: number;
  perMonth: number;
  badge: string;
}

export const INITIAL_CLIENTS: Client[] = [
  {
    id: 1,
    name: 'Priya Raghavan',
    phone: '+91 98842 10233',
    bookings: 3,
    sales: 41000,
    profit: 32500,
    history: [
      { date: '12 Jan', pkg: 'Bridal', amount: 15000 },
      { date: '18 Mar', pkg: 'Reception', amount: 8000 },
      { date: '22 Aug', pkg: 'Bridal', amount: 18000 },
    ],
  },
  {
    id: 2,
    name: 'Divya Krishnan',
    phone: '+91 90031 55420',
    bookings: 2,
    sales: 18000,
    profit: 13200,
    history: [
      { date: '04 Feb', pkg: 'Party', amount: 8000 },
      { date: '14 Sep', pkg: 'Reception', amount: 10000 },
    ],
  },
  {
    id: 3,
    name: 'Anu Menon',
    phone: '+91 94430 77812',
    bookings: 4,
    sales: 56000,
    profit: 44000,
    history: [
      { date: '09 Dec', pkg: 'Bridal', amount: 18000 },
      { date: '21 Apr', pkg: 'Party', amount: 5000 },
      { date: '30 Jun', pkg: 'Bridal', amount: 26500 },
      { date: '14 Sep', pkg: 'Party', amount: 6500 },
    ],
  },
  {
    id: 4,
    name: 'Keerthi Bala',
    phone: '+91 89409 21764',
    bookings: 1,
    sales: 5000,
    profit: 3800,
    history: [{ date: '17 Jul', pkg: 'Party', amount: 5000 }],
  },
  {
    id: 5,
    name: 'Lakshmi Iyer',
    phone: '+91 97878 40199',
    bookings: 2,
    sales: 26000,
    profit: 19500,
    history: [
      { date: '11 May', pkg: 'Reception', amount: 8000 },
      { date: '02 Aug', pkg: 'Bridal', amount: 18000 },
    ],
  },
];

export const INITIAL_PKG_GROUPS: PackageGroup[] = [
  {
    name: 'Makeup',
    items: [
      { name: 'Bridal Makeup', price: 15000 },
      { name: 'Reception Makeup', price: 8000 },
      { name: 'Party Makeup', price: 5000 },
    ],
  },
  {
    name: 'Hair Styling',
    items: [
      { name: 'Bridal Hair', price: 3000 },
      { name: 'Party Hair', price: 1500 },
    ],
  },
  {
    name: 'Saree Draping',
    items: [
      { name: 'Bridal Draping', price: 2000 },
      { name: 'Normal Draping', price: 1000 },
    ],
  },
];

export const INITIAL_BOOKINGS: Booking[] = [
  {
    id: 'b1',
    ref: 'Booking #2609',
    client: 'Anu Menon',
    day: 14,
    month: 'Sep',
    dateLong: 'Mon 14 Sep 2026',
    time: '10:00',
    meridiem: 'AM',
    today: true,
    items: [
      { name: 'Party Makeup', price: 5000 },
      { name: 'Party Hair', price: 1500 },
    ],
    travel: 0,
    advance: 0,
    status: 'Upcoming',
    venue: 'Residence · Race Course',
    address: '12 Chinnaswamy Rd, Race Course, Coimbatore',
    notes: 'Soft glam, client prefers nude tones. Reach 45 min early.',
  },
  {
    id: 'b2',
    ref: 'Booking #2610',
    client: 'Divya Krishnan',
    day: 14,
    month: 'Sep',
    dateLong: 'Mon 14 Sep 2026',
    time: '6:00',
    meridiem: 'PM',
    today: true,
    items: [
      { name: 'Reception Makeup', price: 8000 },
      { name: 'Normal Draping', price: 1000 },
    ],
    travel: 1000,
    advance: 0,
    status: 'Upcoming',
    venue: 'Hotel Le Meridien',
    address: 'Avinashi Rd, Neelambur, Coimbatore',
    notes: 'Reception look — heavier eye. Hall lighting is warm, check base shade.',
  },
  {
    id: 'b3',
    ref: 'Booking #2612',
    client: 'Priya Raghavan',
    day: 18,
    month: 'Sep',
    dateLong: 'Fri 18 Sep 2026',
    time: '5:30',
    meridiem: 'AM',
    items: [
      { name: 'Bridal Makeup', price: 15000 },
      { name: 'Bridal Hair', price: 3000 },
      { name: 'Bridal Draping', price: 2000 },
    ],
    travel: 1500,
    advance: 8000,
    status: 'Upcoming',
    venue: 'Sri Kamatchi Mahal',
    address: 'RS Puram, Coimbatore',
    notes: 'HD airbrush, no false lashes. Muhurtham at 7:10 AM — finish by 6:45.',
  },
  {
    id: 'b4',
    ref: 'Booking #2615',
    client: 'Keerthi Bala',
    day: 22,
    month: 'Sep',
    dateLong: 'Tue 22 Sep 2026',
    time: '4:00',
    meridiem: 'PM',
    items: [{ name: 'Party Makeup', price: 5000 }],
    travel: 0,
    advance: 2000,
    status: 'Upcoming',
    venue: 'Residence · Saibaba Colony',
    address: 'Saibaba Colony, Coimbatore',
    notes: 'Engagement party. Client will send reference photos on WhatsApp.',
  },
  {
    id: 'b5',
    ref: 'Booking #2618',
    client: 'Lakshmi Iyer',
    day: 29,
    month: 'Sep',
    dateLong: 'Tue 29 Sep 2026',
    time: '5:00',
    meridiem: 'AM',
    items: [
      { name: 'Bridal Makeup', price: 15000 },
      { name: 'Bridal Hair', price: 3000 },
    ],
    travel: 2000,
    advance: 10000,
    status: 'Upcoming',
    venue: 'Nachiar Thirumana Mandapam',
    address: 'Peelamedu, Coimbatore',
    notes: 'Second bride (sister) needs party makeup — confirm add-on.',
  },
  {
    id: 'b6',
    ref: 'Booking #2604',
    client: 'Anu Menon',
    day: 30,
    month: 'Jun',
    dateLong: 'Tue 30 Jun 2026',
    time: '6:00',
    meridiem: 'AM',
    items: [
      { name: 'Bridal Makeup', price: 15000 },
      { name: 'Bridal Hair', price: 3000 },
      { name: 'Bridal Draping', price: 2000 },
    ],
    travel: 1500,
    advance: 26500,
    status: 'Completed',
    venue: 'CODISSIA Trade Fair Complex',
    address: 'Avinashi Rd, Coimbatore',
    notes: 'Delivered. Photos pending from the photographer.',
  },
  {
    id: 'b7',
    ref: 'Booking #2598',
    client: 'Lakshmi Iyer',
    day: 2,
    month: 'Aug',
    dateLong: 'Sun 2 Aug 2026',
    time: '5:30',
    meridiem: 'AM',
    items: [
      { name: 'Bridal Makeup', price: 15000 },
      { name: 'Bridal Draping', price: 2000 },
    ],
    travel: 1000,
    advance: 18000,
    status: 'Closed',
    venue: 'Sri Ayyappan Mahal',
    address: 'Ganapathy, Coimbatore',
    notes: 'Closed. 6 photos uploaded, Instagram posted 4 Aug.',
  },
];

export const INITIAL_NOTIFS: NotificationItem[] = [
  {
    id: 'n1',
    glyph: '₹',
    title: 'Payment received — ₹15,000',
    body: 'Priya Raghavan paid the balance for her bridal booking on 18 Sep.',
    time: 'Today · 9:12 AM',
    to: 'payments',
  },
  {
    id: 'n2',
    glyph: '●',
    title: 'Booking today at 10:00 AM',
    body: 'Anu Menon · Party Makeup + Party Hair at Race Course. Leave by 9:15.',
    time: 'Today · 7:00 AM',
    to: 'orders',
  },
  {
    id: 'n3',
    glyph: '!',
    title: '₹10,000 balance still pending',
    body: 'Divya Krishnan · reception booking on 14 Sep. Send a reminder?',
    time: 'Yesterday · 6:30 PM',
    to: 'payments',
  },
  {
    id: 'n4',
    glyph: '＋',
    title: 'New booking request',
    body: 'Keerthi Bala asked about 22 Sep, 4:00 PM for party makeup.',
    time: 'Yesterday · 2:05 PM',
    to: 'orders',
  },
  {
    id: 'n5',
    glyph: 'star',
    title: 'Anu Menon left you a 5-star review',
    body: '"Flawless work and so calm on the morning of the wedding."',
    time: '12 Sep',
    to: 'gallery',
  },
  {
    id: 'n6',
    glyph: '↑',
    title: 'August report is ready',
    body: 'Sales ₹1,10,000 · profit ₹79,000 — your best month so far.',
    time: '1 Sep',
    to: 'reports',
  },
];

export const QUOTES = [
  {
    title: 'Artist who makes every moment beautiful.',
    subtitle: 'Behind every radiant smile is your craft, patience, and magic.',
  },
  {
    title: 'You are a hard worker.',
    subtitle: 'We see the effort you put in every single day.',
  },
  {
    title: 'Every appointment has a story of hard work behind it.',
    subtitle: 'The early mornings, late nights, and countless hours — it all matters.',
  },
  {
    title: 'Miles travelled, just to be there for someone’s special moment.',
    subtitle: 'Your time, your energy and your dedication make every appointment special.',
  },
  {
    title: 'Late nights. Long hours. Endless effort.',
    subtitle: 'And still, you give your very best.',
  },
  {
    title: 'You don’t just create beautiful looks.',
    subtitle: 'You make people feel beautiful and confident.',
  },
  {
    title: 'Every brush stroke carries your passion.',
    subtitle: 'Every look reflects your talent.',
  },
  {
    title: 'You make every moment beautiful.',
    subtitle: 'And we are proud to be a part of your journey.',
  },
  {
    title: 'Shilpi',
    subtitle: 'For the artists who make every moment beautiful.',
  },
];

export const PLANS: PlanItem[] = [
  { months: 3, perMonth: 499, badge: 'Standard' },
  { months: 6, perMonth: 449, badge: 'Save 10%' },
  { months: 12, perMonth: 399, badge: 'Best value' },
];

export const fmt = (n: number | string) => '₹' + Number(n).toLocaleString('en-IN');
export const first = (name: string) => name.split(' ')[0];
