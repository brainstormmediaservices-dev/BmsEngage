import { memo, useMemo } from 'react';
import { SlideElement, SlideBackground, PresentationSlide } from '../../services/presentationService';

interface SlideRendererProps {
  slide: PresentationSlide;
  slideWidth: number;
  slideHeight: number;
  isPresentMode?: boolean;
  activeAnimations?: Set<string>;
  onClickElement?: (elementId: string) => void;
  selectedElementId?: string | null;
}

function getAnimationStyle(el: SlideElement, isActive: boolean): React.CSSProperties {
  if (el.animationType === 'none' || !isActive) return {};
  const style: React.CSSProperties = {
    animationDelay: `${el.animationDelay}ms`,
    animationDuration: `${el.animationDuration}ms`,
    animationFillMode: 'both',
    animationTimingFunction: 'ease-out',
  };
  return style;
}

function getAnimationClass(el: SlideElement): string {
  if (el.animationType === 'none') return '';
  const map: Record<string, string> = {
    fadeIn: 'animate-fadeIn',
    slideUp: 'animate-slideUp',
    slideDown: 'animate-slideDown',
    slideLeft: 'animate-slideLeft',
    slideRight: 'animate-slideRight',
    scaleIn: 'animate-scaleIn',
    zoomIn: 'animate-zoomIn',
    rotateIn: 'animate-rotateIn',
    bounceIn: 'animate-bounceIn',
  };
  return map[el.animationType] || '';
}

function renderElement(el: SlideElement, scale: number, isPresent: boolean, isActive: boolean) {
  const baseStyle: React.CSSProperties = {
    position: 'absolute',
    left: el.x * scale,
    top: el.y * scale,
    width: el.width * scale,
    height: el.height * scale,
    transform: `rotate(${el.rotation}deg)`,
    opacity: el.opacity,
    zIndex: el.zIndex,
    display: el.visible ? 'block' : 'none',
    boxShadow: el.shadowBlur > 0 ? `${el.shadowX * scale}px ${el.shadowY * scale}px ${el.shadowBlur * scale}px ${el.shadowColor}` : undefined,
    border: el.borderWidth > 0 ? `${el.borderWidth * scale}px ${el.borderStyle} ${el.borderColor}` : undefined,
  };

  const animStyle = getAnimationStyle(el, isActive);
  const animClass = getAnimationClass(el);

  switch (el.type) {
    case 'text':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group'}
            ${isPresent ? '' : 'hover:outline hover:outline-1 hover:outline-white/50'}
            ${isPresent ? '' : el.locked ? 'cursor-default' : 'cursor-move'}`}
          style={{
            ...baseStyle,
            ...animStyle,
            fontSize: el.fontSize * scale,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            fontStyle: el.fontStyle,
            textDecoration: el.textDecoration,
            color: el.color,
            textAlign: el.textAlign as any,
            lineHeight: el.lineHeight,
            letterSpacing: el.letterSpacing * scale,
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            overflow: 'hidden',
            borderRadius: el.borderRadius * scale,
          }}
        >
          {el.content}
        </div>
      );

    case 'image':
    case 'gif':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'}`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
            overflow: 'hidden',
          }}
        >
          <img
            src={el.src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: el.objectFit as any }}
          />
        </div>
      );

    case 'video':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'}`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
            overflow: 'hidden',
          }}
        >
          <video
            src={el.src}
            poster={el.poster || undefined}
            autoPlay={isPresent && el.autoplay}
            loop={el.loop}
            muted={el.muted}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: el.objectFit as any }}
          />
        </div>
      );

    case 'shape':
      const shapeStyle: React.CSSProperties = {
        ...baseStyle,
        ...animStyle,
        backgroundColor: el.fill,
        border: el.borderWidth > 0 ? `${el.borderWidth * scale}px ${el.borderStyle} ${el.borderColor}` : 'none',
        borderRadius: el.shapeType === 'circle'
          ? '50%'
          : el.shapeType === 'roundedRect'
            ? `${el.borderRadius * scale}px`
            : '0',
      };
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'}`}
          style={shapeStyle}
        />
      );

    case 'icon':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'} flex items-center justify-center`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
          }}
        >
          <img
            src={el.src}
            alt=""
            draggable={false}
            style={{ width: '60%', height: '60%', objectFit: 'contain', filter: `drop-shadow(0 0 0 ${el.color})` }}
          />
        </div>
      );

    case 'embed':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'}`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
            overflow: 'hidden',
          }}
        >
          <iframe
            src={el.embedUrl}
            style={{ width: '100%', height: '100%', border: 'none' }}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>
      );

    case 'button':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'} flex items-center justify-center`}
          style={{
            ...baseStyle,
            ...animStyle,
            backgroundColor: el.buttonBg,
            color: el.buttonColor,
            borderRadius: el.buttonRadius * scale,
            fontSize: el.fontSize * scale,
            fontFamily: el.fontFamily,
            fontWeight: el.fontWeight,
            cursor: isPresent ? 'pointer' : 'default',
          }}
        >
          {el.buttonLabel}
        </div>
      );

    case 'svg':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'}`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
          }}
        >
          <img
            src={el.src}
            alt=""
            draggable={false}
            style={{ width: '100%', height: '100%', objectFit: el.objectFit as any }}
          />
        </div>
      );

    case 'lottie':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'}`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
          }}
        >
          <img
            src={el.src || 'https://lottie.host/empty.json'}
            alt=""
            style={{ width: '100%', height: '100%', objectFit: el.objectFit as any }}
          />
        </div>
      );

    case 'chart':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'} flex items-center justify-center`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
            backgroundColor: 'rgba(255,255,255,0.05)',
            color: '#fff',
            fontSize: 14 * scale,
          }}
        >
          Chart: {el.chartType}
        </div>
      );

    case 'audio':
      return (
        <div
          key={el._id || el.zIndex}
          className={`${animClass} ${isPresent ? '' : 'group hover:outline hover:outline-1 hover:outline-white/50'} flex items-center justify-center`}
          style={{
            ...baseStyle,
            ...animStyle,
            borderRadius: el.borderRadius * scale,
            backgroundColor: 'rgba(255,255,255,0.05)',
          }}
        >
          {isPresent ? (
            <audio src={el.src} autoPlay={el.autoplay} loop={el.loop} controls style={{ width: '80%' }} />
          ) : (
            <span style={{ color: '#fff', fontSize: 12 * scale }}>Audio: {el.src.split('/').pop()}</span>
          )}
        </div>
      );

    default:
      return null;
  }
}

function renderBackground(bg: SlideBackground | undefined, slideWidth: number, slideHeight: number, scale: number): React.ReactNode {
  if (!bg || bg.type === 'none') return null;

  const style: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    opacity: bg.opacity,
  };

  switch (bg.type) {
    case 'color':
      return <div style={{ ...style, backgroundColor: bg.value }} />;
    case 'image':
      return (
        <div style={{ ...style, backgroundImage: `url(${bg.value})`, backgroundSize: 'cover', backgroundPosition: 'center', filter: `blur(${bg.blur}px) brightness(${bg.brightness}%)` }} />
      );
    case 'video':
      return (
        <div style={style}>
          <video
            src={bg.value}
            autoPlay={bg.videoAutoplay}
            loop={bg.videoLoop}
            muted={bg.videoMuted}
            playsInline
            style={{ width: '100%', height: '100%', objectFit: 'cover', filter: `blur(${bg.blur}px) brightness(${bg.brightness}%)` }}
          />
        </div>
      );
    case 'gradient':
      return <div style={{ ...style, background: bg.value }} />;
    default:
      return null;
  }
}

const SlideRenderer = memo(function SlideRenderer({
  slide,
  slideWidth,
  slideHeight,
  isPresentMode = false,
  activeAnimations,
  onClickElement,
  selectedElementId,
}: SlideRendererProps) {
  const scale = 1;

  const sortedElements = useMemo(() => {
    return [...(slide.elements || [])].sort((a, b) => a.zIndex - b.zIndex);
  }, [slide.elements]);

  return (
    <div
      className="relative overflow-hidden"
      style={{
        width: slideWidth,
        height: slideHeight,
        backgroundColor: '#1a1a2e',
      }}
    >
      {renderBackground(slide.background, slideWidth, slideHeight, scale)}

      {sortedElements.map((el) => {
        const isActive = !activeAnimations || activeAnimations.has(el._id || '');
        return (
          <div
            key={el._id || `el-${el.zIndex}-${el.x}-${el.y}`}
            onClick={isPresentMode && onClickElement ? () => onClickElement(el._id || '') : undefined}
          >
            {renderElement(el, scale, isPresentMode, isActive)}
          </div>
        );
      })}
    </div>
  );
});

export default SlideRenderer;
