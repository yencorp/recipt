import React, { useState } from 'react';
import { Project } from '../types';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (id: string) => void;
  onCreateProject: (name: string) => void;
}

const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
}) => {
  const [newProjectName, setNewProjectName] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newProjectName.trim()) {
      onCreateProject(newProjectName.trim());
      setNewProjectName('');
    }
  };

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-2 mb-4">
        {projects.map((project) => (
          <button
            key={project.id}
            onClick={() => onSelectProject(project.id)}
            className={`px-4 py-2 text-sm font-semibold rounded-full transition-colors duration-200 ${
              selectedProjectId === project.id
                ? 'bg-sky-500 text-white'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            {project.name}
          </button>
        ))}
      </div>
      <form onSubmit={handleCreate} className="flex gap-2">
        <input
          type="text"
          value={newProjectName}
          onChange={(e) => setNewProjectName(e.target.value)}
          placeholder="새 프로젝트 이름..."
          className="flex-grow bg-slate-800 border border-slate-700 rounded-md px-3 py-2 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-sky-500"
        />
        <button
          type="submit"
          className="bg-indigo-600 text-white font-semibold px-4 py-2 rounded-md hover:bg-indigo-500 transition-colors duration-200 disabled:bg-slate-600 disabled:cursor-not-allowed"
          disabled={!newProjectName.trim()}
        >
          프로젝트 생성
        </button>
      </form>
    </div>
  );
};

export default ProjectSelector;