import { NextResponse } from 'next/server';
import axios from 'axios';
import { getAccessToken } from '../../../utils/baiduApi';

// 列出所有图片的API端点
export async function GET(request) {
  try {
    // 获取查询参数
    const { searchParams } = new URL(request.url);
    const start = parseInt(searchParams.get('start') || '0');
    const count = parseInt(searchParams.get('count') || '100');
    
    // 获取访问令牌
    const accessToken = await getAccessToken();
    
    // 查询百度图像搜索库中的所有图片
    const response = await axios({
      method: 'GET',
      url: `https://aip.baidubce.com/rest/2.0/image-classify/v1/realtime_search/similar/list?access_token=${accessToken}&start=${start}&num=${count}`,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });
    
    // 处理响应
    if (response.data.error_code) {
      console.error('获取图库列表失败:', response.data.error_msg);
      return NextResponse.json({
        success: false,
        message: `查询图库失败: ${response.data.error_msg}`,
        error_code: response.data.error_code
      });
    }
    
    // 提取并增强图片数据
    const images = response.data.result || [];
    
    // 增强图片数据，从brief中提取URL等信息
    const enhancedImages = images.map(img => {
      let briefData = {};
      try {
        if (img.brief) {
          briefData = JSON.parse(img.brief);
        }
      } catch (e) {
        console.error('解析brief失败:', e);
      }
      
      return {
        ...img,
        imageUrl: briefData.imageUrl || null,
        bosUrl: briefData.bosUrl || null,
        filename: briefData.filename || null,
        filesize: briefData.filesize || null,
        dateAdded: briefData.dateAdded || null,
        additionalInfo: briefData
      };
    });
    
    return NextResponse.json({
      success: true,
      total: response.data.result_num || 0,
      start,
      count,
      images: enhancedImages
    });
    
  } catch (error) {
    console.error('获取图库列表失败:', error);
    return NextResponse.json(
      { success: false, message: `获取图库列表失败: ${error.message}` },
      { status: 500 }
    );
  }
} 