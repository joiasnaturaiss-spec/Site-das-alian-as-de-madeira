import React, { useEffect, useRef } from 'react';
import { useEditor } from '../context/EditorContext';
import { useConfig } from '../context/ConfigContext';
import { cn } from '../lib/utils';
import { ElementConfig } from '../types';

interface EditableProps {
  id: string;
  type: ElementConfig['type'];
  children?: React.ReactNode;
  className?: string;
  content?: string;
  src?: string;
  initialStyles?: ElementConfig['styles'];
  as?: React.ElementType;
}

export function Editable({
  id,
  type,
  children,
  className,
  content,
  src,
  initialStyles = {},
  as: Component = 'div',
}: EditableProps) {
  const { isEditMode, selectedElementId, setSelectedElementId } = useEditor();
  const { config, registerElement, updateElementConfig, updateElementStyles } = useConfig();
  const elementRef = useRef<HTMLElement>(null);

  const elementConfig = config.elements[id];
  const isSelected = selectedElementId === id;

  const initialStylesJSON = JSON.stringify(initialStyles);
  const childrenString = typeof children === 'string' ? children : '';

  useEffect(() => {
    registerElement(id, {
      id,
      type,
      content: content || (childrenString ? childrenString : undefined),
      src,
      styles: JSON.parse(initialStylesJSON),
    });
  }, [id, type, content, src, initialStylesJSON, registerElement, childrenString]);

  const styles = elementConfig?.styles || initialStyles;
  const currentContent = elementConfig?.content ?? content;
  const currentSrc = elementConfig?.src ?? src;

  const handleClick = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    e.stopPropagation();
    setSelectedElementId(id);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    if (!isEditMode) return;
    
    // For text, let native text selection/editing run normally,
    // unless they click outside active content area.
    if (type === 'text' && document.activeElement === e.currentTarget) {
      return; 
    }
    
    // Disable native img drag ghosts or text selections
    if (type === 'image') {
      e.preventDefault();
    }
    e.stopPropagation();
    setSelectedElementId(id);
    
    const startX = e.clientX;
    const startY = e.clientY;
    const origX = styles.x || 0;
    const origY = styles.y || 0;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const dx = moveEvent.clientX - startX;
      const dy = moveEvent.clientY - startY;
      updateElementStyles(id, {
        x: origX + dx,
        y: origY + dy,
      });
    };
    
    const handleMouseUp = () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLElement>) => {
    if (!isEditMode) return;
    if (type === 'text' && document.activeElement === e.currentTarget) {
      return;
    }
    
    e.stopPropagation();
    setSelectedElementId(id);
    
    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;
    const origX = styles.x || 0;
    const origY = styles.y || 0;
    
    const handleTouchMove = (moveEvent: TouchEvent) => {
      if (moveEvent.cancelable) {
        moveEvent.preventDefault();
      }
      const currentTouch = moveEvent.touches[0];
      const dx = currentTouch.clientX - startX;
      const dy = currentTouch.clientY - startY;
      updateElementStyles(id, {
        x: origX + dx,
        y: origY + dy,
      });
    };
    
    const handleTouchEnd = () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
    
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
  };

  const handleBlur = (e: React.FocusEvent<HTMLElement>) => {
    if (type === 'text' && isEditMode) {
      updateElementConfig(id, { content: e.currentTarget.innerText });
    }
  };

  const inlineStyles: React.CSSProperties = {
    transform: `translate(${styles.x || 0}px, ${styles.y || 0}px) scale(${styles.scale || 1}) rotate(${styles.rotate || 0}deg)`,
    width: styles.width,
    height: styles.height,
    fontSize: styles.fontSize,
    fontWeight: styles.fontWeight,
    lineHeight: styles.lineHeight,
    letterSpacing: styles.letterSpacing,
    color: styles.color,
    backgroundColor: styles.backgroundColor,
    borderColor: styles.borderColor,
    borderWidth: styles.borderWidth,
    borderRadius: styles.borderRadius,
    boxShadow: styles.boxShadow,
    opacity: styles.opacity,
    padding: styles.padding,
    margin: styles.margin,
    textAlign: styles.textAlign,
    filter: styles.filterBrightness !== undefined ? `brightness(${styles.filterBrightness})` : styles.filter,
    display: styles.display,
    gap: styles.gap,
    zIndex: styles.zIndex !== undefined ? styles.zIndex : (isSelected ? 50 : undefined),
    cursor: isEditMode ? 'grab' : undefined,
    position: (styles.x !== undefined || styles.y !== undefined || type === 'image') ? 'relative' : undefined,
    transition: isEditMode ? 'none' : 'all 0.3s ease',
  };

  if (type === 'image') {
    return (
      <img
        ref={elementRef as any}
        src={currentSrc}
        alt=""
        id={id}
        style={inlineStyles}
        className={cn(
          className,
          isEditMode && 'hover:outline-1 hover:outline-brand-lime/50 select-none touch-none',
          isSelected && 'outline-2 outline-brand-lime glow-green ring-4 ring-brand-lime/20 z-50'
        )}
        onClick={handleClick}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        draggable={false}
        referrerPolicy="no-referrer"
      />
    );
  }

  return (
    <Component
      ref={elementRef}
      id={id}
      style={inlineStyles}
      className={cn(
        className,
        isEditMode && 'hover:outline-1 hover:outline-brand-lime/50 transition-none select-none touch-none',
        isSelected && 'outline-2 outline-brand-lime glow-green ring-4 ring-brand-lime/20 z-50'
      )}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      contentEditable={isEditMode && type === 'text'}
      suppressContentEditableWarning={true}
      onBlur={handleBlur}
    >
      {type === 'text' ? currentContent : children}
    </Component>
  );
}
