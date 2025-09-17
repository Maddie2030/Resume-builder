//frontend-service/src/pages/ResumeBuilderPage.jsx
import React, { useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Save, Download, Eye, EyeOff, Plus, Trash2, User, Briefcase, GraduationCap, Phone, Mail, MapPin } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

const ResumeBuilderPage = () => {
  const { templateId } = useParams();
  const [showPreview, setShowPreview] = useState(true);
  const resumeRef = useRef(null);
  const token = useAuthStore((state) => state.token); // Use the existing auth store

  const [resumeData, setResumeData] = useState({
    personalInfo: {
      name: 'John Doe',
      title: 'Software Engineer',
      email: 'john.doe@email.com',
      phone: '+1 (555) 123-4567',
      location: 'New York, NY',
      website: 'johndoe.dev'
    },
    summary: 'Passionate software engineer with 5+ years of experience building scalable web applications. Expertise in React, Node.js, and cloud technologies.',
    experience: [
      {
        id: '1',
        company: 'Tech Corp',
        position: 'Senior Software Engineer',
        location: 'New York, NY',
        startDate: '2021-01',
        endDate: 'Present',
        description: 'Led development of microservices architecture serving 1M+ users. Improved application performance by 40% through code optimization.'
      }
    ],
    education: [
      {
        id: '1',
        institution: 'University of Technology',
        degree: 'Bachelor of Science in Computer Science',
        location: 'New York, NY',
        startDate: '2016-09',
        endDate: '2020-05',
        gpa: '3.8'
      }
    ],
    skills: ['JavaScript', 'React', 'Node.js', 'Python', 'AWS', 'Docker'],
    certifications: [
      {
        id: '1',
        name: 'AWS Certified Solutions Architect',
        issuer: 'Amazon Web Services',
        date: '2022-03'
      }
    ]
  });

  const handlePersonalInfoChange = (field, value) => {
    setResumeData(prev => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [field]: value }
    }));
  };

  const addExperience = () => {
    const newExp = {
      id: Date.now().toString(),
      company: '',
      position: '',
      location: '',
      startDate: '',
      endDate: '',
      description: ''
    };
    setResumeData(prev => ({
      ...prev,
      experience: [...prev.experience, newExp]
    }));
  };

  const removeExperience = (id) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.filter(exp => exp.id !== id)
    }));
  };

  const updateExperience = (id, field, value) => {
    setResumeData(prev => ({
      ...prev,
      experience: prev.experience.map(exp =>
        exp.id === id ? { ...exp, [field]: value } : exp
      )
    }));
  };

  const downloadPDF = () => {
    // This is a placeholder for a real PDF generation call
    alert('PDF download feature would be implemented here.');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Toolbar */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-xl font-semibold text-gray-900">Resume Builder</h1>
            <button
              onClick={() => setShowPreview(!showPreview)}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              <span>{showPreview ? 'Hide Preview' : 'Show Preview'}</span>
            </button>
          </div>
          <div className="flex items-center space-x-3">
            <button className="flex items-center space-x-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
              <Save className="h-4 w-4" />
              <span>Save</span>
            </button>
            <button
              onClick={downloadPDF}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto flex">
        {/* Editor Panel */}
        <div className={`p-6 overflow-y-auto max-h-screen ${showPreview ? 'w-1/2' : 'w-full'}`}>
          <div className="space-y-8">
            {/* Personal Information */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <User className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold">Personal Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Full Name"
                  value={resumeData.personalInfo.name}
                  onChange={(e) => handlePersonalInfoChange('name', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Job Title"
                  value={resumeData.personalInfo.title}
                  onChange={(e) => handlePersonalInfoChange('title', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={resumeData.personalInfo.email}
                  onChange={(e) => handlePersonalInfoChange('email', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="tel"
                  placeholder="Phone"
                  value={resumeData.personalInfo.phone}
                  onChange={(e) => handlePersonalInfoChange('phone', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  placeholder="Location"
                  value={resumeData.personalInfo.location}
                  onChange={(e) => handlePersonalInfoChange('location', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="url"
                  placeholder="Website"
                  value={resumeData.personalInfo.website}
                  onChange={(e) => handlePersonalInfoChange('website', e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Professional Summary */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <h2 className="text-lg font-semibold mb-4">Professional Summary</h2>
              <textarea
                rows={4}
                placeholder="Write a brief summary of your professional background..."
                value={resumeData.summary}
                onChange={(e) => setResumeData(prev => ({ ...prev, summary: e.target.value }))}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Experience */}
            <div className="bg-white rounded-lg p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <h2 className="text-lg font-semibold">Work Experience</h2>
                </div>
                <button
                  onClick={addExperience}
                  className="flex items-center space-x-1 text-blue-600 hover:text-blue-700"
                >
                  <Plus className="h-4 w-4" />
                  <span>Add Experience</span>
                </button>
              </div>
              <div className="space-y-4">
                {resumeData.experience.map((exp) => (
                  <div key={exp.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex justify-between items-start mb-3">
                      <h3 className="font-medium">Experience Entry</h3>
                      <button
                        onClick={() => removeExperience(exp.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                      <input
                        type="text"
                        placeholder="Company"
                        value={exp.company}
                        onChange={(e) => updateExperience(exp.id, 'company', e.target.value)}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Position"
                        value={exp.position}
                        onChange={(e) => updateExperience(exp.id, 'position', e.target.value)}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="text"
                        placeholder="Location"
                        value={exp.location}
                        onChange={(e) => updateExperience(exp.id, 'location', e.target.value)}
                        className="p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex space-x-2">
                        <input
                          type="month"
                          placeholder="Start Date"
                          value={exp.startDate}
                          onChange={(e) => updateExperience(exp.id, 'startDate', e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <input
                          type="month"
                          placeholder="End Date"
                          value={exp.endDate}
                          onChange={(e) => updateExperience(exp.id, 'endDate', e.target.value)}
                          className="flex-1 p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <textarea
                      rows={3}
                      placeholder="Describe your responsibilities and achievements..."
                      value={exp.description}
                      onChange={(e) => updateExperience(exp.id, 'description', e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preview Panel */}
        {showPreview && (
          <div className="w-1/2 p-6 bg-white border-l border-gray-200">
            <div className="sticky top-6">
              <div
                ref={resumeRef}
                className="bg-white shadow-lg rounded-lg p-8 max-w-2xl mx-auto"
                style={{ minHeight: '800px' }}
              >
                {/* Header */}
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {resumeData.personalInfo.name || 'Your Name'}
                  </h1>
                  <p className="text-xl text-blue-600 mb-4">
                    {resumeData.personalInfo.title || 'Your Title'}
                  </p>
                  <div className="flex flex-wrap justify-center gap-4 text-sm text-gray-600">
                    {resumeData.personalInfo.email && (
                      <div className="flex items-center space-x-1">
                        <Mail className="h-4 w-4" />
                        <span>{resumeData.personalInfo.email}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.phone && (
                      <div className="flex items-center space-x-1">
                        <Phone className="h-4 w-4" />
                        <span>{resumeData.personalInfo.phone}</span>
                      </div>
                    )}
                    {resumeData.personalInfo.location && (
                      <div className="flex items-center space-x-1">
                        <MapPin className="h-4 w-4" />
                        <span>{resumeData.personalInfo.location}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Summary */}
                {resumeData.summary && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 border-b-2 border-blue-600 pb-1 mb-3">
                      Professional Summary
                    </h2>
                    <p className="text-gray-700 leading-relaxed">{resumeData.summary}</p>
                  </div>
                )}

                {/* Experience */}
                {resumeData.experience.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 border-b-2 border-blue-600 pb-1 mb-3">
                      Work Experience
                    </h2>
                    <div className="space-y-4">
                      {resumeData.experience.map((exp) => (
                        <div key={exp.id}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h3 className="font-semibold text-gray-900">{exp.position || 'Position'}</h3>
                              <p className="text-blue-600">{exp.company || 'Company'}</p>
                            </div>
                            <div className="text-right text-sm text-gray-600">
                              <p>{exp.location}</p>
                              <p>
                                {exp.startDate && new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                                {exp.startDate && exp.endDate && ' - '}
                                {exp.endDate === 'Present' ? 'Present' : exp.endDate && new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          {exp.description && (
                            <p className="text-gray-700 text-sm leading-relaxed">{exp.description}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Education */}
                {resumeData.education.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 border-b-2 border-blue-600 pb-1 mb-3">
                      Education
                    </h2>
                    <div className="space-y-4">
                      {resumeData.education.map((edu) => (
                        <div key={edu.id} className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold text-gray-900">{edu.degree}</h3>
                            <p className="text-blue-600">{edu.institution}</p>
                            {edu.gpa && <p className="text-sm text-gray-600">GPA: {edu.gpa}</p>}
                          </div>
                          <div className="text-right text-sm text-gray-600">
                            <p>{edu.location}</p>
                            <p>
                              {edu.startDate && new Date(edu.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                              {edu.startDate && edu.endDate && ' - '}
                              {edu.endDate && new Date(edu.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResumeBuilderPage;