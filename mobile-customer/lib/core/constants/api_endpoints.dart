class ApiEndpoints {
  static const String baseUrl = 'http://localhost:4000/api/v1';

  // Auth
  static const String register = '$baseUrl/auth/register';
  static const String login = '$baseUrl/auth/login';
  static const String me = '$baseUrl/auth/me';

  // Brand & Health
  static const String brand = '$baseUrl/brand';
  static const String health = '$baseUrl/health';

  // Catalog
  static const String products = '$baseUrl/products';
  static const String categories = '$baseUrl/categories';
  static const String fabrics = '$baseUrl/fabrics';
  static const String craftOptions = '$baseUrl/craft-options';

  // Custom Design Studio & Quotations
  static const String customRequests = '$baseUrl/custom-requests';
  static const String measurementTemplates = '$baseUrl/custom-requests/measurement-templates';
  static const String quotations = '$baseUrl/quotations';

  // Orders & Production
  static const String orders = '$baseUrl/orders';
  static String orderPay(String id) => '$baseUrl/orders/$id/pay';
  static String orderTracking(String id) => '$baseUrl/orders/$id/tracking';
  static String customerProductionProgress(String orderId) =>
      '$baseUrl/production/orders/$orderId/customer-progress';

  // Notifications
  static const String notifications = '$baseUrl/notifications';
  static const String notificationPreferences = '$baseUrl/notifications/preferences';
}
