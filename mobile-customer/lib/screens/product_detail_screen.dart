import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants/colors.dart';
import '../core/models/product_model.dart';
import 'custom_design_screen.dart';

class ProductDetailScreen extends StatefulWidget {
  final ProductModel product;

  const ProductDetailScreen({super.key, required this.product});

  @override
  State<ProductDetailScreen> createState() => _ProductDetailScreenState();
}

class _ProductDetailScreenState extends State<ProductDetailScreen> {
  int _selectedImageIndex = 0;
  String _selectedColour = '';
  String _selectedSize = 'M';
  final PageController _pageController = PageController();

  @override
  void initState() {
    super.initState();
    if (widget.product.availableColours.isNotEmpty) {
      _selectedColour = widget.product.availableColours.first;
    }
    if (widget.product.availableSizes.isNotEmpty) {
      _selectedSize = widget.product.availableSizes.contains('M')
          ? 'M'
          : widget.product.availableSizes.first;
    }
  }

  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  void _showSizeChartModal() {
    showModalBottomSheet(
      context: context,
      backgroundColor: BrandColors.surfaceDark,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) {
        return Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text(
                    'ATELIER SIZE CHART',
                    style: TextStyle(
                      color: BrandColors.gold,
                      fontSize: 14,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 2.0,
                    ),
                  ),
                  IconButton(
                    icon: const Icon(Icons.close, color: Colors.white54),
                    onPressed: () => Navigator.pop(context),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              const Text(
                'All measurements are in inches. For custom tailoring, select "Customise This Piece" or "Custom Bespoke".',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
              const SizedBox(height: 16),
              Table(
                border: TableBorder.all(color: BrandColors.borderGold.withOpacity(0.3)),
                children: const [
                  TableRow(
                    decoration: BoxDecoration(color: BrandColors.cardDark),
                    children: [
                      Padding(padding: EdgeInsets.all(8), child: Text('Size', style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('Chest', style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('Waist', style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('Hip', style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('Length', style: TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold, fontSize: 11))),
                    ],
                  ),
                  TableRow(
                    children: [
                      Padding(padding: EdgeInsets.all(8), child: Text('XS (34)', style: TextStyle(color: BrandColors.ivory, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('34"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('26"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('36"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('56"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                    ],
                  ),
                  TableRow(
                    children: [
                      Padding(padding: EdgeInsets.all(8), child: Text('S (36)', style: TextStyle(color: BrandColors.ivory, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('36"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('28"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('38"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('57"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                    ],
                  ),
                  TableRow(
                    children: [
                      Padding(padding: EdgeInsets.all(8), child: Text('M (38)', style: TextStyle(color: BrandColors.ivory, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('38"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('30"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('40"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('58"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                    ],
                  ),
                  TableRow(
                    children: [
                      Padding(padding: EdgeInsets.all(8), child: Text('L (40)', style: TextStyle(color: BrandColors.ivory, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('40"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('32"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('42"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                      Padding(padding: EdgeInsets.all(8), child: Text('59"', style: TextStyle(color: Colors.white70, fontSize: 11))),
                    ],
                  ),
                ],
              ),
              const SizedBox(height: 20),
            ],
          ),
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);
    final images = widget.product.imageUrls.isNotEmpty
        ? widget.product.imageUrls
        : [
            'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=1200&q=80',
          ];

    return Scaffold(
      backgroundColor: BrandColors.surfaceDark,
      extendBodyBehindAppBar: true,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: Container(
          margin: const EdgeInsets.all(8),
          decoration: BoxDecoration(
            color: BrandColors.surfaceDark.withOpacity(0.7),
            shape: BoxShape.circle,
          ),
          child: IconButton(
            icon: const Icon(Icons.arrow_back, color: BrandColors.ivory),
            onPressed: () => Navigator.pop(context),
          ),
        ),
        actions: [
          Container(
            margin: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: BrandColors.surfaceDark.withOpacity(0.7),
              shape: BoxShape.circle,
            ),
            child: IconButton(
              icon: const Icon(Icons.favorite_border, color: BrandColors.gold),
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Saved to your private atelier wishlist.'),
                    backgroundColor: BrandColors.cardDark,
                    duration: Duration(seconds: 2),
                  ),
                );
              },
            ),
          ),
        ],
      ),
      body: SingleChildScrollView(
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image Carousel with Hero Feel
            SizedBox(
              height: 480,
              width: double.infinity,
              child: Stack(
                children: [
                  PageView.builder(
                    controller: _pageController,
                    itemCount: images.length,
                    onPageChanged: (index) {
                      setState(() => _selectedImageIndex = index);
                    },
                    itemBuilder: (context, index) {
                      return Image.network(
                        images[index],
                        fit: BoxFit.cover,
                        width: double.infinity,
                      );
                    },
                  ),
                  // Gradient Overlay
                  Positioned(
                    bottom: 0,
                    left: 0,
                    right: 0,
                    child: Container(
                      height: 80,
                      decoration: BoxDecoration(
                        gradient: LinearGradient(
                          colors: [Colors.transparent, BrandColors.surfaceDark.withOpacity(0.9)],
                          begin: Alignment.topCenter,
                          end: Alignment.bottomCenter,
                        ),
                      ),
                    ),
                  ),
                  // Dot Indicators
                  if (images.length > 1)
                    Positioned(
                      bottom: 16,
                      left: 0,
                      right: 0,
                      child: Row(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: List.generate(images.length, (index) {
                          final isActive = _selectedImageIndex == index;
                          return Container(
                            margin: const EdgeInsets.symmetric(horizontal: 4),
                            width: isActive ? 20 : 6,
                            height: 6,
                            decoration: BoxDecoration(
                              color: isActive ? BrandColors.gold : Colors.white38,
                              borderRadius: BorderRadius.circular(3),
                            ),
                          );
                        }),
                      ),
                    ),
                ],
              ),
            ),

            // Content
            Padding(
              padding: const EdgeInsets.all(20.0),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  // Category & SKU
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.product.category.toUpperCase(),
                        style: const TextStyle(
                          color: BrandColors.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                        ),
                      ),
                      Text(
                        widget.product.sku,
                        style: const TextStyle(
                          color: Colors.white38,
                          fontSize: 11,
                          letterSpacing: 1.0,
                        ),
                      ),
                    ],
                  ),

                  const SizedBox(height: 8),

                  // Name
                  Text(
                    widget.product.name,
                    style: const TextStyle(
                      color: BrandColors.ivory,
                      fontSize: 24,
                      fontWeight: FontWeight.w600,
                      fontFamily: 'serif',
                      height: 1.2,
                    ),
                  ),

                  const SizedBox(height: 12),

                  // Price
                  Text(
                    currencyFormatter.format(widget.product.basePrice),
                    style: const TextStyle(
                      color: BrandColors.gold,
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Description
                  const Text(
                    'ATELIER DETAILS',
                    style: TextStyle(
                      color: BrandColors.ivory,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    widget.product.description,
                    style: const TextStyle(
                      color: Colors.white70,
                      fontSize: 13,
                      height: 1.5,
                    ),
                  ),

                  const SizedBox(height: 20),

                  // Atelier Craft & Fabric specifications
                  Container(
                    padding: const EdgeInsets.all(14),
                    decoration: BoxDecoration(
                      color: BrandColors.cardDark,
                      borderRadius: BorderRadius.circular(10),
                      border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
                    ),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceAround,
                      children: [
                        _buildSpecPill('Fabric', widget.product.defaultFabric),
                        Container(width: 1, height: 30, color: Colors.white24),
                        _buildSpecPill('Craft', widget.product.defaultCraft),
                      ],
                    ),
                  ),

                  const SizedBox(height: 24),

                  // Colour Selection
                  const Text(
                    'SELECT COLOUR',
                    style: TextStyle(
                      color: BrandColors.ivory,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.product.availableColours.map((colour) {
                      final isSelected = _selectedColour == colour;
                      return ChoiceChip(
                        label: Text(colour),
                        selected: isSelected,
                        selectedColor: BrandColors.gold,
                        backgroundColor: BrandColors.cardDark,
                        labelStyle: TextStyle(
                          color: isSelected ? BrandColors.surfaceDark : BrandColors.ivory,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 12,
                        ),
                        side: BorderSide(
                          color: isSelected ? BrandColors.gold : BrandColors.borderGold.withOpacity(0.3),
                        ),
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedColour = colour);
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 24),

                  // Size Selection Header with Size Chart link
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'SELECT SIZE',
                        style: TextStyle(
                          color: BrandColors.ivory,
                          fontSize: 12,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      GestureDetector(
                        onTap: _showSizeChartModal,
                        child: const Row(
                          children: [
                            Icon(Icons.straighten, color: BrandColors.gold, size: 14),
                            SizedBox(width: 4),
                            Text(
                              'SIZE CHART',
                              style: TextStyle(
                                color: BrandColors.gold,
                                fontSize: 11,
                                fontWeight: FontWeight.bold,
                                letterSpacing: 1.0,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: widget.product.availableSizes.map((size) {
                      final isSelected = _selectedSize == size;
                      return ChoiceChip(
                        label: Text(size),
                        selected: isSelected,
                        selectedColor: BrandColors.gold,
                        backgroundColor: BrandColors.cardDark,
                        labelStyle: TextStyle(
                          color: isSelected ? BrandColors.surfaceDark : BrandColors.ivory,
                          fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                          fontSize: 12,
                        ),
                        side: BorderSide(
                          color: isSelected ? BrandColors.gold : BrandColors.borderGold.withOpacity(0.3),
                        ),
                        onSelected: (selected) {
                          if (selected) setState(() => _selectedSize = size);
                        },
                      );
                    }).toList(),
                  ),

                  const SizedBox(height: 32),

                  // Customise This Piece CTA (If customizable)
                  if (widget.product.isCustomizable) ...[
                    OutlinedButton.icon(
                      style: OutlinedButton.styleFrom(
                        side: const BorderSide(color: BrandColors.gold, width: 1.5),
                        minimumSize: const Size(double.infinity, 50),
                        shape: RoundedRectangleBorder(
                          borderRadius: BorderRadius.circular(8),
                        ),
                      ),
                      icon: const Icon(Icons.auto_awesome, color: BrandColors.gold, size: 18),
                      label: const Text(
                        'CUSTOMISE THIS PIECE IN BESPOKE STUDIO',
                        style: TextStyle(
                          color: BrandColors.gold,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.2,
                        ),
                      ),
                      onPressed: () {
                        Navigator.push(
                          context,
                          MaterialPageRoute(
                            builder: (context) => CustomDesignScreen(
                              referenceProduct: widget.product,
                            ),
                          ),
                        );
                      },
                    ),
                    const SizedBox(height: 12),
                  ],

                  // Add To Bag CTA
                  ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: BrandColors.gold,
                      foregroundColor: BrandColors.surfaceDark,
                      minimumSize: const Size(double.infinity, 54),
                      shape: RoundedRectangleBorder(
                        borderRadius: BorderRadius.circular(8),
                      ),
                    ),
                    onPressed: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        SnackBar(
                          backgroundColor: BrandColors.cardDark,
                          content: Text(
                            'Added ${widget.product.name} ($_selectedSize) to your private bag.',
                            style: const TextStyle(color: BrandColors.ivory),
                          ),
                          action: SnackBarAction(
                            label: 'VIEW ORDERS',
                            textColor: BrandColors.gold,
                            onPressed: () => Navigator.pop(context),
                          ),
                        ),
                      );
                    },
                    child: const Text(
                      'ADD TO ATELIER BAG',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        letterSpacing: 1.5,
                        fontSize: 13,
                      ),
                    ),
                  ),

                  const SizedBox(height: 40),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSpecPill(String title, String value) {
    return Column(
      children: [
        Text(
          title.toUpperCase(),
          style: const TextStyle(
            color: BrandColors.gold,
            fontSize: 10,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.0,
          ),
        ),
        const SizedBox(height: 4),
        Text(
          value,
          style: const TextStyle(
            color: BrandColors.ivory,
            fontSize: 12,
            fontWeight: FontWeight.w500,
          ),
        ),
      ],
    );
  }
}
