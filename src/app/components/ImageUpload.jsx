'use client';

import { useRef, useState, useEffect } from 'react';
import Image from 'next/image';

export default function ImageUpload({ onImageUpload, onSearch, hasImage }) {
  const [preview, setPreview] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  const dropAreaRef = useRef(null);

  // 支持的文件格式
  const supportedFormats = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif', 'image/bmp'];
  
  // 修改粘贴事件监听器
  useEffect(() => {
    const handlePaste = async (e) => {
      // 检查是否在输入框中粘贴
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
        return;
      }

      const items = e.clipboardData.items;
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          e.preventDefault(); // 阻止默认粘贴行为
          const file = items[i].getAsFile();
          
          try {
            // 先清理旧的预览
            if (preview) {
              URL.revokeObjectURL(preview);
              setPreview(null);
            }
            
            // 重置所有状态
            setIsUploading(false);
            await onImageUpload(null);
            
            // 创建新的预览并处理上传
            const previewUrl = URL.createObjectURL(file);
            setPreview(previewUrl);
            await processUploadedFile(file, true);
          } catch (error) {
            console.error('处理粘贴图片失败:', error);
            if (preview) {
              URL.revokeObjectURL(preview);
              setPreview(null);
            }
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [preview, onImageUpload]); // 添加依赖项
  
  // 处理上传的文件
  const processUploadedFile = async (file, autoSearch = false) => {
    if (!file) return;
    
    try {
      setIsUploading(true);
      
      // 检查文件类型
      if (!supportedFormats.includes(file.type)) {
        alert('不支持的文件格式，请上传 JPG, PNG, WEBP, GIF 或 BMP 图片');
        return;
      }

      // 创建预览URL
      const previewUrl = URL.createObjectURL(file);
      setPreview(previewUrl);
      
      // 调用上传回调
      await onImageUpload(file, autoSearch);
      
      // 如果是自动搜索，显示提示
      if (autoSearch) {
        showAutoSearchToast();
      }
    } catch (error) {
      console.error('处理图片失败:', error);
      alert('上传图片失败，请重试');
    } finally {
      setIsUploading(false);
    }
  };

  // 显示自动搜索提示
  const showAutoSearchToast = () => {
    const toastContainer = document.createElement('div');
    toastContainer.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-md shadow-lg z-50';
    toastContainer.innerHTML = `
      <div class="flex items-center">
        <svg class="w-5 h-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
        已粘贴图片并自动开始搜索...
      </div>
    `;
    document.body.appendChild(toastContainer);
    setTimeout(() => {
      toastContainer.style.opacity = '0';
      setTimeout(() => toastContainer.remove(), 300);
    }, 3000);
  };
  
  // 处理文件选择
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedFile(e.target.files[0]);
    }
  };

  // 处理拖拽相关事件
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };
  
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };
  
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const dt = e.dataTransfer;
    const file = dt.files[0];
    processUploadedFile(file);
  };

  // 清理预览URL
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
        setPreview(null);
      }
    };
  }, [preview]);

  // 同步预览状态
  useEffect(() => {
    if (!hasImage && preview) {
      URL.revokeObjectURL(preview);
      setPreview(null);
    }
  }, [hasImage, preview]);

  return (
    <div className="h-full" ref={dropAreaRef}>
      <div 
        className={`border border-dashed rounded-lg text-center cursor-pointer transition-all h-full flex items-center justify-center ${
          isDragging 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
        }`}
        onClick={() => fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {preview ? (
          <div className="relative w-full h-full">
            <Image 
              src={preview} 
              alt="上传预览" 
              fill 
              className="object-contain p-3" 
              unoptimized={true}
              priority
            />
            <button 
              className="absolute top-2 right-2 bg-white bg-opacity-80 text-gray-600 rounded-full p-1 hover:bg-opacity-100 transition shadow-sm"
              onClick={async (e) => {
                e.stopPropagation();
                // 清理预览URL
                if (preview) {
                  URL.revokeObjectURL(preview);
                }
                setPreview(null);
                setIsUploading(false); // 重置上传状态
                // 通知父组件清理图片并触发搜索更新
                await onImageUpload(null);
                if (onSearch) {
                  await onSearch(null);
                }
              }}
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : (
          <div className="p-6 text-center">
            <svg className="h-10 w-10 mx-auto text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="mt-3 text-sm text-gray-600">
              点击或拖拽图片到此处上传
            </p>
            <p className="mt-1 text-xs text-gray-400">
              支持 JPG, PNG, WEBP, GIF, BMP 格式
            </p>
            <p className="mt-3 text-xs text-gray-400 flex items-center justify-center">
              <svg className="w-4 h-4 mr-1 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              可直接粘贴 (Ctrl+V)
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/png,image/jpg,image/webp,image/gif,image/bmp"
          onChange={handleFileChange}
        />
      </div>
      {isUploading && (
        <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      )}
    </div>
  );
} 