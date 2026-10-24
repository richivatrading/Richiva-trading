import { Download, Printer } from 'lucide-react';
import { Logo } from '../../ui/brand';
import { Button, Modal } from '../../ui/kit';
import { rs } from '../../lib/format';
import type { Order } from '../../data/seed';
import { productOf, totalsOf, unitPrice } from './shared';

const PRINT_CSS = `@media print { body * { visibility: hidden !important; } #invoice-print, #invoice-print * { visibility: visible !important; } #invoice-print { position: fixed; left: 0; top: 0; width: 100%; box-shadow: none !important; } @page { size: A4; margin: 12mm; } }`;

export default function InvoicePreview({ order, onClose }: { order: Order; onClose: () => void }) {
  const t = totalsOf(order);
  const print = () => window.print();
  return (
    <Modal open onClose={onClose} size="xl" title={`Invoice ${order.id}`}
      footer={<><Button variant="secondary" onClick={onClose}>Close</Button><Button variant="secondary" icon={Download} onClick={print}>Download PDF</Button><Button icon={Printer} onClick={print}>Print</Button></>}>
      <style>{PRINT_CSS}</style>
      <div className="bg-stone rounded-xl p-4 sm:p-6 overflow-x-auto">
        <div id="invoice-print" className="mx-auto bg-white text-neutral-900 shadow-[var(--shadow)] p-10 text-[13px]" style={{ width: 720, minHeight: 600 }}>
          <div className="flex justify-between items-start">
            <div><Logo width={140} /><div className="text-neutral-500 mt-3 leading-5">Richiva Fashion Pvt. Ltd.<br />Jawalakhel, Lalitpur, Nepal<br />PAN 601234567 · hello@richiva.com</div></div>
            <div className="text-right"><div className="font-title text-[32px] leading-none">Tax invoice</div><div className="mt-2 text-neutral-500">No. INV-{order.id.slice(4)}<br />Order {order.id}<br />{order.date}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-6 mt-8">
            <div><div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 mb-1">Billed to</div><div className="font-medium">{order.customer}</div><div className="text-neutral-600 leading-5">{order.address}<br />{order.phone}</div></div>
            <div className="text-right"><div className="text-[10px] uppercase tracking-[0.14em] text-neutral-500 mb-1">Payment</div><div className="font-medium">{order.pay}</div><div className="text-neutral-600">{order.pay === 'COD' ? 'Pay on delivery' : 'Paid online'}</div></div>
          </div>
          <table className="w-full mt-8 border-collapse">
            <thead><tr className="text-left text-[10px] uppercase tracking-[0.14em] text-neutral-500 border-b border-neutral-300"><th className="py-2 font-normal">Item</th><th className="font-normal">Qty</th><th className="font-normal text-right">Price</th><th className="font-normal text-right">Amount</th></tr></thead>
            <tbody>{order.items.map((i, k) => { const p = productOf(i.productId); return (
              <tr key={k} className="border-b border-neutral-200"><td className="py-2.5">{p.name}<div className="text-neutral-500 text-[11.5px]">{i.color} · {i.size} · {p.sku}</div></td><td>{i.qty}</td><td className="text-right num">{rs(unitPrice(i.productId))}</td><td className="text-right num">{rs(unitPrice(i.productId) * i.qty)}</td></tr>); })}</tbody>
          </table>
          <div className="ml-auto mt-5 w-64 leading-7">
            <div className="flex justify-between"><span className="text-neutral-500">Subtotal</span><span className="num">{rs(t.sub)}</span></div>
            {t.discount > 0 && <div className="flex justify-between"><span className="text-neutral-500">Discount</span><span className="num">-{rs(t.discount)}</span></div>}
            <div className="flex justify-between"><span className="text-neutral-500">Shipping</span><span className="num">{t.shipping ? rs(t.shipping) : 'Free'}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">Taxable value</span><span className="num">{rs(t.total - t.vat)}</span></div>
            <div className="flex justify-between"><span className="text-neutral-500">VAT 13% (included)</span><span className="num">{rs(t.vat)}</span></div>
            <div className="flex justify-between border-t border-neutral-900 mt-1 pt-1.5 text-[15px] font-semibold"><span>Total</span><span className="num">{rs(t.total)}</span></div>
          </div>
          <div className="mt-12 text-center text-neutral-500 text-[12px]">Thank you for shopping with Richiva. Exchanges within 7 days with the tag attached.</div>
        </div>
      </div>
    </Modal>
  );
}
