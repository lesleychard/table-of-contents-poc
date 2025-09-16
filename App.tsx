import React, { useState, useCallback } from 'react';
import type { TocNode } from './types';
import { TreeNode } from './components/TreeNode';

const initialData: TocNode[] = [
  {
    id: '1',
    title: 'Chapter 1: The Beginning',
    children: [
      { id: '1-1', title: 'The first step', children: [] },
      { 
        id: '1-2', 
        title: 'A fork in the road', 
        children: [
            { id: '1-2-1', title: 'The left path', children: [] },
            { id: '1-2-2', title: 'The right path', children: [] },
        ] 
      },
    ],
  },
  {
    id: '2',
    title: 'Chapter 2: The Middle',
    children: [],
  },
  {
    id: '3',
    title: 'Chapter 3: The End',
    children: [],
  },
];

const App: React.FC = () => {
  const [nodes, setNodes] = useState<TocNode[]>(initialData);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1-2']));
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null);

  const handleToggleExpand = useCallback((nodeId: string) => {
    setExpandedNodes(prev => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const addNode = useCallback(<T,>(
    nodes: TocNode[],
    parentId: string | null,
    newNode: TocNode
  ): TocNode[] => {
    if (parentId === null) {
      return [...nodes, newNode];
    }

    return nodes.map(node => {
      if (node.id === parentId) {
        return { ...node, children: [...node.children, newNode] };
      }
      if (node.children.length > 0) {
        return { ...node, children: addNode(node.children, parentId, newNode) };
      }
      return node;
    });
  }, []);
  
  const handleAddChild = useCallback((parentId: string | null) => {
    const newNode: TocNode = {
      id: new Date().getTime().toString(),
      title: 'New Section',
      children: [],
    };
    setNodes(currentNodes => addNode(currentNodes, parentId, newNode));
    if(parentId) {
        setExpandedNodes(prev => new Set(prev).add(parentId));
    }
  }, [addNode]);

  const updateNodeTitle = useCallback(<T,>(
    nodes: TocNode[], 
    nodeId: string, 
    newTitle: string
  ): TocNode[] => {
    return nodes.map(node => {
      if (node.id === nodeId) {
        return { ...node, title: newTitle };
      }
      if (node.children.length > 0) {
        return { ...node, children: updateNodeTitle(node.children, nodeId, newTitle) };
      }
      return node;
    });
  }, []);

  const handleUpdateTitle = useCallback((nodeId: string, newTitle: string) => {
    setNodes(currentNodes => updateNodeTitle(currentNodes, nodeId, newTitle));
  }, [updateNodeTitle]);

  const deleteNode = useCallback(<T,>(nodes: TocNode[], nodeId: string): TocNode[] => {
    return nodes
      .filter(node => node.id !== nodeId)
      .map(node => ({
        ...node,
        children: deleteNode(node.children, nodeId),
      }));
  }, []);
  
  const handleDeleteNode = useCallback((nodeId: string) => {
    setNodes(currentNodes => deleteNode(currentNodes, nodeId));
  }, [deleteNode]);

  const handleMoveNode = useCallback((draggedId: string, targetId: string, position: 'top' | 'bottom') => {
    let draggedNode: TocNode | null = null;

    const findNode = (searchNodes: TocNode[], id: string): TocNode | null => {
        for (const node of searchNodes) {
            if (node.id === id) return node;
            const foundInChildren = findNode(node.children, id);
            if (foundInChildren) return foundInChildren;
        }
        return null;
    };
    
    const getDescendantIds = (node: TocNode): string[] => {
        let ids: string[] = [];
        for (const child of node.children) {
            ids.push(child.id);
            ids = [...ids, ...getDescendantIds(child)];
        }
        return ids;
    };
    
    const foundDraggedNode = findNode(nodes, draggedId);
    if (foundDraggedNode) {
        const descendantIds = getDescendantIds(foundDraggedNode);
        if (descendantIds.includes(targetId)) {
            console.error("Cannot move a node into one of its own descendants.");
            return;
        }
    }

    const remove = (items: TocNode[], id: string): TocNode[] => {
        return items.filter(item => {
            if (item.id === id) {
                draggedNode = item;
                return false;
            }
            if (item.children) {
                item.children = remove(item.children, id);
            }
            return true;
        });
    };

    const insert = (items: TocNode[], tId: string, nodeToInsert: TocNode, pos: 'top' | 'bottom'): TocNode[] => {
        return items.flatMap(item => {
            if (item.id === tId) {
                return pos === 'top' ? [nodeToInsert, item] : [item, nodeToInsert];
            }
            if (item.children) {
                return [{ ...item, children: insert(item.children, tId, nodeToInsert, pos) }];
            }
            return [item];
        });
    };

    const treeWithoutDragged = remove(JSON.parse(JSON.stringify(nodes)), draggedId);

    if (draggedNode) {
        const newTree = insert(treeWithoutDragged, targetId, draggedNode, position);
        setNodes(newTree);
    }
  }, [nodes]);

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 font-sans p-4 sm:p-6 md:p-8">
      <div className="max-w-3xl mx-auto bg-white rounded-xl shadow-lg">
        <header className="p-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900">Table of Contents Editor</h1>
          <p className="mt-1 text-sm text-gray-600">Drag and drop items to reorder the structure.</p>
        </header>
        <main className="p-6">
            <div className="space-y-2">
            {nodes.map(node => (
                <TreeNode
                    key={node.id}
                    node={node}
                    level={0}
                    isExpanded={expandedNodes.has(node.id)}
                    onToggleExpand={handleToggleExpand}
                    onAddChild={handleAddChild}
                    onUpdateTitle={handleUpdateTitle}
                    onDelete={handleDeleteNode}
                    expandedNodes={expandedNodes}
                    draggingNodeId={draggingNodeId}
                    onSetDraggingNodeId={setDraggingNodeId}
                    onMoveNode={handleMoveNode}
                />
            ))}
            </div>
            <div className="mt-6">
                <button
                    onClick={() => handleAddChild(null)}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                    </svg>
                    Add Chapter
                </button>
            </div>
        </main>
      </div>
    </div>
  );
};

export default App;