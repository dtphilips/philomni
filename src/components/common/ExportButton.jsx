import React, { useState } from 'react';
import { Download, Loader2, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';

export default function ExportButton({ content, title, variant = 'outline', size = 'sm' }) {
  const [loading, setLoading] = useState(null);

  const handleExport = async (format) => {
    setLoading(format);
    try {
      const response = /* TODO: migrate base44.functions.invoke */ Promise.resolve(null);

      if (response.data) {
        const blob = new Blob([response.data], {
          'pdf': 'application/pdf',
          'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'txt': 'text/plain'
        }[format]);
        
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title}.${format}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success(`Exported as ${format.toUpperCase()}`);
      }
    } catch (error) {
      toast.error(`Failed to export: ${error.message}`);
    }
    setLoading(null);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="gap-2">
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleExport('pdf')} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />
          PDF Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('docx')} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />
          Word Document
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleExport('txt')} disabled={loading}>
          <FileText className="w-4 h-4 mr-2" />
          Text File
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}