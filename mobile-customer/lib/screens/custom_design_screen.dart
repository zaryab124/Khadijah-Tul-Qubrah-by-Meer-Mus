import 'package:flutter/material.dart';
import '../core/constants/colors.dart';
import '../core/models/product_model.dart';
import '../core/services/api_service.dart';

class CustomDesignScreen extends StatefulWidget {
  final ProductModel? referenceProduct;
  final bool isRootTab;

  const CustomDesignScreen({
    super.key,
    this.referenceProduct,
    this.isRootTab = false,
  });

  @override
  State<CustomDesignScreen> createState() => _CustomDesignScreenState();
}

class _CustomDesignScreenState extends State<CustomDesignScreen> {
  final ApiService _apiService = ApiService();
  int _currentStep = 0;
  bool _isSubmitting = false;

  // Step 1: Garment Type
  String _productType = 'Peshwas & Dupatta';
  final List<String> _productTypes = [
    'Peshwas & Dupatta',
    'Bridal Lehenga Choli',
    'Bespoke Anarkali',
    'Farshi Gharara Suit',
    'Royal Sherwani',
    'Tissue Saree',
    'Luxury Kurta Set',
  ];

  // Step 2: Design Source
  String _designSource = 'MY_OWN_DESIGN'; // 'MY_OWN_DESIGN' or 'EXISTING_PRODUCT'
  String? _referenceProductName;

  // Step 3: Reference/Inspiration Images
  final List<String> _inspirationImages = [
    'https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b?auto=format&fit=crop&w=600&q=80',
  ];

  // Step 4: Colour
  String _selectedColour = 'Royal Emerald Green';
  final List<String> _colourOptions = [
    'Royal Emerald Green',
    'Antique Gold',
    'Deep Crimson Velvet',
    'Pristine Ivory',
    'Midnight Navy',
    'Imperial Plum',
    'Powder Rose',
  ];

  // Step 5: Fabric
  String _selectedFabric = 'Micro Velvet 9000';
  final List<String> _fabricOptions = [
    'Micro Velvet 9000 (Winter Couture)',
    'Pure Katan Silk (Loomed)',
    'Hand-loomed 80g Raw Silk',
    'Pure French Silk Organza',
    'Metallic Tissue Organza',
    'Pure Chiffon with Zari',
  ];

  // Step 6: Craftsmanship
  String _selectedCraft = 'Zardozi Handwork';
  final List<String> _craftOptions = [
    'Zardozi Handwork (Metallic Gold & Stones)',
    'Tilla & Marori Stitching',
    'Handwork Dabka & Naqshi',
    'Silk Ribbon Appliqué',
    'Artisanal Crochet',
    'Hand Screen Printing with Foil',
    'Other Atelier Custom Handwork',
  ];

  // Step 7: Size & Measurements
  String _sizeCategory = 'CUSTOM'; // 'STANDARD' or 'CUSTOM'
  String _standardSize = 'M';
  final TextEditingController _chestCtrl = TextEditingController(text: '36');
  final TextEditingController _waistCtrl = TextEditingController(text: '28');
  final TextEditingController _hipCtrl = TextEditingController(text: '38');
  final TextEditingController _lengthCtrl = TextEditingController(text: '56');
  final TextEditingController _sleeveCtrl = TextEditingController(text: '22');
  final TextEditingController _shoulderCtrl = TextEditingController(text: '14.5');

  // Step 8: Instructions
  final TextEditingController _instructionsCtrl = TextEditingController();
  final TextEditingController _budgetCtrl = TextEditingController(text: 'PKR 350,000 - 500,000');

  @override
  void initState() {
    super.initState();
    if (widget.referenceProduct != null) {
      _designSource = 'EXISTING_PRODUCT';
      _referenceProductName = widget.referenceProduct!.name;
      _selectedFabric = widget.referenceProduct!.defaultFabric;
      _selectedCraft = widget.referenceProduct!.defaultCraft;
      _productType = widget.referenceProduct!.category;
    }
  }

  @override
  void dispose() {
    _chestCtrl.dispose();
    _waistCtrl.dispose();
    _hipCtrl.dispose();
    _lengthCtrl.dispose();
    _sleeveCtrl.dispose();
    _shoulderCtrl.dispose();
    _instructionsCtrl.dispose();
    _budgetCtrl.dispose();
    super.dispose();
  }

  Future<void> _submitRequest() async {
    setState(() => _isSubmitting = true);

    final payload = {
      'productType': _productType,
      'designSource': _designSource,
      'referenceProductName': _referenceProductName,
      'colour': _selectedColour,
      'fabric': _selectedFabric,
      'craftsmanship': _selectedCraft,
      'sizingMode': _sizeCategory,
      'standardSize': _sizeCategory == 'STANDARD' ? _standardSize : null,
      'measurements': _sizeCategory == 'CUSTOM'
          ? {
              'chest': _chestCtrl.text,
              'waist': _waistCtrl.text,
              'hip': _hipCtrl.text,
              'length': _lengthCtrl.text,
              'sleeve': _sleeveCtrl.text,
              'shoulder': _shoulderCtrl.text,
            }
          : null,
      'specialInstructions': _instructionsCtrl.text,
      'targetBudget': _budgetCtrl.text,
      'referenceImagesCount': _inspirationImages.length,
    };

    final result = await _apiService.submitCustomRequest(payload);

    if (mounted) {
      setState(() => _isSubmitting = false);
      showDialog(
        context: context,
        barrierDismissible: false,
        builder: (ctx) => AlertDialog(
          backgroundColor: BrandColors.surfaceDark,
          shape: RoundedRectangleBorder(
            borderRadius: BorderRadius.circular(16),
            side: const BorderSide(color: BrandColors.gold, width: 1.5),
          ),
          title: const Row(
            children: [
              Icon(Icons.auto_awesome, color: BrandColors.gold, size: 22),
              SizedBox(width: 8),
              Text(
                'REQUEST RECEIVED',
                style: TextStyle(
                  color: BrandColors.ivory,
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  letterSpacing: 1.5,
                ),
              ),
            ],
          ),
          content: Column(
            mainAxisSize: MainAxisSize.min,
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                'Request Ref: ${result['requestNumber'] ?? 'CDR-202609-001'}',
                style: const TextStyle(
                  color: BrandColors.gold,
                  fontWeight: FontWeight.bold,
                  fontSize: 13,
                ),
              ),
              const SizedBox(height: 12),
              const Text(
                'Your bespoke haute couture commission has been submitted to the lead atelier designer. A tailored quotation (V1) with breakdown of fabrics and karigar hours will be issued to your account shortly.',
                style: TextStyle(color: Colors.white70, fontSize: 13, height: 1.4),
              ),
            ],
          ),
          actions: [
            ElevatedButton(
              style: ElevatedButton.styleFrom(
                backgroundColor: BrandColors.gold,
                foregroundColor: BrandColors.surfaceDark,
              ),
              onPressed: () {
                Navigator.pop(ctx);
                if (!widget.isRootTab && Navigator.canPop(context)) {
                  Navigator.pop(context);
                } else {
                  setState(() {
                    _currentStep = 0;
                  });
                }
              },
              child: const Text('PROCEED TO DASHBOARD'),
            ),
          ],
        ),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('CREATE YOUR OWN'),
        leading: (!widget.isRootTab && Navigator.canPop(context))
            ? IconButton(
                icon: const Icon(Icons.arrow_back, color: BrandColors.ivory),
                onPressed: () => Navigator.pop(context),
              )
            : null,
      ),
      body: Stepper(
        type: StepperType.vertical,
        currentStep: _currentStep,
        elevation: 0,
        physics: const ClampingScrollPhysics(),
        onStepContinue: () {
          if (_currentStep < 8) {
            setState(() => _currentStep += 1);
          } else {
            _submitRequest();
          }
        },
        onStepCancel: () {
          if (_currentStep > 0) {
            setState(() => _currentStep -= 1);
          }
        },
        controlsBuilder: (context, details) {
          final isLastStep = _currentStep == 8;
          return Padding(
            padding: const EdgeInsets.only(top: 20.0),
            child: Row(
              children: [
                Expanded(
                  child: ElevatedButton(
                    style: ElevatedButton.styleFrom(
                      backgroundColor: BrandColors.gold,
                      foregroundColor: BrandColors.surfaceDark,
                      padding: const EdgeInsets.symmetric(vertical: 14),
                    ),
                    onPressed: _isSubmitting ? null : details.onStepContinue,
                    child: _isSubmitting
                        ? const SizedBox(
                            height: 18,
                            width: 18,
                            child: CircularProgressIndicator(
                              strokeWidth: 2,
                              color: BrandColors.surfaceDark,
                            ),
                          )
                        : Text(
                            isLastStep ? 'SUBMIT BESPOKE COMMISSION' : 'CONTINUE',
                            style: const TextStyle(fontWeight: FontWeight.bold, fontSize: 12),
                          ),
                  ),
                ),
                if (_currentStep > 0) ...[
                  const SizedBox(width: 12),
                  OutlinedButton(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: Colors.white38),
                      padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 16),
                    ),
                    onPressed: details.onStepCancel,
                    child: const Text('BACK', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  ),
                ],
              ],
            ),
          );
        },
        steps: [
          // Step 1: Choose Product / Silhouette
          Step(
            title: const Text('Step 1: Product Silhouette', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            subtitle: Text(_productType, style: const TextStyle(color: BrandColors.gold, fontSize: 11)),
            isActive: _currentStep >= 0,
            content: DropdownButtonFormField<String>(
              value: _productType,
              dropdownColor: BrandColors.cardDark,
              decoration: const InputDecoration(
                filled: true,
                fillColor: BrandColors.cardDark,
                border: OutlineInputBorder(),
                labelText: 'Select Couture Silhouette',
                labelStyle: TextStyle(color: BrandColors.gold),
              ),
              items: _productTypes
                  .map((t) => DropdownMenuItem(value: t, child: Text(t, style: const TextStyle(color: BrandColors.ivory))))
                  .toList(),
              onChanged: (v) => setState(() => _productType = v!),
            ),
          ),

          // Step 2: Design Basis
          Step(
            title: const Text('Step 2: Design Source', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 1,
            content: Column(
              children: [
                RadioListTile<String>(
                  title: const Text('My Own Original Design / Idea', style: TextStyle(color: BrandColors.ivory, fontSize: 13)),
                  subtitle: const Text('Create from your sketches or references', style: TextStyle(color: Colors.white54, fontSize: 11)),
                  value: 'MY_OWN_DESIGN',
                  groupValue: _designSource,
                  activeColor: BrandColors.gold,
                  onChanged: (v) => setState(() => _designSource = v!),
                ),
                RadioListTile<String>(
                  title: const Text('Customise Existing Atelier Creation', style: TextStyle(color: BrandColors.ivory, fontSize: 13)),
                  subtitle: Text(
                    _referenceProductName ?? 'Based on an existing catalogue piece',
                    style: const TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  value: 'EXISTING_PRODUCT',
                  groupValue: _designSource,
                  activeColor: BrandColors.gold,
                  onChanged: (v) => setState(() => _designSource = v!),
                ),
              ],
            ),
          ),

          // Step 3: Reference & Inspiration Images
          Step(
            title: const Text('Step 3: Reference & Sketches', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 2,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const Text(
                  'Upload moodboards, sketches, or embroidery close-ups (signed URL protected):',
                  style: TextStyle(color: Colors.white70, fontSize: 12),
                ),
                const SizedBox(height: 12),
                SizedBox(
                  height: 90,
                  child: ListView(
                    scrollDirection: Axis.horizontal,
                    children: [
                      ..._inspirationImages.map(
                        (url) => Container(
                          width: 80,
                          margin: const EdgeInsets.only(right: 8),
                          decoration: BoxDecoration(
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: BrandColors.gold),
                            image: DecorationImage(image: NetworkImage(url), fit: BoxFit.cover),
                          ),
                        ),
                      ),
                      GestureDetector(
                        onTap: () {
                          setState(() {
                            _inspirationImages.add(
                              'https://images.unsplash.com/photo-1594223274512-ad4803739b7c?auto=format&fit=crop&w=600&q=80',
                            );
                          });
                          ScaffoldMessenger.of(context).showSnackBar(
                            const SnackBar(
                              content: Text('Inspiration sketch attached and generated thumbnail.'),
                              backgroundColor: BrandColors.emerald,
                              duration: Duration(seconds: 1),
                            ),
                          );
                        },
                        child: Container(
                          width: 80,
                          decoration: BoxDecoration(
                            color: BrandColors.cardDark,
                            borderRadius: BorderRadius.circular(8),
                            border: Border.all(color: Colors.white38, style: BorderStyle.solid),
                          ),
                          child: const Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_photo_alternate, color: BrandColors.gold, size: 24),
                              SizedBox(height: 4),
                              Text('UPLOAD', style: TextStyle(color: BrandColors.gold, fontSize: 9, fontWeight: FontWeight.bold)),
                            ],
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          ),

          // Step 4: Colour
          Step(
            title: const Text('Step 4: Heritage Colour', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            subtitle: Text(_selectedColour, style: const TextStyle(color: BrandColors.gold, fontSize: 11)),
            isActive: _currentStep >= 3,
            content: DropdownButtonFormField<String>(
              value: _selectedColour,
              dropdownColor: BrandColors.cardDark,
              decoration: const InputDecoration(
                filled: true,
                fillColor: BrandColors.cardDark,
                border: OutlineInputBorder(),
                labelText: 'Select Royal Palette Shade',
                labelStyle: TextStyle(color: BrandColors.gold),
              ),
              items: _colourOptions
                  .map((c) => DropdownMenuItem(value: c, child: Text(c, style: const TextStyle(color: BrandColors.ivory))))
                  .toList(),
              onChanged: (v) => setState(() => _selectedColour = v!),
            ),
          ),

          // Step 5: Fabric
          Step(
            title: const Text('Step 5: Hand-Selected Fabric', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            subtitle: Text(_selectedFabric, style: const TextStyle(color: BrandColors.gold, fontSize: 11)),
            isActive: _currentStep >= 4,
            content: DropdownButtonFormField<String>(
              value: _selectedFabric,
              dropdownColor: BrandColors.cardDark,
              decoration: const InputDecoration(
                filled: true,
                fillColor: BrandColors.cardDark,
                border: OutlineInputBorder(),
                labelText: 'Base Fabric Selection',
                labelStyle: TextStyle(color: BrandColors.gold),
              ),
              items: _fabricOptions
                  .map((f) => DropdownMenuItem(value: f, child: Text(f, style: const TextStyle(color: BrandColors.ivory))))
                  .toList(),
              onChanged: (v) => setState(() => _selectedFabric = v!),
            ),
          ),

          // Step 6: Craftsmanship
          Step(
            title: const Text('Step 6: Karigar Craftsmanship', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            subtitle: Text(_selectedCraft, style: const TextStyle(color: BrandColors.gold, fontSize: 11)),
            isActive: _currentStep >= 5,
            content: DropdownButtonFormField<String>(
              value: _selectedCraft,
              dropdownColor: BrandColors.cardDark,
              decoration: const InputDecoration(
                filled: true,
                fillColor: BrandColors.cardDark,
                border: OutlineInputBorder(),
                labelText: 'Embellishment & Stitch Technique',
                labelStyle: TextStyle(color: BrandColors.gold),
              ),
              items: _craftOptions
                  .map((cr) => DropdownMenuItem(value: cr, child: Text(cr, style: const TextStyle(color: BrandColors.ivory))))
                  .toList(),
              onChanged: (v) => setState(() => _selectedCraft = v!),
            ),
          ),

          // Step 7: Size & Configurable Measurements
          Step(
            title: const Text('Step 7: Sizing & Measurements', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 6,
            content: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: ChoiceChip(
                        label: const Center(child: Text('Custom Measurements')),
                        selected: _sizeCategory == 'CUSTOM',
                        selectedColor: BrandColors.gold,
                        backgroundColor: BrandColors.cardDark,
                        labelStyle: TextStyle(
                          color: _sizeCategory == 'CUSTOM' ? BrandColors.surfaceDark : BrandColors.ivory,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                        onSelected: (val) => setState(() => _sizeCategory = 'CUSTOM'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: ChoiceChip(
                        label: const Center(child: Text('Standard Size')),
                        selected: _sizeCategory == 'STANDARD',
                        selectedColor: BrandColors.gold,
                        backgroundColor: BrandColors.cardDark,
                        labelStyle: TextStyle(
                          color: _sizeCategory == 'STANDARD' ? BrandColors.surfaceDark : BrandColors.ivory,
                          fontWeight: FontWeight.bold,
                          fontSize: 11,
                        ),
                        onSelected: (val) => setState(() => _sizeCategory = 'STANDARD'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 16),
                if (_sizeCategory == 'STANDARD')
                  DropdownButtonFormField<String>(
                    value: _standardSize,
                    dropdownColor: BrandColors.cardDark,
                    decoration: const InputDecoration(
                      filled: true,
                      fillColor: BrandColors.cardDark,
                      border: OutlineInputBorder(),
                      labelText: 'Select Standard Size',
                    ),
                    items: ['XS', 'S', 'M', 'L', 'XL']
                        .map((s) => DropdownMenuItem(value: s, child: Text(s, style: const TextStyle(color: BrandColors.ivory))))
                        .toList(),
                    onChanged: (v) => setState(() => _standardSize = v!),
                  )
                else ...[
                  const Text('Enter body measurements in inches:', style: TextStyle(color: Colors.white70, fontSize: 12)),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _buildMeasurementField('Chest (in)', _chestCtrl)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildMeasurementField('Waist (in)', _waistCtrl)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildMeasurementField('Hip (in)', _hipCtrl)),
                    ],
                  ),
                  const SizedBox(height: 10),
                  Row(
                    children: [
                      Expanded(child: _buildMeasurementField('Length (in)', _lengthCtrl)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildMeasurementField('Sleeve (in)', _sleeveCtrl)),
                      const SizedBox(width: 8),
                      Expanded(child: _buildMeasurementField('Shoulder (in)', _shoulderCtrl)),
                    ],
                  ),
                ],
              ],
            ),
          ),

          // Step 8: Additional Instructions & Budget
          Step(
            title: const Text('Step 8: Instructions & Budget', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 7,
            content: Column(
              children: [
                TextField(
                  controller: _instructionsCtrl,
                  maxLines: 3,
                  style: const TextStyle(color: BrandColors.ivory, fontSize: 13),
                  decoration: const InputDecoration(
                    filled: true,
                    fillColor: BrandColors.cardDark,
                    border: OutlineInputBorder(),
                    hintText: 'e.g. Heavier embroidery on cuffs, scalloped border with gold pearls...',
                    labelText: 'Atelier Styling Notes',
                    labelStyle: TextStyle(color: BrandColors.gold),
                  ),
                ),
                const SizedBox(height: 12),
                TextField(
                  controller: _budgetCtrl,
                  style: const TextStyle(color: BrandColors.ivory, fontSize: 13),
                  decoration: const InputDecoration(
                    filled: true,
                    fillColor: BrandColors.cardDark,
                    border: OutlineInputBorder(),
                    labelText: 'Target Budget / Range',
                    labelStyle: TextStyle(color: BrandColors.gold),
                  ),
                ),
              ],
            ),
          ),

          // Step 9: Review Complete Commission
          Step(
            title: const Text('Step 9: Review & Submit', style: TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold)),
            isActive: _currentStep >= 8,
            content: Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.borderGold.withOpacity(0.5)),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    'BESPOKE COMMISSION SUMMARY',
                    style: TextStyle(
                      color: BrandColors.gold,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                      letterSpacing: 1.5,
                    ),
                  ),
                  const Divider(color: Colors.white24, height: 20),
                  _buildReviewRow('Silhouette', _productType),
                  _buildReviewRow('Source', _designSource == 'MY_OWN_DESIGN' ? 'Original Design' : 'Modified Atelier Piece'),
                  _buildReviewRow('Colour', _selectedColour),
                  _buildReviewRow('Fabric', _selectedFabric),
                  _buildReviewRow('Craft', _selectedCraft),
                  _buildReviewRow('Sizing', _sizeCategory == 'CUSTOM' ? 'Bespoke Measurements (${_chestCtrl.text}" chest)' : 'Standard ($_standardSize)'),
                  _buildReviewRow('Budget', _budgetCtrl.text),
                  _buildReviewRow('Images Attached', '${_inspirationImages.length} sketches'),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildMeasurementField(String label, TextEditingController ctrl) {
    return TextField(
      controller: ctrl,
      keyboardType: TextInputType.number,
      style: const TextStyle(color: BrandColors.ivory, fontSize: 13),
      decoration: InputDecoration(
        filled: true,
        fillColor: BrandColors.cardDark,
        border: const OutlineInputBorder(),
        labelText: label,
        labelStyle: const TextStyle(color: Colors.white60, fontSize: 10),
        contentPadding: const EdgeInsets.symmetric(horizontal: 8, vertical: 12),
      ),
    );
  }

  Widget _buildReviewRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.white60, fontSize: 12)),
          Flexible(
            child: Text(
              value,
              style: const TextStyle(color: BrandColors.ivory, fontWeight: FontWeight.bold, fontSize: 12),
              textAlign: TextAlign.end,
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
    );
  }
}
