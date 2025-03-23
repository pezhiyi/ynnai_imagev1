import { NextResponse } from 'next/server';
import { getAccessToken, addImageToLibrary, searchSimilarImages } from '../../../utils/baiduApi';
import { getImageUrlFromContSign, getUrlFromBosKey, generateBosKey } from '../../../utils/bosStorage';
import { compressImage } from '../../../utils/imageProcessor';
import { getImageUrlFromSearchItem } from '../../../utils/bosStorage';

export async function POST(request) {
  try {
    console.log('【图片搜索】开始处理搜索请求');
    
    // 添加新的日志...
    console.log('【图片搜索】初始化:', {
      时间: new Date().toISOString(),
      环境: process.env.NODE_ENV
    });
    
    // 获取表单数据
    const formData = await request.formData();
    const imageFile = formData.get('image');
    const mode = formData.get('mode') || 'search';
    
    console.log('【图片搜索】请求信息:', {
      模式: mode,
      文件名: imageFile?.name,
      文件大小: imageFile ? `${(imageFile.size / 1024 / 1024).toFixed(2)}MB` : '无文件',
      文件类型: imageFile?.type
    });
    
    if (!imageFile) {
      console.error('【图片搜索】错误: 未提供图片');
      return NextResponse.json(
        { success: false, message: '未提供图片文件' },
        { status: 400 }
      );
    }
    
    // 检查文件大小限制
    console.log('【图片搜索】检查文件大小限制');
    if (mode === 'add' && imageFile.size > 3 * 1024 * 1024) {
      console.error('【图片搜索】错误: 添加模式下文件过大');
      return NextResponse.json({ 
        message: '添加图库时，图片不能超过3MB' 
      }, { status: 400 });
    }
    
    // 处理图片
    console.log('【图片搜索】开始处理图片');
    const originalBuffer = await imageFile.arrayBuffer();
    let searchImageBuffer;
    let isCompressed = false;
    
    if (imageFile.size > 3 * 1024 * 1024) {
      console.log('【图片搜索】图片需要压缩');
      searchImageBuffer = await compressImage(originalBuffer, {
        maxSize: 3 * 1024 * 1024,
        minWidth: 50,
        maxWidth: 1024,
        quality: 80
      });
      isCompressed = true;
      console.log('【图片搜索】压缩完成:', {
        原始大小: `${(imageFile.size / 1024 / 1024).toFixed(2)}MB`,
        压缩后: `${(searchImageBuffer.length / 1024 / 1024).toFixed(2)}MB`,
        压缩率: `${((1 - searchImageBuffer.length / imageFile.size) * 100).toFixed(1)}%`
      });
    } else {
      console.log('【图片搜索】图片无需压缩');
      searchImageBuffer = Buffer.from(originalBuffer);
    }
    
    // 创建File对象用于搜索
    const searchImageFile = new File(
      [searchImageBuffer], 
      imageFile.name || 'search.jpg', 
      { type: imageFile.type || 'image/jpeg' }
    );
    
    // 获取访问令牌
    console.log('【图片搜索】获取百度API访问令牌');
    const accessToken = await getAccessToken();
    console.log('【图片搜索】成功获取访问令牌');
    
    // 执行搜索
    console.log('【图片搜索】开始执行搜索');
    const searchResults = await searchSimilarImages(searchImageFile);
    
    console.log('【图片搜索】搜索完成:', {
      成功: searchResults.success,
      结果数量: searchResults.results?.length || 0
    });
    
    if (!searchResults.success) {
      console.error('【图片搜索】搜索失败:', searchResults);
      return NextResponse.json(
        { 
          success: false, 
          message: `图片搜索失败: ${searchResults.message}`,
          error: searchResults
        },
        { status: 500 }
      );
    }
    
    // 处理搜索结果
    console.log('【图片搜索】开始处理搜索结果');
    const enhancedResults = searchResults.results.map((item, index) => {
      const bosKey = generateBosKey(null, item.cont_sign);
      const standardImageUrl = getUrlFromBosKey(bosKey);
      
      let briefData = {};
      try {
        if (item.brief) {
          briefData = JSON.parse(item.brief);
          console.log(`【图片搜索】解析结果${index + 1}的brief数据成功`);
        }
      } catch (e) {
        console.warn(`【图片搜索】解析结果${index + 1}的brief数据失败:`, e);
      }
      
      return {
        score: item.score,
        cont_sign: item.cont_sign,
        imageUrl: standardImageUrl,
        bosUrl: standardImageUrl,
        filename: briefData.filename || null,
        filesize: briefData.filesize || null,
        uploadTime: briefData.uploadTime || null,
        bosKey: bosKey,
        additionalInfo: briefData
      };
    });
    
    console.log('【图片搜索】结果处理完成:', {
      总结果数: enhancedResults.length,
      有效URL数: enhancedResults.filter(r => r.imageUrl).length,
      平均相似度: (enhancedResults.reduce((sum, r) => sum + r.score, 0) / enhancedResults.length * 100).toFixed(1) + '%'
    });
    
    // 返回结果
    return NextResponse.json({
      success: true,
      message: `找到 ${enhancedResults.length} 个相似图片`,
      isCompressed,
      originalSize: imageFile.size,
      searchSize: searchImageBuffer.length,
      results: enhancedResults
    });
    
  } catch (error) {
    console.error('【图片搜索】处理失败:', {
      错误类型: error.name,
      错误信息: error.message,
      堆栈: error.stack
    });
    return NextResponse.json(
      { success: false, message: `搜索失败: ${error.message}` },
      { status: 500 }
    );
  }
} 