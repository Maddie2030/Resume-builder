import React, { useState, useRef, useCallback } from 'react';
import { Move, Type, Image, Trash2, Plus } from 'lucide-react';
import { TemplateService } from '../services/templateService';
import TemplateEditor from './TemplateEditor'; // keep this if needed for recursive usage

const TemplateEditorComponent = ({ template, onTemplateChange, resumeData }) => {
  const [selectedElement, setSelectedElement] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef(null);

  const handleElementMouseDown = useCallback((e, elementId) => {
    e.preventDefault();
    setSelectedElement(elementId);
    setIsDragging(true);
    
    const element = template.elements.find(el => el.id === elementId);
    if (element) {
      setDragOffset({
        x: e.clientX - element.x,
        y: e.clientY - element.y
      });
    }
  }, [template.elements]);

  const handleMouseMove = useCallback((e) => {
    if (!isDragging || !selectedElement) return;

    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;

    const updatedTemplate = {
      ...template,
      elements: template.elements.map(el =>
        el.id === selectedElement
          ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
          : el
      )
    };

    onTemplateChange(updatedTemplate);
  }, [isDragging, selectedElement, dragOffset, template, onTemplateChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const addTextElement = () => {
    const newElement = {
      id: TemplateService.generateElementId(),
      type: 'text',
      content: 'New Text Element',
      x: 50,
      y: 100,
      width: 150,
      height: 20,
      fontSize: 12,
      color: '#000000',
      textAlign: 'left'
    };

    onTemplateChange({
      ...template,
      elements: [...template.elements, newElement]
    });
  };

  const addPage = () => {
    onTemplateChange({
      ...template,
      pages: template.pages + 1
    });
  };

  const deleteElement = (elementId) => {
    onTemplateChange({
      ...template,
      elements: template.elements.filter(el => el.id !== elementId)
    });
  };

  const updateElement = (elementId, updates) => {
    onTemplateChange({
      ...template,
      elements: template.elements.map(el =>
        el.id === elementId ? { ...el, ...updates } : el
      )
    });
  };

  const replacePlaceholders = (text) => {
    return text.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value = resumeData;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value || match;
    });
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Toolbar */}
      <div className="w-64 bg-white border-r border-gray-200 p-4 overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Template Editor</h3>
        
        <div className="space-y-4">
          <button
            onClick={addTextElement}
            className="w-full flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            <Type className="h-4 w-4" />
            <span>Add Text</span>
          </button>

          <button
            onClick={addPage}
            className="w-full flex items-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
          >
            <Plus className="h-4 w-4" />
            <span>Add Page ({template.pages})</span>
          </button>

          <div className="border-t pt-4">
            <h4 className="font-medium mb-2">Elements</h4>
            <div className="space-y-2">
              {template.elements.map((element) => (
                <div
                  key={element.id}
                  className={`p-2 border rounded cursor-pointer ${
                    selectedElement === element.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedElement(element.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {element.type === 'text' ? (
                        <Type className="h-4 w-4" />
                      ) : (
                        <Image className="h-4 w-4" />
                      )}
                      <span className="text-sm truncate">
                        {element.type === 'text' 
                          ? replacePlaceholders(element.content).substring(0, 20)
                          : 'Image'
                        }
                      </span>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="flex-1 p-4 overflow-auto">
        <div className="bg-white shadow-lg mx-auto" style={{ width: '210mm', minHeight: `${297 * template.pages}mm` }}>
          <div
            ref={canvasRef}
            className="relative"
            style={{ width: '210mm', height: `${297 * template.pages}mm` }}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
          >
            {/* Background Image */}
            {template.backgroundImage && (
              <img
                src={template.backgroundImage}
                alt="Template background"
                className="absolute inset-0 w-full h-full object-cover pointer-events-none"
                style={{ height: `${297 * template.pages}mm` }}
              />
            )}

            {/* Page Separators */}
            {Array.from({ length: template.pages - 1 }, (_, i) => (
              <div
                key={i}
                className="absolute left-0 right-0 border-t-2 border-dashed border-gray-400"
                style={{ top: `${297 * (i + 1)}mm` }}
              />
            ))}

            {/* Elements */}
            {template.elements.map((element) => (
              <div
                key={element.id}
                className={`absolute cursor-move border-2 ${
                  selectedElement === element.id
                    ? 'border-blue-500 bg-blue-50 bg-opacity-50'
                    : 'border-transparent hover:border-gray-300'
                }`}
                style={{
                  left: `${element.x}mm`,
                  top: `${element.y}mm`,
                  width: `${element.width}mm`,
                  minHeight: `${element.height}mm`,
                  fontSize: `${element.fontSize || 12}pt`,
                  color: element.color || '#000000',
                  fontWeight: element.fontWeight || 'normal',
                  textAlign: element.textAlign || 'left'
                }}
                onMouseDown={(e) => handleElementMouseDown(e, element.id)}
              >
                {element.type === 'text' && (
                  <div className="p-1 whitespace-pre-wrap break-words">
                    {replacePlaceholders(element.content)}
                  </div>
                )}
                {selectedElement === element.id && (
                  <div className="absolute -top-6 -left-1 bg-blue-500 text-white px-2 py-1 text-xs rounded">
                    <Move className="h-3 w-3 inline mr-1" />
                    Drag to move
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateEditorComponent;
