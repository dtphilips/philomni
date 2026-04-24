import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Download, X, FileText, File, Music } from 'lucide-react';
import { formatFileSize, getFileIcon } from './FileUpload';

export default function FilePreview({ files, onRemove, className = '' }) {
  if (!files || files.length === 0) return null;

  return (
    <div className={`space-y-2 ${className}`}>
      {files.map((file, index) => {
        const isImage = file.file_type === 'image' || file.type === 'image';
        const fileUrl = file.file_url || file.url;
        const fileType = file.file_type || file.type;
        const fileName = file.file_name || file.name;
        const fileSize = file.file_size || file.size;

        return (
          <div key={index} className="rounded-lg border border-border overflow-hidden">
            {/* Image Preview */}
            {isImage && fileUrl && (
              <div className="relative bg-muted aspect-video overflow-hidden">
                <img src={fileUrl} alt={fileName} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center">
                  <div className="flex gap-2 opacity-0 hover:opacity-100 transition-opacity">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="sm" variant="secondary">
                        <Download className="w-4 h-4 mr-2" />
                        Open
                      </Button>
                    </a>
                    {onRemove && (
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => onRemove(index)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* File Preview */}
            {!isImage && (
              <div className="p-3 flex items-center gap-3">
                <div className="flex-shrink-0 text-muted-foreground">
                  {getFileIcon(fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{fileName}</p>
                  {fileSize && (
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(fileSize)}
                    </p>
                  )}
                </div>
                <Badge variant="outline" className="capitalize text-xs flex-shrink-0">
                  {fileType}
                </Badge>
                <div className="flex gap-1">
                  {fileUrl && (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button size="icon" variant="ghost" className="h-8 w-8">
                        <Download className="w-4 h-4" />
                      </Button>
                    </a>
                  )}
                  {onRemove && (
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 text-destructive hover:bg-destructive/10"
                      onClick={() => onRemove(index)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}