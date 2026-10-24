import { Download, Upload, Plus, TriangleAlert } from 'lucide-react';
import { Button, PageHeader, Tabs } from '../ui/kit';
import { navigate, useApp, useRoute } from '../store';
import { productsStore } from '../data/seed';
import ProductList from './products/ProductList';
import ProductEditor from './products/ProductEditor';
import Categories from './products/Categories';
import ImportExport from './products/ImportExport';
import { downloadCsv, filterStore, isLow, productsCsv } from './products/shared';

function Home() {
  const route = useRoute();
  const { toast } = useApp();
  const [products] = productsStore.use();
  const tab = (['products', 'categories', 'import'].includes(route.query.tab) ? route.query.tab : 'products') as 'products' | 'categories' | 'import';
  const low = products.filter(isLow).length;
  const exportNow = () => {
    const f = filterStore.get();
    downloadCsv('richiva-products.csv', productsCsv(products.filter((p) => f.ids.includes(p.id))));
    toast('Export ready', { body: `${f.ids.length} products` });
  };
  return (
    <div>
      <PageHeader title="Products" chip={`${products.length} products`}
        hint={low > 0 && <button onClick={() => navigate('/products?filter=low')} className="inline-flex items-center gap-1.5 text-[13px] text-warn hover:underline"><TriangleAlert size={14} strokeWidth={1.5} />{low} products are low on stock</button>}
        actions={<>
          <Button variant="secondary" icon={Upload} onClick={() => navigate('/products?tab=import')}>Import</Button>
          <Button variant="secondary" icon={Download} onClick={exportNow}>Export</Button>
          <Button icon={Plus} onClick={() => navigate('/products/edit/new')}>Add product</Button>
        </>} />
      <Tabs className="mb-6 anim-fade-up" value={tab} onChange={(t) => navigate(`/products?tab=${t}`)}
        tabs={[{ id: 'products', label: 'Products' }, { id: 'categories', label: 'Categories and collections' }, { id: 'import', label: 'Import and export' }]} />
      {tab === 'products' && <ProductList />}
      {tab === 'categories' && <Categories />}
      {tab === 'import' && <ImportExport />}
    </div>
  );
}

export default function Products() {
  const route = useRoute();
  if (route.path[1] === 'edit') return <ProductEditor key={route.path[2] ?? 'new'} id={route.path[2] ?? 'new'} />;
  return <Home />;
}
