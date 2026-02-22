import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerSupabaseClient } from '@/lib/supabase/server';

const SYSTEM_PROMPT = `You are the MooreItems Shopping Assistant — a friendly, knowledgeable shopping helper for MooreItems.com, a curated online store with 3,000+ products across fashion, home & garden, health & beauty, electronics, jewelry, kitchen, pet supplies, and kids & toys. All products ship from US warehouses in 2-5 business days. Free shipping on orders over $50.

Your job is to help customers find the perfect products. Be warm, conversational, and helpful. When recommending products, ALWAYS include the product slug so the frontend can create links. Format product recommendations as JSON blocks within your response using this exact format:

[PRODUCT:{"name":"Product Name","price":29.99,"slug":"product-slug","image":"image_url","rating":4.5}]

Rules:
- Only recommend products from the provided product list — never make up products
- If no products match, say so honestly and suggest broadening the search
- Recommend 2-4 products per response, not more
- Give a brief reason WHY each product is a good fit
- Keep responses concise — 2-3 sentences intro, then product recommendations
- If the customer's request is vague, ask ONE clarifying question
- Never mention that you're searching a database — just naturally recommend products
- You can suggest browsing categories if the query is very broad`;

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  fashion: ['fashion', 'clothing', 'dress', 'dresses', 'shoes', 'apparel', 'outfit'],
  'home-garden': ['home', 'garden', 'decor', 'furniture', 'outdoor', 'patio', 'bedding'],
  'health-beauty': ['beauty', 'skincare', 'makeup', 'wellness', 'fitness', 'health', 'massage'],
  electronics: ['electronics', 'tech', 'gadget', 'phone', 'charger', 'headphones', 'camera'],
  jewelry: ['jewelry', 'necklace', 'bracelet', 'ring', 'earring', 'watch'],
  kitchen: ['kitchen', 'cookware', 'utensil', 'bakeware', 'appliance', 'drinkware'],
  'pet-supplies': ['pet', 'pets', 'dog', 'dogs', 'cat', 'cats', 'puppy', 'kitten'],
  'kids-toys': ['kids', 'kid', 'baby', 'toddler', 'toy', 'toys', 'children'],
};

const STOP_WORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'for',
  'with',
  'to',
  'of',
  'my',
  'our',
  'your',
  'me',
  'i',
  'we',
  'you',
  'is',
  'are',
  'in',
  'on',
  'at',
  'from',
  'under',
  'over',
  'below',
  'above',
  'best',
  'cheap',
  'gift',
  'ideas',
]);

function extractPriceHints(message: string) {
  const lower = message.toLowerCase();
  let minPrice: number | undefined;
  let maxPrice: number | undefined;

  const betweenMatch = lower.match(/between\s*\$?(\d+)\s*(?:and|-)\s*\$?(\d+)/);
  if (betweenMatch) {
    minPrice = parseFloat(betweenMatch[1]);
    maxPrice = parseFloat(betweenMatch[2]);
    return { minPrice, maxPrice };
  }

  const rangeMatch = lower.match(/\$?(\d+)\s*-\s*\$?(\d+)/);
  if (rangeMatch) {
    minPrice = parseFloat(rangeMatch[1]);
    maxPrice = parseFloat(rangeMatch[2]);
    return { minPrice, maxPrice };
  }

  const underMatch = lower.match(/(?:under|below|less than|up to|<=)\s*\$?(\d+)/);
  if (underMatch) {
    maxPrice = parseFloat(underMatch[1]);
  }

  const overMatch = lower.match(/(?:over|above|more than|>=)\s*\$?(\d+)/);
  if (overMatch) {
    minPrice = parseFloat(overMatch[1]);
  }

  return { minPrice, maxPrice };
}

function extractCategoryHint(message: string) {
  const lower = message.toLowerCase();
  for (const [slug, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return slug;
    }
  }
  return undefined;
}

function extractKeywords(message: string) {
  const lower = message.toLowerCase();
  const implied: string[] = [];

  if (lower.includes('mom') || lower.includes('mother')) {
    implied.push('women', 'ladies');
  }
  if (lower.includes('dad') || lower.includes('father')) {
    implied.push('men', 'mens');
  }
  if (lower.includes('boy') || lower.includes('boys')) {
    implied.push('boys');
  }
  if (lower.includes('girl') || lower.includes('girls')) {
    implied.push('girls');
  }

  const tokens = lower
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean)
    .filter((token) => !STOP_WORDS.has(token))
    .filter((token) => token.length >= 3);

  const unique = Array.from(new Set([...tokens, ...implied]));
  return unique.slice(0, 6);
}

function buildProductContext(products: Array<{
  name: string;
  price: number;
  slug: string;
  image: string | null;
  rating: number;
}>) {
  if (products.length === 0) return 'No matching products were found.';
  return products
    .map(
      (product) =>
        `- ${product.name} (price: ${product.price}, slug: ${product.slug}, image: ${product.image || ''}, rating: ${product.rating})`
    )
    .join('\n');
}

function parseAssistantResponse(text: string) {
  const products: Array<{
    name: string;
    price: number;
    slug: string;
    image: string;
    rating: number;
  }> = [];

  const productRegex = /\[PRODUCT:(\{[\s\S]*?\})\]/g;
  let match;
  while ((match = productRegex.exec(text)) !== null) {
    try {
      const parsed = JSON.parse(match[1]);
      if (parsed?.name && parsed?.slug) {
        products.push({
          name: String(parsed.name),
          price: Number(parsed.price) || 0,
          slug: String(parsed.slug),
          image: String(parsed.image || ''),
          rating: Number(parsed.rating) || 0,
        });
      }
    } catch {
      // Ignore malformed product blocks.
    }
  }

  const message = text.replace(productRegex, '').replace(/\n{3,}/g, '\n\n').trim();
  return { message, products };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const message = String(body?.message || '').trim();
    const history = Array.isArray(body?.history) ? body.history : [];

    if (!message) {
      return NextResponse.json({ message: 'Tell me what you are shopping for!', products: [] });
    }

    const { minPrice, maxPrice } = extractPriceHints(message);
    const categoryHint = extractCategoryHint(message);
    const keywords = extractKeywords(message);

    const supabase = await createServerSupabaseClient();
    let query = supabase
      .from('mi_products')
      .select('id, name, slug, retail_price, images, average_rating, review_count, mi_categories(name, slug)')
      .eq('status', 'active');

    if (categoryHint) {
      const { data: cat } = await supabase
        .from('mi_categories')
        .select('id')
        .eq('slug', categoryHint)
        .single();
      if (cat?.id) {
        query = query.eq('category_id', cat.id);
      }
    }

    if (minPrice !== undefined) query = query.gte('retail_price', minPrice);
    if (maxPrice !== undefined) query = query.lte('retail_price', maxPrice);

    if (keywords.length > 0) {
      const keywordFilters = keywords.map((keyword) => `name.ilike.%${keyword}%`).join(',');
      query = query.or(keywordFilters);
    }

    const { data: products } = await query.limit(20);

    const productList = (products || []).map((product: any) => ({
      name: product.name,
      price: product.retail_price,
      slug: product.slug,
      image: Array.isArray(product.images) ? product.images[0] || '' : '',
      rating: product.average_rating || 0,
    }));

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        message: 'I can help with product ideas soon. Please try again in a moment.',
        products: [],
      });
    }

    const anthropic = new Anthropic({ apiKey });
    const filteredHistory = history
      .filter((item: any) => item?.role && item?.content)
      .slice(-10)
      .map((item: any) => ({
        role: item.role === 'assistant' ? 'assistant' : 'user',
        content: String(item.content),
      }));

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1024,
      system: SYSTEM_PROMPT,
      messages: [
        ...filteredHistory,
        {
          role: 'user',
          content: `${message}\n\nAvailable products:\n${buildProductContext(productList)}`,
        },
      ],
    });

    const text = response.content
      .map((block) => (block.type === 'text' ? block.text : ''))
      .join('')
      .trim();

    const parsed = parseAssistantResponse(text || '');
    return NextResponse.json({
      message: parsed.message || 'Here are a few options that might work well for you.',
      products: parsed.products,
    });
  } catch (error) {
    return NextResponse.json({
      message: 'Sorry — I had trouble finding products just now. Try a different request?',
      products: [],
    });
  }
}
