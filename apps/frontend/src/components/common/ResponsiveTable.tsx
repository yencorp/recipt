import { ReactNode } from 'react';
import { Card, CardContent } from '@/components/ui/card';

interface Column<T> {
  key: keyof T | string;
  label: string;
  render?: (item: T) => ReactNode;
  mobileLabel?: string; // 모바일에서 사용할 레이블 (없으면 label 사용)
  hideOnMobile?: boolean; // 모바일에서 숨김
}

interface ResponsiveTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (item: T) => string;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
}

export function ResponsiveTable<T extends Record<string, any>>({
  data,
  columns,
  keyExtractor,
  onRowClick,
  emptyMessage = '데이터가 없습니다.',
}: ResponsiveTableProps<T>) {
  const getValue = (item: T, column: Column<T>) => {
    if (column.render) {
      return column.render(item);
    }
    return item[column.key as keyof T];
  };

  if (data.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        {emptyMessage}
      </div>
    );
  }

  return (
    <>
      {/* 데스크톱 테이블 */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              {columns.map((column, index) => (
                <th
                  key={index}
                  className="text-left py-3 px-4 font-medium text-sm text-muted-foreground"
                >
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((item) => (
              <tr
                key={keyExtractor(item)}
                onClick={() => onRowClick?.(item)}
                className={`border-b transition-colors ${
                  onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''
                }`}
              >
                {columns.map((column, index) => (
                  <td key={index} className="py-3 px-4">
                    {getValue(item, column)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 모바일 카드 뷰 */}
      <div className="md:hidden space-y-3">
        {data.map((item) => (
          <Card
            key={keyExtractor(item)}
            onClick={() => onRowClick?.(item)}
            className={onRowClick ? 'cursor-pointer active:scale-98' : ''}
          >
            <CardContent className="p-4 space-y-3">
              {columns
                .filter((column) => !column.hideOnMobile)
                .map((column, index) => (
                  <div key={index} className="flex justify-between items-start">
                    <span className="text-sm text-muted-foreground font-medium">
                      {column.mobileLabel || column.label}
                    </span>
                    <span className="text-sm font-medium text-right ml-2">
                      {getValue(item, column)}
                    </span>
                  </div>
                ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
