import { NextRequest, NextResponse } from 'next/server';
import { handlePOST, handleGET, checkAuth } from '../route';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers':
    'Content-Type, Authorization, mcp-session-id, Accept',
};

type Params = { params: Promise<{ key: string }> };

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS });
}

export async function POST(req: NextRequest, { params }: Params) {
  const { key } = await params;
  return handlePOST(req, key);
}

export async function GET(req: NextRequest, { params }: Params) {
  const { key } = await params;
  return handleGET(req, key);
}
