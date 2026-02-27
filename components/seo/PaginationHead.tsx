'use client';

import { useEffect } from 'react';

interface PaginationHeadProps {
  currentPage: number;
  totalPages: number;
  basePath: string;
}

export function PaginationHead({ currentPage, totalPages, basePath }: PaginationHeadProps) {
  useEffect(() => {
    const existing = document.querySelectorAll('link[data-pagination]');
    existing.forEach((el) => el.remove());

    if (currentPage > 1) {
      const prev = document.createElement('link');
      prev.rel = 'prev';
      prev.setAttribute('data-pagination', 'true');
      prev.href = currentPage === 2 ? basePath : `${basePath}?page=${currentPage - 1}`;
      document.head.appendChild(prev);
    }

    if (currentPage < totalPages) {
      const next = document.createElement('link');
      next.rel = 'next';
      next.setAttribute('data-pagination', 'true');
      next.href = `${basePath}?page=${currentPage + 1}`;
      document.head.appendChild(next);
    }

    return () => {
      const links = document.querySelectorAll('link[data-pagination]');
      links.forEach((el) => el.remove());
    };
  }, [currentPage, totalPages, basePath]);

  return null;
}
