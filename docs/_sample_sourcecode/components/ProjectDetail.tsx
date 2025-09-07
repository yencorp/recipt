import React from 'react';
import { Project, Receipt } from '../types';
import AddReceiptForm from './AddReceiptForm';
import ReceiptList from './ReceiptList';

interface ProjectDetailProps {
  project: Project;
  onAddReceipts: (projectId: string, receiptData: Omit<Receipt, 'id'>[]) => void;
}

const ProjectDetail: React.FC<ProjectDetailProps> = ({ project, onAddReceipts }) => {
  return (
    <div className="bg-slate-800/50 rounded-xl p-4 md:p-6 mt-6 border border-slate-700">
      <h2 className="text-xl font-bold text-slate-100 mb-4">
        프로젝트: {project.name}
      </h2>
      <AddReceiptForm projectId={project.id} onAddReceipts={onAddReceipts} />
      <div className="mt-6">
        <ReceiptList receipts={project.receipts} />
      </div>
    </div>
  );
};

export default ProjectDetail;