import React from 'react';
import { ReceiptIcon } from './Icons';

export const Header: React.FC = () => (
  <header className="flex items-center justify-between pb-4 border-b border-slate-700 mb-6">
    <div className="flex items-center space-x-3">
      <div className="bg-sky-500 p-2 rounded-lg">
        <ReceiptIcon className="h-6 w-6 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-slate-100 tracking-tight">
        AI 영수증 관리자
      </h1>
    </div>
  </header>
);