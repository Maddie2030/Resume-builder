// frontend-service/src/pages/TemplatesPage.jsx
import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Filter, Star, Eye, Sparkles, ArrowRight, Users, Download, Heart, Grid3X3, List } from 'lucide-react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import * as fabric from 'fabric';
import { Canvas, FabricImage, Textbox } from 'fabric';

// Canvas dimensions for template previews
const ORIGINAL_W = 715;
const ORIGINAL_H = 1144;
const PREVIEW_W = ORIGINAL_W /1.8;
const PREVIEW_H = ORIGINAL_H/1.8 ;

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Component to render each template preview
const TemplateThumbnail = ({ template, showTextBlocks = true }) => {
  const canvasRef = useRef(null);
  const fabricCanvasRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    if (!fabricCanvasRef.current) {
      fabricCanvasRef.current = new fabric.StaticCanvas(canvasRef.current, {
        width: PREVIEW_W,
        height: PREVIEW_H,
        backgroundColor: null,
      });
    }

    const canvas = fabricCanvasRef.current;
    canvas.clear();

    if (template?.image_path) {
      FabricImage.fromURL(`${API_BASE}${template.image_path}`, { crossOrigin: "anonymous" }).then(img => {
        if (!img) return;

        const scaleX = PREVIEW_W / img.width;
        const scaleY = PREVIEW_H / img.height;
        const scale = Math.min(scaleX, scaleY);

        img.scale(scale);
        img.set({
          left: (canvas.getWidth() - img.width * scale) / 2,
          top: (canvas.getHeight() - img.height * scale) / 2,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        });

        canvas.backgroundImage = img;
        canvas.renderAll();

        if (showTextBlocks && Array.isArray(template.text_blocks)) {
          template.text_blocks.forEach((block) => {
            const tb = new fabric.Textbox(block.default_text || block.content || "", {
              left: block.x * scaleX,
              top: block.y * scaleY,
              width: block.width * scaleX,
              fontSize: Math.max(block.font_size * scaleX, 8),
              fill: block.color || "#000",
              fontWeight: block.font_weight || "normal",
              fontStyle: block.font_style || "normal",
              textAlign: block.text_align || "left",
              selectable: false,
              editable: false,
            });
            canvas.add(tb);
          });
        }
        canvas.renderAll();
      });
    }
  }, [template, showTextBlocks]);

  return <canvas ref={canvasRef} className="w-full h-full object-cover" />;
};

const TemplateCard = ({ template, navigate }) => {
  const [isLiked, setIsLiked] = useState(false);
  
  return (
    <div className="group relative bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-2xl hover:shadow-blue-100/50 transition-all duration-500 transform hover:-translate-y-2 flex-shrink-0 w-80">
      {/* Template Preview */}
      <div className="relative aspect-[395/475] overflow bg-gradient-to-br from-gray-50 to-gray-100 h-96 ">
        <div className="absolute inset-0 p-4">
          <TemplateThumbnail template={template} showTextBlocks={true} />
        </div>
      </div>
            {/* Overlay with Actions */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300">
        <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
          <div className="flex space-x-2">
            <button
              onClick={() => navigate(`/text-entry/${template._id || template.id}`)}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl font-medium flex items-center space-x-2 hover:bg-blue-700 transition-colors shadow-lg"
            >
              <span>Use Template</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          <button
            onClick={() => setIsLiked(!isLiked)}
            className={`p-2 rounded-xl backdrop-blur-sm transition-colors shadow-lg ${
              isLiked ? 'bg-red-500 text-white' : 'bg-white/90 text-gray-700 hover:text-red-500'
            }`}
          >
            <Heart className={`h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
          </button>
            {/* Premium Badge */}
          <div>
            <span className="bg-gradient-to-r from-purple-600 to-pink-600 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1 shadow-lg">
              <Sparkles className="h-3 w-3" />
              <span>Premium</span>
            </span>
          </div>

          {/* Rating Badge - No absolute positioning */}
          <div>
            <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center space-x-1 shadow-lg">
              <Star className="h-3 w-3 text-yellow-400 fill-current" />
              <span className="text-xs font-medium text-gray-700">4.9</span>
            </div>
          </div>
              
        </div>
      </div>

      {/* Template Info */}
      <div className="p-6 bg-transparent">
        <div className="flex items-start justify-between mb-3 bg-transparent">
          <div className='bg-transparent'>
            <h3 className="text-lg font-bold text-gray-900 mb-1 group-hover:text-blue-600 bg-transparent transition-colors ">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 mb-3">
              Professional resume template designed for modern care
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const LoadingSkeleton = () => (
  <div className="flex space-x-6">
    {[...Array(3)].map((_, i) => (
      <div key={i} className="flex-shrink-0 w-80 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
        <div className="aspect-[400/480] bg-gray-200"></div>
        <div className="p-6">
          <div className="h-5 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded mb-4 w-3/4"></div>
          <div className="flex justify-between items-center mb-4">
            <div className="h-6 bg-gray-200 rounded-full w-20"></div>
            <div className="h-4 bg-gray-200 rounded w-16"></div>
          </div>
          <div className="h-12 bg-gray-200 rounded-xl"></div>
        </div>
      </div>
    ))}
  </div>
);

const TemplatesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('grid');
  const token = useAuthStore((state) => state.token);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE}/api/v1/templates/templates`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTemplates(response.data);
      } catch (error) {
        console.error('Failed to fetch templates:', error);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTemplates();
  }, [token]);

  const categories = ['All', 'Modern', 'Professional', 'Creative', 'Minimal', 'Executive', 'Student', 'Technical'];

  const filteredTemplates = templates.filter((template) => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === 'All' ||
      (template.category && template.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-white to-blue-100 bg-clip-text text-transparent">
              Professional Resume Templates
            </h1>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8 leading-relaxed">
              Choose from our collection of expertly designed templates, trusted by professionals worldwide. 
              Create a stunning resume in minutes with our easy-to-use editor.
            </p>
            <div className="flex items-center justify-center space-x-8 text-sm text-blue-100">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5" />
                <span>50K+ Happy Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <Star className="h-5 w-5 text-yellow-300 fill-current" />
                <span>4.9/5 Rating</span>
              </div>
              <div className="flex items-center space-x-2">
                <Download className="h-5 w-5" />
                <span>1M+ Downloads</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Filter Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8">
        <div className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-gray-100">
          <div className="flex flex-col lg:flex-row gap-6 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-4 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for templates, styles, industries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 text-lg transition-all"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="border border-gray-200 rounded-xl px-4 py-4 focus:outline-none focus:ring-4 focus:ring-blue-100 focus:border-blue-500 bg-white min-w-[140px]"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex bg-gray-100 rounded-xl p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <Grid3X3 className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'
                  }`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                  selectedCategory === category
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Templates Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8">
          {loading ? (
            <LoadingSkeleton />
          ) : filteredTemplates.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-gray-400 mb-4">
                <Search className="h-16 w-16 mx-auto" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No templates found</h3>
              <p className="text-gray-500">Try adjusting your search criteria or browse all templates.</p>
              <button
                onClick={() => {
                  setSearchTerm('');
                  setSelectedCategory('All');
                }}
                className="mt-4 bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <>
              {/* Templates Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-1">
                    {selectedCategory === 'All' ? 'All Templates' : `${selectedCategory} Templates`}
                  </h2>
                  <p className="text-gray-600">
                    {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} available
                  </p>
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <span>Scroll to see more</span>
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                </div>
              </div>
              
              {/* Horizontal Scrolling Container */}
              <div className="overflow-x-auto pb-4 scrollbar-hide">
                <div className="flex space-x-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard
                      key={template._id || template.id}
                      template={template}
                      navigate={navigate}
                    />
                  ))}
                </div>
              </div>
              
              {/* Navigation Hint */}
              <div className="mt-6 text-center">
                <p className="text-sm text-gray-500">
                  Showing {Math.min(3, filteredTemplates.length)} of {filteredTemplates.length} templates • 
                  <span className="text-blue-600 ml-1">Scroll horizontally to see more</span>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Call to Action */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to create your perfect resume?</h2>
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              Join thousands of professionals who have successfully landed their dream jobs using our templates.
            </p>
            <button
              onClick={() => navigate('/templates')}
              className="bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg text-lg"
            >
              Get Started Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplatesPage;