import { useState } from 'react';
import { FilePlus2 } from 'lucide-react';
import { Button, Card, DataTable, EmptyState, ErrorState, Field, Modal, PageHeader, StatusPill, Tabs, useFakeLoad } from '../ui/kit';
import { navigate, useApp, useRoute } from '../store';
import PageEditor, { type CmsPage } from './cms/PageEditor';
import { makeBlock, type BType } from './cms/blocks';
import { BannersTab, FaqTab, HomeTab, NavTab, PolicyTab } from './cms/Sections';

const TABS = ['pages', 'home', 'banners', 'faqs', 'policies', 'navigation'] as const;
const mkPage = (id: string, title: string, url: string, status: CmsPage['status'], by: string, date: string, types: BType[], seo = true): CmsPage => {
  const blocks = types.map((t) => makeBlock(t));
  return { id, title, url, status, by, date, seoTitle: seo ? `${title} | Richiva` : '', seoDesc: seo ? `${title}: handmade fashion from Richiva, designed and stitched in Nepal. Cash on delivery available.` : '', blocks, versions: [{ id: id + 'v2', label: 'Edited text', time: date, by, blocks }, { id: id + 'v1', label: 'Page created', time: '2 Sep 2026', by: 'Anita Shrestha', blocks: blocks.slice(0, 2) }] };
};
const SEED: CmsPage[] = [
  mkPage('pg1', 'Our story', '/our-story', 'Published', 'Anita Shrestha', '12 Oct 2026', ['hero', 'text', 'imagetext', 'testimonials']),
  mkPage('pg2', 'Custom made orders', '/custom', 'Published', 'Sneha Pradhan', '9 Oct 2026', ['hero', 'imagetext', 'faq', 'newsletter']),
  mkPage('pg3', 'Dashain lookbook', '/dashain-lookbook', 'Scheduled', 'Sneha Pradhan', '17 Oct 2026', ['hero', 'collection', 'products', 'marquee']),
  mkPage('pg4', 'Size guide', '/size-guide', 'Published', 'Bikram Thapa', '28 Sep 2026', ['text', 'faq']),
  mkPage('pg5', 'Wholesale enquiries', '/wholesale', 'Draft', 'Anita Shrestha', '15 Oct 2026', ['hero', 'text', 'newsletter'], false),
  mkPage('pg6', 'Visit the atelier', '/stores', 'Draft', 'Maya Tuladhar', '3 Oct 2026', ['text', 'video'], false),
];

export default function Cms() {
  const { query } = useRoute();
  const { toast } = useApp();
  const tab = (TABS as readonly string[]).includes(query.tab) ? query.tab : 'pages';
  const loading = useFakeLoad(600, [tab]);
  const [pages, setPages] = useState(SEED);
  const [editId, setEditId] = useState<string | null>(null);
  const [err, setErr] = useState(false);
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(''); const [url, setUrl] = useState(''); const [e1, setE1] = useState('');
  const editing = pages.find((p) => p.id === editId);

  if (editing) return <PageEditor key={editing.id} page={editing} onExit={(p) => { setPages((a) => a.map((x) => (x.id === p.id ? p : x))); setEditId(null); }} />;

  const create = () => {
    const slug = '/' + (url || title).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    if (!title.trim()) return setE1('Give the page a title');
    if (pages.some((p) => p.url === slug)) return setE1('A page with this URL already exists');
    const p = mkPage('pg' + Date.now(), title.trim(), slug, 'Draft', 'Anita Shrestha', '18 Oct 2026', ['hero', 'text'], false);
    setPages([p, ...pages]); setOpen(false); setTitle(''); setUrl(''); setE1(''); setEditId(p.id); toast('Page created', { body: 'Start adding blocks' });
  };

  return (
    <div>
      <PageHeader title="Content" subtitle="Pages, home page, banners and menus for the Richiva store" actions={tab === 'pages' ? <Button icon={FilePlus2} onClick={() => setOpen(true)}>New page</Button> : undefined} />
      <Tabs className="mb-6" value={tab} onChange={(t) => navigate(`/cms?tab=${t}`)} tabs={[{ id: 'pages', label: 'Pages', count: pages.length }, { id: 'home', label: 'Home page' }, { id: 'banners', label: 'Banners and announcement' }, { id: 'faqs', label: 'FAQs' }, { id: 'policies', label: 'Policies' }, { id: 'navigation', label: 'Navigation' }]} />
      <div key={tab} className="anim-fade-up">
        {tab === 'pages' && (err ? <Card><ErrorState onRetry={() => setErr(false)} /></Card> : (
          <Card pad={false}>
            <DataTable loading={loading} rows={pages} rowId={(p) => p.id} onRowClick={(p) => setEditId(p.id)}
              empty={<EmptyState title="No pages yet" body="Create your first page to get started." action={<Button onClick={() => setOpen(true)}>New page</Button>} />}
              columns={[
                { key: 't', header: 'Title', sort: (p) => p.title, render: (p) => <span className="font-medium">{p.title}</span> },
                { key: 'u', header: 'URL', hideBelow: 'lg', sort: (p) => p.url, render: (p) => <span className="text-muted">{p.url}</span> },
                { key: 's', header: 'Status', sort: (p) => p.status, render: (p) => <StatusPill status={p.status} /> },
                { key: 'b', header: 'Last edited by', hideBelow: 'lg', render: (p) => p.by },
                { key: 'd', header: 'Date', sort: (p) => p.date, render: (p) => <span className="text-muted">{p.date}</span> },
              ]} />
          </Card>
        ))}
        {tab === 'home' && <HomeTab />}
        {tab === 'banners' && <BannersTab />}
        {tab === 'faqs' && <FaqTab />}
        {tab === 'policies' && <PolicyTab />}
        {tab === 'navigation' && <NavTab />}
      </div>
      <Modal open={open} onClose={() => setOpen(false)} size="sm" title="New page" footer={<><Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button><Button onClick={create}>Create page</Button></>}>
        <div className="grid gap-4"><Field label="Page title" value={title} onChange={(v) => { setTitle(v); setE1(''); }} error={e1} autoFocus /><Field label="URL" prefix="/" value={url} onChange={setUrl} hint="Leave blank to use the title" /></div>
      </Modal>
    </div>
  );
}
