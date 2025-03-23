import { useState, useEffect } from 'react';

export default function FilterPanel({ onFilterChange, initialFilters = {}, onClose }) {
  const [filters, setFilters] = useState({
    filename: initialFilters.filename || '',
    dateRange: initialFilters.dateRange || { start: '', end: '' },
    fileType: initialFilters.fileType || []
  });
  
  // 文件类型选项
  const fileTypes = [
    { value: 'image/jpeg', label: 'JPEG 图片' },
    { value: 'image/png', label: 'PNG 图片' },
    { value: 'image/gif', label: 'GIF 图片' },
    { value: 'image/webp', label: 'WebP 图片' }
  ];
  
  // 当筛选器改变时触发回调
  useEffect(() => {
    // 构建实际筛选条件，删除空值
    const activeFilters = {};
    
    if (filters.filename) activeFilters.filename = filters.filename;
    
    if (filters.dateRange.start || filters.dateRange.end) {
      activeFilters.dateRange = filters.dateRange;
    }
    
    if (filters.fileType && filters.fileType.length > 0) {
      activeFilters.fileType = filters.fileType;
    }
    
    onFilterChange(activeFilters);
  }, [filters]);
  
  // 处理输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };
  
  // 处理日期范围变化
  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      dateRange: {
        ...prev.dateRange,
        [name]: value
      }
    }));
  };
  
  // 处理文件类型变化
  const handleFileTypeChange = (type) => {
    setFilters(prev => {
      const newFileTypes = prev.fileType.includes(type)
        ? prev.fileType.filter(t => t !== type)
        : [...prev.fileType, type];
      
      return { ...prev, fileType: newFileTypes };
    });
  };
  
  // 清除所有筛选器
  const handleClearFilters = () => {
    setFilters({
      filename: '',
      dateRange: { start: '', end: '' },
      fileType: []
    });
  };
  
  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="font-medium text-gray-700">筛选图片</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="space-y-4">
        {/* 文件名筛选 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            文件名包含
          </label>
          <input
            type="text"
            name="filename"
            value={filters.filename}
            onChange={handleInputChange}
            placeholder="输入关键词..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        {/* 上传日期范围 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            上传日期范围
          </label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-gray-500">开始日期</label>
              <input
                type="date"
                name="start"
                value={filters.dateRange.start}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">结束日期</label>
              <input
                type="date"
                name="end"
                value={filters.dateRange.end}
                onChange={handleDateRangeChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>
        
        {/* 文件类型 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            文件类型
          </label>
          <div className="space-y-2">
            {fileTypes.map(type => (
              <label key={type.value} className="flex items-center">
                <input
                  type="checkbox"
                  checked={filters.fileType.includes(type.value)}
                  onChange={() => handleFileTypeChange(type.value)}
                  className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{type.label}</span>
              </label>
            ))}
          </div>
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-between pt-2 border-t">
          <button
            type="button"
            onClick={handleClearFilters}
            className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
          >
            清除筛选
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            应用
          </button>
        </div>
      </div>
    </div>
  );
} 