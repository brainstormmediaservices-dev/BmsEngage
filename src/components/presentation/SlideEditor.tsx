import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { 
  Plus, Type, Image, Square, Circle, Triangle, Minus, Video, 
  Trash2, Copy, Lock, Unlock, Eye, EyeOff, ArrowUp, ArrowDown,
  ChevronDown, MousePointer, Hand
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PresentationSlide, SlideElement, SlideBackground,
  createBlankSlide, createTextElement, createImageElement, 
  createShapeElement, createVideoElement 
} from '../../services/presentationService';
import SlideRenderer from './SlideRenderer';
import { cn } from '../../lib/utils';

interface SlideEditorProps {
  slide: PresentationSlide;
  slideWidth: number;
  slideHeight: number;
  onUpdateSlide: (updates: Partial<PresentationSlide>) => void;
  mediaAssets?: { url: string; title: string; type: string }[];
  className?: string;
}

export default function SlideEditor({ 
  slide, slideWidth, slideHeight, onUpdateSlide, mediaAssets = [], className 
}: SlideEditorProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'hand'>('select');
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragElementStart, setDragElementStart] = useState({ x: 0, y: 0 });

  const elements = slide.elements || [];
  const selectedElement = useMemo(() => 
    elements.find(e => e._id === selectedId) || null,
    [elements, selectedId]
  );

  const updateElement = useCallback((id: string, updates: Partial<SlideElement>) => {
    const newElements = elements.map(el => 
      el._id === id ? { ...el, ...updates } : el
    );
    onUpdateSlide({ elements: newElements });
  }, [elements, onUpdateSlide]);

  const addElement = useCallback((type: SlideElement['type'], extras?: Partial<SlideElement>) => {
    let el: SlideElement;
    switch (type) {
      case 'text':
        el = createTextElement(extras);
        break;
      case 'image':
        el = createImageElement(extras?.src || '', extras);
        break;
      case 'shape':
        el = createShapeElement(extras?.shapeType || 'rectangle', extras);
        break;
      case 'video':
        el = createVideoElement(extras?.src || '', extras);
        break;
      default:
        el = createTextElement({ type, ...extras });
    }
    el.zIndex = elements.length;
    el._id = `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    onUpdateSlide({ elements: [...elements, el] });
    setSelectedId(el._id);
    setShowAddMenu(false);
  }, [elements, onUpdateSlide]);

  const deleteElement = useCallback((id: string) => {
    const newElements = elements.filter(e => e._id !== id);
    onUpdateSlide({ elements: newElements });
    if (selectedId === id) setSelectedId(null);
  }, [elements, selectedId, onUpdateSlide]);

  const duplicateElement = useCallback((id: string) => {
    const el = elements.find(e => e._id === id);
    if (!el) return;
    const newEl = { 
      ...JSON.parse(JSON.stringify(el)), 
      _id: `el-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      x: el.x + 20,
      y: el.y + 20,
      zIndex: elements.length,
    };
    onUpdateSlide({ elements: [...elements, newEl] });
    setSelectedId(newEl._id);
  }, [elements, onUpdateSlide]);

  const bringForward = useCallback((id: string) => {
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(e => e._id === id);
    if (idx < sorted.length - 1) {
      const temp = sorted[idx].zIndex;
      sorted[idx].zIndex = sorted[idx + 1].zIndex;
      sorted[idx + 1].zIndex = temp;
      onUpdateSlide({ elements: sorted });
    }
  }, [elements, onUpdateSlide]);

  const sendBackward = useCallback((id: string) => {
    const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const idx = sorted.findIndex(e => e._id === id);
    if (idx > 0) {
      const temp = sorted[idx].zIndex;
      sorted[idx].zIndex = sorted[idx - 1].zIndex;
      sorted[idx - 1].zIndex = temp;
      onUpdateSlide({ elements: sorted });
    }
  }, [elements, onUpdateSlide]);

  // Canvas mouse handlers for element dragging
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (tool === 'hand') return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicking on an element (reverse order for top-most)
    const sorted = [...elements].sort((a, b) => b.zIndex - a.zIndex);
    const clicked = sorted.find(el => 
      el.visible && !el.locked &&
      x >= el.x && x <= el.x + el.width &&
      y >= el.y && y <= el.y + el.height
    );

    if (clicked) {
      setSelectedId(clicked._id);
      setIsDragging(true);
      setDragStart({ x: e.clientX, y: e.clientY });
      setDragElementStart({ x: clicked.x, y: clicked.y });
    } else {
      setSelectedId(null);
    }
  }, [elements, tool]);

  const handleCanvasMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedId) return;
    const dx = e.clientX - dragStart.x;
    const dy = e.clientY - dragStart.y;
    updateElement(selectedId, {
      x: Math.round(dragElementStart.x + dx),
      y: Math.round(dragElementStart.y + dy),
    });
  }, [isDragging, selectedId, dragStart, dragElementStart, updateElement]);

  const handleCanvasMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (!selectedId) return;
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(selectedId);
      }
      if (e.key === 'd' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        duplicateElement(selectedId);
      }
      // Arrow keys to nudge
      const nudge = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowLeft') { e.preventDefault(); updateElement(selectedId, { x: (selectedElement?.x || 0) - nudge }); }
      if (e.key === 'ArrowRight') { e.preventDefault(); updateElement(selectedId, { x: (selectedElement?.x || 0) + nudge }); }
      if (e.key === 'ArrowUp') { e.preventDefault(); updateElement(selectedId, { y: (selectedElement?.y || 0) - nudge }); }
      if (e.key === 'ArrowDown') { e.preventDefault(); updateElement(selectedId, { y: (selectedElement?.y || 0) + nudge }); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [selectedId, selectedElement, deleteElement, duplicateElement, updateElement]);

  // Scale to fit editor
  const editorScale = useMemo(() => {
    const maxW = 800;
    const maxH = 500;
    return Math.min(maxW / slideWidth, maxH / slideHeight, 1);
  }, [slideWidth, slideHeight]);

  const bgPresets = [
    { label: 'Dark', value: '#1a1a2e' },
    { label: 'Black', value: '#000000' },
    { label: 'White', value: '#ffffff' },
    { label: 'Gray', value: '#374151' },
    { label: 'Blue', value: '#1e3a5f' },
    { label: 'Purple', value: '#2d1b69' },
    { label: 'Green', value: '#1a3a2a' },
    { label: 'Red', value: '#5c1a1a' },
    { label: 'Gradient 1', value: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' },
    { label: 'Gradient 2', value: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
    { label: 'Gradient 3', value: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)' },
    { label: 'Gradient 4', value: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' },
  ];

  return (
    <div className={cn("flex flex-col h-full", className)}>
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border shrink-0">
        <div className="flex items-center gap-1 bg-background rounded-lg p-0.5">
          <button 
            onClick={() => setTool('select')}
            className={cn("p-1.5 rounded-md transition-colors", tool === 'select' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}
            title="Select (V)"
          >
            <MousePointer size={14} />
          </button>
          <button 
            onClick={() => setTool('hand')}
            className={cn("p-1.5 rounded-md transition-colors", tool === 'hand' ? 'bg-primary/20 text-primary' : 'text-text-muted hover:text-text')}
            title="Hand tool"
          >
            <Hand size={14} />
          </button>
        </div>

        <div className="w-px h-5 bg-border mx-1" />

        <div className="relative">
          <button
            onClick={() => setShowAddMenu(!showAddMenu)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary rounded-lg text-xs font-semibold hover:bg-primary/20 transition-colors"
          >
            <Plus size={14} /> Add Element
          </button>
          <AnimatePresence>
            {showAddMenu && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 w-52 bg-card border border-border rounded-xl shadow-2xl z-30 overflow-hidden"
              >
                <button onClick={() => addElement('text')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Type size={14} className="text-blue-400" /> Text
                </button>
                <button onClick={() => addElement('image')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Image size={14} className="text-emerald-400" /> Image
                </button>
                <button onClick={() => addElement('video')}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Video size={14} className="text-red-400" /> Video
                </button>
                <div className="border-t border-border" />
                <button onClick={() => addElement('shape', { shapeType: 'rectangle', fill: '#6366f1' })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Square size={14} className="text-primary" /> Rectangle
                </button>
                <button onClick={() => addElement('shape', { shapeType: 'circle', fill: '#6366f1' })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Circle size={14} className="text-primary" /> Circle
                </button>
                <button onClick={() => addElement('shape', { shapeType: 'triangle', fill: '#6366f1' })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Triangle size={14} className="text-primary" /> Triangle
                </button>
                <button onClick={() => addElement('shape', { shapeType: 'line', fill: 'transparent', stroke: '#ffffff', strokeWidth: 2, height: 4 })}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-xs text-text hover:bg-white/5 transition-colors">
                  <Minus size={14} className="text-primary" /> Line
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowBgPicker(!showBgPicker)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 text-text-muted rounded-lg text-xs font-semibold hover:text-text transition-colors"
          >
            <div className="w-4 h-4 rounded border border-border" style={{ background: slide.background?.type === 'gradient' ? slide.background.value : slide.background?.value || '#1a1a2e' }} />
            Background
            <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {showBgPicker && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute top-full left-0 mt-1 w-64 bg-card border border-border rounded-xl shadow-2xl z-30 p-3"
              >
                <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">Background Color / Gradient</p>
                <div className="grid grid-cols-4 gap-1.5">
                  {bgPresets.map(p => (
                    <button
                      key={p.label}
                      onClick={() => {
                        const type = p.value.startsWith('linear') ? 'gradient' : 'color';
                        onUpdateSlide({ background: { ...(slide.background || {} as SlideBackground), type: type as any, value: p.value } });
                        setShowBgPicker(false);
                      }}
                      className="w-full aspect-square rounded-lg border border-border hover:border-primary/50 transition-colors"
                      style={{ background: p.value }}
                      title={p.label}
                    />
                  ))}
                </div>
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Custom Color</label>
                  <input
                    type="color"
                    value={slide.background?.value?.startsWith('#') ? slide.background.value : '#1a1a2e'}
                    onChange={(e) => {
                      onUpdateSlide({ background: { ...(slide.background || {} as SlideBackground), type: 'color', value: e.target.value } });
                    }}
                    className="w-full h-8 rounded-lg border border-border cursor-pointer"
                  />
                </div>
                <div className="mt-2">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Background Image URL</label>
                  <input
                    type="text"
                    placeholder="https://..."
                    className="w-full px-3 py-1.5 bg-background border border-border rounded-lg text-xs text-text"
                    onBlur={(e) => {
                      if (e.target.value) {
                        onUpdateSlide({ background: { ...(slide.background || {} as SlideBackground), type: 'image', value: e.target.value } });
                      }
                    }}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex-1" />

        <span className="text-[10px] text-text-muted font-medium">
          {slideWidth} × {slideHeight}
        </span>
      </div>

      {/* Canvas + properties panel */}
      <div className="flex flex-1 min-h-0">
        {/* Canvas area */}
        <div 
          className="flex-1 flex items-center justify-center overflow-auto bg-[#111] p-4"
          onClick={() => setShowAddMenu(false)}
        >
          <div
            ref={canvasRef}
            className="relative shadow-2xl"
            style={{
              width: slideWidth * editorScale,
              height: slideHeight * editorScale,
              cursor: tool === 'hand' ? 'grab' : isDragging ? 'grabbing' : 'default',
            }}
            onMouseDown={handleCanvasMouseDown}
            onMouseMove={handleCanvasMouseMove}
            onMouseUp={handleCanvasMouseUp}
            onMouseLeave={handleCanvasMouseUp}
          >
            <div style={{ 
              width: slideWidth, 
              height: slideHeight, 
              transform: `scale(${editorScale})`, 
              transformOrigin: 'top left' 
            }}>
              <SlideRenderer
                slide={slide}
                slideWidth={slideWidth}
                slideHeight={slideHeight}
                isPresentMode={false}
                selectedElementId={selectedId}
              />
              
              {/* Selection indicators (editor only) */}
              {selectedElement && (
                <div
                  className="absolute border-2 border-primary pointer-events-none"
                  style={{
                    left: selectedElement.x - 2,
                    top: selectedElement.y - 2,
                    width: selectedElement.width + 4,
                    height: selectedElement.height + 4,
                    transform: `rotate(${selectedElement.rotation}deg)`,
                  }}
                />
              )}
            </div>
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-64 bg-card border-l border-border overflow-y-auto shrink-0">
          {selectedElement ? (
            <ElementProperties
              element={selectedElement}
              onUpdate={(updates) => updateElement(selectedId!, updates)}
              onDelete={() => deleteElement(selectedId!)}
              onDuplicate={() => duplicateElement(selectedId!)}
              onBringForward={() => bringForward(selectedId!)}
              onSendBackward={() => sendBackward(selectedId!)}
            />
          ) : (
            <SlideProperties
              slide={slide}
              slideWidth={slideWidth}
              slideHeight={slideHeight}
              onUpdate={onUpdateSlide}
              elementCount={elements.length}
            />
          )}
        </div>
      </div>

      {/* Click away to close menus */}
      {(showAddMenu || showBgPicker) && (
        <div className="fixed inset-0 z-20" onClick={() => { setShowAddMenu(false); setShowBgPicker(false); }} />
      )}
    </div>
  );
}

// Properties panel for selected element
function ElementProperties({ 
  element, onUpdate, onDelete, onDuplicate, onBringForward, onSendBackward 
}: {
  element: SlideElement;
  onUpdate: (updates: Partial<SlideElement>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onBringForward: () => void;
  onSendBackward: () => void;
}) {
  return (
    <div className="p-3 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-text capitalize">{element.type} Properties</h3>
        <div className="flex gap-1">
          <button onClick={onBringForward} className="p-1 rounded text-text-muted hover:text-text" title="Bring Forward">
            <ArrowUp size={12} />
          </button>
          <button onClick={onSendBackward} className="p-1 rounded text-text-muted hover:text-text" title="Send Backward">
            <ArrowDown size={12} />
          </button>
          <button onClick={() => onUpdate({ locked: !element.locked })} className="p-1 rounded text-text-muted hover:text-text" title="Lock">
            {element.locked ? <Lock size={12} /> : <Unlock size={12} />}
          </button>
          <button onClick={() => onUpdate({ visible: !element.visible })} className="p-1 rounded text-text-muted hover:text-text" title="Visibility">
            {element.visible ? <Eye size={12} /> : <EyeOff size={12} />}
          </button>
          <button onClick={onDuplicate} className="p-1 rounded text-text-muted hover:text-text" title="Duplicate">
            <Copy size={12} />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-text-muted hover:text-red-500" title="Delete">
            <Trash2 size={12} />
          </button>
        </div>
      </div>

      {/* Position & Size */}
      <Section title="Position & Size">
        <div className="grid grid-cols-2 gap-2">
          <PropInput label="X" value={element.x} onChange={(v) => onUpdate({ x: v })} type="number" />
          <PropInput label="Y" value={element.y} onChange={(v) => onUpdate({ y: v })} type="number" />
          <PropInput label="W" value={element.width} onChange={(v) => onUpdate({ width: v })} type="number" />
          <PropInput label="H" value={element.height} onChange={(v) => onUpdate({ height: v })} type="number" />
          <PropInput label="Rotate" value={element.rotation} onChange={(v) => onUpdate({ rotation: v })} type="number" />
          <PropInput label="Opacity" value={element.opacity} onChange={(v) => onUpdate({ opacity: Math.max(0, Math.min(1, v)) })} type="number" step={0.1} min={0} max={1} />
        </div>
      </Section>

      {/* Text properties */}
      {element.type === 'text' && (
        <Section title="Text">
          <textarea
            value={element.content}
            onChange={(e) => onUpdate({ content: e.target.value })}
            className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-text resize-none"
            rows={3}
          />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <PropInput label="Size" value={element.fontSize} onChange={(v) => onUpdate({ fontSize: v })} type="number" />
            <PropSelect label="Weight" value={element.fontWeight} onChange={(v) => onUpdate({ fontWeight: v })} 
              options={['normal', 'bold', '100', '200', '300', '400', '500', '600', '700', '800', '900']} />
            <PropSelect label="Align" value={element.textAlign} onChange={(v) => onUpdate({ textAlign: v })} 
              options={['left', 'center', 'right', 'justify']} />
            <PropInput label="Line Height" value={element.lineHeight} onChange={(v) => onUpdate({ lineHeight: v })} type="number" step={0.1} />
          </div>
          <div className="mt-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Color</label>
            <input type="color" value={element.color} onChange={(e) => onUpdate({ color: e.target.value })}
              className="w-full h-7 rounded border border-border cursor-pointer" />
          </div>
        </Section>
      )}

      {/* Media properties */}
      {(element.type === 'image' || element.type === 'video' || element.type === 'gif' || element.type === 'icon' || element.type === 'svg') && (
        <Section title="Media">
          <PropInput label="Source URL" value={element.src} onChange={(v) => onUpdate({ src: v })} type="text" />
          <PropSelect label="Fit" value={element.objectFit} onChange={(v) => onUpdate({ objectFit: v })}
            options={['cover', 'contain', 'fill', 'none']} />
          {element.type === 'video' && (
            <>
              <PropToggle label="Autoplay" checked={element.autoplay} onChange={(v) => onUpdate({ autoplay: v })} />
              <PropToggle label="Loop" checked={element.loop} onChange={(v) => onUpdate({ loop: v })} />
              <PropToggle label="Muted" checked={element.muted} onChange={(v) => onUpdate({ muted: v })} />
            </>
          )}
        </Section>
      )}

      {/* Shape properties */}
      {element.type === 'shape' && (
        <Section title="Shape">
          <PropSelect label="Type" value={element.shapeType} onChange={(v) => onUpdate({ shapeType: v })}
            options={['rectangle', 'roundedRect', 'circle', 'triangle', 'line']} />
          <div className="mt-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Fill</label>
            <input type="color" value={element.fill} onChange={(e) => onUpdate({ fill: e.target.value })}
              className="w-full h-7 rounded border border-border cursor-pointer" />
          </div>
          <div className="mt-2">
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Stroke</label>
            <div className="flex gap-2">
              <input type="color" value={element.stroke === 'transparent' ? '#000000' : element.stroke}
                onChange={(e) => onUpdate({ stroke: e.target.value })}
                className="flex-1 h-7 rounded border border-border cursor-pointer" />
              <PropInput label="" value={element.strokeWidth} onChange={(v) => onUpdate({ strokeWidth: v })} type="number" />
            </div>
          </div>
          <PropInput label="Radius" value={element.borderRadius} onChange={(v) => onUpdate({ borderRadius: v })} type="number" />
        </Section>
      )}

      {/* Shadow & Border */}
      <Section title="Shadow">
        <div className="grid grid-cols-2 gap-2">
          <PropInput label="X" value={element.shadowX} onChange={(v) => onUpdate({ shadowX: v })} type="number" />
          <PropInput label="Y" value={element.shadowY} onChange={(v) => onUpdate({ shadowY: v })} type="number" />
          <PropInput label="Blur" value={element.shadowBlur} onChange={(v) => onUpdate({ shadowBlur: v })} type="number" />
          <div>
            <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">Color</label>
            <input type="color" 
              value={element.shadowColor.startsWith('rgba') ? '#000000' : element.shadowColor} 
              onChange={(e) => onUpdate({ shadowColor: e.target.value })}
              className="w-full h-7 rounded border border-border cursor-pointer" />
          </div>
        </div>
      </Section>

      {/* Animation */}
      <Section title="Animation">
        <PropSelect label="Type" value={element.animationType} onChange={(v) => onUpdate({ animationType: v })}
          options={['none', 'fadeIn', 'slideUp', 'slideDown', 'slideLeft', 'slideRight', 'scaleIn', 'zoomIn', 'rotateIn', 'bounceIn']} />
        {element.animationType !== 'none' && (
          <>
            <div className="grid grid-cols-2 gap-2 mt-2">
              <PropInput label="Delay (ms)" value={element.animationDelay} onChange={(v) => onUpdate({ animationDelay: v })} type="number" />
              <PropInput label="Duration (ms)" value={element.animationDuration} onChange={(v) => onUpdate({ animationDuration: v })} type="number" />
            </div>
            <PropSelect label="Trigger" value={element.animationTrigger} onChange={(v) => onUpdate({ animationTrigger: v as any })}
              options={['enter', 'click', 'auto']} />
          </>
        )}
      </Section>
    </div>
  );
}

// Properties panel for the slide itself
function SlideProperties({ 
  slide, slideWidth, slideHeight, onUpdate, elementCount 
}: {
  slide: PresentationSlide;
  slideWidth: number;
  slideHeight: number;
  onUpdate: (updates: Partial<PresentationSlide>) => void;
  elementCount: number;
}) {
  return (
    <div className="p-3 space-y-4">
      <h3 className="text-xs font-bold text-text">Slide Properties</h3>
      <div className="text-[10px] text-text-muted">
        {elementCount} element{elementCount !== 1 ? 's' : ''}
      </div>

      <Section title="Transition">
        <PropSelect label="" value={slide.transition} onChange={(v) => onUpdate({ transition: v as any })}
          options={['fade', 'slide', 'push', 'zoom', 'none']} />
      </Section>

      <Section title="Notes">
        <textarea
          value={slide.notes}
          onChange={(e) => onUpdate({ notes: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-text resize-none"
          rows={4}
          placeholder="Speaker notes..."
        />
      </Section>

      <Section title="Label">
        <input
          value={slide.label || ''}
          onChange={(e) => onUpdate({ label: e.target.value })}
          className="w-full px-3 py-2 bg-background border border-border rounded-lg text-xs text-text"
          placeholder="Section label..."
        />
      </Section>
    </div>
  );
}

// Reusable section wrapper
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );
}

// Reusable property input
function PropInput({ label, value, onChange, type = 'text', step, min, max }: {
  label: string;
  value: number | string;
  onChange: (v: any) => void;
  type?: string;
  step?: number;
  min?: number;
  max?: number;
}) {
  return (
    <div>
      {label && <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">{label}</label>}
      <input
        type={type}
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => onChange(type === 'number' ? parseFloat(e.target.value) || 0 : e.target.value)}
        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-text focus:outline-none focus:border-primary/50"
      />
    </div>
  );
}

// Reusable property select
function PropSelect({ label, value, onChange, options }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div>
      {label && <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1 block">{label}</label>}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-2.5 py-1.5 bg-background border border-border rounded-lg text-xs text-text focus:outline-none focus:border-primary/50"
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

// Reusable property toggle
function PropToggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <label className="text-[10px] font-bold text-text-muted uppercase tracking-widest">{label}</label>
      <button
        onClick={() => onChange(!checked)}
        className={cn(
          "w-8 h-4.5 rounded-full transition-colors relative",
          checked ? 'bg-primary' : 'bg-white/10'
        )}
      >
        <div className={cn(
          "absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform",
          checked ? 'translate-x-4' : 'translate-x-0.5'
        )} />
      </button>
    </div>
  );
}
