import React, { useState, useMemo } from 'react';
import { Receipt } from '../types';
import ImageModal from './ImageModal';
import { ArrowDownTrayIcon, ChevronUpIcon, ChevronDownIcon } from './Icons';

interface ReceiptListProps {
  receipts: Receipt[];
}

type SortKey = keyof Omit<Receipt, 'id' | 'imageUrl'>;
type SortDirection = 'ascending' | 'descending';

const ReceiptList: React.FC<ReceiptListProps> = ({ receipts }) => {
  const [selectedImageUrl, setSelectedImageUrl] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<{ key: SortKey; direction: SortDirection } | null>({ key: 'date', direction: 'descending' });

  const sortedReceipts = useMemo(() => {
    let sortableItems = [...receipts];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [receipts, sortConfig]);

  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };
  
  const downloadCSV = () => {
    const headers = ['날짜', '가게', '금액'];
    const rows = sortedReceipts.map(r => [r.date, `"${r.store.replace(/"/g, '""')}"`, r.total].join(','));
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `영수증_내역_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ko-KR', {
      style: 'currency',
      currency: 'KRW',
    }).format(amount);
  };
  
  const SortableHeader: React.FC<{ sortKey: SortKey, children: React.ReactNode }> = ({ sortKey, children }) => {
    const isSorted = sortConfig?.key === sortKey;
    const isAscending = sortConfig?.direction === 'ascending';
    return (
        <th scope="col" className="py-3.5 px-3 text-left text-sm font-semibold text-slate-300">
            <button onClick={() => requestSort(sortKey)} className="group inline-flex items-center gap-1">
                {children}
                <span className={`transition-opacity ${isSorted ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                    {isSorted ? (isAscending ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpIcon className="h-4 w-4" />}
                </span>
            </button>
        </th>
    )
  }

  if (receipts.length === 0) {
    return (
      <div className="text-center py-10 text-slate-500">
        <p>이 프로젝트에 아직 추가된 영수증이 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      <ImageModal imageUrl={selectedImageUrl} onClose={() => setSelectedImageUrl(null)} />
      <div className="flex justify-end mb-4">
          <button
            onClick={downloadCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white font-semibold text-sm rounded-md hover:bg-slate-500 transition-colors"
          >
              <ArrowDownTrayIcon className="h-5 w-5"/>
              Excel 다운로드
          </button>
      </div>
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <table className="min-w-full divide-y divide-slate-700">
              <thead>
                <tr>
                  <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-slate-300 sm:pl-0">
                      <button onClick={() => requestSort('date')} className="group inline-flex items-center gap-1">
                          날짜
                          <span className={`transition-opacity ${sortConfig?.key === 'date' ? 'opacity-100' : 'opacity-20 group-hover:opacity-100'}`}>
                              {sortConfig?.key === 'date' ? (sortConfig?.direction === 'ascending' ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />) : <ChevronUpIcon className="h-4 w-4" />}
                          </span>
                      </button>
                  </th>
                  <SortableHeader sortKey="store">가게</SortableHeader>
                  <SortableHeader sortKey="total">금액</SortableHeader>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-slate-300">
                    이미지
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {sortedReceipts.map((receipt) => (
                  <tr key={receipt.id}>
                    <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-slate-400 sm:pl-0">
                      {receipt.date}
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">{receipt.store}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300 font-mono">{formatCurrency(receipt.total)}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-slate-300">
                      <button 
                        onClick={() => setSelectedImageUrl(receipt.imageUrl)} 
                        className="focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-sky-500 rounded-md"
                      >
                        <img src={receipt.imageUrl} alt={`${receipt.store} 영수증`} className="h-10 w-10 object-cover rounded-md hover:opacity-80 transition-opacity"/>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
};

export default ReceiptList;