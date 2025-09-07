import React, { useEffect } from 'react';
import { XCircleIcon } from './Icons';

interface ImageModalProps {
  imageUrl: string | null;
  onClose: () => void;
}

const ImageModal: React.FC<ImageModalProps> = ({ imageUrl, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (imageUrl) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [imageUrl, onClose]);

  if (!imageUrl) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="이미지 미리보기"
    >
      <div className="relative max-w-3xl max-h-[90vh] w-full p-4" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          className="absolute -top-1 -right-1 text-white bg-slate-800 rounded-full hover:text-sky-400 transition-colors z-10"
          aria-label="닫기"
        >
          <XCircleIcon className="h-10 w-10" />
        </button>
        <img
          src={imageUrl}
          alt="영수증 전체 이미지"
          className="w-full h-auto max-h-[90vh] object-contain rounded-lg"
        />
      </div>
    </div>
  );
};

export default ImageModal;
