// Custom store integration via REST API
// This is a generic adapter for custom e-commerce stores
// Store owners configure their own API endpoints

import axios from "axios";

export interface CustomStoreConfig {
  apiBaseUrl: string;
  apiKey: string;
  headers?: Record<string, string>;
}

export class CustomStoreIntegration {
  private baseUrl: string;
  private headers: Record<string, string>;

  constructor(config: CustomStoreConfig) {
    this.baseUrl = config.apiBaseUrl.replace(/\/$/, "");
    this.headers = {
      Authorization: `Bearer ${config.apiKey}`,
      "Content-Type": "application/json",
      ...(config.headers || {}),
    };
  }

  async getProducts(endpoint = "/products") {
    try {
      const res = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: this.headers,
      });
      const data = Array.isArray(res.data) ? res.data : res.data.products || res.data.data || [];
      return data.map((p: any) => ({
        externalId: String(p.id || p._id),
        name: p.name || p.title,
        description: p.description || "",
        sku: p.sku || "",
        price: parseFloat(p.price || "0"),
        comparePrice: p.compare_price || p.comparePrice || null,
        imageUrl: p.image || p.imageUrl || p.image_url || null,
        category: p.category || null,
        tags: p.tags || [],
        inventory: p.quantity || p.stock || p.inventory || 0,
      }));
    } catch {
      return [];
    }
  }

  async getOrders(endpoint = "/orders") {
    try {
      const res = await axios.get(`${this.baseUrl}${endpoint}`, {
        headers: this.headers,
      });
      const data = Array.isArray(res.data) ? res.data : res.data.orders || res.data.data || [];
      return data.map((o: any) => ({
        externalId: String(o.id || o._id),
        orderNumber: String(o.order_number || o.orderNumber || o.number || o.id),
        status: (o.status || "PENDING").toUpperCase(),
        subtotal: parseFloat(o.subtotal || "0"),
        shippingCost: parseFloat(o.shipping || o.shipping_cost || "0"),
        tax: parseFloat(o.tax || "0"),
        discount: parseFloat(o.discount || "0"),
        total: parseFloat(o.total || "0"),
        paymentStatus: (o.payment_status || o.paymentStatus || "PENDING").toUpperCase(),
        customer: {
          name: o.customer_name || o.customer?.name || "",
          email: o.customer_email || o.customer?.email || null,
          phone: o.customer_phone || o.customer?.phone || "",
          address: o.address || o.customer?.address || null,
          city: o.city || o.customer?.city || null,
          country: o.country || o.customer?.country || null,
        },
        items: (o.items || o.line_items || []).map((li: any) => ({
          externalId: String(li.product_id || li.productId || li.id),
          name: li.name || li.title,
          quantity: li.quantity || 1,
          price: parseFloat(li.price || "0"),
        })),
        createdAt: o.created_at || o.createdAt || new Date().toISOString(),
      }));
    } catch {
      return [];
    }
  }

  async pushOrderStatus(orderId: string, status: string, endpoint = "/orders") {
    try {
      await axios.put(
        `${this.baseUrl}${endpoint}/${orderId}`,
        { status },
        { headers: this.headers }
      );
      return true;
    } catch {
      return false;
    }
  }
}
