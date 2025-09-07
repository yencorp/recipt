import React, { useState, useCallback, useEffect } from 'react';
import { Project, Receipt } from './types';
import ProjectSelector from './components/ProjectSelector';
import ProjectDetail from './components/ProjectDetail';
import { Header } from './components/Header';
import { PlusCircleIcon } from './components/Icons';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'receipt-manager-projects';

const getInitialProjects = (): Project[] => {
  try {
    const savedProjects = localStorage.getItem(STORAGE_KEY);
    if (savedProjects) {
      return JSON.parse(savedProjects);
    }
  } catch (error) {
    console.error("저장된 프로젝트를 불러오는 데 실패했습니다:", error);
  }

  return [
    {
      id: 'proj-1',
      name: '4분기 출장',
      receipts: [
        {
          id: 'rec-1',
          store: '더 커피 숍',
          date: '2023-10-26',
          total: 12500,
          imageUrl: 'https://picsum.photos/seed/receipt1/400/600',
        },
        {
          id: 'rec-2',
          store: '사무용품 주식회사',
          date: '2023-10-27',
          total: 78120,
          imageUrl: 'https://picsum.photos/seed/receipt2/400/600',
        },
      ],
    },
    {
      id: 'proj-2',
      name: '팀 점심',
      receipts: [],
    },
  ];
};


const App: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>(getInitialProjects);

  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    () => projects.length > 0 ? projects[0].id : null
  );
  
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
    } catch (error) {
      console.error("프로젝트를 저장하는 데 실패했습니다:", error);
    }
  }, [projects]);


  const handleCreateProject = useCallback((name: string) => {
    const newProject: Project = {
      id: uuidv4(),
      name,
      receipts: [],
    };
    setProjects((prev) => [...prev, newProject]);
    setSelectedProjectId(newProject.id);
  }, []);

  const handleAddReceipts = useCallback((projectId: string, receiptsData: Omit<Receipt, 'id'>[]) => {
    const newReceipts: Receipt[] = receiptsData.map(r => ({ ...r, id: uuidv4() }));
    setProjects((prevProjects) =>
      prevProjects.map((p) =>
        p.id === projectId
          ? { ...p, receipts: [...p.receipts, ...newReceipts] }
          : p
      )
    );
  }, []);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="bg-slate-900 min-h-screen text-white font-sans">
      <div className="container mx-auto p-4 md:p-6 lg:p-8 max-w-4xl">
        <Header />

        <main>
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onCreateProject={handleCreateProject}
          />
          
          {selectedProject ? (
            <ProjectDetail
              key={selectedProject.id}
              project={selectedProject}
              onAddReceipts={handleAddReceipts}
            />
          ) : (
            <div className="text-center py-20 bg-slate-800 rounded-lg mt-6">
              <PlusCircleIcon className="mx-auto h-12 w-12 text-slate-500" />
              <h3 className="mt-2 text-lg font-medium text-slate-300">선택된 프로젝트가 없습니다</h3>
              <p className="mt-1 text-sm text-slate-400">위에서 프로젝트를 선택하거나 새 프로젝트를 만들어 시작하세요.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;