export enum AppView {
  DASHBOARD = 'DASHBOARD',
  COMPRESSOR = 'COMPRESSOR',
  QR_GENERATOR = 'QR_GENERATOR',
  DOWNLOADER = 'DOWNLOADER',
  PROFILE = 'PROFILE',
  UPGRADE = 'UPGRADE'
}

export interface ActivityItem {
  id: string;
  action: string;
  file: string; // Filename or URL
  date: string;
  size?: string;
  type: 'compress' | 'qr' | 'download';
}

export interface CompressOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
}

export interface VideoQuality {
  label: string;
  size: string;
  itag?: number;
}