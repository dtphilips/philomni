import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Loader2, File, Image, FileText, Music } from 'lucide-react';
import { cn } from '@/lib/utils';

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB
const ALLOWED_TYPES = {
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  pdf: ['application/pdf'],
  document: ['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'],
  video: ['video/mp4', 'video/quicktime', 'video/webm'],
  audio: ['audio/mpeg', 'audio/wav', 'audio/ogg'],
  code: ['text/javascript', 'text/html', 'text/css', 'application/json'],
};

function getMimeType(file) {
  for (const [type, mimes] of Object.entries(ALLOWED_TYPES)) {
    if (mimes.includes(file.type)) {
      return type;
    }
  }
  return 'other';
}

function getFileIcon(fileType, className = 'w-4 h-4') {
  switch (fileType) {
    case 'image':
      return <Image className={className} />;
    case 'pdf':
    case 'document':
      return <FileText className={className} />;
    case 'audio':
      return <Music className={className} />;
    default:
      return <File className={className} />;
  }
}

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

export default function FileUpload({ onFilesSelected, maxFiles = 5, className = '' }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const handleFileSelect = async (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    
    // Validate files
    const validFiles = selectedFiles.filter(file => {
      if (file.size > MAX_FILE_SIZE) {
        console.error(`File ${file.name} is too large`);
        return false;
      }
      return true;
    });

    if (validFiles.length + files.length > maxFiles) {
      console.error(`Maximum ${maxFiles} files allowed`);
      return;
    }

    setFiles(prev => [...prev, ...validFiles.map(f => ({
      file: f,
      id: Math.random(),
      fileType: getMimeType(f),
    }))]);
  };

  const removeFile = (id) => {
    setFiles(files.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    if (files.length === 0) return;

    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const fileObj of files) {
        const { file_url } = await base44.integrations.Core.UploadFile({ file: fileObj.file });
        uploadedUrls.push({
          url: file_url,
          name: fileObj.file.name,
          type: fileObj.fileType,
          size: fileObj.file.size,
          mimeType: fileObj.file.type,
        });
      }

      onFilesSelected(uploadedUrls);
      setFiles([]);
    } catch (error) {
      console.error('Upload failed:', error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className="border-2 border-dashed border-border rounded-lg p-4 hover:border-primary transition-colors cursor-pointer text-center"
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          className="hidden"
          accept="image/*,.pdf,.doc,.docx,.txt,.json,.mp4,.webm,.mp3,.wav"
        />
        <Upload className="w-8 h-8 mx-auto mb-2 text-muted-foreground" />
        <p className="text-sm font-medium">Drop files here or click to upload</p>
        <p className="text-xs text-muted-foreground">Max 50MB per file, {maxFiles} files max</p>
      </div>

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(fileObj => (
            <div key={fileObj.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
              <div className="flex-shrink-0 text-muted-foreground">
                {getFileIcon(fileObj.fileType)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{fileObj.file.name}</p>
                <p className="text-xs text-muted-foreground">{formatFileSize(fileObj.file.size)}</p>
              </div>
              <Badge variant="outline" className="capitalize text-xs">
                {fileObj.fileType}
              </Badge>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6 text-destructive hover:bg-destructive/10"
                onClick={() => removeFile(fileObj.id)}
                disabled={uploading}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))}
          
          <Button
            onClick={uploadFiles}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload {files.length} file{files.length !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}

export { formatFileSize, getFileIcon };