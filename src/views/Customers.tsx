import { useRoute } from '../store';
import List from './customers/List';
import Profile from './customers/Profile';

export default function Customers() {
  const { path } = useRoute();
  return path[1] ? <Profile key={path[1]} id={path[1]} /> : <List />;
}
