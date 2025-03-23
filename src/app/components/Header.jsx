import React from 'react';
import Image from 'next/image';

export default function Header({ activeTab, onTabChange }) {
  return (
    <header className="bg-white border-b border-gray-200 px-5 py-4 shadow-sm">
      <div className="max-w-full mx-auto flex items-center relative">
        {/* 左侧品牌区域 */}
        <div className="flex items-center">
          <Image
            src="/favicon.ico"
            alt="Logo"
            width={32}
            height={32}
            className="mr-3"
          />
          <div className="flex flex-col">
            <h1 className="text-xl font-bold text-gray-800 leading-tight">
              YnnAI Product Library
            </h1>
            <p className="text-xs text-gray-500 -mt-1">
              商品图库管理系统
            </p>
          </div>
        </div>

        {/* 中间导航按钮 - 居中显示, 增加宽度 */}
        <div className="absolute left-1/2 transform -translate-x-1/2 w-full max-w-3xl">
          <div className="flex justify-center space-x-3 border border-gray-200 rounded-lg p-1.5 shadow-sm bg-gray-50">
            <button
              onClick={() => onTabChange('search')}
              className={`px-8 py-3 min-w-[140px] text-sm font-medium transition-all rounded-md flex items-center ${
                activeTab === 'search'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg
                className={`w-5 h-5 mr-3 ${
                  activeTab === 'search' ? 'text-white' : 'text-gray-500'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                  fill="currentColor"
                />
                <path
                  d="M8 14C9.10457 14 10 13.1046 10 12C10 10.8954 9.10457 10 8 10C6.89543 10 6 10.8954 6 12C6 13.1046 6.89543 14 8 14Z"
                  fill="currentColor"
                />
                <path
                  d="M16 14C17.1046 14 18 13.1046 18 12C18 10.8954 17.1046 10 16 10C14.8954 10 14 10.8954 14 12C14 13.1046 14.8954 14 16 14Z"
                  fill="currentColor"
                />
                <path
                  d="M8.5 15.5C7.5 16.3 7 17.42 7 18.5H9C9 18.1 9.25 17.75 9.57 17.5C10.07 17.1 10.73 16.9 11.43 16.9C12.13 16.9 12.78 17.1 13.29 17.5C13.6 17.75 13.85 18.1 13.85 18.5H15.85C15.85 17.42 15.35 16.3 14.35 15.5C13.72 14.97 12.95 14.6 12.07 14.47C12.05 14.47 12.02 14.46 12 14.46C11.98 14.46 11.95 14.47 11.93 14.47C11.05 14.6 10.28 14.97 9.65 15.5H8.5Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-left font-medium">智能搜索</span>
            </button>
            <button
              onClick={() => onTabChange('library')}
              className={`px-8 py-3 min-w-[140px] text-sm font-medium transition-all rounded-md flex items-center ${
                activeTab === 'library'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg
                className={`w-5 h-5 mr-3 ${
                  activeTab === 'library' ? 'text-white' : 'text-gray-500'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M4 6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V18C20 19.1046 19.1046 20 18 20H6C4.89543 20 4 19.1046 4 18V6Z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M10 9H7V15H10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M17 9H14L14 15H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M7 12H10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M14 12H17"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-left font-medium">商品图库</span>
            </button>
            <button
              onClick={() => onTabChange('shipment')}
              className={`px-8 py-3 min-w-[140px] text-sm font-medium transition-all rounded-md flex items-center ${
                activeTab === 'shipment'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <svg
                className={`w-5 h-5 mr-3 ${
                  activeTab === 'shipment' ? 'text-white' : 'text-gray-500'
                }`}
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z"
                  fill="currentColor"
                />
                <path
                  d="M12 15C14.21 15 16 13.21 16 11C16 8.79 14.21 7 12 7C9.79 7 8 8.79 8 11C8 13.21 9.79 15 12 15Z"
                  fill="currentColor"
                />
              </svg>
              <span className="text-left font-medium">发货管理</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
} 