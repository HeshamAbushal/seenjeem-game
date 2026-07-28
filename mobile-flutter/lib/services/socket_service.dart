import 'package:flutter/material.dart';
import 'package:socket_io_client/socket_io_client.dart' as IO;

class SocketService extends ChangeNotifier {
  late IO.Socket _socket;
  Map<String, dynamic>? _gameState;
  String? _roomId;
  String? _teamId;
  bool _isConnected = false;
  String? _errorMessage;

  // Getters
  IO.Socket get socket => _socket;
  Map<String, dynamic>? get gameState => _gameState;
  String? get roomId => _roomId;
  String? get teamId => _teamId;
  bool get isConnected => _isConnected;
  String? get errorMessage => _errorMessage;

  // Connection URL pointing to Express/Socket.io backend
  // For local testing on emulator, use 'http://10.0.2.2:3000' for Android,
  // or your machine's local IP (e.g. 'http://192.168.1.100:3000')
  void connect(String url) {
    _socket = IO.io(url, IO.OptionBuilder()
      .setTransports(['websocket'])
      .disableAutoConnect()
      .build());

    _socket.connect();

    _socket.onConnect((_) {
      _isConnected = true;
      _errorMessage = null;
      notifyListeners();
      print('Connected to Seen Jeem backend');
    });

    _socket.onDisconnect((_) {
      _isConnected = false;
      notifyListeners();
      print('Disconnected from backend');
    });

    _socket.on('sync_state', (data) {
      _gameState = data as Map<String, dynamic>;
      notifyListeners();
    });

    _socket.on('join_success', (data) {
      _teamId = data['teamId'];
      _gameState = data['state'];
      _errorMessage = null;
      notifyListeners();
    });

    _socket.on('join_error', (data) {
      _errorMessage = data['message'];
      notifyListeners();
    });
  }

  // Actions
  void joinRoom(String roomId, String teamId) {
    _roomId = roomId.toUpperCase().trim();
    _socket.emit('join_room', {
      'roomId': _roomId,
      'teamId': teamId,
    });
  }

  void selectQuestion(String questionId) {
    if (_roomId != null) {
      _socket.emit('select_question', {
        'roomId': _roomId,
        'questionId': questionId,
      });
    }
  }

  void buzzIn() {
    if (_roomId != null && _teamId != null) {
      _socket.emit('buzz_in', {
        'roomId': _roomId,
        'teamId': _teamId,
      });
    }
  }

  void submitAnswer(int answerIndex) {
    if (_roomId != null && _teamId != null) {
      _socket.emit('submit_answer', {
        'roomId': _roomId,
        'teamId': _teamId,
        'answerIndex': answerIndex,
      });
    }
  }

  void resetGame() {
    if (_roomId != null) {
      _socket.emit('reset_game', {'roomId': _roomId});
    }
  }

  void disconnect() {
    _socket.disconnect();
    _isConnected = false;
    _gameState = null;
    _roomId = null;
    _teamId = null;
    notifyListeners();
  }
}
