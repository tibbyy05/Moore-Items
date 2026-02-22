import { NextRequest, NextResponse } from 'next/server';
import { cjClient } from '@/lib/cj/client';

export async function POST(request: NextRequest) {
  try {
    const { vid, quantity, countryCode } = await request.json();

    const freight = await cjClient.calculateFreight({
      endCountryCode: countryCode || 'US',
      products: [{ vid, quantity: quantity || 1 }],
    });

    return NextResponse.json({
      options: freight.map((f) => ({
        carrier: f.logisticName,
        price: f.logisticPrice,
        estimatedDays: f.logisticAging,
      })),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
