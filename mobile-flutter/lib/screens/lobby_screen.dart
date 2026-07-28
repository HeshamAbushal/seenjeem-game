import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';

class LobbyScreen extends StatefulWidget {
  const LobbyScreen({Key? key}) : super(key: key);

  @override
  State<LobbyScreen> createState() => _LobbyScreenState();
}

class _LobbyScreenState extends State<LobbyScreen> {
  final _serverUrlController = TextEditingController(text: 'http://localhost:3000');
  final _roomCodeController = TextEditingController();
  String _selectedTeam = 'team_1'; // Default team

  @override
  void dispose() {
    _serverUrlController.dispose();
    _roomCodeController.dispose();
    super.dispose();
  }

  void _handleJoin(BuildContext context) {
    final socketService = Provider.of<SocketService>(context, listen: false);
    
    if (_roomCodeController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('الرجاء إدخال رمز الغرفة')),
      );
      return;
    }

    if (!socketService.isConnected) {
      socketService.connect(_serverUrlController.text.trim());
    }

    // Wait a brief moment to connect, then join
    Future.delayed(const Duration(milliseconds: 500), () {
      if (socketService.isConnected) {
        socketService.joinRoom(
          _roomCodeController.text.trim(),
          _selectedTeam,
        );
      } else {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('فشل الاتصال بالسيرفر. تحقق من الرابط.')),
        );
      }
    });
  }

  @override
  Widget build(BuildContext context) {
    final socketService = Provider.of<SocketService>(context);

    return Scaffold(
      backgroundColor: const Color(0xFF0D0A1B),
      appBar: AppBar(
        title: const Text('سين جيم - تحكم أبو سعيد', style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        centerTitle: true,
        backgroundColor: const Color(0xFF160E2E),
        elevation: 0,
      ),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: SingleChildScrollView(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 20),
              // Logo placeholder icon
              const Center(
                child: Icon(
                  Icons.gamepad_rounded,
                  size: 80,
                  color: Colors.amber,
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'لوحة التحكم لقادة الفرق',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 22,
                  fontWeight: FontWeight.bold,
                  color: Colors.white,
                ),
              ),
              const SizedBox(height: 8),
              const Text(
                'تأكد من كتابة كود الغرفة الموضح على شاشة التلفاز',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 14,
                  color: Colors.grey,
                ),
              ),
              const SizedBox(height: 30),

              // Server URL Field
              TextField(
                controller: _serverUrlController,
                style: const TextStyle(color: Colors.white),
                decoration: InputDecoration(
                  labelText: 'رابط خادم اللعبة (Server URL)',
                  labelStyle: const TextStyle(color: Colors.amber, fontFamily: 'Cairo'),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: Color(0xFF3A305B)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: Colors.amber),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 20),

              // Room Code Field
              TextField(
                controller: _roomCodeController,
                autocorrect: false,
                textCapitalization: TextCapitalization.characters,
                style: const TextStyle(color: Colors.white, fontSize: 24, fontWeight: FontWeight.bold, letterSpacing: 2),
                textAlign: TextAlign.center,
                decoration: InputDecoration(
                  labelText: 'كود الغرفة',
                  labelStyle: const TextStyle(color: Colors.amber, fontFamily: 'Cairo', fontSize: 16),
                  hintText: 'ABU12',
                  hintStyle: const TextStyle(color: Colors.grey, fontSize: 20),
                  enabledBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: Color(0xFF3A305B)),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  focusedBorder: OutlineInputBorder(
                    borderSide: const BorderSide(color: Colors.amber),
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
              ),
              const SizedBox(height: 24),

              // Team Selector Headers
              const Text(
                'اختر فريقك:',
                style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 16, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 10),

              // Team selection buttons
              Row(
                children: [
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() => _selectedTeam = 'team_1');
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: _selectedTeam == 'team_1'
                            ? const Color(0xFF2563EB)
                            : const Color(0xFF160E2E),
                        side: BorderSide(
                          color: _selectedTeam == 'team_1' ? Colors.blue : const Color(0xFF3A305B),
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text(
                        'شقردية أبو سعيد',
                        style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: ElevatedButton(
                      onPressed: () {
                        setState(() => _selectedTeam = 'team_2');
                      },
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: _selectedTeam == 'team_2'
                            ? const Color(0xFFD97706)
                            : const Color(0xFF160E2E),
                        side: BorderSide(
                          color: _selectedTeam == 'team_2' ? Colors.amber : const Color(0xFF3A305B),
                        ),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: const Text(
                        'سناعيس الكرو',
                        style: TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold, color: Colors.white),
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 35),

              // Error messages from socket if any
              if (socketService.errorMessage != null)
                Padding(
                  padding: const EdgeInsets.only(bottom: 20),
                  child: Text(
                    socketService.errorMessage!,
                    textAlign: TextAlign.center,
                    style: const TextStyle(color: Colors.red, fontFamily: 'Cairo', fontWeight: FontWeight.bold),
                  ),
                ),

              // Submit Button
              ElevatedButton(
                onPressed: () => _handleJoin(context),
                style: ElevatedButton.styleFrom(
                  padding: const EdgeInsets.symmetric(vertical: 18),
                  backgroundColor: Colors.amber,
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                  elevation: 5,
                ),
                child: const Text(
                  'انضم للفريق ودخول الغرفة',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                    color: Color(0xFF0D0A1B),
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
