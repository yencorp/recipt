export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t bg-background">
      <div className="container flex flex-col items-center justify-between gap-4 py-6 md:flex-row md:py-8 px-4">
        <p className="text-sm text-muted-foreground">
          © {currentYear} 광남동성당 청소년위원회. All rights reserved.
        </p>
        <div className="flex items-center space-x-4">
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            개인정보처리방침
          </a>
          <a
            href="#"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            이용약관
          </a>
        </div>
      </div>
    </footer>
  );
};
