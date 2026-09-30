import 'package:flutter/material.dart';
import '../core/constants/colors.dart';

class ProfileScreen extends StatefulWidget {
  const ProfileScreen({super.key});

  @override
  State<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends State<ProfileScreen> {
  bool _inAppNotifs = true;
  bool _pushNotifs = true;
  bool _smsNotifs = true;
  bool _emailLookbooks = false;

  void _showMeasurementDialog() {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        backgroundColor: BrandColors.surfaceDark,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: const BorderSide(color: BrandColors.gold),
        ),
        title: const Text(
          'UPDATE ATELIER MEASUREMENTS',
          style: TextStyle(
            color: BrandColors.gold,
            fontSize: 14,
            fontWeight: FontWeight.bold,
            letterSpacing: 1.5,
          ),
        ),
        content: const SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Text(
                'Your measurements are archived for bespoke tailoring across all future commissions.',
                style: TextStyle(color: Colors.white70, fontSize: 12),
              ),
              SizedBox(height: 14),
              TextField(
                decoration: InputDecoration(
                  labelText: 'Chest (inches)',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: BrandColors.cardDark,
                ),
              ),
              SizedBox(height: 10),
              TextField(
                decoration: InputDecoration(
                  labelText: 'Waist (inches)',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: BrandColors.cardDark,
                ),
              ),
              SizedBox(height: 10),
              TextField(
                decoration: InputDecoration(
                  labelText: 'Hip (inches)',
                  border: OutlineInputBorder(),
                  filled: true,
                  fillColor: BrandColors.cardDark,
                ),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('CANCEL', style: TextStyle(color: Colors.white54)),
          ),
          ElevatedButton(
            style: ElevatedButton.styleFrom(
              backgroundColor: BrandColors.gold,
              foregroundColor: BrandColors.surfaceDark,
            ),
            onPressed: () {
              Navigator.pop(ctx);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Atelier measurement profile updated successfully.'),
                  backgroundColor: BrandColors.emerald,
                ),
              );
            },
            child: const Text('SAVE PROFILE'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('PATRON PROFILE'),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // VIP Patron Card
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [BrandColors.cardDark, BrandColors.surfaceDark],
                  begin: Alignment.topLeft,
                  end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(16),
                border: Border.all(color: BrandColors.borderGold, width: 1.5),
                boxShadow: [
                  BoxShadow(
                    color: Colors.black.withOpacity(0.3),
                    blurRadius: 10,
                    offset: const Offset(0, 4),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text(
                        'ROYAL ATELIER PATRON',
                        style: TextStyle(
                          color: BrandColors.gold,
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                          letterSpacing: 2.0,
                        ),
                      ),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                        decoration: BoxDecoration(
                          color: BrandColors.gold,
                          borderRadius: BorderRadius.circular(4),
                        ),
                        child: const Text(
                          'TIER I PRIVILEGE',
                          style: TextStyle(
                            color: BrandColors.surfaceDark,
                            fontSize: 9,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  const Text(
                    'Begum Sophia Al-Rashid',
                    style: TextStyle(
                      color: BrandColors.ivory,
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      fontFamily: 'serif',
                    ),
                  ),
                  const SizedBox(height: 4),
                  const Text(
                    'Patron ID: KTQ-VIP-7819 • Joined 2024',
                    style: TextStyle(color: Colors.white54, fontSize: 11),
                  ),
                  const SizedBox(height: 12),
                  const Divider(color: Colors.white12, height: 1),
                  const SizedBox(height: 12),
                  const Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text('EMAIL', style: TextStyle(color: Colors.white38, fontSize: 9)),
                          Text('sophia.alrashid@couture.pk', style: TextStyle(color: BrandColors.ivory, fontSize: 12)),
                        ],
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text('VIP HOTLINE', style: TextStyle(color: Colors.white38, fontSize: 9)),
                          Text('+92 300 8472910', style: TextStyle(color: BrandColors.ivory, fontSize: 12)),
                        ],
                      ),
                    ],
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Saved Atelier Measurements
            _buildSectionHeader('SAVED ATELIER MEASUREMENTS', Icons.straighten),
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
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMeasurementStat('Chest', '36"'),
                      _buildMeasurementStat('Waist', '28"'),
                      _buildMeasurementStat('Hip', '38"'),
                      _buildMeasurementStat('Length', '56"'),
                    ],
                  ),
                  const SizedBox(height: 14),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceAround,
                    children: [
                      _buildMeasurementStat('Shoulder', '14.5"'),
                      _buildMeasurementStat('Sleeve', '22"'),
                      _buildMeasurementStat('Armhole', '16"'),
                      _buildMeasurementStat('Inseam', '41"'),
                    ],
                  ),
                  const SizedBox(height: 16),
                  OutlinedButton.icon(
                    style: OutlinedButton.styleFrom(
                      side: const BorderSide(color: BrandColors.gold),
                      minimumSize: const Size(double.infinity, 42),
                    ),
                    icon: const Icon(Icons.edit, color: BrandColors.gold, size: 14),
                    label: const Text(
                      'EDIT SAVED MEASUREMENTS',
                      style: TextStyle(color: BrandColors.gold, fontSize: 11, fontWeight: FontWeight.bold),
                    ),
                    onPressed: _showMeasurementDialog,
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // VIP Concierge & Stylist
            _buildSectionHeader('ATELIER CONCIERGE & STYLIST', Icons.support_agent),
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
                  _buildConciergeTile(
                    'WhatsApp VIP Stylist Desk',
                    'Direct encrypted channel with Head Designer Meer & Mus',
                    Icons.chat_bubble_outline,
                    () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Opening encrypted WhatsApp VIP Concierge...'),
                          backgroundColor: BrandColors.emerald,
                        ),
                      );
                    },
                  ),
                  const Divider(color: Colors.white12, height: 16),
                  _buildConciergeTile(
                    'Private Atelier Appointment',
                    'Book a private viewing at our Lahore Flagship Atelier',
                    Icons.calendar_month_outlined,
                    () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('Atelier appointment request submitted to concierge.'),
                          backgroundColor: BrandColors.emerald,
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // Notification Channels
            _buildSectionHeader('COMMUNICATION PREFERENCES', Icons.notifications_outlined),
            const SizedBox(height: 10),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              decoration: BoxDecoration(
                color: BrandColors.cardDark,
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: BrandColors.borderGold.withOpacity(0.3)),
              ),
              child: Column(
                children: [
                  SwitchListTile(
                    activeColor: BrandColors.gold,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('In-App Atelier Alerts', style: TextStyle(color: BrandColors.ivory, fontSize: 13)),
                    subtitle: const Text('Milestones, quotation updates and messages', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    value: _inAppNotifs,
                    onChanged: (v) => setState(() => _inAppNotifs = v),
                  ),
                  const Divider(color: Colors.white12, height: 1),
                  SwitchListTile(
                    activeColor: BrandColors.gold,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Push Notifications', style: TextStyle(color: BrandColors.ivory, fontSize: 13)),
                    subtitle: const Text('Production progress and QC pass alerts', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    value: _pushNotifs,
                    onChanged: (v) => setState(() => _pushNotifs = v),
                  ),
                  const Divider(color: Colors.white12, height: 1),
                  SwitchListTile(
                    activeColor: BrandColors.gold,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('SMS Courier Tracking', style: TextStyle(color: BrandColors.ivory, fontSize: 13)),
                    subtitle: const Text('Real-time courier dispatch and delivery OTP', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    value: _smsNotifs,
                    onChanged: (v) => setState(() => _smsNotifs = v),
                  ),
                  const Divider(color: Colors.white12, height: 1),
                  SwitchListTile(
                    activeColor: BrandColors.gold,
                    contentPadding: EdgeInsets.zero,
                    title: const Text('Haute Lookbook Previews', style: TextStyle(color: BrandColors.ivory, fontSize: 13)),
                    subtitle: const Text('Exclusive seasonal private viewing invitations', style: TextStyle(color: Colors.white54, fontSize: 11)),
                    value: _emailLookbooks,
                    onChanged: (v) => setState(() => _emailLookbooks = v),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 32),

            // Sign Out Button
            Center(
              child: TextButton.icon(
                icon: const Icon(Icons.logout, color: Colors.white54, size: 16),
                label: const Text('SIGN OUT OF ATELIER ACCOUNT', style: TextStyle(color: Colors.white54, fontSize: 11, letterSpacing: 1.0)),
                onPressed: () {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(
                      content: Text('Signed out of patron account.'),
                      backgroundColor: BrandColors.surfaceDark,
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

  Widget _buildMeasurementStat(String label, String value) {
    return Column(
      children: [
        Text(label, style: const TextStyle(color: Colors.white54, fontSize: 10)),
        const SizedBox(height: 4),
        Text(value, style: const TextStyle(color: BrandColors.gold, fontSize: 14, fontWeight: FontWeight.bold)),
      ],
    );
  }

  Widget _buildConciergeTile(String title, String subtitle, IconData icon, VoidCallback onTap) {
    return InkWell(
      onTap: onTap,
      child: Row(
        children: [
          Container(
            padding: const EdgeInsets.all(10),
            decoration: BoxDecoration(
              color: BrandColors.surfaceDark,
              borderRadius: BorderRadius.circular(8),
              border: Border.all(color: BrandColors.borderGold.withOpacity(0.5)),
            ),
            child: Icon(icon, color: BrandColors.gold, size: 20),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: const TextStyle(color: BrandColors.ivory, fontSize: 13, fontWeight: FontWeight.bold)),
                const SizedBox(height: 2),
                Text(subtitle, style: const TextStyle(color: Colors.white54, fontSize: 11)),
              ],
            ),
          ),
          const Icon(Icons.chevron_right, color: Colors.white38, size: 18),
        ],
      ),
    );
  }
}
