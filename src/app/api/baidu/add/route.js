import { NextResponse } from 'next/server';
import { addToImageSearchLibrary } from '../../../utils/baiduApi';
import { uploadToBos, generateBosKey, getUrlFromBosKey } from '../../../utils/bosStorage';
import { updateImageBrief } from '../../../utils/baiduApi';
import { compressImage } from '../../../utils/imageProcessor';

if (!process.env.BAIDU_BOS_DOMAIN || !process.env.BAIDU_BOS_ENDPOINT) {
  console.error('缺少必要的环境变量配置');
}

if (!process.env.BAIDU_BOS_DOMAIN) {
  console.error('未配置 BAIDU_BOS_DOMAIN 环境变量');
}

export async function POST(request) {
  try {
    console.log('【图库添加】开始处理添加请求');
    
    // 检查环境变量
    console.log('【图库添加】检查环境配置:', {
      BOS_DOMAIN: process.env.BAIDU_BOS_DOMAIN ? '已配置' : '未配置',
      BOS_ENDPOINT: process.env.BAIDU_BOS_ENDPOINT ? '已配置' : '未配置',
      BOS_BUCKET: process.env.BAIDU_BOS_BUCKET ? '已配置' : '未配置',
      API_KEY: process.env.BAIDU_API_KEY ? '已配置' : '未配置'
    });

    if (!process.env.BAIDU_BOS_DOMAIN) {
      console.error('【图库添加】错误: 未配置BOS域名');
      return NextResponse.json(
        { success: false, message: '服务器配置错误：未设置存储域名' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const originalImageFile = formData.get('image');
    const filename = formData.get('filename') || originalImageFile.name || 'upload.jpg';
    const filesize = originalImageFile.size;
    
    console.log('【图库添加】接收到文件:', {
      文件名: filename,
      大小: `${(filesize / 1024 / 1024).toFixed(2)}MB`,
      类型: originalImageFile.type
    });
    
    // 1. 准备图片数据
    console.log('【图库添加】开始处理图片数据');
    const originalBuffer = await originalImageFile.arrayBuffer();
    
    // 检查图片大小
    let searchImageBuffer;
    let isCompressed = false;
    
    if (filesize > 3 * 1024 * 1024) {
      console.log('【图库添加】图片超过3MB，开始压缩');
      searchImageBuffer = await compressImage(originalBuffer, {
        maxSize: 3 * 1024 * 1024,
        minWidth: 50,
        maxWidth: 1024,
        quality: 80,
        preserveFormat: true
      });
      isCompressed = true;
      console.log('【图库添加】压缩完成:', {
        原始大小: `${(filesize / 1024 / 1024).toFixed(2)}MB`,
        压缩后: `${(searchImageBuffer.length / 1024 / 1024).toFixed(2)}MB`,
        压缩率: `${((1 - searchImageBuffer.length / filesize) * 100).toFixed(1)}%`
      });
    } else {
      console.log('【图库添加】图片小于3MB，无需压缩');
      searchImageBuffer = Buffer.from(originalBuffer);
    }
    
    // 创建File对象用于搜索图库上传
    const searchImageFile = new File(
      [searchImageBuffer], 
      filename, 
      { type: originalImageFile.type || 'image/png' }
    );
    
    // 2. 添加到搜索库
    console.log('【图库添加】开始添加到搜索库');
    const searchLibraryResult = await addToImageSearchLibrary(searchImageFile);
    
    console.log('【图库添加】搜索库添加结果:', {
      成功: searchLibraryResult.success,
      是否已存在: searchLibraryResult.isExisting,
      图片签名: searchLibraryResult.cont_sign
    });
    
    if (!searchLibraryResult.success) {
      console.error('【图库添加】添加到搜索库失败:', searchLibraryResult);
      return NextResponse.json(
        { 
          success: false, 
          message: `添加到搜图图库失败: ${searchLibraryResult.message}`,
          error: searchLibraryResult
        },
        { status: 500 }
      );
    }
    
    // 3. 上传到BOS
    console.log('【图库添加】开始上传到BOS存储');
    const contSign = searchLibraryResult.cont_sign;
    const bosKey = generateBosKey(null, contSign);
    
    console.log('【图库添加】BOS上传信息:', {
      文件名: filename,
      BOS密钥: bosKey,
      存储桶: process.env.BAIDU_BOS_BUCKET
    });
    
    const bosUploadResult = await uploadToBos(originalImageFile, bosKey);
    
    console.log('【图库添加】BOS上传结果:', {
      成功: bosUploadResult.success,
      URL: bosUploadResult.success ? bosUploadResult.bosUrl : '上传失败'
    });
    
    // 4. 更新brief
    console.log('【图库添加】开始更新图片元数据');
    const standardImageUrl = `https://${process.env.BAIDU_BOS_DOMAIN}/${bosKey}`;
    
    const briefUpdateResult = await updateImageBrief(contSign, standardImageUrl, {
      filename,
      filesize: originalImageFile.size,
      bosKey,
      isCompressed,
      originalSize: originalImageFile.size,
      compressedSize: isCompressed ? searchImageBuffer.length : null,
      updateTime: new Date().toISOString()
    });
    
    console.log('【图库添加】元数据更新结果:', {
      成功: briefUpdateResult.success,
      图片签名: contSign,
      标准URL: standardImageUrl
    });
    
    // 5. 完成处理
    console.log('【图库添加】处理完成:', {
      总体结果: 'success',
      图片签名: contSign,
      是否压缩: isCompressed,
      是否已存在: searchLibraryResult.isExisting,
      存储URL: standardImageUrl
    });

    // 全部成功，返回结果
    return NextResponse.json({
      success: true,
      message: searchLibraryResult.isExisting 
        ? `图片已存在于图库中${isCompressed ? '（搜索版本已压缩）' : ''}` 
        : `图片已成功添加${isCompressed ? '（搜索版本已压缩）' : ''}`,
      cont_sign: contSign,
      imageUrl: standardImageUrl,
      bosUrl: standardImageUrl,
      directUrl: standardImageUrl,
      bosKey: bosKey,
      filename: filename,
      filesize: filesize,
      isExisting: searchLibraryResult.isExisting,
      isCompressed,
      briefUpdateSuccess: briefUpdateResult.success,
      src: standardImageUrl
    });
    
  } catch (error) {
    console.error('【图库添加】处理失败:', {
      错误类型: error.name,
      错误信息: error.message,
      堆栈: error.stack
    });
    return NextResponse.json(
      { success: false, message: `添加图片失败: ${error.message}` },
      { status: 500 }
    );
  }
} 