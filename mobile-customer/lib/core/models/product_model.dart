class ProductModel {
  final String id;
  final String name;
  final String sku;
  final String description;
  final double basePrice;
  final bool isCustomizable;
  final String category;
  final List<String> imageUrls;
  final List<String> availableColours;
  final List<String> availableSizes;
  final String defaultFabric;
  final String defaultCraft;

  ProductModel({
    required this.id,
    required this.name,
    required this.sku,
    required this.description,
    required this.basePrice,
    required this.isCustomizable,
    required this.category,
    required this.imageUrls,
    required this.availableColours,
    required this.availableSizes,
    required this.defaultFabric,
    required this.defaultCraft,
  });

  factory ProductModel.fromJson(Map<String, dynamic> json) {
    return ProductModel(
      id: json['id'] ?? '',
      name: json['name'] ?? '',
      sku: json['sku'] ?? '',
      description: json['description'] ?? '',
      basePrice: (json['basePrice'] is num)
          ? (json['basePrice'] as num).toDouble()
          : double.tryParse(json['basePrice']?.toString() ?? '0') ?? 0.0,
      isCustomizable: json['isCustomizable'] ?? true,
      category: json['category']?['name'] ?? json['categoryName'] ?? 'Haute Couture',
      imageUrls: (json['images'] as List?)
              ?.map((img) => img['cdnUrl']?.toString() ?? '')
              .where((url) => url.isNotEmpty)
              .toList() ??
          [],
      availableColours: (json['colours'] as List?)
              ?.map((c) => c['name']?.toString() ?? '')
              .toList() ??
          ['Royal Emerald Green', 'Antique Gold', 'Deep Crimson Velvet', 'Pristine Ivory'],
      availableSizes: (json['sizes'] as List?)
              ?.map((s) => s['name']?.toString() ?? '')
              .toList() ??
          ['XS', 'S', 'M', 'L', 'XL', 'Custom Bespoke'],
      defaultFabric: json['fabric']?['name'] ?? 'Micro Velvet 9000',
      defaultCraft: json['craft']?['name'] ?? 'Zardozi Handwork',
    );
  }
}
