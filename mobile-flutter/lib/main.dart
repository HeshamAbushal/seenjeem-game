import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'services/socket_service.dart';
import 'screens/lobby_screen.dart';
import 'screens/board_screen.dart';
import 'screens/controller_screen.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SocketService(),
      child: MaterialApp(
        title: 'سين جيم - تحكم أبو سعيد',
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: const Color(0xFF160E2E),
            brightness: Brightness.dark,
          ),
          useMaterial3: true,
          fontFamily: 'Cairo', // Requires Cairo font added to pubspec or loaded dynamically
        ),
        home: const GameControllerRouter(),
        debugShowCheckedModeBanner: false,
      ),
    );
  }
}

class GameControllerRouter extends StatelessWidget {
  const GameControllerRouter({super.key});

  @override
  Widget build(BuildContext context) {
    final socketService = Provider.of<SocketService>(context);

    // If not connected or state is not initialized, show the connection Lobby screen
    if (!socketService.isConnected || socketService.gameState == null) {
      return const LobbyScreen();
    }

    final state = socketService.gameState!;
    final stage = state['stage'] as String;

    switch (stage) {
      case 'LOBBY':
        return const LobbyScreen();
      case 'BOARD':
        return const BoardScreen();
      case 'QUESTION_ACTIVE':
      case 'BUZZED_IN':
      case 'ANSWER_REVEAL':
      case 'GAME_OVER':
        return const ControllerScreen();
      default:
        return const LobbyScreen();
    }
  }
}
