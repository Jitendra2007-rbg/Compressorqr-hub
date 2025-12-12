export const parseVideoUrl = (url: string) => {
  if (url.includes('youtube.com') || url.includes('youtu.be')) {
    let id = '';
    if (url.includes('youtu.be')) {
      id = url.split('/').pop()?.split('?')[0] || '';
    } else {
      const params = new URLSearchParams(url.split('?')[1]);
      id = params.get('v') || '';
    }
    return { platform: 'youtube', id };
  } else if (url.includes('instagram.com')) {
    // Rough parse for IG
    const parts = url.split('/');
    const pIndex = parts.indexOf('p');
    const reelIndex = parts.indexOf('reel');
    const id = pIndex > -1 ? parts[pIndex + 1] : (reelIndex > -1 ? parts[reelIndex + 1] : '');
    return { platform: 'instagram', id };
  }
  return { platform: 'unknown', id: '' };
};

export const getThumbnail = (platform: string, id: string) => {
  if (platform === 'youtube') {
    return `https://img.youtube.com/vi/${id}/mqdefault.jpg`;
  }
  if (platform === 'instagram') {
    // IG doesn't have a public unauthenticated thumb endpoint, use placeholder
    return 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e7/Instagram_logo_2016.svg/2048px-Instagram_logo_2016.svg.png';
  }
  return null;
};

export const formatBytes = (bytes: number, decimals = 2) => {
    if (!+bytes) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};