// URL 映射存储
const urlMappings = new Map();

// 生成唯一的短 ID
function generateShortId() {
  return Math.random().toString(36).substring(2, 8);
}

// 添加 URL 映射
export function addUrlMapping(originalUrl) {
  const shortId = generateShortId();
  urlMappings.set(shortId, {
    originalUrl,
    createdAt: new Date().toISOString()
  });
  return shortId;
}

// 获取原始 URL
export function getOriginalUrl(shortId) {
  const mapping = urlMappings.get(shortId);
  return mapping ? mapping.originalUrl : null;
}

// 获取所有映射
export function getAllMappings() {
  return Array.from(urlMappings.entries()).map(([shortId, data]) => ({
    shortId,
    ...data
  }));
}

// 删除映射
export function removeMapping(shortId) {
  return urlMappings.delete(shortId);
}

// 检查 URL 是否已存在映射
export function hasUrlMapping(originalUrl) {
  for (const [, data] of urlMappings) {
    if (data.originalUrl === originalUrl) {
      return true;
    }
  }
  return false;
}

// 清理过期的映射（可选）
export function cleanupExpiredMappings(maxAgeHours = 24) {
  const now = new Date();
  for (const [shortId, data] of urlMappings) {
    const createdAt = new Date(data.createdAt);
    const ageHours = (now - createdAt) / (1000 * 60 * 60);
    if (ageHours > maxAgeHours) {
      urlMappings.delete(shortId);
    }
  }
} 