import { useState, useEffect, useRef } from 'react';
import GalleryItem from './GalleryItem';
import FilterPanel from './FilterPanel';
import SortControls from './SortControls';
import ImagePreview from '../ImagePreview';
import axios from 'axios';

export default function Gallery({ onSelectImage }) {
  const [library, setLibrary] = useState([]);
  const [filteredLibrary, setFilteredLibrary] = useState([]);
  const [filters, setFilters] = useState({});
  const [sortConfig, setSortConfig] = useState({ field: 'dateAdded', ascending: false });
  const [isLoading, setIsLoading] = useState(true);
  const [view, setView] = useState('grid'); // 'grid' 或 'list'
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // 添加预览相关状态
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  
  // 添加选择模式状态
  const [selectMode, setSelectMode] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // 引用筛选面板
  const filterPanelRef = useRef(null);
  
  // 添加点击外部关闭筛选面板
  useEffect(() => {
    function handleClickOutside(event) {
      if (filterPanelRef.current && !filterPanelRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // 从服务器加载图库
  useEffect(() => {
    const loadLibrary = async () => {
      setIsLoading(true);
      try {
        // 使用文件存储API获取图库列表
        const response = await axios.get('/api/gallery');
        
        if (response.data.success) {
          const images = response.data.images;
          setLibrary(images);
          
          // 提取所有可用标签
          const tags = new Set();
          images.forEach(img => {
            if (img.tags && Array.isArray(img.tags)) {
              img.tags.forEach(tag => tags.add(tag));
            }
          });
          setAvailableTags(Array.from(tags));
          
          applyFiltersAndSort(images, filters, sortConfig);
        } else {
          console.error('加载图库失败:', response.data.message);
        }
      } catch (error) {
        console.error('获取图库列表错误:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadLibrary();
    
    // 添加刷新图库的事件监听器
    const handleRefresh = () => {
      loadLibrary();
    };
    
    window.addEventListener('refresh_gallery', handleRefresh);
    
    // 清理函数
    return () => {
      window.removeEventListener('refresh_gallery', handleRefresh);
    };
  }, []);
  
  // 应用筛选和排序
  const applyFiltersAndSort = (data, filterOptions, sortOptions) => {
    // 筛选逻辑
    let result = [...data];
    
    // 文本搜索筛选
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.filename && item.filename.toLowerCase().includes(term)) ||
        (item.bosKey && item.bosKey.toLowerCase().includes(term))
      );
    }
    
    // 标签筛选
    if (selectedTags.length > 0) {
      result = result.filter(item => 
        item.tags && selectedTags.every(tag => item.tags.includes(tag))
      );
    }
    
    // 基于文件名的筛选
    if (filterOptions.filename) {
      result = result.filter(item => 
        item.filename && item.filename.toLowerCase().includes(filterOptions.filename.toLowerCase())
      );
    }
    
    // 日期范围筛选
    if (filterOptions.dateRange) {
      const { start, end } = filterOptions.dateRange;
      if (start) {
        result = result.filter(item => new Date(item.dateAdded) >= new Date(start));
      }
      if (end) {
        result = result.filter(item => new Date(item.dateAdded) <= new Date(end));
      }
    }
    
    // 排序逻辑
    if (sortOptions.field) {
      result.sort((a, b) => {
        let valueA = a[sortOptions.field];
        let valueB = b[sortOptions.field];
        
        // 日期比较
        if (sortOptions.field === 'dateAdded') {
          valueA = new Date(valueA || 0).getTime();
          valueB = new Date(valueB || 0).getTime();
        }
        
        // 数字比较
        if (sortOptions.field === 'filesize') {
          valueA = Number(valueA || 0);
          valueB = Number(valueB || 0);
        }
        
        // 字符串比较
        if (typeof valueA === 'string' && typeof valueB === 'string') {
          return sortOptions.ascending 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        }
        
        // 数字比较
        return sortOptions.ascending ? valueA - valueB : valueB - valueA;
      });
    }
    
    setFilteredLibrary(result);
  };
  
  // 处理筛选变更
  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
    applyFiltersAndSort(library, newFilters, sortConfig);
  };
  
  // 处理排序变更
  const handleSortChange = (field, ascending) => {
    const newSortConfig = { field, ascending };
    setSortConfig(newSortConfig);
    applyFiltersAndSort(library, filters, newSortConfig);
  };
  
  // 处理图片预览
  const handlePreviewImage = (item) => {
    if (selectMode) {
      handleSelectItem(item);
    } else {
      setPreviewImage(item);
      setShowPreview(true);
    }
  };
  
  // 关闭预览
  const handleClosePreview = () => {
    setShowPreview(false);
  };
  
  // 处理搜索
  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    applyFiltersAndSort(library, filters, sortConfig);
  };
  
  // 处理标签选择
  const handleTagSelect = (tag) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };
  
  // 处理图片发货
  const handleShipImage = (item) => {
    if (selectMode) {
      handleSelectItem(item);
    } else {
      const imageWithTab = {...item, initialTab: 'delivery'};
      setPreviewImage(imageWithTab);
      setShowPreview(true);
    }
  };
  
  // 选择/取消选择图片
  const handleSelectItem = (item) => {
    if (selectedItems.some(i => i.id === item.id)) {
      setSelectedItems(selectedItems.filter(i => i.id !== item.id));
    } else {
      setSelectedItems([...selectedItems, item]);
    }
  };
  
  // 切换选择模式
  const toggleSelectMode = () => {
    if (selectMode) {
      // 如果退出选择模式，清除所有选中项
      setSelectedItems([]);
    }
    setSelectMode(!selectMode);
  };
  
  // 全选/取消全选
  const toggleSelectAll = () => {
    if (selectedItems.length === filteredLibrary.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems([...filteredLibrary]);
    }
  };
  
  // 批量删除选中图片
  const handleDeleteSelected = async () => {
    if (selectedItems.length === 0) return;
    
    try {
      setIsDeleteConfirmOpen(false);
      
      // 逐个删除选中图片
      for (const item of selectedItems) {
        await axios.delete(`/api/gallery?id=${item.id || item.cont_sign}`);
      }
      
      // 删除后刷新图库
      window.dispatchEvent(new CustomEvent('refresh_gallery'));
      
      // 清空选中项
      setSelectedItems([]);
      
      // 如果删除了所有图片，退出选择模式
      if (selectedItems.length === filteredLibrary.length) {
        setSelectMode(false);
      }
    } catch (error) {
      console.error('删除图片失败:', error);
      alert('删除图片时出现错误，请重试');
    }
  };
  
  // 添加批量标签功能
  const [showTagDialog, setShowTagDialog] = useState(false);
  const [newTag, setNewTag] = useState('');

  // 批量添加标签
  const handleAddTagToSelected = async () => {
    if (!newTag.trim() || selectedItems.length === 0) {
      setShowTagDialog(false);
      return;
    }
    
    try {
      // 为选中图片添加标签
      for (const item of selectedItems) {
        const tags = Array.isArray(item.tags) ? [...item.tags] : [];
        if (!tags.includes(newTag.trim())) {
          tags.push(newTag.trim());
        }
        
        // 更新图片元数据
        await axios.post('/api/gallery', {
          ...item,
          tags
        });
      }
      
      // 刷新图库
      window.dispatchEvent(new CustomEvent('refresh_gallery'));
      setShowTagDialog(false);
      setNewTag('');
      
    } catch (error) {
      console.error('添加标签失败:', error);
      alert('添加标签时出现错误，请重试');
    }
  };
  
  useEffect(() => {
    applyFiltersAndSort(library, filters, sortConfig);
  }, [searchTerm, selectedTags]);
  
  // 修复PDF导出功能
  const exportToPDF = async () => {
    try {
      setIsExporting(true);
      console.log('开始导出PDF...');
      
      // 动态导入jsPDF库，解决SSR兼容性问题
      const { jsPDF } = await import('jspdf');
      
      // 确保字体已加载
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });
      
      // 设置文档标题和创建时间
      const title = '图像库导出';
      const date = new Date().toLocaleDateString();
      doc.setFontSize(18);
      doc.text(title, 105, 15, { align: 'center' });
      doc.setFontSize(12);
      doc.text(`导出日期: ${date}`, 105, 25, { align: 'center' });
      
      // 计算每页可放几张图片
      const pageWidth = 210;  // A4宽度(mm)
      const pageHeight = 297; // A4高度(mm)
      const margin = 20;
      const imageWidth = 80;
      const imageHeight = 80;
      const imagesPerRow = Math.floor((pageWidth - 2 * margin) / imageWidth);
      const rowsPerPage = Math.floor((pageHeight - 40 - margin) / (imageHeight + 20));
      const imagesPerPage = imagesPerRow * rowsPerPage;
      
      let currentPage = 1;
      
      // 添加图片到PDF
      for (let i = 0; i < selectedImages.length; i++) {
        const image = selectedImages[i];
        
        // 计算当前图片在页面上的位置
        const pageIndex = Math.floor(i / imagesPerPage);
        if (pageIndex + 1 > currentPage) {
          doc.addPage();
          currentPage++;
        }
        
        const indexOnPage = i % imagesPerPage;
        const row = Math.floor(indexOnPage / imagesPerRow);
        const col = indexOnPage % imagesPerRow;
        
        const x = margin + col * imageWidth;
        const y = 40 + row * (imageHeight + 20);
        
        try {
          // 使用图片URL而不是二进制数据
          doc.addImage(
            image.url, 
            'JPEG', 
            x, 
            y, 
            imageWidth, 
            imageHeight
          );
          
          // 添加图片标题
          doc.setFontSize(10);
          doc.text(image.name || `图片 ${i+1}`, x + imageWidth / 2, y + imageHeight + 10, { 
            align: 'center',
            maxWidth: imageWidth
          });
        } catch (imgError) {
          console.error('添加图片到PDF时出错:', imgError);
          // 添加错误提示替代图片
          doc.setFillColor(240, 240, 240);
          doc.rect(x, y, imageWidth, imageHeight, 'F');
          doc.setFontSize(10);
          doc.text('图片加载失败', x + imageWidth / 2, y + imageHeight / 2, { align: 'center' });
        }
      }
      
      // 保存PDF文件
      doc.save('图像库导出.pdf');
      console.log('PDF导出完成');
      
      setIsExporting(false);
    } catch (error) {
      console.error('导出PDF失败:', error);
      alert('导出PDF失败，请重试: ' + (error.message || error));
      setIsExporting(false);
    }
  };
  
  return (
    <div className="w-full flex flex-col h-full">
      {/* 高级搜索和筛选工具栏 */}
      <div className="bg-white py-3 px-4 border-b space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            <h3 className="text-base font-medium text-gray-700 mr-2">我的图库</h3>
            <span className="text-sm text-gray-500">({filteredLibrary.length} 个项目)</span>
          </div>
          
          <div className="flex space-x-2">
            {/* 选择模式切换按钮 */}
            <button
              className={`px-3 py-1 text-sm border rounded flex items-center ${
                selectMode ? 'bg-indigo-50 text-indigo-600 border-indigo-300' : 'bg-white text-gray-600 border-gray-300'
              }`}
              onClick={toggleSelectMode}
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              {selectMode ? '退出选择' : '选择模式'}
            </button>
            
            {/* 选择模式下的操作按钮 */}
            {selectMode && (
              <>
                <button
                  className="px-3 py-1 text-sm border rounded flex items-center bg-white text-gray-600 border-gray-300"
                  onClick={toggleSelectAll}
                >
                  {selectedItems.length === filteredLibrary.length ? '取消全选' : '全选'}
                  {selectedItems.length > 0 && selectedItems.length < filteredLibrary.length && (
                    <span className="ml-1 text-xs">({selectedItems.length})</span>
                  )}
                </button>
                
                {/* 添加标签按钮 */}
                <button
                  className={`px-3 py-1 text-sm border rounded flex items-center ${
                    selectedItems.length > 0 
                      ? 'bg-green-50 text-green-600 border-green-300 hover:bg-green-100' 
                      : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                  onClick={() => selectedItems.length > 0 && setShowTagDialog(true)}
                  disabled={selectedItems.length === 0}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                  </svg>
                  添加标签
                </button>
                
                <button
                  className={`px-3 py-1 text-sm border rounded flex items-center ${
                    selectedItems.length > 0 
                      ? 'bg-red-50 text-red-600 border-red-300 hover:bg-red-100' 
                      : 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                  }`}
                  onClick={() => selectedItems.length > 0 && setIsDeleteConfirmOpen(true)}
                  disabled={selectedItems.length === 0}
                >
                  <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                  删除选中 ({selectedItems.length})
                </button>
              </>
            )}
            
            {/* 非选择模式下的视图切换和筛选按钮 */}
            {!selectMode && (
              <>
                {/* 视图切换 */}
                <div className="flex border border-gray-300 rounded overflow-hidden">
                  <button 
                    className={`px-3 py-1 text-sm ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'}`}
                    onClick={() => setView('grid')}
                  >
                    <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                    </svg>
                  </button>
                  <button 
                    className={`px-3 py-1 text-sm ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-600'}`}
                    onClick={() => setView('list')}
                  >
                    <svg className="w-4 h-4 inline-block" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                    </svg>
                  </button>
                </div>
                
                {/* 排序控件 */}
                <SortControls 
                  sortField={sortConfig.field} 
                  ascending={sortConfig.ascending} 
                  onSortChange={handleSortChange} 
                />
                
                {/* 筛选按钮 */}
                <div className="relative" ref={filterPanelRef}>
                  <button 
                    className={`px-3 py-1 text-sm border rounded ${isFilterOpen || Object.keys(filters).length > 0 ? 'bg-blue-50 text-blue-600 border-blue-300' : 'bg-white text-gray-600 border-gray-300'}`}
                    onClick={() => setIsFilterOpen(!isFilterOpen)}
                  >
                    <svg className="w-4 h-4 inline-block mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                    </svg>
                    筛选
                    {Object.keys(filters).length > 0 && (
                      <span className="ml-1 px-1.5 py-0.5 text-xs bg-blue-500 text-white rounded-full">
                        {Object.keys(filters).length}
                      </span>
                    )}
                  </button>
                  
                  {/* 筛选面板弹出层 */}
                  {isFilterOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-white border border-gray-200 rounded-lg shadow-lg z-10 animate-fadeIn">
                      <FilterPanel onFilterChange={handleFilterChange} initialFilters={filters} onClose={() => setIsFilterOpen(false)} />
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
        
        {/* 搜索框和标签筛选 */}
        <div className="flex flex-col space-y-2">
          <div className="relative">
            <input
              type="text"
              placeholder="搜索图片名称..."
              value={searchTerm}
              onChange={handleSearch}
              className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
          </div>
          
          {availableTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => handleTagSelect(tag)}
                  className={`px-2 py-1 text-xs rounded-full ${
                    selectedTags.includes(tag) 
                      ? 'bg-blue-100 text-blue-800 border border-blue-300' 
                      : 'bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200'
                  }`}
                >
                  {tag}
                  {selectedTags.includes(tag) && (
                    <span className="ml-1">✓</span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* 图库内容区域 */}
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
        </div>
      ) : filteredLibrary.length === 0 ? (
        <div className="flex-grow flex flex-col items-center justify-center text-gray-500 py-10">
          <svg className="w-16 h-16 mb-4 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-lg">暂无匹配的图片</p>
          <p className="text-sm mt-2">尝试调整筛选条件或上传新图片</p>
        </div>
      ) : (
        <div className="flex-grow overflow-auto p-2">
          {view === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {filteredLibrary.map(item => (
                <GalleryItem 
                  key={item.id} 
                  item={item}
                  onSelect={() => selectMode ? handleSelectItem(item) : onSelectImage && onSelectImage(item)}
                  onPreview={() => handlePreviewImage(item)}
                  onShip={() => handleShipImage(item)}
                  isSelected={selectedItems.some(i => i.id === item.id)}
                  selectMode={selectMode}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col divide-y">
              {filteredLibrary.map(item => (
                <div 
                  key={item.id}
                  className={`py-3 px-2 flex items-center hover:bg-gray-50 rounded ${
                    selectedItems.some(i => i.id === item.id) && 'bg-blue-50'
                  }`}
                >
                  {/* 选择框 */}
                  {selectMode && (
                    <div className="mr-2 flex-shrink-0">
                      <input
                        type="checkbox"
                        checked={selectedItems.some(i => i.id === item.id)}
                        onChange={() => handleSelectItem(item)}
                        className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                    </div>
                  )}
                  
                  <div className="w-16 h-16 relative mr-3 flex-shrink-0">
                    {item.thumbnailUrl || item.imageUrl || item.bosUrl ? (
                      <img 
                        src={item.thumbnailUrl || item.imageUrl || item.bosUrl}
                        alt={item.filename || 'Gallery image'}
                        className="w-full h-full object-contain"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" 
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div className="flex-grow">
                    <div className="font-medium truncate">{item.filename || '未命名文件'}</div>
                    <div className="text-xs text-gray-500">
                      {item.dateAdded && new Date(item.dateAdded).toLocaleDateString('zh-CN')}
                      {item.filesize && ` • ${(item.filesize / 1024 / 1024).toFixed(2)}MB`}
                    </div>
                  </div>
                  <div className="flex space-x-2 ml-2">
                    {!selectMode && (
                      <>
                        <button
                          onClick={() => handlePreviewImage(item)}
                          className="p-1.5 text-gray-600 hover:text-blue-600 rounded hover:bg-blue-50"
                          title="预览"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleShipImage(item)}
                          className="p-1.5 text-gray-600 hover:text-indigo-600 rounded hover:bg-indigo-50"
                          title="发货"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8" />
                          </svg>
                        </button>
                        <button
                          onClick={() => onSelectImage && onSelectImage(item)}
                          className="p-1.5 text-gray-600 hover:text-green-600 rounded hover:bg-green-50"
                          title="使用此图片"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                          </svg>
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {/* 图片预览模态窗口 */}
      {showPreview && previewImage && (
        <ImagePreview 
          imageUrl={previewImage.bosUrl || previewImage.imageUrl}
          onClose={handleClosePreview}
          alt={previewImage.filename || '图片预览'}
          imageData={previewImage}
          initialTab={previewImage.initialTab || 'preview'}
        />
      )}
      
      {/* 删除确认对话框 */}
      {isDeleteConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 max-w-md w-full animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 mb-3">确认删除</h3>
            <p className="text-gray-700 mb-4">
              您确定要删除选中的 {selectedItems.length} 张图片吗？此操作不可恢复。
            </p>
            <div className="flex justify-end space-x-3">
              <button
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setIsDeleteConfirmOpen(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                onClick={handleDeleteSelected}
              >
                确认删除
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* 批量添加标签对话框 */}
      {showTagDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-5 max-w-md w-full animate-fadeIn">
            <h3 className="text-lg font-medium text-gray-900 mb-3">为选中图片添加标签</h3>
            
            <div className="flex flex-col space-y-2">
              <div className="relative">
                <input
                  type="text"
                  placeholder="输入新标签..."
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="w-full px-3 py-2 pl-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-4">
              <button
                className="px-4 py-2 text-sm text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50"
                onClick={() => setShowTagDialog(false)}
              >
                取消
              </button>
              <button
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                onClick={handleAddTagToSelected}
              >
                添加标签
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 