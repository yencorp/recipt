import { Button } from '@/components/ui/button';

interface SkipLink {
  href: string;
  label: string;
}

const defaultSkipLinks: SkipLink[] = [
  { href: '#main-content', label: '본문으로 건너뛰기' },
  { href: '#main-nav', label: '주 메뉴로 건너뛰기' },
  { href: '#search', label: '검색으로 건너뛰기' },
];

interface SkipNavProps {
  links?: SkipLink[];
}

export const SkipNav: React.FC<SkipNavProps> = ({
  links = defaultSkipLinks,
}) => {
  return (
    <div className="sr-only focus-within:not-sr-only">
      <div className="fixed top-0 left-0 right-0 z-[9999] bg-primary p-2 flex gap-2 justify-center">
        {links.map((link) => (
          <Button
            key={link.href}
            asChild
            variant="secondary"
            size="sm"
            className="focus:ring-4 focus:ring-ring"
          >
            <a href={link.href}>{link.label}</a>
          </Button>
        ))}
      </div>
    </div>
  );
};
