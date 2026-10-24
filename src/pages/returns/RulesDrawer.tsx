import { Button, Chip, Drawer, Field, Label, Slider, Switch } from '../../ui/kit';
import { useApp } from '../../store';
import { NON_RETURNABLE_OPTIONS, patchReturn, policyStore, returnsStore } from './data';

export default function RulesDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [pol, setPol] = policyStore.use(); const { toast } = useApp();
  const toggleAuto = (v: boolean) => {
    setPol({ ...pol, autoApprove: v });
    if (!v) return;
    const hits = returnsStore.get().filter((r) => r.status === 'Requested' && r.days <= pol.windowDays && r.value <= pol.autoLimit);
    hits.forEach((r) => patchReturn(r.id, () => ({ status: 'Approved' }), 'Auto-approved by rule'));
    if (hits.length) toast(`${hits.length} requests auto-approved`, { body: 'Customers have been notified.' });
  };
  return (
    <Drawer open={open} onClose={onClose} title="Return rules" subtitle="Changes apply to every badge straight away" width={460} footer={<Button onClick={onClose}>Done</Button>}>
      <div className="space-y-8">
        <section>
          <Label>Return window</Label>
          <div className="flex items-center gap-4 mt-3"><Slider value={pol.windowDays} min={7} max={60} onChange={(v) => setPol({ ...pol, windowDays: v })} className="flex-1" /><span className="num text-[22px] font-semibold w-20 text-right">{pol.windowDays} <span className="text-[13px] text-muted font-normal">days</span></span></div>
        </section>
        <section>
          <div className="flex items-start justify-between gap-4"><div><Label>Auto-approve</Label><div className="text-[13px] text-muted mt-2 max-w-[300px]">Approve requests inside the window and under the amount below without waiting for a person.</div></div><Switch checked={pol.autoApprove} onChange={toggleAuto} label="Auto-approve" /></div>
          {pol.autoApprove && <Field className="mt-4 anim-fade-up" label="Only when the value is under" prefix="Rs" type="number" value={pol.autoLimit} onChange={(v) => setPol({ ...pol, autoLimit: Math.max(0, +v || 0) })} />}
        </section>
        <section>
          <Label>Non-returnable items</Label>
          <div className="text-[13px] text-muted mt-2 mb-3">Requests for these are shown with a red badge.</div>
          <div className="flex flex-wrap gap-2">{NON_RETURNABLE_OPTIONS.map((o) => <Chip key={o} active={pol.nonReturnable.includes(o)} onClick={() => setPol({ ...pol, nonReturnable: pol.nonReturnable.includes(o) ? pol.nonReturnable.filter((x) => x !== o) : [...pol.nonReturnable, o] })}>{o}</Chip>)}</div>
        </section>
      </div>
    </Drawer>
  );
}
