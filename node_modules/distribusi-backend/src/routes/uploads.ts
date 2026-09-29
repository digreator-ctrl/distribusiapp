import { Hono } from 'hono';
import type { Env } from '../types';
import { authMiddleware } from '../middleware/auth';
import { tenantMiddleware } from '../middleware/tenant';

export const uploadRoutes = new Hono<{ Bindings: Env }>();
uploadRoutes.use('/*', authMiddleware, tenantMiddleware);

uploadRoutes.post('/image', async (c) => {
  const businessId = c.get('businessId');
  
  try {
    const body = await c.req.parseBody();
    const file = body['file'] as File;
    
    if (!file) return c.json({ success: false, message: 'File tidak ditemukan' }, 400);
    if (!file.type.startsWith('image/')) return c.json({ success: false, message: 'File harus berupa gambar' }, 400);

    const ext = file.name.split('.').pop();
    const fileName = `${businessId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
    
    const arrayBuffer = await file.arrayBuffer();
    
    // R2 Upload
    await c.env.STORAGE.put(fileName, arrayBuffer, {
      httpMetadata: {
        contentType: file.type,
      },
    });
    
    const url = `/api/uploads/${fileName}`;
    
    return c.json({ success: true, data: { url, key: fileName } });
  } catch (error: any) {
    return c.json({ success: false, message: 'Gagal mengupload gambar', error: error.message }, 500);
  }
});

// Retrieve file directly via API if the bucket isn't public
uploadRoutes.get('/:businessId/:fileName', async (c) => {
  const businessId = c.req.param('businessId');
  const fileName = c.req.param('fileName');
  const key = `${businessId}/${fileName}`;
  
  const object = await c.env.STORAGE.get(key);
  if (!object) return c.text('Not found', 404);
  
  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set('etag', object.httpEtag);
  
  return new Response(object.body, { headers });
});

uploadRoutes.delete('/:key', async (c) => {
  const businessId = c.get('businessId');
  const key = c.req.param('key');
  
  // Ensure the file belongs to this tenant
  if (!key.startsWith(businessId)) {
    return c.json({ success: false, message: 'Unauthorized access to delete file' }, 403);
  }
  
  await c.env.STORAGE.delete(key);
  return c.json({ success: true, message: 'File deleted' });
});
