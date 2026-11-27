import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

export interface ExportTextFileOptions {
  filename: string;
  content: string;
  mimeType: string;
  title?: string;
}

/**
 * Exports text/JSON/CSV/Markdown files in a way that works both in Capacitor native iOS
 * (using Filesystem + native Share sheet) and standard web browsers (Blob download).
 */
export async function exportTextFile({
  filename,
  content,
  mimeType,
  title,
}: ExportTextFileOptions): Promise<void> {
  if (Capacitor.isNativePlatform()) {
    try {
      const writeResult = await Filesystem.writeFile({
        path: filename,
        data: content,
        directory: Directory.Cache,
        encoding: Encoding.UTF8,
        recursive: true,
      });

      await Share.share({
        title: title || filename,
        text: title || filename,
        url: writeResult.uri,
        files: [writeResult.uri],
        dialogTitle: title || `Export ${filename}`,
      });
      return;
    } catch (nativeErr) {
      console.warn('[exportTextFile] Native Share/Filesystem fallback triggered:', nativeErr);
      // Last-resort Share with plain text if file share fails on older iOS targets
      try {
        await Share.share({
          title: title || filename,
          text: content,
          dialogTitle: title || filename,
        });
        return;
      } catch (shareErr) {
        console.error('[exportTextFile] Native text share failed:', shareErr);
        throw shareErr;
      }
    }
  }

  // Web browser download fallback
  const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
}

/**
 * Opens an external URL without relying directly on window.open.
 */
export function openExternalUrl(url: string): void {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  setTimeout(() => {
    document.body.removeChild(link);
  }, 100);
}
