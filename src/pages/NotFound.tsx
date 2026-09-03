import { useSEO } from '../lib/useSEO';
import Button from '../components/ui/Button';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  useSEO('Page not found');
  return (
    <div className="wrap flex min-h-[80vh] flex-col items-center justify-center pb-24 pt-40 text-center">
      <p className="eyebrow">404</p>
      <h1 className="mt-5 font-display text-6xl font-light md:text-8xl">
        Lost in the <span className="italic text-muted">void.</span>
      </h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-muted">The page you are looking for has been removed, renamed, or never existed. Even our engineers cannot locate it.</p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        <Button to="/" icon={<ArrowLeft size={14} />}>
          Return home
        </Button>
        <Button to="/shop" variant="secondary">
          Browse objects
        </Button>
      </div>
    </div>
  );
}
