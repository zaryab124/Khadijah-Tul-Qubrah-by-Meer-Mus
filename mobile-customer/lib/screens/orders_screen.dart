import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../core/constants/colors.dart';
import '../core/models/order_model.dart';
import '../core/services/api_service.dart';
import 'order_detail_screen.dart';

class OrdersScreen extends StatefulWidget {
  const OrdersScreen({super.key});

  @override
  State<OrdersScreen> createState() => _OrdersScreenState();
}

class _OrdersScreenState extends State<OrdersScreen> with SingleTickerProviderStateMixin {
  final ApiService _apiService = ApiService();
  late TabController _tabController;
  List<OrderModel> _orders = [];
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 3, vsync: this);
    _loadOrders();
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  Future<void> _loadOrders() async {
    setState(() => _isLoading = true);
    final orders = await _apiService.fetchOrders();
    if (mounted) {
      setState(() {
        _orders = orders;
        _isLoading = false;
      });
    }
  }

  List<OrderModel> get _activeOrders {
    return _orders.where((o) => o.status != 'DELIVERED' && o.status != 'CANCELLED').toList();
  }

  List<OrderModel> get _customOrders {
    return _orders.where((o) => o.isCustom).toList();
  }

  List<OrderModel> get _completedOrders {
    return _orders.where((o) => o.status == 'DELIVERED' || o.status == 'CANCELLED').toList();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('MY ATELIER COMMISSIONS'),
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: BrandColors.gold,
          indicatorWeight: 3,
          labelColor: BrandColors.gold,
          unselectedLabelColor: Colors.white54,
          labelStyle: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12, letterSpacing: 1.2),
          tabs: const [
            Tab(text: 'ACTIVE'),
            Tab(text: 'CUSTOM'),
            Tab(text: 'COMPLETED'),
          ],
        ),
      ),
      body: RefreshIndicator(
        color: BrandColors.gold,
        backgroundColor: BrandColors.cardDark,
        onRefresh: _loadOrders,
        child: _isLoading
            ? const Center(child: CircularProgressIndicator(color: BrandColors.gold))
            : TabBarView(
                controller: _tabController,
                children: [
                  _buildOrderList(_activeOrders, 'No active commissions currently in production'),
                  _buildOrderList(_customOrders, 'No custom bespoke commissions found'),
                  _buildOrderList(_completedOrders, 'No completed heirloom orders archive yet'),
                ],
              ),
      ),
    );
  }

  Widget _buildOrderList(List<OrderModel> list, String emptyMessage) {
    if (list.isEmpty) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.receipt_long, size: 48, color: Colors.white30),
            const SizedBox(height: 12),
            Text(
              emptyMessage,
              style: const TextStyle(color: Colors.white60, fontSize: 13),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      );
    }

    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);
    final dateFormatter = DateFormat('dd MMM yyyy');

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: list.length,
      itemBuilder: (context, index) {
        final order = list[index];
        return GestureDetector(
          onTap: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => OrderDetailScreen(order: order)),
            );
          },
          child: Container(
            margin: const EdgeInsets.only(bottom: 14),
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: BrandColors.cardDark,
              borderRadius: BorderRadius.circular(12),
              border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.25),
                  blurRadius: 8,
                  offset: const Offset(0, 3),
                ),
              ],
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                // Header: Order Number & Date
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      order.orderNumber,
                      style: const TextStyle(
                        color: BrandColors.gold,
                        fontWeight: FontWeight.bold,
                        fontSize: 13,
                        letterSpacing: 1.0,
                      ),
                    ),
                    Text(
                      dateFormatter.format(order.createdAt),
                      style: const TextStyle(color: Colors.white54, fontSize: 11),
                    ),
                  ],
                ),
                const SizedBox(height: 8),

                // Item Title
                Text(
                  order.itemTitle,
                  style: const TextStyle(
                    color: BrandColors.ivory,
                    fontSize: 15,
                    fontWeight: FontWeight.w600,
                    fontFamily: 'serif',
                  ),
                ),
                const SizedBox(height: 10),

                // Badges Row
                Row(
                  children: [
                    if (order.isCustom) ...[
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: BrandColors.surfaceDark,
                          borderRadius: BorderRadius.circular(4),
                          border: Border.all(color: BrandColors.gold, width: 0.8),
                        ),
                        child: Text(
                          order.quotationVersion != null
                              ? 'BESPOKE ${order.quotationVersion}'
                              : 'BESPOKE',
                          style: const TextStyle(
                            color: BrandColors.gold,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                    ],
                    _buildStatusChip(order.status),
                  ],
                ),

                const SizedBox(height: 12),
                const Divider(color: Colors.white12, height: 1),
                const SizedBox(height: 10),

                // Footer: Total & Arrow
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          'TOTAL AMOUNT',
                          style: TextStyle(color: Colors.white54, fontSize: 9, letterSpacing: 0.8),
                        ),
                        Text(
                          currencyFormatter.format(order.totalAmount),
                          style: const TextStyle(
                            color: BrandColors.ivory,
                            fontSize: 14,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ],
                    ),
                    const Row(
                      children: [
                        Text(
                          'VIEW TIMELINE',
                          style: TextStyle(
                            color: BrandColors.gold,
                            fontSize: 11,
                            fontWeight: FontWeight.bold,
                            letterSpacing: 0.8,
                          ),
                        ),
                        SizedBox(width: 4),
                        Icon(Icons.chevron_right, color: BrandColors.gold, size: 16),
                      ],
                    ),
                  ],
                ),
              ],
            ),
          ),
        );
      },
    );
  }

  Widget _buildStatusChip(String status) {
    Color bg = BrandColors.cardDark;
    Color fg = BrandColors.ivory;
    String label = status.replaceAll('_', ' ');

    switch (status) {
      case 'PENDING_PAYMENT':
        bg = const Color(0xFF4A1E22);
        fg = const Color(0xFFFF8E8E);
        break;
      case 'PAID':
      case 'CONFIRMED':
        bg = const Color(0xFF143B2A);
        fg = const Color(0xFF75E6A3);
        break;
      case 'IN_PRODUCTION':
        bg = const Color(0xFF382F10);
        fg = BrandColors.gold;
        label = 'IN PRODUCTION';
        break;
      case 'QUALITY_CHECK':
        bg = const Color(0xFF1C2C3D);
        fg = const Color(0xFF67B5FF);
        break;
      case 'READY_TO_SHIP':
      case 'SHIPPED':
        bg = const Color(0xFF281F42);
        fg = const Color(0xFFC7A8FF);
        break;
      case 'DELIVERED':
        bg = const Color(0xFF1B3D23);
        fg = const Color(0xFF8CE09D);
        break;
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
      decoration: BoxDecoration(
        color: bg,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        label,
        style: TextStyle(
          color: fg,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 0.5,
        ),
      ),
    );
  }
}
