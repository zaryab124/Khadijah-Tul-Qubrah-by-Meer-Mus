import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants/colors.dart';
import '../core/models/product_model.dart';
import '../core/services/api_service.dart';
import 'product_detail_screen.dart';

class ShopScreen extends StatefulWidget {
  const ShopScreen({super.key});

  @override
  State<ShopScreen> createState() => _ShopScreenState();
}

class _ShopScreenState extends State<ShopScreen> {
  final ApiService _apiService = ApiService();
  List<ProductModel> _allProducts = [];
  List<ProductModel> _filteredProducts = [];
  bool _isLoading = true;
  String _selectedCategory = 'ALL';
  final TextEditingController _searchController = TextEditingController();

  final List<String> _categories = [
    'ALL',
    'Bridal Couture',
    'Haute Couture',
    'Luxury Pret',
  ];

  @override
  void initState() {
    super.initState();
    _loadProducts();
    _searchController.addListener(_filterProducts);
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  Future<void> _loadProducts() async {
    setState(() => _isLoading = true);
    final products = await _apiService.fetchProducts();
    if (mounted) {
      setState(() {
        _allProducts = products;
        _isLoading = false;
        _filterProducts();
      });
    }
  }

  void _filterProducts() {
    final query = _searchController.text.toLowerCase().trim();
    setState(() {
      _filteredProducts = _allProducts.where((p) {
        final matchesCategory = _selectedCategory == 'ALL' ||
            p.category.toLowerCase().contains(_selectedCategory.toLowerCase());
        final matchesQuery = query.isEmpty ||
            p.name.toLowerCase().contains(query) ||
            p.description.toLowerCase().contains(query) ||
            p.sku.toLowerCase().contains(query);
        return matchesCategory && matchesQuery;
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('HAUTE ATELIER SHOP'),
      ),
      body: RefreshIndicator(
        color: BrandColors.gold,
        backgroundColor: BrandColors.cardDark,
        onRefresh: _loadProducts,
        child: Column(
          children: [
            // Search Bar
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 8, 16, 12),
              child: Container(
                decoration: BoxDecoration(
                  color: BrandColors.cardDark,
                  borderRadius: BorderRadius.circular(10),
                  border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
                ),
                child: TextField(
                  controller: _searchController,
                  style: const TextStyle(color: BrandColors.ivory, fontSize: 14),
                  decoration: const InputDecoration(
                    hintText: 'Search heirloom garments, velvets, zardozi...',
                    hintStyle: TextStyle(color: Colors.white38, fontSize: 13),
                    prefixIcon: Icon(Icons.search, color: BrandColors.gold, size: 20),
                    border: InputBorder.none,
                    contentPadding: EdgeInsets.symmetric(vertical: 14),
                  ),
                ),
              ),
            ),

            // Category Filter Chips
            SizedBox(
              height: 42,
              child: ListView.builder(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16),
                itemCount: _categories.length,
                itemBuilder: (context, index) {
                  final cat = _categories[index];
                  final isSelected = _selectedCategory == cat;
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: ChoiceChip(
                      label: Text(cat),
                      selected: isSelected,
                      selectedColor: BrandColors.gold,
                      backgroundColor: BrandColors.cardDark,
                      labelStyle: TextStyle(
                        color: isSelected ? BrandColors.surfaceDark : BrandColors.ivory,
                        fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
                        fontSize: 12,
                        letterSpacing: 0.8,
                      ),
                      side: BorderSide(
                        color: isSelected ? BrandColors.gold : BrandColors.borderGold.withOpacity(0.3),
                      ),
                      onSelected: (selected) {
                        if (selected) {
                          setState(() {
                            _selectedCategory = cat;
                            _filterProducts();
                          });
                        }
                      },
                    ),
                  );
                },
              ),
            ),

            const SizedBox(height: 12),

            // Product Grid or Empty State
            Expanded(
              child: _isLoading
                  ? const Center(
                      child: CircularProgressIndicator(color: BrandColors.gold),
                    )
                  : _filteredProducts.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.search_off, size: 48, color: Colors.white38),
                              const SizedBox(height: 12),
                              const Text(
                                'No couture pieces match your criteria',
                                style: TextStyle(color: Colors.white70, fontSize: 14),
                              ),
                              const SizedBox(height: 8),
                              TextButton(
                                onPressed: () {
                                  _searchController.clear();
                                  setState(() {
                                    _selectedCategory = 'ALL';
                                    _filterProducts();
                                  });
                                },
                                child: const Text(
                                  'RESET FILTERS',
                                  style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold),
                                ),
                              ),
                            ],
                          ),
                        )
                      : GridView.builder(
                          padding: const EdgeInsets.all(16),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 2,
                            childAspectRatio: 0.62,
                            crossAxisSpacing: 14,
                            mainAxisSpacing: 14,
                          ),
                          itemCount: _filteredProducts.length,
                          itemBuilder: (context, index) {
                            final product = _filteredProducts[index];
                            final imageUrl = product.imageUrls.isNotEmpty
                                ? product.imageUrls.first
                                : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=800&q=80';

                            return GestureDetector(
                              onTap: () {
                                Navigator.push(
                                  context,
                                  MaterialPageRoute(
                                    builder: (context) => ProductDetailScreen(product: product),
                                  ),
                                );
                              },
                              child: Container(
                                decoration: BoxDecoration(
                                  color: BrandColors.cardDark,
                                  borderRadius: BorderRadius.circular(12),
                                  border: Border.all(color: BrandColors.cardDark),
                                  boxShadow: [
                                    BoxShadow(
                                      color: Colors.black.withOpacity(0.3),
                                      blurRadius: 8,
                                      offset: const Offset(0, 4),
                                    ),
                                  ],
                                ),
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    // Product Image Container
                                    Expanded(
                                      child: Stack(
                                        children: [
                                          Container(
                                            decoration: BoxDecoration(
                                              borderRadius: const BorderRadius.vertical(
                                                top: Radius.circular(12),
                                              ),
                                              image: DecorationImage(
                                                image: NetworkImage(imageUrl),
                                                fit: BoxFit.cover,
                                              ),
                                            ),
                                          ),
                                          if (product.isCustomizable)
                                            Positioned(
                                              top: 8,
                                              right: 8,
                                              child: Container(
                                                padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                                                decoration: BoxDecoration(
                                                  color: BrandColors.surfaceDark.withOpacity(0.85),
                                                  borderRadius: BorderRadius.circular(4),
                                                  border: Border.all(color: BrandColors.gold, width: 0.8),
                                                ),
                                                child: const Row(
                                                  mainAxisSize: MainAxisSize.min,
                                                  children: [
                                                    Icon(Icons.auto_awesome, color: BrandColors.gold, size: 10),
                                                    SizedBox(width: 3),
                                                    Text(
                                                      'BESPOKE',
                                                      style: TextStyle(
                                                        color: BrandColors.gold,
                                                        fontSize: 9,
                                                        fontWeight: FontWeight.bold,
                                                      ),
                                                    ),
                                                  ],
                                                ),
                                              ),
                                            ),
                                        ],
                                      ),
                                    ),
                                    // Product Info
                                    Padding(
                                      padding: const EdgeInsets.all(10.0),
                                      child: Column(
                                        crossAxisAlignment: CrossAxisAlignment.start,
                                        children: [
                                          Text(
                                            product.category.toUpperCase(),
                                            style: const TextStyle(
                                              color: BrandColors.gold,
                                              fontSize: 9,
                                              fontWeight: FontWeight.bold,
                                              letterSpacing: 1.0,
                                            ),
                                            maxLines: 1,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 3),
                                          Text(
                                            product.name,
                                            style: const TextStyle(
                                              color: BrandColors.ivory,
                                              fontSize: 13,
                                              fontWeight: FontWeight.w600,
                                              fontFamily: 'serif',
                                              height: 1.2,
                                            ),
                                            maxLines: 2,
                                            overflow: TextOverflow.ellipsis,
                                          ),
                                          const SizedBox(height: 6),
                                          Text(
                                            currencyFormatter.format(product.basePrice),
                                            style: const TextStyle(
                                              color: BrandColors.ivory,
                                              fontSize: 13,
                                              fontWeight: FontWeight.bold,
                                            ),
                                          ),
                                        ],
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                            );
                          },
                        ),
            ),
          ],
        ),
      ),
    );
  }
}
