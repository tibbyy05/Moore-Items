'use client';

import { useState } from 'react';

export default function CategoryDescription({ description }: { description: string }) {
  const [expanded, setExpanded] = useState(false);
  const preview = description.slice(0, 120);
  const hasMore = description.length > 120;

  return (
    <div className="text-sm text-gray-600">
      <span>{expanded ? description : `${preview}${hasMore ? '...' : ''}`}</span>
      {hasMore && (
        <button
          onClick={() => setExpanded(!expanded)}
          className="ml-1 text-[#c8a45e] hover:underline text-sm"
        >
          {expanded ? 'Show less' : 'Read more'}
        </button>
      )}
    </div>
  );
}
