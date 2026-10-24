import { PRODUCTS } from '../../data/seed';

export type RStatus = 'Pending' | 'Approved' | 'Rejected' | 'Flagged';
export type AiTag = 'Positive' | 'Neutral' | 'Negative' | 'Possible spam';
export interface Review { id: string; productId: string; rating: number; title: string; text: string; name: string; verified: boolean; date: string; photos: number[]; ai: AiTag; status: RStatus; featured: boolean; reply?: string; reason?: string }

type T = [number, number, string, string, string, boolean, string, number[], AiTag, RStatus];
const RAW: T[] = [
  [0, 5, 'Fits like it was made for me', 'The satin drapes beautifully and the stitching is clean. I wore it to my cousin\'s wedding in Pokhara and received so many compliments.', 'Sunita Gurung', true, '17 Oct 2026', [2, 5], 'Positive', 'Pending'],
  [1, 4, 'Lovely linen, runs slightly large', 'Soft, breathable and perfect for Kathmandu afternoons. I would size down if you are between sizes.', 'Priya Maharjan', true, '17 Oct 2026', [1], 'Positive', 'Pending'],
  [3, 5, 'Dashain outfit sorted', 'The Himal kurta set arrived in three days. Colours are true to the photos and the embroidery is delicate.', 'Anjali Thapa', true, '16 Oct 2026', [3, 7, 9], 'Positive', 'Pending'],
  [7, 3, 'Beautiful but the edge frayed', 'The pashmina feels luxurious, though one corner had loose threads. Customer care was helpful on the phone.', 'Sabina Rai', true, '16 Oct 2026', [], 'Neutral', 'Pending'],
  [8, 2, 'Sleeves too tight', 'Ordered my usual size M but the blazer felt snug around the arms. Fabric quality is good though.', 'Nisha Karki', true, '15 Oct 2026', [4], 'Negative', 'Pending'],
  [12, 5, 'Worth every rupee', 'The pleated maxi flows so nicely when I walk. Packaging was gorgeous too.', 'Rojina Tamang', true, '15 Oct 2026', [6, 8], 'Positive', 'Pending'],
  [5, 1, 'BUY CHEAP WATCHES www.deal-now.example', 'Great site visit our store for cheap watches and bags, discount code inside.', 'Manisha Adhikari', false, '14 Oct 2026', [], 'Possible spam', 'Pending'],
  [10, 4, 'Elegant chiffon', 'Light and graceful. I wish it came in more colours but the sage is pretty.', 'Bipana Shrestha', true, '14 Oct 2026', [10], 'Positive', 'Pending'],
  [16, 5, 'A showstopper gown', 'Wore the velvet gown to a gala in Lalitpur. The fit after alterations was perfect.', 'Kritika Basnet', true, '13 Oct 2026', [11, 12], 'Positive', 'Pending'],
  [0, 5, 'My new favourite dress', 'Soft, elegant and easy to style with a shawl. The delivery to Butwal took only two days.', 'Samjhana Pandey', true, '12 Oct 2026', [0], 'Positive', 'Approved'],
  [2, 4, 'Comfortable all day', 'The palazzo pants are airy and the waistband is comfortable. A little long for me.', 'Pooja Joshi', true, '11 Oct 2026', [], 'Positive', 'Approved'],
  [4, 5, 'Anarkali dreams', 'The embroidery is intricate and the flare is dramatic. Wore it for Tihar and felt wonderful.', 'Aastha Bhandari', true, '10 Oct 2026', [13, 2], 'Positive', 'Approved'],
  [6, 5, 'Warm without the weight', 'The wool blend coat kept me warm on a cold Dharan morning. Beautiful lining.', 'Rina Limbu', true, '9 Oct 2026', [5], 'Positive', 'Approved'],
  [9, 4, 'Great denim skirt', 'Good length and structure. Pockets are a pleasant surprise.', 'Sarita Magar', true, '8 Oct 2026', [], 'Positive', 'Approved'],
  [14, 5, 'Lounge luxury', 'The bamboo set is so soft against the skin. I have already ordered a second colour.', 'Deepa Koirala', true, '7 Oct 2026', [7], 'Positive', 'Approved'],
  [11, 3, 'Nice, but pilled after a wash', 'Lovely cardigan, although I noticed light pilling after the first wash. Handled it gently as advised.', 'Mamata Subedi', true, '6 Oct 2026', [], 'Neutral', 'Approved'],
  [17, 5, 'Perfect ribbed top', 'Holds its shape and the ivory is not see-through. Highly recommended.', 'Asmita Neupane', true, '5 Oct 2026', [1], 'Positive', 'Approved'],
  [15, 4, 'Summery and sweet', 'The floral print is vibrant and the fabric is breathable.', 'Laxmi Khadka', true, '4 Oct 2026', [], 'Positive', 'Approved'],
  [21, 5, 'Quilted and cosy', 'Light jacket that still keeps the chill away on early mornings in Chitwan.', 'Trishna Dahal', true, '3 Oct 2026', [9], 'Positive', 'Approved'],
  [18, 4, 'Classic shirt dress', 'Crisp ivory with a flattering belt. Ironing is a must but it is worth it.', 'Binita Ghimire', true, '2 Oct 2026', [], 'Positive', 'Approved'],
  [13, 1, 'Terrible, total waste', 'Does not look like the photo at all. Never buying again. Click my link for a better shop.', 'Sushma Bista', false, '1 Oct 2026', [], 'Possible spam', 'Rejected'],
  [19, 2, 'Colour did not match', 'The culottes looked greener in the picture. Returned for exchange.', 'Ishani Rana', true, '30 Sep 2026', [], 'Negative', 'Rejected'],
  [22, 1, 'Rude comment about delivery rider', 'Contains personal remarks about our rider that we cannot publish.', 'Kabita Sherpa', true, '29 Sep 2026', [], 'Negative', 'Flagged'],
  [23, 5, 'Gorgeous organza gown', 'Looks like it is straight from a magazine. Photos do not do it justice.', 'Smriti Acharya', false, '28 Sep 2026', [3], 'Positive', 'Flagged'],
];
export const SEED_REVIEWS: Review[] = RAW.map((r, i) => ({ id: `rv${i + 1}`, productId: PRODUCTS[r[0]].id, rating: r[1], title: r[2], text: r[3], name: r[4], verified: r[5], date: r[6], photos: r[7], ai: r[8], status: r[9], featured: i === 9 || i === 11, }));
export const RATING_BARS = [{ s: 5, n: 214 }, { s: 4, n: 72 }, { s: 3, n: 21 }, { s: 2, n: 8 }, { s: 1, n: 5 }];
export const REPLY_TEMPLATES = [
  'Thank you so much for your kind words. We are delighted you love it.',
  'We are sorry the fit was not right. Our team will message you about a free exchange.',
  'Thank you for the honest feedback. We have passed it on to our atelier.',
];
export const REJECT_REASONS = ['Spam or advertising', 'Offensive language', 'Not about the product', 'Contains personal details', 'Other'];
