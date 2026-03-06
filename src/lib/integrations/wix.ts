import axios from "axios";

export interface WixConfig {
  apiKey: string;
  siteId: string;
}

export class WixIntegration {
  private headers: Record<string, string>;
  private siteId: string;

  constructor(config: WixConfig) {
    this.siteId = config.siteId;
    this.headers = {
      Authorization: config.apiKey,
      "wix-site-id": config.siteId,
      "Content-Type": "application/json",
    };
  }

  async getProducts(limit = 50) {
    const res = await axios.post(
      "https://www.wixapis.com/stores/v1/products/query",
      {
        query: { paging: { limit } },
      },
      { headers: this.headers }
    );
    return res.data.products?.map((p: any) => ({
      externalId: p.id,
      name: p.name,
      description: p.description?.replace(/<[^>]*>/g, "") || "",
      sku: p.sku || "",
      price: p.price?.price || 0,
      comparePrice: p.price?.discountedPrice !== p.price?.price
        ? p.price?.price
        : null,
      imageUrl: p.media?.mainMedia?.image?.url || null,
      category: p.productType || null,
      tags: [],
      inventory: p.stock?.quantity || 0,
    })) || [];
  }

  async getOrders(limit = 50) {
    const res = await axios.post(
      "https://www.wixapis.com/stores/v2/orders/query",
      {
        query: { paging: { limit } },
      },
      { headers: this.headers }
    );
    return res.data.orders?.map((o: any) => ({
      externalId: o.id,
      orderNumber: String(o.number),
      status: mapWixStatus(o.fulfillmentStatus),
      subtotal: o.totals?.subtotal || 0,
      shippingCost: o.totals?.shipping || 0,
      tax: o.totals?.tax || 0,
      discount: o.totals?.discount || 0,
      total: o.totals?.total || 0,
      paymentStatus: o.paymentStatus === "PAID" ? "PAID" : "PENDING",
      customer: {
        name: `${o.billingInfo?.firstName || ""} ${o.billingInfo?.lastName || ""}`.trim(),
        email: o.buyerInfo?.email || null,
        phone: o.buyerInfo?.phone || "",
        address: o.shippingInfo?.shipmentDetails?.address?.addressLine1 || null,
        city: o.shippingInfo?.shipmentDetails?.address?.city || null,
        country: o.shippingInfo?.shipmentDetails?.address?.country || null,
      },
      items: o.lineItems?.map((li: any) => ({
        externalId: li.catalogReference?.catalogItemId,
        name: li.name,
        quantity: li.quantity,
        price: li.price || 0,
      })) || [],
      createdAt: o.dateCreated,
    })) || [];
  }

  async registerWebhook(eventType: string, callbackUrl: string) {
    const res = await axios.post(
      "https://www.wixapis.com/webhooks/v1/hooks",
      {
        eventType,
        callbackUrl,
      },
      { headers: this.headers }
    );
    return res.data;
  }
}

function mapWixStatus(status: string) {
  switch (status) {
    case "FULFILLED": return "DELIVERED";
    case "PARTIALLY_FULFILLED": return "SHIPPED";
    case "CANCELED": return "CANCELLED";
    default: return "PENDING";
  }
}
