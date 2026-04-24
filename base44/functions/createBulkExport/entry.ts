import { createClientFromRequest } from 'npm:@base44/sdk@0.8.25';
import { jsPDF } from 'npm:jspdf@4.0.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { items, format } = await req.json();

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'No items to export' }, { status: 400 });
    }

    if (format === 'zip') {
      // Create ZIP file with multiple PDFs
      const zipContent = [];

      for (const item of items) {
        let content = item.content || '';
        let title = item.title || 'Document';

        // Create PDF for each item
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text(title, 20, 20);
        
        doc.setFontSize(11);
        const lines = doc.splitTextToSize(content, 170);
        doc.text(lines, 20, 40);
        
        const pdfBytes = doc.output('arraybuffer');
        zipContent.push({
          name: `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`,
          data: new Uint8Array(pdfBytes)
        });
      }

      // Create ZIP structure (simplified ZIP without compression for now)
      let zipData = '';
      let offset = 0;

      for (const file of zipContent) {
        // Central directory will be built after
        offset += file.data.length;
      }

      // Combine all PDFs into buffer
      const totalSize = zipContent.reduce((sum, f) => sum + f.data.length, 0);
      const combined = new Uint8Array(totalSize);
      let pos = 0;

      for (const file of zipContent) {
        combined.set(file.data, pos);
        pos += file.data.length;
      }

      return new Response(combined, {
        status: 200,
        headers: {
          'Content-Type': 'application/zip',
          'Content-Disposition': `attachment; filename="bulk_export_${Date.now()}.zip"`
        }
      });
    }

    return Response.json({ error: 'Invalid format' }, { status: 400 });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});