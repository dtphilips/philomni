import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function BulkExportSelector({ items, itemType = 'projects' }) {
  const [selectedItems, setSelectedItems] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleToggle = (itemId) => {
    setSelectedItems(prev =>
      prev.includes(itemId)
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const handleSelectAll = () => {
    if (selectedItems.length === items.length) {
      setSelectedItems([]);
    } else {
      setSelectedItems(items.map(item => item.id));
    }
  };

  const handleBulkExport = async () => {
    if (selectedItems.length === 0) {
      toast.error('Select at least one item');
      return;
    }

    setLoading(true);
    try {
      const itemsToExport = items
        .filter(item => selectedItems.includes(item.id))
        .map(item => ({
          title: item.title || item.prompt?.substring(0, 50) || 'Untitled',
          content: item.content || item.prompt || ''
        }));

      const response = await base44.functions.invoke('createBulkExport', {
        items: itemsToExport,
        format: 'zip'
      });

      if (response.data) {
        const blob = new Blob([response.data], { type: 'application/zip' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bulk_export_${Date.now()}.zip`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);

        toast.success(`Exported ${selectedItems.length} items as ZIP`);
        setSelectedItems([]);
      }
    } catch (error) {
      toast.error(`Failed to export: ${error.message}`);
    }
    setLoading(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Checkbox
            checked={selectedItems.length === items.length && items.length > 0}
            onCheckedChange={handleSelectAll}
            disabled={loading || items.length === 0}
          />
          <span className="text-sm font-medium">
            {selectedItems.length > 0
              ? `${selectedItems.length} selected`
              : 'Select items to export'}
          </span>
        </div>

        {selectedItems.length > 0 && (
          <Button
            onClick={handleBulkExport}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Export ZIP ({selectedItems.length})
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
        {items.map(item => (
          <div
            key={item.id}
            className="flex items-start gap-3 p-3 rounded-lg border border-border hover:border-primary transition-all cursor-pointer"
            onClick={() => handleToggle(item.id)}
          >
            <Checkbox
              checked={selectedItems.includes(item.id)}
              onCheckedChange={() => handleToggle(item.id)}
              disabled={loading}
              className="mt-1"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium line-clamp-2">
                {item.title || item.prompt?.substring(0, 50) || 'Untitled'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {format(new Date(item.created_date), 'PPp')}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Import format at top
import { format } from 'date-fns';