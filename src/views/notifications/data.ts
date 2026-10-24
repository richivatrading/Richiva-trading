export type Ch = 'email' | 'sms' | 'whatsapp' | 'push';
export const CHANNELS: { id: Ch; label: string }[] = [{ id: 'email', label: 'Email' }, { id: 'sms', label: 'SMS' }, { id: 'whatsapp', label: 'WhatsApp' }, { id: 'push', label: 'Push' }];
export const VARS: Record<string, string> = { customer_name: 'Sunita', order_no: 'RCV-10482', total: 'Rs 7,450', tracking_no: 'WB482913NP', courier: 'Pathao', eta: 'Friday', product_name: 'Satin Slip Dress', refund_amount: 'Rs 4,500', store_name: 'Richiva', discount_code: 'WELCOME10' };
export const fill = (s: string) => s.replace(/\{\{(\w+)\}\}/g, (m, k) => VARS[k] ?? m);

export const EVENTS = [
  { id: 'placed', label: 'Order placed', subject: 'We have received your order {{order_no}}', msg: 'Thank you for your order {{order_no}} of {{total}}. We will confirm it shortly.', delay: 0 },
  { id: 'confirmed', label: 'Order confirmed', subject: 'Your order {{order_no}} is confirmed', msg: 'Your order {{order_no}} is confirmed and is being prepared in our Kathmandu atelier.', delay: 0 },
  { id: 'shipped', label: 'Order shipped', subject: 'Your order {{order_no}} is on its way', msg: 'Your order {{order_no}} has shipped with {{courier}}. Tracking number {{tracking_no}}.', delay: 0 },
  { id: 'ofd', label: 'Out for delivery', subject: 'Arriving today: order {{order_no}}', msg: 'Your order {{order_no}} is out for delivery today. Please keep your phone nearby.', delay: 0 },
  { id: 'delivered', label: 'Delivered', subject: 'Delivered: order {{order_no}}', msg: 'Your order {{order_no}} has been delivered. We hope you love your {{product_name}}.', delay: 60 },
  { id: 'payfail', label: 'Payment failed', subject: 'We could not take payment for {{order_no}}', msg: 'Payment for order {{order_no}} did not go through. Please try again to keep your order.', delay: 5 },
  { id: 'retapp', label: 'Return approved', subject: 'Your return for {{order_no}} is approved', msg: 'Your return for order {{order_no}} is approved. Our courier will collect it within 2 days.', delay: 0 },
  { id: 'refund', label: 'Refund sent', subject: 'Your refund of {{refund_amount}} is on its way', msg: 'We have sent a refund of {{refund_amount}} for order {{order_no}}. It may take 3 to 5 days to appear.', delay: 0 },
  { id: 'cart', label: 'Abandoned cart', subject: 'You left something beautiful behind', msg: 'Your {{product_name}} is still waiting. Use {{discount_code}} for 10% off today.', delay: 60 },
  { id: 'stock', label: 'Back in stock', subject: '{{product_name}} is back in stock', msg: 'Good news. {{product_name}} is back in stock in your size. It will not last long.', delay: 0 },
  { id: 'birthday', label: 'Birthday', subject: 'A little gift for your birthday', msg: 'Happy birthday {{customer_name}}. Enjoy a gift from us with code {{discount_code}}.', delay: 0 },
];
export type Tpl = { subject: string; body: string };
export type TplMap = Record<string, Record<Ch, Tpl>>;
export type Trig = Record<string, Record<Ch, boolean> & { delay: number }>;

export const initialTemplates = (): TplMap => Object.fromEntries(EVENTS.map((e) => [e.id, {
  email: { subject: e.subject, body: `Hi {{customer_name}},\n\n${e.msg}\n\nWith care,\nThe {{store_name}} team` },
  sms: { subject: '', body: `{{store_name}}: ${e.msg}` },
  whatsapp: { subject: '', body: `Hello {{customer_name}}, ${e.msg.charAt(0).toLowerCase()}${e.msg.slice(1)}` },
  push: { subject: e.subject, body: e.msg },
}]));
export const initialTriggers = (): Trig => Object.fromEntries(EVENTS.map((e, i) => [e.id, { email: true, sms: i % 3 !== 1, whatsapp: i % 2 === 0, push: i % 4 !== 3, delay: e.delay }]));

export const SEED_LOG = [
  ['Today, 10:42', 'shipped', 'sms', '+977 9841-228731', 'Delivered'], ['Today, 10:40', 'placed', 'email', 'priya.maharjan@gmail.com', 'Delivered'],
  ['Today, 10:31', 'confirmed', 'whatsapp', '+977 9803-552190', 'Sent'], ['Today, 10:12', 'payfail', 'sms', '+977 9862-104455', 'Failed'],
  ['Today, 09:58', 'ofd', 'push', 'Anjali Thapa (Android)', 'Delivered'], ['Today, 09:44', 'cart', 'email', 'sabina.rai@gmail.com', 'Sent'],
  ['Today, 09:20', 'delivered', 'whatsapp', '+977 9818-660231', 'Delivered'], ['Today, 09:05', 'placed', 'sms', '+977 9851-337842', 'Queued'],
  ['Yesterday, 18:40', 'refund', 'email', 'nisha.karki@gmail.com', 'Delivered'], ['Yesterday, 17:15', 'retapp', 'whatsapp', '+977 9845-901276', 'Failed'],
  ['Yesterday, 16:02', 'stock', 'push', 'Rojina Tamang (iPhone)', 'Delivered'], ['Yesterday, 12:30', 'birthday', 'email', 'manisha.adhikari@gmail.com', 'Sent'],
  ['Yesterday, 11:08', 'shipped', 'email', 'bipana.shrestha@gmail.com', 'Delivered'], ['Yesterday, 10:44', 'confirmed', 'sms', '+977 9860-445518', 'Delivered'],
].map((r, i) => ({ id: `l${i}`, time: r[0], event: r[1], ch: r[2] as Ch, to: r[3], status: r[4] }));
