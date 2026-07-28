import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/socket_service.dart';

class ControllerScreen extends StatelessWidget {
  const ControllerScreen({Key? key}) : super(key: key);

  @override
  Widget build(BuildContext context) {
    final socketService = Provider.of<SocketService>(context);
    final state = socketService.gameState!;
    final myTeamId = socketService.teamId;
    final stage = state['stage'];

    final activeQuestionId = state['activeQuestionId'];
    final Map<String, dynamic> questions = Map<String, dynamic>.from(state['questions']);
    final activeQuestion = activeQuestionId != null ? questions[activeQuestionId] : null;

    final myTeamName = state['teams'][myTeamId]['name'];

    // 1. Stage: QUESTION_ACTIVE -> Show Buzz Button
    Widget buildBuzzer() {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'استعد للضغط بسرعة!',
              style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 30),
            GestureDetector(
              onTap: () => socketService.buzzIn(),
              child: Container(
                width: 220,
                height: 220,
                decoration: BoxDecoration(
                  shape: BoxShape.circle,
                  color: Colors.red,
                  boxShadow: [
                    BoxShadow(
                      color: Colors.red.withOpacity(0.5),
                      blurRadius: 30,
                      spreadRadius: 5,
                    )
                  ],
                  border: Border.all(color: Colors.white, width: 8),
                ),
                alignment: Alignment.center,
                child: const Text(
                  'اضغط 🔔',
                  style: TextStyle(
                    fontFamily: 'Cairo',
                    color: Colors.white,
                    fontSize: 40,
                    fontWeight: FontWeight.w900,
                  ),
                ),
              ),
            ),
            const SizedBox(height: 30),
            Text(
              'الوقت المتبقي: ${state['buzzTimeRemaining']} ثانية',
              style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 16),
            ),
          ],
        ),
      );
    }

    // 2. Stage: BUZZED_IN -> Show Answers or Waiting
    Widget buildAnswering() {
      final buzzedTeamId = state['buzzedTeamId'];
      final isMyBuzz = buzzedTeamId == myTeamId;
      final buzzedTeamName = state['teams'][buzzedTeamId]['name'];
      final isSteal = state['isStealTurn'] == true;

      if (!isMyBuzz) {
        return Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(isSteal ? Icons.swap_horiz : Icons.lock_clock, size: 80, color: Colors.amber),
              const SizedBox(height: 20),
              Text(
                isSteal ? 'السؤال تحول لـ: $buzzedTeamName' : 'الفرصة عند: $buzzedTeamName',
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 22, fontWeight: FontWeight.bold),
              ),
              const SizedBox(height: 8),
              Text(
                isSteal ? 'الفرصة المرتدة بدون وقت محدد' : 'تم قفل الجرس عليك مؤقتاً',
                style: const TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 16),
              ),
            ],
          ),
        );
      }

      if (activeQuestion == null) return const SizedBox.shrink();
      final List<dynamic> options = activeQuestion['options'];

      return Padding(
        padding: const EdgeInsets.all(20.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Container(
              padding: const EdgeInsets.all(16),
              decoration: BoxDecoration(
                color: const Color(0xFF160E2E),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: isSteal ? Colors.blue : Colors.amber.withOpacity(0.3), width: isSteal ? 2 : 1),
              ),
              child: Column(
                children: [
                  if (isSteal)
                    const Padding(
                      padding: EdgeInsets.only(bottom: 6),
                      child: Text(
                        '⚡ فرصة مرتدة - بدون وقت محدد!',
                        style: TextStyle(fontFamily: 'Cairo', color: Colors.blue, fontWeight: FontWeight.bold, fontSize: 14),
                      ),
                    ),
                  Text(
                    activeQuestion['questionText'],
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 18, fontWeight: FontWeight.bold),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 24),
            Text(
              isSteal ? '🔥 لديك الوقت الكافي للتفكير.. اختر الإجابة:' : 'اختر الإجابة الصحيحة بالهاتف:',
              textAlign: TextAlign.center,
              style: TextStyle(fontFamily: 'Cairo', color: isSteal ? Colors.blue : Colors.grey, fontSize: 14, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Expanded(
              child: ListView.builder(
                itemCount: options.length,
                itemBuilder: (context, index) {
                  final letter = ['أ', 'ب', 'ج', 'د'][index];
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 12),
                    child: ElevatedButton(
                      onPressed: () => socketService.submitAnswer(index),
                      style: ElevatedButton.styleFrom(
                        padding: const EdgeInsets.symmetric(vertical: 16),
                        backgroundColor: const Color(0xFF1F1642),
                        side: const BorderSide(color: Colors.amber, width: 1.5),
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
                      ),
                      child: Row(
                        children: [
                          const SizedBox(width: 15),
                          CircleAvatar(
                            radius: 18,
                            backgroundColor: Colors.amber,
                            child: Text(
                              letter,
                              style: const TextStyle(color: Color(0xFF0D0A1B), fontWeight: FontWeight.bold),
                            ),
                          ),
                          const SizedBox(width: 20),
                          Expanded(
                            child: Text(
                              options[index],
                              textAlign: TextAlign.right,
                              style: const TextStyle(
                                fontFamily: 'Cairo',
                                color: Colors.white,
                                fontSize: 18,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      );
    }

    // 3. Stage: ANSWER_REVEAL -> Wait for TV to return to board
    Widget buildReveal() {
      final buzzedTeamId = state['buzzedTeamId'];
      final isCorrect = state['teams'][buzzedTeamId]['score'] > 0; // Simple check

      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isCorrect ? Icons.check_circle_outline : Icons.highlight_off,
              size: 100,
              color: isCorrect ? Colors.green : Colors.red,
            ),
            const SizedBox(height: 20),
            const Text(
              'تابع شاشة التلفاز لمشاهدة النتيجة',
              style: TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 10),
            const Text(
              'سوف نعود للوحة الأسئلة بعد قليل...',
              style: TextStyle(fontFamily: 'Cairo', color: Colors.grey, fontSize: 14),
            ),
          ],
        ),
      );
    }

    // 4. Stage: GAME_OVER
    Widget buildGameOver() {
      final winnerId = state['winnerTeamId'];
      final isWinner = winnerId == myTeamId;
      final isDraw = winnerId == null;

      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24.0),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(
                isDraw ? '🤝 تعادل!' : (isWinner ? '🏆 فوز ساحق!' : '😢 هاردلك!'),
                style: TextStyle(
                  fontFamily: 'Cairo',
                  color: isDraw ? Colors.amber : (isWinner ? Colors.green : Colors.red),
                  fontSize: 32,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 20),
              Text(
                isDraw
                    ? 'تعادل الكيرف يا أبطال!'
                    : (isWinner ? 'بيضتوا الوجه وطرتوا بالكيرف!' : 'معوضين خير بالجولة القادمة!'),
                textAlign: TextAlign.center,
                style: const TextStyle(fontFamily: 'Cairo', color: Colors.white, fontSize: 18),
              ),
              const SizedBox(height: 40),
              ElevatedButton(
                onPressed: () => socketService.resetGame(),
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.amber,
                  padding: const EdgeInsets.symmetric(horizontal: 40, vertical: 15),
                  shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(20)),
                ),
                child: const Text(
                  'لعب جولة أخرى 🔄',
                  style: TextStyle(fontFamily: 'Cairo', color: Colors.black, fontWeight: FontWeight.bold, fontSize: 16),
                ),
              ),
            ],
          ),
        ),
      );
    }

    Widget getBody() {
      switch (stage) {
        case 'QUESTION_ACTIVE':
          return buildBuzzer();
        case 'BUZZED_IN':
          return buildAnswering();
        case 'ANSWER_REVEAL':
          return buildReveal();
        case 'GAME_OVER':
          return buildGameOver();
        default:
          return const Center(child: Text('المرحلة مجهولة'));
      }
    }

    return Scaffold(
      backgroundColor: const Color(0xFF0D0A1B),
      appBar: AppBar(
        title: Text(myTeamName, style: const TextStyle(fontFamily: 'Cairo', fontWeight: FontWeight.bold)),
        backgroundColor: const Color(0xFF160E2E),
        centerTitle: true,
      ),
      body: Directionality(
        textDirection: TextDirection.rtl,
        child: getBody(),
      ),
    );
  }
}
