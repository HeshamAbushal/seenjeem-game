import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';

class BoardScreen extends StatelessWidget {
  const BoardScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final socketService = Provider.of<SocketService>(context);
    final state = socketService.gameState!;
    final myTeamId = socketService.teamId;
    
    final selectingTeamId = state['selectingTeamId'];
    final isMyTurn = selectingTeamId == myTeamId;
    
    final List<dynamic> categories = state['categories'];
    final Map<String, dynamic> questions = Map<String, dynamic>.from(state['questions']);

    // Group questions by category
    List<Map<String, dynamic>> getQuestionsForCategory(String categoryName) {
      return questions.values
          .where((q) => q['category'] == categoryName)
          .map((q) => Map<String, dynamic>.from(q))
          .toList()
          ..sort((a, b) => (a['points'] as int).compareTo(b['points'] as int));
    }

    final myTeamName = state['teams'][myTeamId]['name'];
    final opponentTeamId = myTeamId == 'team_1' ? 'team_2' : 'team_1';
    final opponentName = state['teams'][opponentTeamId]['name'];

    return Scaffold(
      backgroundColor: const Color(0xFF0D0A1B),
      appBar: AppBar(
        title: Text(myTeamName, style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF160E2E),
        centerTitle: true,
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () => socketService.resetGame(),
          )
        ],
      ),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: Column(
          children: [
            // Turn Banner
            Container(
              width: double.infinity,
              padding: const EdgeInsets.all(16),
              color: isMyTurn ? Colors.green.withOpacity(0.15) : Colors.red.withOpacity(0.08),
              child: Text(
                isMyTurn ? 'أنت تختار الآن! اضغط على أحد الأسئلة لتفعيله:' : 'دور الاختيار عند: $opponentName. انتظر اختيارهم...',
                textAlign: TextAlign.center,
                style: TextStyle(
                  fontFamily: 'Cairo',
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: isMyTurn ? Colors.green : Colors.amber,
                ),
              ),
            ),

            // Main Grid
            Expanded(
              child: SingleChildScrollView(
                padding: const EdgeInsets.all(16),
                child: Column(
                  children: categories.map((catName) {
                    final catQuestions = getQuestionsForCategory(catName);

                    return Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Padding(
                          padding: const EdgeInsets.symmetric(vertical: 8),
                          child: Text(
                            catName,
                            style: const TextStyle(
                              fontFamily: 'Cairo',
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                              color: Colors.amber,
                            ),
                          ),
                        ),
                        GridView.builder(
                          shrinkWrap: true,
                          physics: const NeverScrollableScrollPhysics(),
                          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                            crossAxisCount: 6,
                            crossAxisSpacing: 8,
                            mainAxisSpacing: 8,
                            childAspectRatio: 1.0,
                          ),
                          itemCount: catQuestions.length,
                          itemBuilder: (context, index) {
                            final q = catQuestions[index];
                            final isPlayed = q['played'] as bool;
                            final points = q['points'] as int;
                            final qId = q['id'] as String;

                            return InkWell(
                              onTap: (!isPlayed && isMyTurn)
                                  ? () => socketService.selectQuestion(qId)
                                  : null,
                              child: Container(
                                decoration: BoxDecoration(
                                  color: isPlayed
                                      ? Colors.grey.withOpacity(0.1)
                                      : (isMyTurn ? const Color(0xFF2563EB) : const Color(0xFF160E2E)),
                                  border: Border.all(
                                    color: isPlayed
                                        ? Colors.transparent
                                        : (isMyTurn ? Colors.blue : const Color(0xFF3A305B)),
                                  ),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                alignment: Alignment.center,
                                child: Text(
                                  isPlayed ? '✓' : '$points',
                                  style: TextStyle(
                                    fontFamily: 'Cairo',
                                    fontSize: 14,
                                    fontWeight: FontWeight.bold,
                                    color: isPlayed ? Colors.grey : Colors.white,
                                    decoration: isPlayed ? TextDecoration.lineThrough : null,
                                  ),
                                ),
                              ),
                            );
                          },
                        ),
                        const SizedBox(height: 12),
                      ],
                    );
                  }).toList(),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
