# REST & WebSocket API Specification

**Base URL**: `/api/v1`  
**Protocol**: HTTPS (REST) & WSS (Socket.io WebSockets)  
**Authentication**: Bearer JWT (`Authorization: Bearer <token>`)

---

## 1. Global Request & Response Conventions

All API responses strictly adhere to the standard JSON envelope structure:

### Success Response
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Resource retrieved successfully",
  "data": { ... },
  "meta": {
    "page": 1,
    "limit": 20,
    "totalItems": 142,
    "totalPages": 8
  }
}
```

### Error Response
```json
{
  "success": false,
  "statusCode": 400,
  "error": "Bad Request",
  "message": [
    "fabricId must be a valid UUID",
    "customMeasurements.bust must be a positive number"
  ],
  "timestamp": "2026-09-30T13:14:00.000Z",
  "path": "/api/v1/custom-requests"
}
```

---

## 2. Authentication & Profile Endpoints (`/api/v1/auth`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | Public | Register new customer account |
| `POST` | `/auth/login` | Public | Authenticate with email/phone & password |
| `POST` | `/auth/refresh` | Public | Exchange refresh token for fresh access token |
| `POST` | `/auth/forgot-password` | Public | Initiate password reset flow |
| `POST` | `/auth/reset-password` | Public | Complete password reset using reset token |
| `POST` | `/auth/verify-otp` | Public | Verify SMS/Email OTP during signup or login |
| `POST` | `/auth/logout` | Authenticated | Invalidate refresh token and log audit |
| `GET` | `/auth/me` | Authenticated | Fetch authenticated user profile & permissions |

#### Register Payload Example
```json
{
  "email": "sarah.khan@example.com",
  "phoneNumber": "+923001234567",
  "password": "SecurePassword123!",
  "firstName": "Sarah",
  "lastName": "Khan"
}
```

---

## 3. Brand & Global Configuration (`/api/v1/brand`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/brand` | Public | Retrieve active brand identity, theme colors, logos, and contacts |
| `PATCH` | `/brand` | Admin | Update brand configuration, social links, and theme palettes |
| `POST` | `/brand/assets` | Admin | Upload new brand logo, favicon, or luxury background banners |

---

## 4. Catalog & Master Data Endpoints

### 4.1 Products (`/api/v1/products`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/products` | Public | List products (filters: category, price, colour, fabric, search) |
| `GET` | `/products/:id` | Public | Get product details with variants, images, size charts |
| `POST` | `/products` | Admin / Designer | Create a new luxury ready-to-wear product |
| `PATCH` | `/products/:id` | Admin / Designer | Update product details, pricing, customization flags |
| `DELETE` | `/products/:id` | Admin | Soft delete product |

### 4.2 Categories, Colours & Sizing
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/categories` | Public | Hierarchical category tree (Bridal, Formal, Pret, Bespoke) |
| `POST` | `/categories` | Admin | Create category |
| `GET` | `/colours` | Public | Retrieve standard colour palette & hex codes |
| `GET` | `/sizes` | Public | Retrieve standard size codes (XS to XXL, Custom) |
| `GET` | `/size-charts` | Public | Retrieve size measurement charts by category |

### 4.3 Fabrics & Craftsmanship
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/fabrics` | Public | Retrieve available luxury fabrics & swatch imagery |
| `GET` | `/craft-options` | Public | Retrieve craft techniques (Zardozi, Resham, Crochet, etc.) |

---

## 5. Custom Design Request Endpoints (`/api/v1/custom-requests`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/custom-requests` | Customer | Create a new custom design draft request |
| `GET` | `/custom-requests` | Authenticated | List custom requests (scoped to customer; or agent/admin) |
| `GET` | `/custom-requests/:id` | Authenticated | Get custom request detail, files, current quotation |
| `PATCH` | `/custom-requests/:id` | Authenticated | Update custom request details (before submission) |
| `POST` | `/custom-requests/:id/files/presign` | Customer / Staff | Get signed S3 upload URLs for inspiration images |
| `POST` | `/custom-requests/:id/files` | Customer / Staff | Confirm uploaded file metadata into database |
| `GET` | `/custom-requests/:id/files` | Authenticated | Retrieve secure signed download URLs for design files |
| `POST` | `/custom-requests/:id/submit` | Customer | Submit custom request for review & quotation preparation |

#### Create Custom Request Payload Example
```json
{
  "referencedProductId": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "colourPreference": "Emerald Green with Antique Gold Accents",
  "fabricId": "9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d",
  "craftOptionIds": [
    "e2b4f910-1c6d-4b8e-8a1a-3a79d8f31b20",
    "c8a14b52-5d41-4c6e-9310-7e189d91f89a"
  ],
  "sizingMode": "CUSTOM",
  "customMeasurements": {
    "bust": 36.5,
    "waist": 29.0,
    "hips": 39.5,
    "shoulder": 15.0,
    "shirtLength": 46.0,
    "sleeveLength": 22.5,
    "armhole": 17.0,
    "frontNeckDepth": 7.5,
    "backNeckDepth": 4.0,
    "trouserWaist": 30.0,
    "trouserLength": 38.0,
    "inseam": 29.0
  },
  "designNotes": "Need heavier Zardozi handwork along the neckline and hem. Delicate crochet lace finishing on sleeves.",
  "customerBudget": 185000,
  "expectedDeliveryDate": "2026-11-20"
}
```

---

## 6. Quotation & Revision Engine (`/api/v1/quotations`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `POST` | `/custom-requests/:id/quotations` | Designer / Admin | Create a new quotation version (V1, V2, V3...) |
| `GET` | `/custom-requests/:id/quotations` | Authenticated | List all quotation versions for a request |
| `GET` | `/quotations/:id` | Authenticated | Get full breakdown of a specific quotation version |
| `POST` | `/quotations/:id/send` | Designer / Admin | Finalize and send quotation to customer |
| `POST` | `/quotations/:id/accept` | Customer | Accept quotation & convert into order |
| `POST` | `/quotations/:id/request-changes` | Customer | Request quotation changes (triggers designer revision) |

#### Request Changes Payload Example
```json
{
  "changeNotes": "Can we switch the dupatta fabric from Raw Silk to Organza and reduce the heavy border embroidery to bring cost closer to 160,000 PKR?"
}
```

---

## 7. Order & Payment Endpoints (`/api/v1/orders`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/orders` | Authenticated | List orders (filtered by customer, or staff overview) |
| `GET` | `/orders/:id` | Authenticated | Get order details, item specs, payment status |
| `POST` | `/orders` | Customer | Create order from ready-to-wear shopping cart |
| `POST` | `/orders/:id/pay` | Customer | Initiate payment gateway transaction (Stripe/Card/COD) |
| `POST` | `/orders/webhook/payment` | Public (Signed) | Webhook endpoint for payment gateway callbacks |
| `GET` | `/orders/:id/tracking` | Authenticated | Real-time production and shipping tracking events |

---

## 8. Production & Quality Control (`/api/v1/production`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/production/jobs` | Staff | List active production jobs (filter by stage, assignee) |
| `GET` | `/production/jobs/:id` | Staff | Get production job details, specs, timeline, updates |
| `PATCH` | `/production/jobs/:id/status` | Production / Admin | Advance production status (e.g. CUTTING -> STITCHING) |
| `POST` | `/production/jobs/:id/updates` | Production / Admin | Post stage update with progress notes and photos |
| `POST` | `/production/jobs/:id/qc` | Production / Admin | Submit formal quality control inspection checklist |

---

## 9. CRM, Leads & Campaigns

### 9.1 Leads (`/api/v1/leads`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/leads` | Agent / Admin | List leads (filtered by assigned agent, status, campaign) |
| `GET` | `/leads/:id` | Agent / Admin | Get lead details and activity timeline |
| `POST` | `/leads` | Agent / Admin | Manually create new lead |
| `PATCH` | `/leads/:id` | Agent / Admin | Update lead status, priority, or details |
| `POST` | `/leads/:id/assign` | Admin | Assign or reassign lead to a specific agent |
| `POST` | `/leads/:id/activities` | Agent / Admin | Log a call, WhatsApp chat, meeting, or follow-up note |
| `GET` | `/leads/:id/activities` | Agent / Admin | Get activity log for lead |

### 9.2 Agent Portal (`/api/v1/agents`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/agents/me` | Agent | Get current agent profile, metrics, capacity |
| `GET` | `/agents/me/leads` | Agent | Get assigned leads requiring follow-up |
| `GET` | `/agents/me/tasks` | Agent | Get scheduled follow-ups and pending tasks |

### 9.3 Campaigns (`/api/v1/campaigns`)
| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/campaigns` | Admin | List marketing campaigns and performance metrics |
| `POST` | `/campaigns` | Admin | Create campaign with UTM tags and budget |
| `PATCH` | `/campaigns/:id` | Admin | Update campaign settings or active status |

---

## 10. Admin & Business Intelligence (`/api/v1/admin`)

| Method | Endpoint | Access | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/admin/dashboard` | Admin | High-level metrics: revenue, quotes, active jobs, leads |
| `GET` | `/admin/orders` | Admin | Comprehensive order management table |
| `GET` | `/admin/custom-requests` | Admin | Global custom design requests across all designers |
| `GET` | `/admin/leads` | Admin | Lead pipeline overview, agent conversion rates |
| `GET` | `/admin/quotations` | Admin | Quotation status breakdown & conversion metrics |
| `GET` | `/admin/production` | Admin | Production floor workload and bottleneck analytics |
| `GET` | `/admin/analytics` | Admin | Deep analytics: revenue, craft popularity, turnaround times |

---

## 11. Real-time WebSocket Protocol (Socket.io)

### Namespaces
- `/ws/custom-requests`: Real-time quote alerts, designer notes, and customer change requests.
- `/ws/production`: Real-time stage progression and QC status alerts for shop floor & tracking.
- `/ws/notifications`: General user notification push.

### Standard Events
- `client:join_room`: Join room based on entity UUID (`request_{id}`, `order_{id}`, `user_{id}`).
- `server:quote_issued`: Broadcast when a new quotation version is published.
- `server:revision_requested`: Broadcast when customer requests changes to a quote.
- `server:production_updated`: Broadcast when cutting, stitching, or crafting completes.
- `server:notification`: Direct user alerts (e.g. quote ready, order confirmed).
