import React, { useState, useEffect } from 'react';
import { Upload, Plus, Edit, Trash2, Eye, Download, Image as ImageIcon } from 'lucide-react';
import TemplateEditor from './TemplateEditor';
import { TemplateService } from '../services/templateService';

const AdminPanel = () => {
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [uploadingBackground, setUploadingBackground] = useState(false);

  const mockResumeData = {
    personalInfo: {
      name: 'John Doe',
      title: 'Software Engineer',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY'
    },
    summary: 'Experienced software engineer with expertise in full-stack development and cloud technologies.'
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    const allTemplates = await TemplateService.getAllTemplates();
    setTemplates(allTemplates);
  };

  const createNewTemplate = () => {
    const newTemplate = {
      id: `template-${Date.now()}`,
      name: 'New Template',
      pageSize: 'A4',
      pages: 1,
      elements: []
    };
    setSelectedTemplate(newTemplate);
    setIsEditing(true);
  };

  const handleTemplateChange = (updatedTemplate) => {
    setSelectedTemplate(updatedTemplate);
  };

  const saveTemplate = async () => {
    if (selectedTemplate) {
      await TemplateService.saveTemplate(selectedTemplate);
      await loadTemplates();
      setIsEditing(false);
      setSelectedTemplate(null);
    }
  };

  const deleteTemplate = async (templateId) => {
    if (confirm('Are you sure you want to delete this template?')) {
      await TemplateService.deleteTemplate(templateId);
      await loadTemplates();
    }
  };

  const handleBackgroundUpload = async (templateId, file) => {
    setUploadingBackground(true);
    try {
      const backgroundUrl = await TemplateService.uploadBackgroundImage(file);
      const template = templates.find(t => t.id === templateId);
      if (template) {
        const updatedTemplate = { ...template, backgroundImage: backgroundUrl };
        await TemplateService.saveTemplate(updatedTemplate);
        await loadTemplates();
      }
    } catch (error) {
      console.error('Failed to upload background:', error);
      alert('Failed to upload background image');
    } finally {
      setUploadingBackground(false);
    }
  };

  if (isEditing && selectedTemplate) {
    return (
      <div className="h-screen flex flex-col">
        <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h1 className="text-xl font-semibold">Editing: {selectedTemplate.name}</h1>
          <div className="flex space-x-3">
            <input
              type="text"
              value={selectedTemplate.name}
              onChange={(e) => handleTemplateChange({ ...selectedTemplate, name: e.target.value })}
              className="px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="Template name"
            />
            <button
              onClick={saveTemplate}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Download className="h-4 w-4" />
              <span>Save Template</span>
            </button>
            <button
              onClick={() => {
                setIsEditing(false);
                setSelectedTemplate(null);
              }}
              className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
        <TemplateEditor
          template={selectedTemplate}
          onTemplateChange={handleTemplateChange}
          resumeData={mockResumeData}
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Template Management</h1>
        <button
          onClick={createNewTemplate}
          className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Template</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {templates.map((template) => (
          <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              {template.backgroundImage ? (
                <img
                  src={template.backgroundImage}
                  alt={template.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  <ImageIcon className="h-12 w-12" />
                </div>
              )}
              <div className="absolute top-2 right-2">
                <label className="bg-white bg-opacity-90 p-2 rounded-full cursor-pointer hover:bg-opacity-100 transition-all">
                  <Upload className="h-4 w-4 text-gray-600" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        handleBackgroundUpload(template.id, file);
                      }
                    }}
                    disabled={uploadingBackground}
                  />
                </label>
              </div>
            </div>

            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
              <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                <span>{template.pageSize}</span>
                <span>{template.pages} page{template.pages > 1 ? 's' : ''}</span>
                <span>{template.elements.length} elements</span>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setSelectedTemplate(template);
                    setIsEditing(true);
                  }}
                  className="flex-1 bg-blue-600 text-white px-3 py-2 rounded text-sm hover:bg-blue-700 flex items-center justify-center space-x-1"
                >
                  <Edit className="h-4 w-4" />
                  <span>Edit</span>
                </button>
                <button
                  onClick={() => deleteTemplate(template.id)}
                  className="bg-red-600 text-white px-3 py-2 rounded text-sm hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {templates.length === 0 && (
        <div className="text-center py-12">
          <ImageIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No templates yet</h3>
          <p className="text-gray-500 mb-4">Create your first template to get started</p>
          <button
            onClick={createNewTemplate}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700"
          >
            Create Template
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
