import { CUSTOMER_NAMES, CUSTOMERS, ORDERS, TEAM, type Customer, type Order } from '../../data/seed';

export type Channel = 'Web' | 'App' | 'Email' | 'WhatsApp';
export type TStatus = 'Open' | 'Waiting' | 'Escalated' | 'Closed';
export type Priority = 'High' | 'Medium' | 'Low';
export type Sentiment = 'Upset' | 'Worried' | 'Neutral' | 'Happy';
export interface Msg { id: string; from: 'customer' | 'agent' | 'note'; text: string; time: string; files?: string[]; order?: string }
export interface Ticket {
  id: string; name: string; channel: Channel; status: TStatus; priority: Priority; assignee: string; topic: string; subject: string;
  msgs: Msg[]; unread: number; since: number; dueAt: number; total: number; orders: string[]; rating?: number; follow: string;
  ai: { reply: string; summary: string; topic: string; sentiment: Sentiment; category: string; priority: Priority };
}
export const AGENTS = TEAM.filter((t) => ['Support', 'Manager'].includes(t.role)).map((t) => t.name);
export const customerOf = (name: string): Customer | undefined => CUSTOMERS.find((c) => c.name === name);
export const ordersOf = (name: string): Order[] => ORDERS.filter((o) => o.customer === name);
export const hhmm = (d = new Date()) => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const N = (i: number) => CUSTOMER_NAMES[i];
const M = 60000;
const now = Date.now();
const t = (id: string, name: string, channel: Channel, status: TStatus, priority: Priority, assignee: string, topic: string, subject: string, waitMin: number, dueMin: number, total: number, msgs: [Msg['from'], string, string][], follow: string, ai: Ticket['ai']): Ticket => ({
  id, name, channel, status, priority, assignee, topic, subject, since: now - waitMin * M, dueAt: now + dueMin * M, total, orders: ordersOf(name).slice(0, 1).map((o) => o.id), unread: status === 'Closed' ? 0 : 1, follow, ai,
  msgs: msgs.map(([from, text, time], k) => ({ id: `${id}-${k}`, from, text, time })),
});

export const TICKETS0: Ticket[] = [
  t('T-2041', N(0), 'WhatsApp', 'Open', 'High', 'Unassigned', 'Size exchange', 'Dress is too small, can I swap for M?', 21, 4, 60, [
    ['customer', 'Namaste! I received the Satin Slip Dress yesterday but it is too tight at the waist.', '10:02'], ['customer', 'Can I exchange it for size M? I have not worn it, tags are on.', '10:03']],
    'I can send the photo of the tag if you need it. Also, will the pickup be free?',
    { reply: 'Namaste Sunita, sorry the fit was not right. We can swap it for size M at no cost. Our rider will collect the dress within 2 days and send the new one after it reaches us.', summary: 'Customer received a satin dress in the wrong size and wants a free swap to M. Item is unworn with tags.', topic: 'Size exchange', sentiment: 'Worried', category: 'Returns and exchanges', priority: 'Medium' }),
  t('T-2040', N(1), 'Web', 'Waiting', 'Medium', 'Maya Tuladhar', 'COD delivery delay', 'COD order not delivered after 5 days', 96, 38, 240, [
    ['customer', 'My cash on delivery order to Baneshwor was supposed to arrive in 2 days. It is day 5.', '08:14'], ['agent', 'Namaste Priya, I am checking with the courier now and will update you shortly.', '08:40'], ['customer', 'Please hurry, I need it for a family function on Friday.', '09:05']],
    'The courier called me just now and said they will come tomorrow. Is that right?',
    { reply: 'Namaste Priya, thank you for waiting. The courier confirmed your parcel is out for delivery tomorrow before 5 pm. I will message you the rider number tonight.', summary: 'COD parcel to Kathmandu is 3 days late. Customer needs it by Friday for an event.', topic: 'COD delivery delay', sentiment: 'Upset', category: 'Delivery', priority: 'High' }),
  t('T-2039', N(2), 'App', 'Open', 'High', 'Maya Tuladhar', 'Payment failed', 'ConnectIPS deducted but no order', 34, 9, 60, [
    ['customer', 'Money was deducted from my bank through ConnectIPS but I got no order confirmation.', '09:41'], ['customer', 'Reference number 8841-2290-71. Please check.', '09:42']],
    'It is still not showing in my orders. Should I pay again?',
    { reply: 'Namaste Anjali, please do not pay again. We can see your ConnectIPS reference and will either confirm the order or refund the full amount within 24 hours. I will update you here.', summary: 'ConnectIPS debited the customer but no order was created. She gave a payment reference.', topic: 'Payment failed', sentiment: 'Worried', category: 'Payments', priority: 'High' }),
  t('T-2038', N(3), 'Email', 'Open', 'Medium', 'Unassigned', 'Custom order', 'Anarkali made to measure for a wedding', 180, 240, 480, [
    ['customer', 'Hello Richiva team, I love the embroidered Anarkali. Can it be stitched to my measurements? The wedding is on 12 Nov.', '07:20'], ['customer', 'I can share my measurements by tomorrow.', '07:21']],
    'Here are my measurements: bust 36, waist 30, hip 38, length 52. Is the date still possible?',
    { reply: 'Namaste Sabina, yes, we make the Anarkali to measure. Production takes about 14 days, so 12 Nov is possible if we get your measurements this week. I will send you our measurement guide.', summary: 'Customer wants a made to measure Anarkali for a wedding on 12 Nov and will send measurements.', topic: 'Custom order', sentiment: 'Happy', category: 'Custom orders', priority: 'Medium' }),
  t('T-2037', N(4), 'WhatsApp', 'Waiting', 'Medium', 'Maya Tuladhar', 'COD delivery delay', 'Parcel stuck at Pokhara branch', 140, 22, 120, [
    ['customer', 'My parcel has been at the Pokhara branch since Monday.', '08:02'], ['agent', 'Sorry for the wait Nisha. I have raised it with Nepal Can Move.', '08:30']],
    'Nobody has called me yet. Can you give me another courier?',
    { reply: 'Namaste Nisha, the courier is slow at the Pokhara branch. I have asked them to prioritise your parcel and will check again at 2 pm today.', summary: 'Parcel stuck at the Pokhara branch for three days. Courier already contacted once.', topic: 'COD delivery delay', sentiment: 'Upset', category: 'Delivery', priority: 'High' }),
  t('T-2036', N(5), 'Web', 'Escalated', 'High', 'Anita Shrestha', 'Refund', 'Return refund not received', 300, 90, 480, [
    ['customer', 'I returned the Wool Blend Coat 9 days ago. Still no refund.', 'Yesterday'], ['agent', 'We received the coat. Finance is processing your refund.', 'Yesterday'], ['note', 'Escalated: refund waiting for Finance approval.', 'Yesterday']],
    'Any news about my refund?',
    { reply: 'Namaste Rojina, your refund of the Wool Blend Coat has been approved and will reach your eSewa within 2 working days.', summary: 'Return was received nine days ago, refund still pending Finance approval.', topic: 'Refund', sentiment: 'Upset', category: 'Refunds', priority: 'High' }),
  t('T-2035', N(6), 'App', 'Open', 'Low', 'Unassigned', 'Size exchange', 'Which size for the Himal Kurta Set?', 12, 55, 120, [
    ['customer', 'I am between M and L. Is the Himal Kurta Set true to size?', '10:20']],
    'I am 5 feet 3 inches and 58 kg. Which one is better?',
    { reply: 'Namaste Manisha, the Himal Kurta Set fits close to the body. At 5 ft 3 and 58 kg we suggest size M. If you like a looser fit choose L.', summary: 'Customer is unsure between M and L for a kurta set before buying.', topic: 'Product advice', sentiment: 'Neutral', category: 'Pre-sale question', priority: 'Low' }),
  t('T-2034', N(7), 'Email', 'Open', 'High', 'Maya Tuladhar', 'Payment failed', 'NPX payment timed out twice', 27, 6, 60, [
    ['customer', 'I tried paying with NPX twice and the page just hangs. I really want this order.', '10:01']],
    'It worked on the third try but now I see two charges.',
    { reply: 'Namaste Bipana, sorry about that. If two charges appear, we will refund the extra one straight away. Please share a screenshot of the NPX statement.', summary: 'NPX checkout timed out twice and may have charged the customer more than once.', topic: 'Payment failed', sentiment: 'Upset', category: 'Payments', priority: 'High' }),
  t('T-2033', N(8), 'WhatsApp', 'Waiting', 'Low', 'Maya Tuladhar', 'Product question', 'Is the chiffon blouse see-through?', 75, 120, 480, [
    ['customer', 'Is the Chiffon Blouse see-through? Can I wear it without a camisole?', '09:05'], ['agent', 'Great question Kritika. The ivory is lightly sheer, I will send a close-up photo.', '09:20']],
    'Thank you, the photo helps. I will order the sand colour.',
    { reply: 'Namaste Kritika, the sand colour is the most opaque. We still suggest a light camisole underneath for comfort.', summary: 'Customer asking about sheerness of a chiffon blouse.', topic: 'Product advice', sentiment: 'Neutral', category: 'Pre-sale question', priority: 'Low' }),
  t('T-2032', N(9), 'Web', 'Closed', 'Medium', 'Maya Tuladhar', 'Custom order', 'Blouse alteration for Dashain', 600, 300, 480, [
    ['customer', 'Can you shorten the sleeves on my Lehenga set blouse?', 'Mon'], ['agent', 'Yes, our tailor can do that in 3 days. No charge.', 'Mon'], ['customer', 'Perfect, thank you so much!', 'Tue']],
    '',
    { reply: 'Namaste Samjhana, your blouse is ready. Thank you for shopping with Richiva.', summary: 'Sleeve alteration done and delivered.', topic: 'Custom order', sentiment: 'Happy', category: 'Custom orders', priority: 'Low' }),
];

export const CANNED = [
  { id: 'c1', label: 'Greeting', text: 'Namaste! Thank you for contacting Richiva. How can I help you today?' },
  { id: 'c2', label: 'Exchange policy', text: 'You can exchange any unworn item with tags within 7 days. We collect it from your door and the swap is free.' },
  { id: 'c3', label: 'Delivery update', text: 'I am checking with the courier and will update you within the hour.' },
  { id: 'c4', label: 'Payment check', text: 'Please do not pay again. We are checking your payment reference and will confirm or refund within 24 hours.' },
  { id: 'c5', label: 'Custom order measurements', text: 'For made to measure orders please share bust, waist, hip and length in inches. Production takes about 14 days.' },
  { id: 'c6', label: 'Thank you', text: 'Thank you for your patience. Is there anything else I can help with?' },
];
