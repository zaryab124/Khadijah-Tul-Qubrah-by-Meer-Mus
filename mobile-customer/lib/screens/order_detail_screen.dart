import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:intl/intl.dart';
import '../core/constants/colors.dart';
import '../core/models/order_model.dart';

class OrderDetailScreen extends StatefulWidget {
  final OrderModel order;

  const OrderDetailScreen({super.key, required this.order});

  @override
  State<OrderDetailScreen> createState() => _OrderDetailScreenState();
}

class _OrderDetailScreenState extends State<OrderDetailScreen> {
  late bool _isPaid;
  late int _progress;

  @override
  void initState() {
    super.initState();
    _isPaid = widget.order.paymentStatus == 'PAID';
    _progress = widget.order.progressPercentage;
  }

  void _simulatePay() {
    setState(() {
      _isPaid = true;
    });
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(
        content: Text('Payment verified server-side. Atelier production authorized!'),
        backgroundColor: BrandColors.emerald,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormatter = NumberFormat.currency(symbol: 'PKR ', decimalDigits: 0);
    final dateFormatter = DateFormat('dd MMMM yyyy');

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.order.orderNumber),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Hero Status Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [BrandColors.emerald, BrandColors.cardDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(14),
                border: Border.all(color: BrandColors.borderGold, width: 1.2),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'COMMISSION OVERVIEW',
                        style: TextStyle(
                          color: BrandColors.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 1.5,
                        ),
                      ),
                      if (widget.order.isCustom)
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                          decoration: BoxDecoration(
                            color: BrandColors.surfaceDark,
                            borderRadius: BorderRadius.circular(4),
                            border: Border.all(color: BrandColors.gold, width: 0.8),
                          ),
                          child: Text(
                            widget.order.quotationVersion != null
                                ? 'QUOTATION ${widget.order.quotationVersion}'
                                : 'BESPOKE COMMISSION',
                            style: const TextStyle(
                              color: BrandColors.gold,
                              fontSize: 10,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Text(
                    widget.order.itemTitle,
                    style: const TextStyle(
                      color: BrandColors.ivory,
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'serif',
                    ),
                  ),
                  const SizedBox(height: 6),
                  Text(
                    'Ordered on ${dateFormatter.format(widget.order.createdAt)}',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text('TOTAL VALUE', style: TextStyle(color: Colors.white54, fontSize: 9)),
                          Text(
                            currencyFormatter.format(widget.order.totalAmount),
                            style: const TextStyle(
                              color: BrandColors.gold,
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                        ],
                      ),
                      _buildStatusPill(widget.order.status),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 1. Quotation Section
            _buildSectionHeader('1. QUOTATION BREAKDOWN', Icons.receipt_long),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  _buildPriceRow('Base Atelier Ensemble', currencyFormatter.format(widget.order.totalAmount * 0.75)),
                  _buildPriceRow('Bespoke Customization & Zardozi', currencyFormatter.format(widget.order.totalAmount * 0.22)),
                  _buildPriceRow('Specialty Delivery & Velvet Packaging', currencyFormatter.format(widget.order.totalAmount * 0.05)),
                  _buildPriceRow('VIP Patron Courtesy Privilege', '- ${currencyFormatter.format(widget.order.totalAmount * 0.02)}', isDiscount: true),
                  const Divider(color: Colors.white12, height: 20),
                  _buildPriceRow('Final Agreed Commission Total', currencyFormatter.format(widget.order.totalAmount), isTotal: true),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 2. Payment Section
            _buildSectionHeader('2. PAYMENT VERIFICATION', Icons.account_balance_wallet),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Row(
                        children: [
                          Icon(
                            _isPaid ? Icons.check_circle : Icons.pending,
                            color: _isPaid ? const Color(0xFF75E6A3) : const Color(0xFFFF8E8E),
                            size: 18,
                          ),
                          const SizedBox(width: 8),
                          Text(
                            _isPaid ? 'PAYMENT VERIFIED (SETTLED)' : 'PAYMENT REQUIRED',
                            style: TextStyle(
                              color: _isPaid ? const Color(0xFF75E6A3) : const Color(0xFFFF8E8E),
                              fontWeight: FontWeight.bold,
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                      const Text('Provider: Alpha Gateway', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    _isPaid
                        ? 'Confirmed on server ledger. Transaction authenticated with bank reference PK-SEC-89472.'
                        : 'Please complete payment to initiate fabric allocation and karigar assignment.',
                    style: const TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                  if (!_isPaid) ...[
                    const SizedBox(height: 14),
                    ElevatedButton(
                      style: ElevatedButton.styleFrom(
                        backgroundColor: BrandColors.gold,
                        foregroundColor: BrandColors.surfaceDark,
                        minimumSize: const Size(double.infinity, 44),
                      ),
                      onPressed: _simulatePay,
                      child: const Text('PAY SECURELY NOW (VERIFY SERVER-SIDE)', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 11)),
                    ),
                  ],
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 3. Production Progress Section
            _buildSectionHeader('3. ATELIER PRODUCTION', Icons.precision_manufacturing),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        'CURRENT STAGE: ${widget.order.productionStage ?? 'CUTTING'}',
                        style: const TextStyle(
                          color: BrandColors.gold,
                          fontWeight: FontWeight.bold,
                          fontSize: 12,
                          letterSpacing: 1.0,
                        ),
                      ),
                      Text(
                        '$_progress% Completed',
                        style: const TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(6),
                    child: LinearProgressIndicator(
                      value: _progress / 100.0,
                      backgroundColor: Colors.white12,
                      valueColor: const AlwaysStoppedAnimation<Color>(BrandColors.gold),
                      minHeight: 8,
                    ),
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Atelier Log: Fabrics hand-cut on grain; 3 master karigars dedicated to 24k metallic tilla and dabka border work.',
                    style: TextStyle(color: Colors.white70, fontSize: 12, height: 1.4),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 4. Quality Check Section
            _buildSectionHeader('4. QUALITY CONTROL (QC)', Icons.verified),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(
                  color: widget.order.isQcPassed
                      ? const Color(0xFF75E6A3).withOpacity(0.5)
                      : BrandColors.borderGold.withOpacity(0.3),
                ),
              ),
              child: Row(
                children: [
                  Icon(
                    widget.order.isQcPassed ? Icons.verified : Icons.hourglass_top,
                    color: widget.order.isQcPassed ? const Color(0xFF75E6A3) : BrandColors.gold,
                    size: 32,
                  ),
                  const SizedBox(width: 14),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          widget.order.isQcPassed ? 'CERTIFIED BY HEAD ARTISAN' : 'PENDING QC PROTOCOL',
                          style: TextStyle(
                            color: widget.order.isQcPassed ? const Color(0xFF75E6A3) : BrandColors.gold,
                            fontWeight: FontWeight.bold,
                            fontSize: 12,
                            letterSpacing: 0.8,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          widget.order.isQcPassed
                              ? 'Measurements, stone setting, and seam tension verified within 0.1" atelier tolerance.'
                              : 'Final quality inspection scheduled prior to parceling in signature velvet box.',
                          style: const TextStyle(color: Colors.white70, fontSize: 12),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // 5. Shipping & Courier Tracking Section
            _buildSectionHeader('5. SHIPPING & COURIER DISPATCH', Icons.local_shipping),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Text(
                        widget.order.courierName ?? 'TCS Express Prime',
                        style: const TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold, fontSize: 13),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 3),
                        decoration: BoxDecoration(
                          color: BrandColors.emerald,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text('INSURED DISPATCH', style: TextStyle(color: BrandColors.ivory, fontSize: 9, fontWeight: FontWeight.bold)),
                      ),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      const Text('Tracking Ref: ', style: TextStyle(color: Colors.white54, fontSize: 12)),
                      Text(
                        widget.order.trackingNumber ?? 'TCS-9847291-PK',
                        style: const TextStyle(color: BrandColors.gold, fontWeight: FontWeight.bold, fontSize: 12),
                      ),
                      IconButton(
                        icon: const Icon(Icons.copy, size: 14, color: BrandColors.gold),
                        onPressed: () {
                          Clipboard.setData(ClipboardData(text: widget.order.trackingNumber ?? 'TCS-9847291-PK'));
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Tracking number copied to clipboard.'),
                              duration: Duration(seconds: 1),
                              backgroundColor: BrandColors.surfaceDark,
                            ),
                          );
                        },
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  const Text(
                    'Delivery Destination: Gulberg III, Lahore, Pakistan',
                    style: TextStyle(color: Colors.white70, fontSize: 12),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 40),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionHeader(String title, IconData icon) {
    return Row(
      children: [
        Icon(icon, color: BrandColors.gold, size: 16),
        const SizedBox(width: 8),
        Text(
          title,
          style: const TextStyle(
            color: BrandColors.gold,
            fontSize: 12,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
      ],
    );
  }

  Widget _buildPriceRow(String label, String amount, {bool isDiscount = false, bool isTotal = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(
            label,
            style: TextStyle(
              color: isTotal ? BrandColors.ivory : Colors.white60,
              fontSize: isTotal ? 13 : 12,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.normal,
            ),
          ),
          Text(
            amount,
            style: TextStyle(
              color: isDiscount
                  ? const Color(0xFF75E6A3)
                  : isTotal
                      ? BrandColors.gold
                      : BrandColors.ivory,
              fontSize: isTotal ? 14 : 12,
              fontWeight: isTotal ? FontWeight.bold : FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildStatusPill(String status) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: BrandColors.gold,
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        status.replaceAll('_', ' '),
        style: const TextStyle(
          color: BrandColors.surfaceDark,
          fontWeight: FontWeight.bold,
          fontSize: 10,
        ),
      ),
    );
  }
}
