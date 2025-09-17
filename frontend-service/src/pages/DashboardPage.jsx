//frontend-service/src/pages/DashboardPage.jsx
import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, FileText, Download, Edit, Star } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import '../assets/DashboardPage.css';

const DashboardPage = () => {
  const token = useAuthStore((state) => state.token);

  return (
    <div className="dashboard-wrap min-h-screen py-12 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#FBFCFF] to-[#F6F7FB] relative overflow-hidden">
      {/* Hero Section */}
      
      <div className="hero text-center max-w-3xl mx-auto mb-12 animate-fadeIn">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-3 leading-tight">
          Create Professional Resumes in Minutes
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Build stunning resumes with our AI-powered templates and land your dream job.
        </p>
        <Link
          to="/templates"
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3 rounded-xl font-semibold shadow-lg hover:bg-blue-700 transition-transform duration-200 transform hover:-translate-y-1"
        >
          <Plus className="h-5 w-5" />
          <span>Create New Resume</span>
        </Link>
      </div>

      {token && (
        <>
          {/* Section for your generated images */}
          <div className="mb-12 max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-extrabold text-gray-900">Your Generated Images</h2>
              <Link to="/templates" className="text-blue-600 hover:text-blue-700 font-semibold">
                View all templates
              </Link>
            </div>
            {/* Generated images list here */}
          </div>
        </>
      )}


      
      {/* Stats Section */}
    
      <div className="stats grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-3xl mx-auto">
        <div className="stat-card bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center hover:shadow-lg hover:-translate-y-1 transition-transform transition-shadow duration-200">
          <div className="stat-icon blue w-10 h-10 flex items-center justify-center rounded-lg text-blue-600 bg-blue-100">
            <FileText className="h-6 w-6" />
          </div>
          <div className="stat-meta ml-4">
            <p className="value text-3xl font-extrabold text-gray-900 leading-tight">50+</p>
            <p className="label text-sm text-gray-500 mt-1">Professional Templates</p>
          </div>
        </div>

        <div className="stat-card bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center hover:shadow-lg hover:-translate-y-1 transition-transform transition-shadow duration-200">
          <div className="stat-icon green w-10 h-10 flex items-center justify-center rounded-lg text-green-600 bg-green-100">
            <Download className="h-6 w-6" />
          </div>
          <div className="stat-meta ml-4">
            <p className="value text-3xl font-extrabold text-gray-900 leading-tight">1M+</p>
            <p className="label text-sm text-gray-500 mt-1">Downloads</p>
          </div>
        </div>

        <div className="stat-card bg-white border border-gray-200 rounded-xl p-6 shadow-sm flex items-center hover:shadow-lg hover:-translate-y-1 transition-transform transition-shadow duration-200">
          <div className="stat-icon amber w-10 h-10 flex items-center justify-center rounded-lg text-yellow-600 bg-yellow-100">
            <Star className="h-6 w-6" />
          </div>
          <div className="stat-meta ml-4">
            <p className="value text-3xl font-extrabold text-gray-900 leading-tight">4.9/5</p>
            <p className="label text-sm text-gray-500 mt-1">User Rating</p>
          </div>
        </div>
      </div>
    

      {/* Features Section */}
    <div className="flex flex-col md:flex-row gap-8">
      <div className="features bg-white border border-gray-200 rounded-2xl p-8 shadow-lg max-w-5xl mx-auto">
        <h2 className="text-2xl font-extrabold text-gray-900 mb-8 text-center">Why Choose Our Service?</h2>
        <div className="feature-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="feature text-center p-4 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
            <div className="badge blue bg-blue-100 text-blue-600 mx-auto mb-4 flex items-center justify-center rounded-full w-12 h-12">
              <FileText className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Professional Templates</h3>
            <p className="text-gray-600">
              Choose from 50+ professionally designed templates crafted by industry experts.
            </p>
          </div>
        
          <div className="feature text-center p-4 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
            <div className="badge green bg-green-100 text-green-600 mx-auto mb-4 flex items-center justify-center rounded-full w-12 h-12">
              <Edit className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Easy Customization</h3>
            <p className="text-gray-600">
              Our powerful editors make customization effortless, whether for resumes or other templates.
            </p>
          </div>

          <div className="feature text-center p-4 rounded-lg hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-default">
            <div className="badge violet bg-purple-100 text-purple-600 mx-auto mb-4 flex items-center justify-center rounded-full w-12 h-12">
              <Download className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Instant Download</h3>
            <p className="text-gray-600">
              Download your creations as PDFs or high-quality images instantly.
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
      

  );
};

export default DashboardPage;
