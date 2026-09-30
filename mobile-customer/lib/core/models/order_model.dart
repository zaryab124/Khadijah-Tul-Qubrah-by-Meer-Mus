class OrderModel {
  final String id;
  final String orderNumber;
  final String status;
  final String paymentStatus;
  final double totalAmount;
  final String currency;
  final DateTime createdAt;
  final String itemTitle;
  final bool isCustom;
  final String? quotationVersion;
  final String? productionStage;
  final int progressPercentage;
  final String? courierName;
  final String? trackingNumber;
  final bool isQcPassed;

  OrderModel({
    required this.id,
    required this.orderNumber,
    required this.status,
    required this.paymentStatus,
    required this.totalAmount,
    required this.currency,
    required this.createdAt,
    required this.itemTitle,
    required this.isCustom,
    this.quotationVersion,
    this.productionStage,
    this.progressPercentage = 0,
    this.courierName,
    this.trackingNumber,
    this.isQcPassed = false,
  });

  factory OrderModel.fromJson(Map<String, dynamic> json) {
    return OrderModel(
      id: json['id'] ?? '',
      orderNumber: json['orderNumber'] ?? '',
      status: json['status'] ?? 'PENDING_PAYMENT',
      paymentStatus: json['paymentStatus'] ?? 'PENDING',
      totalAmount: (json['totalAmount'] is num)
          ? (json['totalAmount'] as num).toDouble()
          : double.tryParse(json['totalAmount']?.toString() ?? '0') ?? 0.0,
      currency: json['currency'] ?? 'PKR',
      createdAt: json['createdAt'] != null
          ? DateTime.tryParse(json['createdAt']) ?? DateTime.now()
          : DateTime.now(),
      itemTitle: (json['orderItems'] as List?)?.firstOrNull?['itemTitle'] ??
          json['itemTitle'] ??
          'Haute Couture Ensemble',
      isCustom: json['originCustomRequestId'] != null || json['isCustom'] == true,
      quotationVersion: json['acceptedQuotation']?['versionNumber'] != null
          ? 'V${json['acceptedQuotation']['versionNumber']}'
          : json['quotationVersion'],
      productionStage: json['productionJobs']?.firstOrNull?['status'] ??
          json['productionStage'] ??
          'CUTTING',
      progressPercentage: json['productionJobs']?.firstOrNull?['progressPercentage'] ??
          json['progressPercentage'] ??
          20,
      courierName: json['courierName'] ?? 'TCS Express Prime',
      trackingNumber: json['trackingNumber'] ?? 'TCS-9847291-PK',
      isQcPassed: json['isQcPassed'] ?? false,
    );
  }
}
