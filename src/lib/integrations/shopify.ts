import axios from "axios";

export interface ShopifyConfig {
  shopDomain: string;
  accessToken: string;
}

export class ShopifyIntegration {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: ShopifyConfig) {
    this.baseUrl = `https://${config.shopDomain}/admin/api/2024-01`;
    this.headers = {
      "X-Shopify-Access-Token": config.accessToken,
      "Content-Type": "application/json",
    };
  }

  async getProducts(limit = 50) {
    const res = await axios.get(`${this.baseUrl}/products.json?limit=${limit}`, {
      headers: this.headers,
    });
    return res.data.products.map((p: any) => ({
      externalId: String(p.id),
      name: p.title,
      description: p.body_html?.replace(/<[^>]*>/g, "") || "",
      sku: p.variants?.[0]?.sku || "",
      price: parseFloat(p.variants?.[0]?.price || "0"),
      comparePrice: p.variants?.[0]?.compare_at_price
        ? parseFloat(p.variants[0].compare_at_price)
        : null,
      imageUrl: p.image?.src || null,
      category: p.product_type || null,
      tags: p.tags ? p.tags.split(",").map((t: string) => t.trim()) : [],
      inventory: p.variants?.[0]?.inventory_quantity || 0,
    }));
  }

  async getOrders(limit = 50) {
    const res = await axios.get(
      `${this.baseUrl}/orders.json?limit=${limit}&status=any`,
      { headers: this.headers }
    );
    return res.data.orders.map((o: any) => ({
      externalId: String(o.id),
      orderNumber: o.name || String(o.order_number),
      status: mapShopifyStatus(o.fulfillment_status, o.cancelled_at),
      subtotal: parseFloat(o.subtotal_price || "0"),
      shippingCost: parseFloat(o.total_shipping_price_set?.shop_money?.amount || "0"),
      tax: parseFloat(o.total_tax || "0"),
      discount: parseFloat(o.total_discounts || "0"),
      total: parseFloat(o.total_price || "0"),
      paymentStatus: o.financial_status === "paid" ? "PAID" : "PENDING",
      customer: {
        name: `${o.customer?.first_name || ""} ${o.customer?.last_name || ""}`.trim(),
        email: o.customer?.email || null,
        phone: o.customer?.phone || o.shipping_address?.phone || "",
        address: o.shipping_address
          ? `${o.shipping_address.address1 || ""}, ${o.shipping_address.city || ""}`
          : null,
        city: o.shipping_address?.city || null,
        country: o.shipping_address?.country || null,
      },
      items: o.line_items?.map((li: any) => ({
        externalId: String(li.product_id),
        name: li.title,
        quantity: li.quantity,
        price: parseFloat(li.price || "0"),
      })) || [],
      createdAt: o.created_at,
    }));
  }

  async getInventory(locationId: string) {
    const res = await axios.get(
      `${this.baseUrl}/inventory_levels.json?location_ids=${locationId}&limit=250`,
      { headers: this.headers }
    );
    return res.data.inventory_levels;
  }

  async registerWebhook(topic: string, callbackUrl: string) {
    const res = await axios.post(
      `${this.baseUrl}/webhooks.json`,
      {
        webhook: {
          topic,
          address: callbackUrl,
          format: "json",
        },
      },
      { headers: this.headers }
    );
    return res.data.webhook;
  }
}

function mapShopifyStatus(fulfillment: string | null, cancelled: string | null) {
  if (cancelled) return "CANCELLED";
  switch (fulfillment) {
    case "fulfilled": return "DELIVERED";
    case "partial": return "SHIPPED";
    default: return "PENDING";
  }
}
