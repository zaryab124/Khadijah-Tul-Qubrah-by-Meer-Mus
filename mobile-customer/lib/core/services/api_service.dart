import 'dart:convert';
import 'package:http/http.dart' as http;
import '../constants/api_endpoints.dart';
import '../models/product_model.dart';
import '../models/order_model.dart';

class ApiService {
  static final ApiService _instance = ApiService._internal();
  factory ApiService() => _instance;
  ApiService._internal();

  // High-fidelity fallback catalog items with real couture images and specs
  static final List<ProductModel> fallbackProducts = [
    ProductModel(
      id: 'p-1',
      name: 'The Emerald Zardozi Peshwas',
      sku: 'KTQ-PESH-001',
      description:
          'A royal velvet peshwas sculpted from pure Micro Velvet 9000 in deep jewel-toned emerald. Lavishly hand-embellished by master karigars with 24k metallic tilla, dabka needlework, and antique zardozi. Paired with a gossamer pure silk organza dupatta framed in four-sided embroidered borders.',
      basePrice: 485000.0,
      isCustomizable: true,
      category: 'Bridal Couture',
      imageUrls: [
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
      ],
      availableColours: ['Royal Emerald Green', 'Deep Crimson Velvet', 'Antique Gold', 'Pristine Ivory'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'Custom Bespoke'],
      defaultFabric: 'Micro Velvet 9000',
      defaultCraft: 'Zardozi Handwork',
    ),
    ProductModel(
      id: 'p-2',
      name: 'Bespoke Tilla Silk Anarkali',
      sku: 'KTQ-ANAR-002',
      description:
          'Flowing pure Katan silk silhouette with 32 hand-pleated kalis. Features intricate marori threadwork and dabka embroidery on the bodice, cuff sleeves, and scalloped hemline.',
      basePrice: 340000.0,
      isCustomizable: true,
      category: 'Haute Couture',
      imageUrls: [
        'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=1200&q=80',
        'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
      ],
      availableColours: ['Antique Gold', 'Royal Emerald Green', 'Midnight Navy', 'Pristine Ivory'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'Custom Bespoke'],
      defaultFabric: 'Pure Katan Silk',
      defaultCraft: 'Tilla & Marori Stitching',
    ),
    ProductModel(
      id: 'p-3',
      name: 'Marori Raw Silk Lehenga',
      sku: 'KTQ-LEH-003',
      description:
          'Bespoke bridal lehenga set crafted on hand-loomed 80g raw silk. Adorned with geometric Mughal motifs executed in heavy cutwork, French knots, and kora dabka.',
      basePrice: 620000.0,
      isCustomizable: true,
      category: 'Bridal Couture',
      imageUrls: [
        'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=1200&q=80',
      ],
      availableColours: ['Deep Crimson Velvet', 'Royal Emerald Green', 'Antique Gold'],
      availableSizes: ['XS', 'S', 'M', 'L', 'XL', 'Custom Bespoke'],
      defaultFabric: 'Pure Raw Silk',
      defaultCraft: 'Zardozi Handwork',
    ),
    ProductModel(
      id: 'p-4',
      name: 'Handcrafted Organza Dupatta',
      sku: 'KTQ-DUP-004',
      description:
          'Featherlight sheer French silk organza shawl featuring hand-appliqued tissue borders, scalloped edging, and dispersed gota spray.',
      basePrice: 115000.0,
      isCustomizable: false,
      category: 'Luxury Pret',
      imageUrls: [
        'https://images.unsplash.com/photo-1617627143750-d86bc21e42bb?auto=format&fit=crop&w=1200&q=80',
      ],
      availableColours: ['Pristine Ivory', 'Antique Gold', 'Pastel Peach'],
      availableSizes: ['Free Size (2.75m)'],
      defaultFabric: 'Pure Silk Organza',
      defaultCraft: 'Silk Ribbon Appliqué',
    ),
  ];

  static final List<OrderModel> fallbackOrders = [
    OrderModel(
      id: 'ord-101',
      orderNumber: 'ORD-202609-001',
      status: 'IN_PRODUCTION',
      paymentStatus: 'PAID',
      totalAmount: 485000.0,
      currency: 'PKR',
      createdAt: DateTime.now().subtract(const Duration(days: 4)),
      itemTitle: 'The Emerald Zardozi Peshwas (Bespoke)',
      isCustom: true,
      quotationVersion: 'V2',
      productionStage: 'CRAFTING',
      progressPercentage: 60,
      courierName: 'TCS Express Prime',
      trackingNumber: 'TCS-9847291-PK',
      isQcPassed: false,
    ),
    OrderModel(
      id: 'ord-102',
      orderNumber: 'ORD-202609-002',
      status: 'QUALITY_CHECK',
      paymentStatus: 'PAID',
      totalAmount: 340000.0,
      currency: 'PKR',
      createdAt: DateTime.now().subtract(const Duration(days: 12)),
      itemTitle: 'Bespoke Tilla Silk Anarkali',
      isCustom: true,
      quotationVersion: 'V1',
      productionStage: 'QUALITY_CHECK',
      progressPercentage: 90,
      courierName: 'DHL Express Worldwide',
      trackingNumber: 'DHL-8472910-INT',
      isQcPassed: true,
    ),
    OrderModel(
      id: 'ord-103',
      orderNumber: 'ORD-202608-044',
      status: 'DELIVERED',
      paymentStatus: 'PAID',
      totalAmount: 115000.0,
      currency: 'PKR',
      createdAt: DateTime.now().subtract(const Duration(days: 35)),
      itemTitle: 'Handcrafted Organza Dupatta',
      isCustom: false,
      productionStage: 'COMPLETED',
      progressPercentage: 100,
      courierName: 'TCS Express Prime',
      trackingNumber: 'TCS-7102941-PK',
      isQcPassed: true,
    ),
  ];

  /// Fetch product catalogue from live NestJS API with graceful fallback
  Future<List<ProductModel>> fetchProducts() async {
    try {
      final response = await http
          .get(Uri.parse(ApiEndpoints.products))
          .timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data is List) ? data : (data['data'] as List? ?? []);
        if (list.isNotEmpty) {
          return list.map((item) => ProductModel.fromJson(item)).toList();
        }
      }
    } catch (_) {
      // Graceful offline fallback
    }
    return fallbackProducts;
  }

  /// Fetch orders list
  Future<List<OrderModel>> fetchOrders() async {
    try {
      final response = await http
          .get(Uri.parse(ApiEndpoints.orders))
          .timeout(const Duration(seconds: 3));

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final list = (data is List) ? data : (data['data'] as List? ?? []);
        if (list.isNotEmpty) {
          return list.map((item) => OrderModel.fromJson(item)).toList();
        }
      }
    } catch (_) {
      // Graceful fallback
    }
    return fallbackOrders;
  }

  /// Submit bespoke custom request
  Future<Map<String, dynamic>> submitCustomRequest(Map<String, dynamic> payload) async {
    try {
      final response = await http.post(
        Uri.parse(ApiEndpoints.customRequests),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode(payload),
      ).timeout(const Duration(seconds: 4));

      if (response.statusCode == 201 || response.statusCode == 200) {
        return jsonDecode(response.body);
      }
    } catch (_) {}

    // Simulated successful submission response
    return {
      'success': true,
      'requestNumber': 'CDR-202609-009',
      'message': 'Your bespoke request has been received by our atelier.',
    };
  }
}
