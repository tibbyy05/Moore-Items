interface CJAuthResponse {
  code: number;
  result: boolean;
  message: string;
  data: {
    accessToken: string;
    accessTokenExpiryDate: string;
    refreshToken: string;
    refreshTokenExpiryDate: string;
  };
}

interface CJProductListParams {
  categoryId?: string;
  productNameEn?: string;
  pageNum?: number;
  pageSize?: number;
  countryCode?: string;
}

interface CJProductListV2Params {
  page?: number;
  size?: number;
  features?: string;
  countryCode?: string;
  orderBy?: number;
  sort?: 'asc' | 'desc';
  categoryId?: string;
}

interface CJProduct {
  pid: string;
  productNameEn: string;
  productImage: string;
  productWeight: number;
  categoryId: string;
  categoryName: string;
  sellPrice: number;
  variants: CJVariant[];
  description: string;
  sourceFrom: number;
  productUnit: string;
}

interface CJVariant {
  vid: string;
  variantNameEn: string;
  variantImage: string;
  variantSellPrice: number;
  variantProperty: string;
}

interface CJFreightResult {
  logisticName: string;
  logisticPrice: number;
  logisticAging: string;
}

// ─── Rate Limiting ───────────────────────────────────────────────
// 3-second gap between any CJ API calls (QPS limit)
const rateState = (globalThis as any).__cj_rate_state ||= { lastRequestTime: 0 };

async function enforceRateLimit() {
  const now = Date.now();
  const elapsed = now - rateState.lastRequestTime;
  if (elapsed < 3000) {
    await new Promise((resolve) => setTimeout(resolve, 3000 - elapsed));
  }
  rateState.lastRequestTime = Date.now();
}

// ─── Token Cache ─────────────────────────────────────────────────
// Persists across Next.js hot reloads and route compilations
const tokenCache = (globalThis as any).__cj_token_cache ||= {
  accessToken: null as string | null,
  tokenExpiry: null as Date | null,
  lastAuthRequest: 0,
};

class CJClient {
  private baseUrl = process.env.CJ_API_BASE_URL!;
  private apiKey = process.env.CJ_API_KEY!;

  async authenticate(): Promise<string> {
    console.log('[cj] authenticate request');

    // Return cached token if still valid (with 2-minute buffer)
    if (
      tokenCache.accessToken &&
      tokenCache.tokenExpiry &&
      new Date(tokenCache.tokenExpiry) > new Date(Date.now() + 2 * 60 * 1000)
    ) {
      console.log('[cj] using cached access token');
      return tokenCache.accessToken;
    }

    // Prevent auth spam — enforce 300s between auth calls
    const timeSinceLastAuth = Date.now() - tokenCache.lastAuthRequest;
    if (timeSinceLastAuth < 300000 && tokenCache.lastAuthRequest > 0) {
      throw new Error('CJ Auth failed: Too Many Requests, QPS limit is 1 time/300 seconds');
    }

    tokenCache.lastAuthRequest = Date.now();

    const response = await fetch(`${this.baseUrl}/authentication/getAccessToken`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ apiKey: this.apiKey }),
    });

    const data: CJAuthResponse = await response.json();

    if (!data.result) {
      throw new Error(`CJ Auth failed: ${data.message}`);
    }

    tokenCache.accessToken = data.data.accessToken;
    tokenCache.tokenExpiry = new Date(data.data.accessTokenExpiryDate);
    console.log('[cj] access token received, expires at', new Date(tokenCache.tokenExpiry).toISOString());
    return tokenCache.accessToken;
  }

  private async apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    await enforceRateLimit();
    const token = await this.authenticate();
    console.log('[cj] apiCall', endpoint);

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'CJ-Access-Token': token,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (data.code !== 200 && data.code !== 0) {
      console.error('[cj] API FAILURE — full response:', JSON.stringify(data, null, 2));
      throw new Error(`CJ API error: ${data.message} (code: ${data.code})`);
    }

    return data.data;
  }

  async getProducts(
    params: CJProductListParams = {}
  ): Promise<{ list: CJProduct[]; pageNum: number; pageSize: number; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.pageNum) searchParams.set('pageNum', String(params.pageNum));
    if (params.pageSize) searchParams.set('pageSize', String(params.pageSize || 200));
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    if (params.productNameEn) searchParams.set('productNameEn', params.productNameEn);
    if (params.countryCode) searchParams.set('countryCode', params.countryCode);

    return this.apiCall(`/product/list?${searchParams.toString()}`);
  }

  async getProductsV2(
    params: CJProductListV2Params = {}
  ): Promise<{ list: any[]; page: number; size: number; total: number }> {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.size) searchParams.set('size', String(params.size));
    if (params.features) searchParams.set('features', params.features);
    if (params.countryCode) searchParams.set('countryCode', params.countryCode);
    if (params.orderBy !== undefined) searchParams.set('orderBy', String(params.orderBy));
    if (params.sort) searchParams.set('sort', params.sort);
    if (params.categoryId) searchParams.set('categoryId', params.categoryId);
    return this.apiCall(`/product/listV2?${searchParams.toString()}`);
  }

  async getProduct(pid: string): Promise<CJProduct> {
    return this.apiCall(`/product/query?pid=${pid}`);
  }

  async getProductReviews(pid: string, pageNum: number = 1, pageSize: number = 20): Promise<any> {
    return this.apiCall(
      `/product/productComments?pid=${pid}&pageNum=${pageNum}&pageSize=${pageSize}`
    );
  }

  async getProductStock(pid: string): Promise<any> {
    return this.apiCall(`/product/stock/getInventoryByPid?pid=${pid}`);
  }

  async getVariants(vid: string): Promise<CJVariant> {
    return this.apiCall(`/product/variant/queryByVid?vid=${vid}`);
  }

  async getCategories(): Promise<any[]> {
    return this.apiCall('/product/getCategory');
  }

  async calculateFreight(params: {
    startCountryCode?: string;
    endCountryCode: string;
    products: Array<{ quantity: number; vid: string }>;
  }): Promise<CJFreightResult[]> {
    return this.apiCall('/logistic/freightCalculate', {
      method: 'POST',
      body: JSON.stringify(params),
    });
  }

  async createOrder(params: {
    orderNumber: string;
    shippingZip: string;
    shippingCountryCode: string;
    shippingCountry: string;
    shippingProvince: string;
    shippingCity: string;
    shippingAddress: string;
    shippingCustomerName: string;
    shippingPhone: string;
    products: Array<{ vid: string; quantity: number }>;
    payType?: number;
    logisticName?: string;
    [key: string]: any;
  }) {
    const payload = { ...params, payType: params.payType || 2 };
    console.log('[cj] createOrder payload:', JSON.stringify(payload, null, 2));
    return this.apiCall('/shopping/order/createOrderV2', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getTracking(orderNumber: string) {
    return this.apiCall(`/logistic/trackingInfo?orderNumber=${orderNumber}`);
  }
}

export const cjClient = new CJClient();