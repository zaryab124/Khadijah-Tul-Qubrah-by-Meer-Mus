import 'package:flutter/material.dart';
import 'core/constants/colors.dart';
import 'screens/main_navigation_screen.dart';

void main() {
  runApp(const KhadijaTulQubrahApp());
}

class KhadijaTulQubrahApp extends StatelessWidget {
  const KhadijaTulQubrahApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KHADIJA-TUL-QUBRAH BY Meer&Mus',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: BrandColors.surfaceDark,
        primaryColor: BrandColors.emerald,
        colorScheme: const ColorScheme.dark(
          primary: BrandColors.gold,
          secondary: BrandColors.emeraldLight,
          surface: BrandColors.cardDark,
          onPrimary: BrandColors.surfaceDark,
          onSurface: BrandColors.ivory,
        ),
        appBarTheme: const AppBarTheme(
          backgroundColor: BrandColors.surfaceDark,
          elevation: 0,
          centerTitle: true,
          titleTextStyle: TextStyle(
            color: BrandColors.ivory,
            fontSize: 16,
            fontWeight: FontWeight.w600,
            letterSpacing: 2.0,
          ),
        ),
        elevatedButtonTheme: ElevatedButtonThemeData(
          style: ElevatedButton.styleFrom(
            backgroundColor: BrandColors.gold,
            foregroundColor: BrandColors.surfaceDark,
            padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 16),
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(8),
            ),
            textStyle: const TextStyle(
              fontWeight: FontWeight.bold,
              letterSpacing: 1.2,
            ),
          ),
        ),
      ),
      home: const MainNavigationScreen(),
    );
  }
}
