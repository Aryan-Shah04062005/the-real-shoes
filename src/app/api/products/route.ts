import { NextResponse } from 'next/server';
import { getProductsList, getProductById, getFullDb } from '@/lib/db';
import { saveProductAction, deleteProductAction } from '@/app/actions';
import { isAdminAuthenticated } from '@/lib/auth';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

// GET /api/products - Retrieve products from database
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const all = searchParams.get('all') === 'true';

    if (id) {
      const product = await getProductById(id);
      if (!product) {
        return NextResponse.json({ success: false, error: 'Product not found' }, { status: 404 });
      }
      return NextResponse.json({ success: true, product });
    }

    const isAdmin = await isAdminAuthenticated();

    if (all && isAdmin) {
      const fullDb = await getFullDb();
      return NextResponse.json({ success: true, products: fullDb.products });
    }

    const products = await getProductsList();
    const activeProducts = products.filter(p => !p.status || p.status === 'ACTIVE' || p.status === 'OUT_OF_STOCK');

    return NextResponse.json({ success: true, products: activeProducts });
  } catch (error: any) {
    console.error('API GET /api/products error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to fetch products' }, { status: 500 });
  }
}

// POST /api/products - Insert new product into database
export async function POST(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await request.json();
    const res = await saveProductAction(body);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error, isDuplicate: res.isDuplicate, existingProduct: res.existingProduct }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product inserted successfully into database',
      productId: res.product?.id,
      product: res.product
    }, { status: 201 });
  } catch (error: any) {
    console.error('API POST /api/products error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Product could not be saved. Please try again.' }, { status: 500 });
  }
}

// PUT /api/products - Update product in database
export async function PUT(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const body = await request.json();
    const res = await saveProductAction(body);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product updated successfully',
      productId: res.product?.id,
      product: res.product
    });
  } catch (error: any) {
    console.error('API PUT /api/products error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to update product' }, { status: 500 });
  }
}

// DELETE /api/products - Delete product from database
export async function DELETE(request: Request) {
  try {
    const isAdmin = await isAdminAuthenticated();
    if (!isAdmin) {
      return NextResponse.json({ success: false, error: 'Unauthorized admin access' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get('id');

    if (!id) {
      try {
        const body = await request.json();
        id = body?.id;
      } catch (e) {
        // Body reading optional if id in searchParams
      }
    }

    if (!id) {
      return NextResponse.json({ success: false, error: 'Product ID is required for deletion' }, { status: 400 });
    }

    const res = await deleteProductAction(id);

    if (!res.success) {
      return NextResponse.json({ success: false, error: res.error }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: 'Product deleted successfully',
      mode: (res as any).mode
    });
  } catch (error: any) {
    console.error('API DELETE /api/products error:', error);
    return NextResponse.json({ success: false, error: error?.message || 'Failed to delete product' }, { status: 500 });
  }
}
