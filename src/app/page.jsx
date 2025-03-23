'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import ImageUpload from './components/ImageUpload';
import ResultGrid from './components/ResultGrid';
import SearchControls from './components/SearchControls';
import Gallery from './components/ImageLibrary/Gallery';
import Header from './components/Header';
import { addToLibrary } from './utils/libraryStorage';
import ShipmentList from './components/ShipmentManagement/ShipmentList';
import imageCompression from 'browser-image-compression';

export default function Home() {
  const [uploadedImage, setUploadedImage] = useState(null);
  const [searchResults, setSearchResults] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // 'search' or 'library' or 'shipment'

  // 响应式布局检测
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };
    
    // 初始检查
    checkIfMobile();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', checkIfMobile);
    
    // 清理函数
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  const handleImageUpload = async (file, autoSearch = false) => {
    if (!file) {
      setUploadedImage(null); // 清除已上传的图片
      setError('');
      return;
    }

    try {
      // 如果已有图片，先清除
      if (uploadedImage) {
        console.log('【前端】替换已上传的图片:', {
          原图片: uploadedImage.name,
          新图片: file.name
        });
      }
      
      // 设置上传的图片
      setUploadedImage(file);
      setError('');
      setSearchResults([]); // 清除之前的搜索结果

      // 如果是自动搜索（粘贴），直接搜索
      if (autoSearch) {
        handleSearch(file);
      }
    } catch (error) {
      console.error('处理图片文件失败:', error);
      setError('处理图片文件失败，请重试');
      setUploadedImage(null);
    }
  };

  const handleAddToLibrary = async () => {
    try {
      console.log('【前端】开始添加图片到图库');
      
      if (!uploadedImage) {
        console.error('【前端】错误: 未选择图片');
        alert('请先选择图片');
        return;
      }

      console.log('【前端】准备上传图片:', {
        文件名: uploadedImage.name,
        大小: `${(uploadedImage.size / 1024 / 1024).toFixed(2)}MB`,
        类型: uploadedImage.type
      });

      setIsLoading(true);
      const formData = new FormData();
      formData.append('image', uploadedImage);

      console.log('【前端】发送添加请求');
      const response = await fetch('/api/baidu/add', {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      console.log('【前端】收到服务器响应:', {
        状态码: response.status,
        成功: data.success,
        消息: data.message,
        图片签名: data.cont_sign,
        存储URL: data.bosUrl
      });

      if (!response.ok) {
        throw new Error(data.error || '添加失败');
      }

      console.log('【前端】图片添加成功:', {
        是否已存在: data.isExisting,
        是否压缩: data.isCompressed,
        文件名: data.filename,
        文件大小: `${(data.filesize / 1024 / 1024).toFixed(2)}MB`,
        存储位置: data.bosKey,
        图库ID: data.cont_sign.replace(',', '_')
      });

      // 使用新的图库API保存图片数据到服务器
      if (data.success) {
        const galleryItem = {
          id: data.cont_sign.replace(',', '_'),
          bosUrl: data.bosUrl,
          imageUrl: data.imageUrl,
          thumbnailUrl: data.imageUrl, 
          filename: data.filename,
          filesize: data.filesize,
          dateAdded: new Date().toISOString(),
          cont_sign: data.cont_sign,
          bosKey: data.bosKey,
          imageType: uploadedImage.type
        };
        
        try {
          // 保存到服务器端图库
          await fetch('/api/gallery', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(galleryItem)
          });
          
          // 通知Gallery组件刷新
          window.dispatchEvent(new CustomEvent('refresh_gallery'));
        } catch (galleryError) {
          console.error('保存到图库失败:', galleryError);
        }
      }

      setSuccessMessage('图片已成功添加到图库！');
      
      // 3秒后自动清除成功消息
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
    } catch (error) {
      console.error('【前端】添加失败:', {
        错误类型: error.name,
        错误信息: error.message,
        堆栈: error.stack
      });
      setError(error.message || '添加到图库失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 替换原有的压缩函数
  const compressImage = async (file, maxSizeMB) => {
    try {
      console.log('【前端】开始压缩图片:', {
        原始大小: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        目标大小: `${maxSizeMB}MB`,
        文件类型: file.type
      });

      const options = {
        maxSizeMB: maxSizeMB,
        maxWidthOrHeight: 1024,
        useWebWorker: true,
        fileType: file.type
      };

      const compressedFile = await imageCompression(file, options);

      console.log('【前端】压缩完成:', {
        压缩前: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        压缩后: `${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`,
        压缩率: `${((1 - compressedFile.size / file.size) * 100).toFixed(1)}%`
      });

      return compressedFile;
    } catch (error) {
      console.error('【前端】图片压缩失败:', error);
      throw new Error('图片压缩失败');
    }
  };

  const handleSearch = async (file) => {
    if (!file && !uploadedImage) {
      setError('请先上传图片文件');
      return;
    }

    setIsLoading(true);
    setError('');
    
    try {
      const searchFile = file || uploadedImage;
      // 创建 FormData
      const formData = new FormData();
      formData.append('image', searchFile);
      formData.append('mode', 'search');
      
      const response = await fetch('/api/baidu/search', {
        method: 'POST',
        body: formData,
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || '搜索失败');
      }
      
      setSearchResults(data.results || []);
      
      if (!data.results?.length) {
        setError('未找到相似图片，请尝试其他图片或先添加图片到库中');
      }
    } catch (error) {
      console.error('搜索失败:', error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleSelectFromLibrary = (item) => {
    // 这里使用fetch获取图片内容，然后转换为File对象
    if (item && item.bosUrl) {
      setIsLoading(true);
      
      fetch(item.bosUrl)
        .then(response => response.blob())
        .then(blob => {
          // 创建File对象
          const file = new File([blob], item.filename || 'image.jpg', { type: blob.type });
          handleImageUpload(file);
          
          // 切换到搜索标签
          setActiveTab('search');
        })
        .catch(err => {
          console.error('从图库选择图片失败:', err);
          setError('加载图片失败');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  };

  return (
    <main className="h-screen flex flex-col bg-gray-50">
      <Header activeTab={activeTab} onTabChange={setActiveTab} />
      
      <div className="flex-grow p-4 sm:p-6 overflow-hidden">
        {activeTab === 'search' ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full">
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex flex-col h-[calc(100vh-160px)] lg:h-auto">
              <h2 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                图片上传
              </h2>
              
              <div className="flex-grow mb-3">
                <ImageUpload 
                  onImageUpload={handleImageUpload} 
                  onSearch={handleSearch}
                  hasImage={!!uploadedImage} 
                />
              </div>
              
              <div>
                <SearchControls 
                  onAddToLibrary={handleAddToLibrary} 
                  onSearch={handleSearch} 
                  isLoading={isLoading} 
                />
                
                {error && (
                  <div className="mt-2 p-2 bg-red-50 text-red-600 text-sm rounded-md">
                    {error}
                  </div>
                )}
              </div>
            </div>
            
            <div className="bg-white border border-gray-100 rounded-lg shadow-sm lg:col-span-2 p-4 flex flex-col h-[calc(100vh-160px)] lg:h-[calc(100vh-160px)] overflow-hidden">
              <h2 className="text-base font-medium text-gray-700 mb-3 flex items-center">
                <svg className="w-4 h-4 mr-2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                搜索结果
              </h2>
              <div className="flex-grow overflow-auto pr-1">
                {!isLoading && !searchResults && (
                  <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                    <div className="bg-gray-50 rounded-full p-6 mb-4">
                      <svg className="w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" 
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-600 mb-2">尚未找到相似结果</h3>
                    <p className="text-sm text-gray-500">上传图片并点击"以图搜图"按钮</p>
                  </div>
                )}
                <ResultGrid results={searchResults} isLoading={isLoading} isMobile={isMobile} />
              </div>
            </div>
          </div>
        ) : activeTab === 'library' ? (
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm w-full h-full p-4 overflow-auto">
            <Gallery onSelectImage={handleSelectFromLibrary} />
          </div>
        ) : (
          <div className="bg-white border border-gray-100 rounded-lg shadow-sm w-full h-full p-4 overflow-auto">
            <ShipmentList />
          </div>
        )}
      </div>
      
      {/* 添加成功消息提示 */}
      {successMessage && (
        <div className="fixed top-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg animate-fade-in-out">
          <div className="flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}
      
      <footer className="py-2 text-center text-gray-500 text-xs border-t border-gray-200">
        <p>YnnAI独立开发 © {new Date().getFullYear()}</p>
      </footer>
    </main>
  );
} 