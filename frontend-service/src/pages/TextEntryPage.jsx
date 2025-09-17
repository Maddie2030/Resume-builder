import React, { useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { Canvas, FabricImage, Textbox } from 'fabric';

const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

const defaultFonts = [
  { label: 'DejaVu Sans', value: '/usr/share/fonts/dejavu/DejaVuSans.ttf' },
  { label: 'Arial (system)', value: 'Arial (system)' },
  { label: 'Roboto', value: 'Roboto' },
  { label: 'Open Sans', value: 'Open Sans' },
  { label: 'Lato', value: 'Lato' },
  { label: 'Montserrat', value: 'Montserrat' },
  { label: 'Verdana', value: 'Verdana' },
  { label: 'Georgia', value: 'Georgia' },
  { label: 'Courier New', value: 'Courier New' },
  { label: 'Times New Roman', value: 'Times New Roman' },
  { label: 'Trebuchet MS', value: 'Trebuchet MS' },
];

const CANVAS_W = 715;
const CANVAS_H = 1144;

const TextEntryPage = () => {
  const { templateId } = useParams();
  const token = useAuthStore((s) => s.token);
  const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8003';

  const [template, setTemplate] = useState(null);
  const [blocks, setBlocks] = useState({});
  const [selectedBlockId, setSelectedBlockId] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [outputUrl, setOutputUrl] = useState(null);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [blockIdCounter, setBlockIdCounter] = useState(1);

  const canvasElRef = useRef(null);
  const fabricRef = useRef(null);
  const objMapRef = useRef({});

  const generateBlockId = () => {
    const id = `block_${Date.now()}_${blockIdCounter}`;
    setBlockIdCounter(prev => prev + 1);
    return id;
  };

  const addNewTextBlock = (type = 'TITLE') => {
    const blockId = generateBlockId();
    const baseY = type === 'TITLE' ? 50 : 150;
    const existingCount = Object.keys(blocks).filter(id => blocks[id].type === type).length;
    
    const newBlock = {
      id: blockId,
      type: type,
      user_text: type === 'TITLE' ? 'Enter Title' : 'Enter Details',
      x: 50 + (existingCount * 20),
      y: baseY + (existingCount * 80),
      font_size: type === 'TITLE' ? 24 : 16,
      color: type === 'TITLE' ? '#000000' : '#333333',
      font_path: '',
      bold: type === 'TITLE' ? true : false,
      italic: false,
      max_width: 400,
      width: 400, // Initial width for new blocks
      height: 0, // Height is dynamic
    };

    setBlocks(prev => ({
      ...prev,
      [blockId]: newBlock
    }));
    
    setSelectedBlockId(blockId);
  };

  const removeTextBlock = (blockId) => {
    setBlocks(prev => {
      const newBlocks = { ...prev };
      delete newBlocks[blockId];
      return newBlocks;
    });
    
    const canvas = fabricRef.current;
    if (canvas && objMapRef.current[blockId]) {
      canvas.remove(objMapRef.current[blockId]);
      delete objMapRef.current[blockId];
      canvas.renderAll();
    }
    
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  };

  const updateBlock = (blockId, updates) => {
    setBlocks(prev => ({
      ...prev,
      [blockId]: { ...prev[blockId], ...updates }
    }));
  };

  useEffect(() => {
    if (!token || !templateId) return;

    const fetchTemplate = async () => {
      try {
        const { data } = await axios.get(`${API_BASE}/api/v1/templates/${templateId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTemplate(data);

        const init = {};
        data.text_blocks?.forEach((b, index) => {
          const blockId = `template_${index}`;
          init[blockId] = {
            id: blockId,
            type: b.default_text || b.title || '', 
            user_text: b.default_text || b.title || '',
            x: b.x,
            y: b.y,
            width: b.width,
            height: b.height,
            font_size: b.font_size,
            color: b.color || '#000000',
            font_path: b.font_path || '',
            bold: !!b.bold,
            italic: !!b.italic,
            max_width: b.max_width || b.width,
          };
        });
        setBlocks(init);
      } catch (err) {
        console.error(err);
        setError('Failed to load template');
      }
    };

    fetchTemplate();
  }, [token, templateId, API_BASE]);

  useEffect(() => {
    if (!template || !canvasElRef.current) return;

    if (fabricRef.current) {
      fabricRef.current.dispose();
      objMapRef.current = {};
    }

    const canvas = new Canvas(canvasElRef.current, {
      width: CANVAS_W,
      height: CANVAS_H,
      selection: true,
      backgroundColor: null,
      preserveObjectStacking: true,
    });
    fabricRef.current = canvas;

    const loadBackgroundAndObjects = async () => {
      const bgUrl = `${API_BASE}${template.image_path}`;
      
      try {
        const img = await FabricImage.fromURL(bgUrl, { crossOrigin: 'anonymous' });
        
        const scaleX = CANVAS_W / img.width;
        const scaleY = CANVAS_H / img.height;
        const scale = Math.min(scaleX, scaleY);
        img.scale(scale);
        
        img.set({
          left: (CANVAS_W - img.width * scale) / 2,
          top: (CANVAS_H - img.height * scale) / 2,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        });
        
        canvas.backgroundImage = img;
        canvas.renderAll();
        
      } catch (err) {
        console.error('Failed to load background image:', err);
      }
    };

    const syncToState = (e) => {
      const obj = e.target;
      if (!obj || !obj.blockId) return;

      const blockId = obj.blockId;
      
      // Get fixed width and dynamic height
      const newWidth = Math.round(obj.width);
      const newHeight = Math.round(obj.getScaledHeight());
      
      obj.set({ scaleX: 1, scaleY: 1 });
      
      const nx = Math.round(obj.left ?? 0);
      // Clamp vertical position
      const ny = clamp(Math.round(obj.top ?? 0), 0, CANVAS_H - 200);
      obj.set({ left: nx, top: ny });

      updateBlock(blockId, {
        x: nx,
        y: ny,
        user_text: obj.text || '',
        width: newWidth,
        height: newHeight,
      });
      
      fabricRef.current?.renderAll();
    };
    
    const updateSelectedBlock = (e) => {
      const activeObject = e.target;
      if (activeObject && activeObject.blockId) {
        setSelectedBlockId(activeObject.blockId);
      } else {
        setSelectedBlockId(null);
      }
    };

    canvas.on('object:modified', syncToState);
    canvas.on('text:changed', syncToState);
    canvas.on('selection:created', updateSelectedBlock);
    canvas.on('selection:updated', updateSelectedBlock);
    canvas.on('selection:cleared', () => setSelectedBlockId(null));


    loadBackgroundAndObjects();

    return () => {
      canvas.off('object:modified', syncToState);
      canvas.off('text:changed', syncToState);
      canvas.off('selection:created', updateSelectedBlock);
      canvas.off('selection:updated', updateSelectedBlock);
      canvas.off('selection:cleared', () => setSelectedBlockId(null));
      canvas.dispose();
      fabricRef.current = null;
      objMapRef.current = {};
    };

  }, [template, API_BASE]);

  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    Object.values(blocks).forEach((block) => {
      if (!block.id) return;
      
      let obj = objMapRef.current[block.id];
      
      if (!obj) {
        // Use Textbox instead of IText for auto-wrapping
        obj = new Textbox(block.user_text, {
          left: block.x,
          top: block.y,
          fontSize: block.font_size,
          fill: block.color,
          fontWeight: block.bold ? '700' : '400',
          fontStyle: block.italic ? 'italic' : 'normal',
          editable: true,
          // Set a fixed width for the text box
          width: block.max_width, 
          // Lock movement on the X-axis
          lockMovementX: true, 
          // Lock all scaling
          lockUniScaling: true,
          lockRotation: true,
          lockSkewingX: true,
          lockSkewingY: true,
          
          transparentCorners: false,
          cornerStyle: 'circle',
          borderScaleFactor: 1,
          objectCaching: false,
          
          padding: 2,
          borderOpacityWhenMoving: 0.4,
          
          minWidth: 20,
        });
        
        obj.blockId = block.id;
        obj.blockType = block.type;
        
        canvas.add(obj);
        objMapRef.current[block.id] = obj;
      } else {
        obj.set({
          left: block.x,
          top: block.y,
          fontSize: block.font_size,
          fill: block.color,
          fontWeight: block.bold ? '700' : '400',
          fontStyle: block.italic ? 'italic' : 'normal',
          text: block.user_text,
          width: block.max_width,
        });
      }
    });
    
    canvas.renderAll();
  }, [blocks]);

  const pollIntervalRef = useRef(null);

  const handleGenerate = async () => {
    // Clear any previous polling
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setIsGenerating(true);
    setError(null);
    setOutputUrl(null);
  

    try {
      const text_data = Object.values(blocks).map((block) => {
        const fabricObject = fabricRef.current?.getObjects().find(o => o.blockId === block.id);
        const currentWidth = fabricObject ? Math.round(fabricObject.width) : block.width;
        const currentHeight = fabricObject ? Math.round(fabricObject.getScaledHeight()) : block.height;
        return {
          title: block.id,
          user_text: block.user_text,
          x: block.x,
          y: block.y,
          width: currentWidth,
          height: currentHeight,
          font_size: block.font_size,
          color: block.color,
          font_path: block.font_path || null,
          bold: block.bold,
          italic: block.italic,
          max_width: block.max_width,
          type: block.type,
        };
      });


      const resp = await axios.post(
        `${API_BASE}/api/v1/render/generate-image`,
        { template_id: templateId, text_data },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );

      if (resp.data?.task_id) {
        const taskId = resp.data.task_id;

        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusResp = await axios.get(`${API_BASE}/api/v1/render/status/${taskId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            const { status, result, error } = statusResp.data;

            if (status === 'SUCCESS') {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setOutputUrl(result);
              setIsGenerating(false);
            } else if (status === 'FAILURE') {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setError(error || 'Image generation failed.');
              setIsGenerating(false);
            }
            // Otherwise keep polling (PENDING, STARTED)
          } catch (pollError) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setError('Failed to check task status.');
            setIsGenerating(false);
          }
        }, 3000); // Poll every 3 seconds
      } else {
        setError('Unexpected response from render service.');
        setIsGenerating(false);
      }
    } catch (e) {
      setError('Failed to start image generation.');
      setIsGenerating(false);
    }
  };

  // Cleanup the interval when your component unmounts
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  const handleGeneratePdf = async () => {
    if (!outputUrl) {
      alert("Please generate the image first.");
      return;
    }
    setIsGenerating(true);
    setError(null);
    setPdfUrl(null);
    
    const imagePath = outputUrl.replace(API_BASE, '');
    try {
      // Use the existing image path to generate PDF
      const resp = await axios.post(
        `${API_BASE}/api/v1/render/generate-pdf-direct`,
        { image_path: imagePath }, // Pass the existing image path
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      if (resp.data?.task_id) {
        const taskId = resp.data.task_id;

        pollIntervalRef.current = setInterval(async () => {
          try {
            const statusResp = await axios.get(`${API_BASE}/api/v1/render/status/${taskId}`, {
              headers: { Authorization: `Bearer ${token}` },
            });

            const { status, result, error } = statusResp.data;

            if (status === 'SUCCESS') {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setPdfUrl(result);
              setIsGenerating(false);
            } else if (status === 'FAILURE') {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
              setError(error || 'pdf generation failed.');
              setIsGenerating(false);
            }
            // Otherwise keep polling (PENDING, STARTED)
          } catch (pollError) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
            setError('Failed to check task status.');
            setIsGenerating(false);
          }
        }, 3000); // Poll every 3 seconds
      } else {
        setError('Unexpected response from render service.');
        setIsGenerating(false);
      }
    } catch (e) {
      setError('Failed to start image generation.');
      setIsGenerating(false);
    }
  };
  
    useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);
  const downloadFile = (url) => {
    fetch(url, { mode: 'cors' })
      .then(response => response.blob())
      .then(blob => {
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        a.download = url.split('/').pop() || 'generated-image.png';
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(blobUrl);
      })
      .catch(() => alert('Failed to download file'));
  };

  // const downloadFile = (url, filename) => {
  //   fetch(url, { mode: 'cors' })
  //     .then(response => response.blob())
  //     .then(blob => {
  //       const blobUrl = window.URL.createObjectURL(blob);
  //       const a = document.createElement('a');
  //       a.href = blobUrl;
  //       a.download = filename || url.split('/').pop() || 'file';
  //       document.body.appendChild(a);
  //       a.click();
  //       a.remove();
  //       window.URL.revokeObjectURL(blobUrl);
  //     })
  //     .catch(() => alert('Failed to download file'));
  // };

  


  if (!template) return <div style={{ padding: '2rem' }}>Loading...</div>;

  const selectedBlock = selectedBlockId ? blocks[selectedBlockId] : null;

  return (
    <div style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '380px 1fr', gap: '1.5rem' }}>
      <div>
        <h2 style={{ marginTop: 0 }}>Customize: {template.name}</h2>

        <div style={{ marginBottom: '1rem', display: 'flex', gap: '8px' }}>
          <button 
            onClick={() => addNewTextBlock('TITLE')} 
            style={{ 
              padding: '8px 12px',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            + Add Title
          </button>
          <button 
            onClick={() => addNewTextBlock('DETAILS')} 
            style={{ 
              padding: '8px 12px',
              backgroundColor: '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              flex: 1
            }}
          >
            + Add Details
          </button>
        </div>

        <div style={{ marginBottom: '1rem', maxHeight: '200px', overflowY: 'auto' }}>
          <h3 style={{ fontSize: '14px', marginBottom: '8px' }}>Text Blocks:</h3>
          {Object.values(blocks).map((block) => (
            <div 
              key={block.id} 
              onClick={() => setSelectedBlockId(block.id)}
              style={{ 
                padding: '2px', 
                marginBottom: '2px',
                backgroundColor: selectedBlockId === block.id ? '#e3f2fd' : '#f5f5f5',
                border: selectedBlockId === block.id ? '1px solid #2196f3' : '1px solid #ddd',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '12px' }}>
                  {block.type} 
                  {selectedBlockId === block.id && ' (Selected)'}
                </div>
                <div style={{ fontSize: '11px', opacity: 0.7 }}>
                  {block.user_text.substring(0, 20)}{block.user_text.length > 20 ? '...' : ''}
                </div>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  removeTextBlock(block.id);
                }}
                style={{ 
                  background: 'none', 
                  border: 'none', 
                  color: '#ff4444', 
                  cursor: 'pointer', 
                  fontSize: '16px',
                  padding: '0 4px'
                }}
              >
                ×
              </button>
            </div>
          ))}
        </div>

        {selectedBlock && (
          <div style={{ border: '1px solid #ddd', borderRadius: '4px', padding: '12px', marginBottom: '1rem' }}>
            <h3 style={{ marginTop: 0, fontSize: '16px' }}>
              Edit {selectedBlock.type} Block
            </h3>
            
            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Text:</label>
              <textarea
                value={selectedBlock.user_text}
                onChange={(e) => updateBlock(selectedBlock.id, { user_text: e.target.value })}
                style={{ width: '100%', padding: '8px', minHeight: '60px', resize: 'vertical' }}
                placeholder={`Enter ${selectedBlock.type.toLowerCase()}`}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Size:</label>
                <input
                  type="number"
                  min={6}
                  value={selectedBlock.font_size}
                  onChange={(e) => updateBlock(selectedBlock.id, { font_size: parseInt(e.target.value) || selectedBlock.font_size })}
                  style={{ width: '100%', padding: '4px' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Color:</label>
                <input
                  type="color"
                  value={selectedBlock.color}
                  onChange={(e) => updateBlock(selectedBlock.id, { color: e.target.value })}
                  style={{ width: '100%', height: '32px' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '8px' }}>
              <label style={{ fontSize: '12px', display: 'block', marginBottom: '4px' }}>Font:</label>
              <select
                value={selectedBlock.font_path || ''}
                onChange={(e) => updateBlock(selectedBlock.id, { font_path: e.target.value || null })}
                style={{ width: '100%', padding: '4px' }}
              >
                {defaultFonts.map((f) => (
                  <option key={f.label} value={f.value}>{f.label}</option>
                ))}
              </select>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedBlock.bold}
                  onChange={(e) => updateBlock(selectedBlock.id, { bold: e.target.checked })}
                  style={{ marginRight: '4px' }}
                />
                Bold
              </label>
              <label style={{ fontSize: '12px', display: 'flex', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={selectedBlock.italic}
                  onChange={(e) => updateBlock(selectedBlock.id, { italic: e.target.checked })}
                  style={{ marginRight: '4px' }}
                />
                Italic
              </label>
            </div>

            <div style={{ fontSize: '11px', opacity: 0.7, marginTop: '8px' }}>
              Position: ({selectedBlock.x}, {selectedBlock.y}) • Size: {selectedBlock.width}×{selectedBlock.height}
            </div>
          </div>
        )}

        <button 
          onClick={handleGenerate} 
          disabled={isGenerating} 
          style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#1b7ff2ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
         >
          {isGenerating ? 'Generating...' : 'Generate Image'}
        </button>
        <button
          onClick={handleGeneratePdf}
          disabled={isGenerating}
          style={{ marginTop: '16px', padding: '8px 16px', backgroundColor: '#0f3359ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          Generate PDF
        </button>
        {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
      </div>

      <div>
        {!outputUrl && (
          <div style={{ position: 'relative', width: CANVAS_W, height: CANVAS_H, border: '1px solid #000' }}>
            <canvas ref={canvasElRef} width={CANVAS_W} height={CANVAS_H} />
          </div>
        )}

        {outputUrl && (
          <div>
            <h3>Generated Image</h3>
            <img src={`${API_BASE}${outputUrl}`} alt="Generated Output" style={{ maxWidth: '100%' }} />

            <button
              onClick={() => downloadFile(`${outputUrl}`)}
              style={{ display: 'block', marginTop: '8px', padding: '8px 16px', backgroundColor: '#017270ff', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
            >
              Download Image
            </button>



        {pdfUrl && (
          
          <button
            onClick={() => downloadFile(`${pdfUrl}`)}
            style={{ display: 'block', marginTop: '8px', padding: '8px 16px', backgroundColor: '#4caf50', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
          >
            Download PDF
          </button>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default TextEntryPage;