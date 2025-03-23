import { useState } from 'react';
import Image from 'next/image';
import { removeFromLibrary } from '../../utils/libraryStorage';
import ImageDetails from './ImageDetails';

export default function GalleryItem({ item, onSelect, onPreview, onShip }) {
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  // 格式化日期
  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('zh-CN', { 
        year: 'numeric', 
        month: '2-digit', 
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '未知日期';
    }
  };
  
  // 格式化文件大小
  const formatFileSize = (bytes) => {
    if (!bytes || isNaN(bytes)) return '未知大小';
    
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };
  
  // 处理删除
  const handleDelete = (e) => {
    e.stopPropagation();
    
    if (confirm('确定要从图库中删除此图片吗？')) {
      removeFromLibrary(item.id);
      
      // 触发更新事件，通知Gallery组件刷新
      window.dispatchEvent(new Event('storage'));
    }
  };
  
  // 使用文件名或截取cont_sign作为显示名称
  const displayName = item.filename || 
    (item.cont_sign ? `图片_${item.cont_sign.substring(0, 8)}...` : `图片_${item.id.substring(4, 12)}`);
  
  // 添加URL处理逻辑
  const getImageUrl = (item) => {
    return item.src || item.bosUrl || item.imageUrl || null;
  };
  
  // 在组件中使用
  const imageUrl = getImageUrl(item);
  
  return (
    <div className="relative group">
      <div 
        className="border border-gray-200 rounded-lg overflow-hidden bg-gray-50 aspect-square relative cursor-pointer"
        onClick={onPreview}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {item.thumbnailUrl || item.imageUrl || item.bosUrl ? (
          <Image
            src={item.thumbnailUrl || item.imageUrl || item.bosUrl}
            alt={item.filename || 'Gallery image'}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
            className="object-contain"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* 操作按钮容器 */}
        <div className={`absolute bottom-0 right-0 p-1 flex space-x-1 bg-white bg-opacity-80 rounded-tl-md transition-all ${isHovered ? 'opacity-100' : 'opacity-0'}`}>
          {/* 现有的详情按钮 */}
          <button
            className="p-1 text-gray-600 hover:text-blue-600 bg-white rounded-full hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(true);
            }}
            title="详情"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </button>
          
          {/* 新增的发货按钮 */}
          <button
            className="p-1 text-gray-600 hover:text-indigo-600 bg-white rounded-full hover:bg-indigo-50"
            onClick={(e) => {
              e.stopPropagation();
              onShip && onShip(item);
            }}
            title="发货"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
            </svg>
          </button>
          
          {/* 现有的使用按钮 */}
          <button
            className="p-1 text-gray-600 hover:text-green-600 bg-white rounded-full hover:bg-green-50"
            onClick={(e) => {
              e.stopPropagation();
              onSelect && onSelect(item);
            }}
            title="使用此图片"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
          </button>
        </div>
      </div>
      
      {showDetails && (
        <ImageDetails 
          item={item} 
          onClose={() => setShowDetails(false)}
          onSelect={onSelect}
        />
      )}
    </div>
  );
} 