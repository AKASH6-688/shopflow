import axios from "axios";

export interface WooCommerceConfig {
  siteUrl: string;
  consumerKey: string;
  consumerSecret: string;
}

export class WooCommerceIntegration {
  private baseUrl: string;
  private auth: { username: string; password: string };

  constructor(config: WooCommerceConfig) {
    this.baseUrl = `${config.siteUrl}/wp-json/wc/v3`;
    this.auth = {
      username: config.consumerKey,
      password: config.consumerSecret,
    };
  }

  async getProducts(limit = 50) {
    const res = await axios.get(`${this.baseUrl}/products`, {
      auth: this.auth,
      params: { per_page: limit },
    });
    return res.data.map((p: any) => ({
      externalId: String(p.id),
      name: p.name,
      description: p.short_description?.replace(/<[^>]*>/g, "") || "",
      sku: p.sku || "",
      price: parseFloat(p.price || "0"),
      comparePrice: p.regular_price ? parseFloat(p.regular_price) : null,
      imageUrl: p.images?.[0]?.src || null,
      category: p.categories?.[0]?.name || null,
      tags: p.tags?.map((t: any) => t.name) || [],
      inventory: p.stock_quantity || 0,
    }));
  }

  async getOrders(limit = 50) {
    const res = await axios.get(`${this.baseUrl}/orders`, {
      auth: this.auth,
      params: { per_page: limit },
    });
    return res.data.map((o: any) => ({
      externalId: String(o.id),
      orderNumber: String(o.number),
      status: mapWooStatus(o.status),
      subtotal: parseFloat(o.subtotal || "0"),
      shippingCost: parseFloat(o.shipping_total || "0"),
      tax: parseFloat(o.total_tax || "0"),
      discount: parseFloat(o.discount_total || "0"),
      total: parseFloat(o.total || "0"),
      paymentStatus: o.date_paid ? "PAID" : "PENDING",
      customer: {
        name: `${o.billing?.first_name || ""} ${o.billing?.last_name || ""}`.trim(),
        email: o.billing?.email || null,
        phone: o.billing?.phone || "",
        address: o.shipping
          ? `${o.shipping.address_1 || ""}, ${o.shipping.city || ""}`
          : null,
        city: o.shipping?.city || null,
        country: o.shipping?.country || null,
      },
      items: o.line_items?.map((li: any) => ({
        externalId: String(li.product_id),
        name: li.name,
        quantity: li.quantity,
        price: parseFloat(li.price || "0"),
      })) || [],
      createdAt: o.date_created,
    }));
  }

  async updateOrderStatus(orderId: string, status: string) {
    const wooStatus = mapToWooStatus(status);
    const res = await axios.put(
      `${this.baseUrl}/orders/${orderId}`,
      { status: wooStatus },
      { auth: this.auth }
    );
    return res.data;
  }

  async registerWebhook(topic: string, callbackUrl: string) {
    const res = await axios.post(
      `${this.baseUrl}/webhooks`,
      {
        name: `ShopFlow - ${topic}`,
        topic,
        delivery_url: callbackUrl,
        status: "active",
      },
      { auth: this.auth }
    );
    return res.data;
  }
}

function mapWooStatus(status: string) {
  switch (status) {
    case "completed": return "DELIVERED";
    case "processing": return "PROCESSING";
    case "on-hold": return "PENDING";
    case "cancelled": return "CANCELLED";
    case "refunded": return "RETURNED";
    default: return "PENDING";
  }
}

function mapToWooStatus(status: string) {
  switch (status) {
    case "DELIVERED": return "completed";
    case "PROCESSING": return "processing";
    case "SHIPPED": return "processing";
    case "CANCELLED": return "cancelled";
    default: return "on-hold";
  }
}
