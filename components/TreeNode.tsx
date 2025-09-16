import React, { useState, useRef, useEffect } from 'react';
import type { TocNode } from '../types';
import { AddIcon, DeleteIcon, EditIcon, ChevronDownIcon, ChevronRightIcon, DragHandleIcon } from './icons';

interface TreeNodeProps {
  node: TocNode;
  level: number;
  isExpanded: boolean;
  expandedNodes: Set<string>;
  onToggleExpand: (nodeId: string) => void;
  onAddChild: (parentId: string) => void;
  onUpdateTitle: (nodeId: string, newTitle: string) => void;
  onDelete: (nodeId: string) => void;
  draggingNodeId: string | null;
  onSetDraggingNodeId: (id: string | null) => void;
  onMoveNode: (draggedId: string, targetId: string, position: 'top' | 'bottom') => void;
}

export const TreeNode: React.FC<TreeNodeProps> = ({
  node,
  level,
  isExpanded,
  expandedNodes,
  onToggleExpand,
  onAddChild,
  onUpdateTitle,
  onDelete,
  draggingNodeId,
  onSetDraggingNodeId,
  onMoveNode,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(node.title);
  const [dropPosition, setDropPosition] = useState<'top' | 'bottom' | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleSave = () => {
    if (title.trim()) {
      onUpdateTitle(node.id, title.trim());
    } else {
      setTitle(node.title); // Revert if empty
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      setTitle(node.title);
      setIsEditing(false);
    }
  };
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', node.id);
    e.dataTransfer.effectAllowed = 'move';
    onSetDraggingNodeId(node.id);
  };

  const handleDragEnd = () => {
    onSetDraggingNodeId(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    setDropPosition(e.clientY < midY ? 'top' : 'bottom');
  };
  
  const handleDragLeave = () => {
    setDropPosition(null);
  };
  
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    if (draggedId && draggedId !== node.id && dropPosition) {
      onMoveNode(draggedId, node.id, dropPosition);
    }
    setDropPosition(null);
    onSetDraggingNodeId(null);
  };

  const hasChildren = node.children && node.children.length > 0;
  const indentStyle = { paddingLeft: `${level * 24}px` };

  return (
    <div>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="relative"
      >
        {dropPosition === 'top' && <div className="absolute top-0 left-0 right-0 h-[2px] bg-blue-500 z-10" />}
        <div
          draggable={true}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          className={`group flex items-center h-10 px-3 rounded-md hover:bg-gray-100 transition-colors duration-150 ${draggingNodeId === node.id ? 'opacity-40' : ''}`}
          style={indentStyle}
        >
            <div className="drag-handle cursor-move mr-1">
                <DragHandleIcon />
            </div>

            <div className="flex items-center flex-grow min-w-0">
            {hasChildren ? (
                <button
                onClick={() => onToggleExpand(node.id)}
                className="p-1 -ml-2 rounded-full hover:bg-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                {isExpanded ? <ChevronDownIcon /> : <ChevronRightIcon />}
                </button>
            ) : (
                <span className="w-6"></span>
            )}

            {isEditing ? (
                <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleSave}
                onKeyDown={handleKeyDown}
                className="ml-2 w-full bg-white border border-blue-400 rounded-md px-2 py-0.5"
                />
            ) : (
                <span className="ml-2 truncate">{node.title}</span>
            )}
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-150 flex-shrink-0">
            <button
                onClick={() => onAddChild(node.id)}
                title="Add child section"
                className="p-2 rounded-full hover:bg-blue-100 text-blue-600"
            >
                <AddIcon />
            </button>
            <button
                onClick={() => setIsEditing(true)}
                title="Edit section"
                className="p-2 rounded-full hover:bg-green-100 text-green-600"
            >
                <EditIcon />
            </button>
            <button
                onClick={() => onDelete(node.id)}
                title="Delete section"
                className="p-2 rounded-full hover:bg-red-100 text-red-600"
            >
                <DeleteIcon />
            </button>
            </div>
        </div>
        {dropPosition === 'bottom' && <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-blue-500 z-10" />}
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-1">
          {node.children.map((childNode) => (
            <TreeNode
              key={childNode.id}
              node={childNode}
              level={level + 1}
              isExpanded={expandedNodes.has(childNode.id)}
              expandedNodes={expandedNodes}
              onToggleExpand={onToggleExpand}
              onAddChild={onAddChild}
              onUpdateTitle={onUpdateTitle}
              onDelete={onDelete}
              draggingNodeId={draggingNodeId}
              onSetDraggingNodeId={onSetDraggingNodeId}
              onMoveNode={onMoveNode}
            />
          ))}
        </div>
      )}
    </div>
  );
};
