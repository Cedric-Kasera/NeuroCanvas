import React, { memo, useState } from 'react';
import { NodeProps } from '@xyflow/react';
import { useCanvasStore } from '@/lib/state/canvasStore';

export const NoteCard = memo(({ id, data, selected }: NodeProps) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const updateNodeData = useCanvasStore((s) => s.updateNodeData);

  const text = (data?.text as string) || '**Note**\nWrite your thoughts or observations about the network here.';

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsEditing(false);
    updateNodeData(id, { text: e.target.value });
  };

  return (
    <div
      className={`relative min-w-[300px] max-w-[380px] rounded-2xl border bg-[#f5f0e8] dark:bg-[#252320] p-4 text-[#141413] dark:text-[#faf9f5] shadow-sm transition-all ${
        selected ? 'ring-2 ring-[#e8a55a] border-[#e8a55a]' : 'border-[#e6dfd8] dark:border-[#383531]'
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#e6dfd8] dark:border-[#383531] pb-1.5 mb-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8e8b82]">Note</span>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className="text-[11px] text-[#cc785c] hover:underline"
        >
          {isEditing ? 'Done' : 'Edit'}
        </button>
      </div>

      {isEditing ? (
        <textarea
          defaultValue={text}
          onBlur={handleBlur}
          autoFocus
          rows={4}
          className="w-full bg-white dark:bg-[#181715] border border-[#e6dfd8] dark:border-[#383531] rounded p-2 text-xs text-[#141413] dark:text-[#faf9f5] focus:outline-none focus:border-[#cc785c] resize-none"
        />
      ) : (
        <div
          onClick={() => setIsEditing(true)}
          className="text-xs text-[#3d3d3a] dark:text-[#efe9de] whitespace-pre-wrap leading-relaxed cursor-text min-h-[50px]"
        >
          {text}
        </div>
      )}
    </div>
  );
});

NoteCard.displayName = 'NoteCard';
