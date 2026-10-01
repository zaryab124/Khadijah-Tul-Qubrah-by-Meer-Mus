/**
 * Supabase Client Configuration & REST API Helper
 *
 * Project Reference: sijfxilgezxtprswtrmx
 * Supabase URL: https://sijfxilgezxtprswtrmx.supabase.co
 * REST Endpoint: https://sijfxilgezxtprswtrmx.supabase.co/rest/v1/
 */

export const SUPABASE_CONFIG = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sijfxilgezxtprswtrmx.supabase.co',
  restUrl: process.env.NEXT_PUBLIC_SUPABASE_REST_URL || 'https://sijfxilgezxtprswtrmx.supabase.co/rest/v1',
  publishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'sb_publishable_ON56k6wJOUcYfcqxXWagNA_I4z-iJYc',
};

/**
 * Generic REST query runner for Supabase endpoints
 */
export async function supabaseRestQuery<T = any>(
  table: string,
  options: {
    method?: 'GET' | 'POST' | 'PATCH' | 'DELETE';
    query?: Record<string, string>;
    body?: any;
    headers?: Record<string, string>;
  } = {}
): Promise<{ data: T | null; error: string | null }> {
  const { method = 'GET', query = {}, body, headers = {} } = options;

  try {
    const url = new URL(`${SUPABASE_CONFIG.restUrl}/${table}`);
    Object.entries(query).forEach(([k, v]) => url.searchParams.append(k, v));

    const reqHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      apikey: SUPABASE_CONFIG.publishableKey,
      Authorization: `Bearer ${SUPABASE_CONFIG.publishableKey}`,
      Prefer: method === 'POST' ? 'return=representation' : undefined as any,
      ...headers,
    };

    // Remove undefined headers
    Object.keys(reqHeaders).forEach(
      (key) => reqHeaders[key] === undefined && delete reqHeaders[key]
    );

    const res = await fetch(url.toString(), {
      method,
      headers: reqHeaders,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!res.ok) {
      const errText = await res.text().catch(() => res.statusText);
      return { data: null, error: `Supabase Error (${res.status}): ${errText}` };
    }

    const data = await res.json().catch(() => null);
    return { data, error: null };
  } catch (err: any) {
    return { data: null, error: err.message || 'Failed to connect to Supabase REST API' };
  }
}

// =========================================================================
// TYPED SUPABASE REST ENTITIES & REPOSITORY FUNCTIONS
// =========================================================================

export interface SupabaseProductRow {
  id?: string;
  sku: string;
  name: string;
  category: string;
  stitched_price: number;
  unstitched_price: number;
  fabric: string;
  craft: string;
  image_url: string;
  gallery?: string[];
  description: string;
  turnaround_days?: string;
  is_customizable?: boolean;
  is_active?: boolean;
  created_at?: string;
}

export interface SupabaseMediaGalleryRow {
  id?: string;
  title: string;
  image_url: string;
  category?: string;
  uploaded_by?: string;
  is_featured?: boolean;
  created_at?: string;
}

export interface SupabaseOrderRow {
  id?: string;
  order_number: string;
  customer_name: string;
  customer_email?: string;
  customer_phone?: string;
  shipping_address?: string;
  city?: string;
  subtotal: number;
  discount?: number;
  total_amount: number;
  status: string;
  notes?: string;
}

export interface SupabaseOrderItemRow {
  id?: string;
  order_id: string;
  product_id?: string;
  product_name: string;
  sku?: string;
  stitching_option: 'STITCHED' | 'UNSTITCHED';
  size?: string;
  fabric?: string;
  craft?: string;
  price: number;
  quantity: number;
  special_notes?: string;
}

export interface SupabaseCustomRequestRow {
  id?: string;
  request_number: string;
  customer_name: string;
  customer_phone?: string;
  customer_email?: string;
  silhouette: string;
  fabric: string;
  craft: string;
  colour: string;
  stitching_type?: 'STITCHED' | 'UNSTITCHED';
  chest?: string;
  waist?: string;
  hip?: string;
  length?: string;
  special_notes?: string;
  status?: string;
  total_amount?: number;
}

/**
 * Fetch all active garments from Supabase products table
 */
export async function fetchProductsFromSupabase(): Promise<SupabaseProductRow[] | null> {
  const res = await supabaseRestQuery<SupabaseProductRow[]>('products', {
    method: 'GET',
    query: { select: '*', is_active: 'eq.true', order: 'created_at.desc' },
  });
  return res.data;
}

/**
 * Create a new product in Supabase
 */
export async function createProductInSupabase(
  product: Omit<SupabaseProductRow, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await supabaseRestQuery<SupabaseProductRow[]>('products', {
    method: 'POST',
    body: product,
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, data: res.data?.[0] };
}

/**
 * Update an existing product in Supabase
 */
export async function updateProductInSupabase(
  id: string,
  updates: Partial<SupabaseProductRow>
): Promise<{ success: boolean; error?: string }> {
  const res = await supabaseRestQuery('products', {
    method: 'PATCH',
    query: { id: `eq.${id}` },
    body: updates,
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true };
}

/**
 * Fetch media gallery pictures from Supabase
 */
export async function fetchMediaGalleryFromSupabase(): Promise<SupabaseMediaGalleryRow[] | null> {
  const res = await supabaseRestQuery<SupabaseMediaGalleryRow[]>('media_gallery', {
    method: 'GET',
    query: { select: '*', order: 'created_at.desc' },
  });
  return res.data;
}

/**
 * Add a new image into Supabase media gallery
 */
export async function addMediaGalleryItem(
  item: Omit<SupabaseMediaGalleryRow, 'id' | 'created_at'>
): Promise<{ success: boolean; data?: any; error?: string }> {
  const res = await supabaseRestQuery<SupabaseMediaGalleryRow[]>('media_gallery', {
    method: 'POST',
    body: item,
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, data: res.data?.[0] };
}

/**
 * Submit an order with its line items to Supabase
 */
export async function submitOrderToSupabase(
  order: SupabaseOrderRow,
  items: Omit<SupabaseOrderItemRow, 'order_id'>[]
): Promise<{ success: boolean; orderId?: string; error?: string }> {
  const orderRes = await supabaseRestQuery<SupabaseOrderRow[]>('orders', {
    method: 'POST',
    body: order,
  });

  if (orderRes.error || !orderRes.data?.[0]?.id) {
    return { success: false, error: orderRes.error || 'Failed to create order record' };
  }

  const createdOrderId = orderRes.data[0].id;

  // Insert items
  if (items.length > 0) {
    const itemsPayload = items.map((it) => ({
      ...it,
      order_id: createdOrderId,
    }));

    await supabaseRestQuery('order_items', {
      method: 'POST',
      body: itemsPayload,
    });
  }

  return { success: true, orderId: createdOrderId };
}

/**
 * Submit a bespoke custom request to Supabase
 */
export async function submitCustomRequestToSupabase(
  request: SupabaseCustomRequestRow
): Promise<{ success: boolean; requestId?: string; error?: string }> {
  const res = await supabaseRestQuery<SupabaseCustomRequestRow[]>('custom_requests', {
    method: 'POST',
    body: request,
  });
  if (res.error) return { success: false, error: res.error };
  return { success: true, requestId: res.data?.[0]?.id };
}
