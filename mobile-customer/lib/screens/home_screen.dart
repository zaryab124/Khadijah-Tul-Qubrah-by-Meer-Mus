import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants/colors.dart';
import '../core/models/product_model.dart';
import '../core/services/api_service.dart';
import 'custom_design_screen.dart';
import 'product_detail_screen.dart';

class HomeScreen extends StatefulWidget {
  final VoidCallback? onNavigateToShop;
  final VoidCallback? onNavigateToCustom;

  const HomeScreen({
    super.key,
    this.onNavigateToShop,
    this.onNavigateToCustom,
  });

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final ApiService _apiService = ApiService();
  List<ProductModel> _featuredProducts = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadFeatured();
  }

  Future<void> _loadFeatured() async {
    final products = await _apiService.fetchProducts();
    if (mounted) {
      setState(() {
        _featuredProducts = products;
        _isLoading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);

    return Scaffold(
      appBar: AppBar(
        title: const Text('KHADIJAH-TUL-QUBRAH'),
        actions: [
          IconButton(
            icon: const Icon(Icons.shopping_bag_outlined, color: BrandColors.gold),
            onPressed: widget.onNavigateToShop,
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Signature subtitle
            const Center(
              child: Text(
                'BY MEER & MUS • HAUTE COUTURE',
                style: TextStyle(
                  color: BrandColors.gold,
                  fontSize: 11,
                  letterSpacing: 3.5,
                  fontWeight: FontWeight.w500,
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Seasonal Campaign Banner (Phase 9 attribution integration)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
                decoration: BoxDecoration(
                  color: BrandColors.velvetCrimson.withOpacity(0.4),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(color: BrandColors.gold.withOpacity(0.5)),
                ),
                child: Row(
                  children: [
                    const Icon(Icons.celebration, color: BrandColors.gold, size: 18),
                    const SizedBox(width: 10),
                    Expanded(
                      child: RichText(
                        text: const TextSpan(
                          style: TextStyle(color: BrandColors.ivory, fontSize: 11),
                          children: [
                            TextSpan(text: 'ROYAL HEIRLOOM CAMPAIGN  •  Use Code '),
                            TextSpan(
                              text: 'SUMMER26',
                              style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold),
                            ),
                            TextSpan(text: ' for VIP consultation'),
                          ],
                        ),
                      ),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 16),

            // Hero "Create Your Own" Bespoke Studio Banner
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Container(
                width: double.infinity,
                padding: const EdgeInsets.all(22.0),
                decoration: BoxDecoration(
                  gradient: const LinearGradient(
                    colors: [BrandColors.emerald, BrandColors.cardDark],
                    begin: Alignment.topLeft,
                    end: Alignment.bottomRight,
                  ),
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(color: BrandColors.borderGold, width: 1.5),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.4),
                      blurRadius: 10,
                      offset: const Offset(0, 4),
                    ),
                  ],
                ),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Row(
                      children: [
                        Icon(Icons.auto_awesome, color: BrandColors.gold, size: 18),
                        SizedBox(width: 8),
                        Text(
                          'BESPOKE COUTURE ATELIER',
                          style: TextStyle(
                            color: BrandColors.gold,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 2.0,
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 10),
                    const Text(
                      'Create Your Own\nMasterpiece',
                      style: TextStyle(
                        color: BrandColors.ivory,
                        fontSize: 24,
                        fontWeight: FontWeight.w600,
                        fontFamily: 'serif',
                        height: 1.2,
                      ),
                    ),
                    const SizedBox(height: 8),
                    const Text(
                      'Sculpted from Micro Velvet 9000 & pure loomed silks. Hand-embellished with 24k metallic tilla, dabka and antique zardozi by master karigars.',
                      style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                    ),
                    const SizedBox(height: 18),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: BrandColors.gold,
                        foregroundColor: BrandColors.surfaceDark,
                        padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
                      ),
                      onPressed: () {
                        if (widget.onNavigateToCustom != null) {
                          widget.onNavigateToCustom!();
                        } else {
                          Navigator.push(
                            context,
                            MaterialPageRoute(builder: (context) => const CustomDesignScreen()),
                          );
                        }
                      },
                      child: const Text('ENTER BESPOKE STUDIO', style: TextStyle(fontSize: 12, fontWeight: FontWeight.bold)),
                    ),
                  ],
                ),
              ),
            ),

            const SizedBox(height: 28),

            // Categories Section
            const Padding(
              padding: EdgeInsets.symmetric(horizontal: 16.0),
              child: Text(
                'COLLECTION CATEGORIES',
                style: TextStyle(
                  color: BrandColors.gold,
                  fontSize: 11,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 2.0,
                ),
              ),
            ),
            const SizedBox(height: 12),
            SizedBox(
              height: 40,
              child: ListView(
                scrollDirection: Axis.horizontal,
                padding: const EdgeInsets.symmetric(horizontal: 16.0),
                children: [
                  _buildCategoryChip('Bridal Heirloom', true),
                  _buildCategoryChip('Haute Couture', false),
                  _buildCategoryChip('Luxury Formal Pret', false),
                  _buildCategoryChip('Handcrafted Shawls', false),
                ],
              ),
            ),

            const SizedBox(height: 28),

            // Featured Pieces Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16.0),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'Featured Creations',
                    style: TextStyle(
                      color: BrandColors.ivory,
                      fontSize: 20,
                      fontFamily: 'serif',
                    ),
                  ),
                  GestureDetector(
                    onTap: widget.onNavigateToShop,
                    child: const Row(
                      children: [
                        Text(
                          'VIEW ALL',
                          style: TextStyle(
                            color: BrandColors.gold,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 1.2,
                          ),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.arrow_forward_ios, size: 10, color: BrandColors.gold),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 14),

            // Featured Products Horizontal Scroll
            SizedBox(
              height: 270,
              child: _isLoading
                  ? const Center(child: CircularProgressIndicator(color: BrandColors.gold))
                  : ListView.builder(
                      scrollDirection: Axis.horizontal,
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: _featuredProducts.length,
                      itemBuilder: (context, index) {
                        final product = _featuredProducts[index];
                        final imgUrl = product.imageUrls.isNotEmpty
                            ? product.imageUrls.first
                            : 'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80';

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
                            width: 175,
                            margin: const EdgeInsets.only(right: 14),
                            decoration: BoxDecoration(
                              color: BrandColors.cardDark,
                              borderRadius: BorderRadius.circular(12),
                              border: Border.all(color: BrandColors.cardDark),
                              boxShadow: [
                                BoxShadow(
                                  color: Colors.black.withOpacity(0.3),
                                  blurRadius: 8,
                                  offset: const Offset(0, 3),
                                ),
                              ],
                            ),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Expanded(
                                  child: ClipRRect(
                                    borderRadius: const BorderRadius.vertical(top: Radius.circular(12)),
                                    child: Image.network(
                                      imgUrl,
                                      fit: BoxFit.cover,
                                      width: double.infinity,
                                    ),
                                  ),
                                ),
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
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 3),
                                      Text(
                                        product.name,
                                        style: const TextStyle(
                                          color: BrandColors.ivory,
                                          fontSize: 12,
                                          fontWeight: FontWeight.w600,
                                          fontFamily: 'serif',
                                        ),
                                        maxLines: 1,
                                        overflow: TextOverflow.ellipsis,
                                      ),
                                      const SizedBox(height: 4),
                                      Text(
                                        currencyFormatter.format(product.basePrice),
                                        style: const TextStyle(
                                          color: BrandColors.ivory,
                                          fontSize: 12,
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

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildCategoryChip(String title, bool isSelected) {
    return GestureDetector(
      onTap: widget.onNavigateToShop,
      child: Container(
        margin: const EdgeInsets.only(right: 8),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        decoration: BoxDecoration(
          color: isSelected ? BrandColors.gold : BrandColors.cardDark,
          borderRadius: BorderRadius.circular(20),
          border: Border.all(
            color: isSelected ? BrandColors.gold : BrandColors.borderGold.withOpacity(0.3),
          ),
        ),
        child: Center(
          child: Text(
            title,
            style: TextStyle(
              color: isSelected ? BrandColors.surfaceDark : BrandColors.ivory,
              fontSize: 12,
              fontWeight: isSelected ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ),
      ),
    );
  }
}
