export enum GameStage {
  LOBBY = 'LOBBY',
  BOARD = 'BOARD',
  QUESTION_ACTIVE = 'QUESTION_ACTIVE',
  BUZZED_IN = 'BUZZED_IN',
  ANSWER_REVEAL = 'ANSWER_REVEAL',
  GAME_OVER = 'GAME_OVER'
}

export interface Team {
  id: 'team_1' | 'team_2';
  name: string;
  leaderSocketId: string | null;
  score: number;
}

export interface Question {
  id: string;
  category: string;
  points: number;      // 10, 20, 30
  questionText: string;
  options: string[];   // A, B, C, D
  correctOptionIndex: number; // 0 to 3
  played: boolean;
}

export type GameMode = 'MULTIPLE_CHOICE' | 'OPEN_QUESTION';

export interface GameState {
  roomId: string;
  gameMode: GameMode;
  stage: GameStage;
  teams: {
    team_1: Team;
    team_2: Team;
  };
  categories: string[];
  questions: { [id: string]: Question };
  activeQuestionId: string | null;
  selectingTeamId: 'team_1' | 'team_2';
  buzzedTeamId: 'team_1' | 'team_2' | null;
  buzzTimeRemaining: number;
  answerTimeRemaining: number | null;
  isStealTurn: boolean;
  isOpenAnswerRevealed?: boolean;
  winnerTeamId: 'team_1' | 'team_2' | null;
}

export const CATEGORY_MAP: { [key: string]: { name: string; icon: string } } = {
  sports: { name: 'رياضة كرة القدم', icon: '⚽' },
  cinema: { name: 'سينما وأفلام', icon: '🎬' },
  geography: { name: 'جغرافيا ودول', icon: '🌍' },
  history: { name: 'تاريخ وحضارات', icon: '📜' },
  islamic: { name: 'ثقافة إسلامية', icon: '🕌' },
  science: { name: 'علوم واكتشافات', icon: '🧪' },
  cars: { name: 'سيارات ومحركات', icon: '🚗' },
  health: { name: 'صحة وطب', icon: '🍏' },
  music: { name: 'موسيقى وأغاني', icon: '🎵' },
  food: { name: 'أطعمة ومطابخ', icon: '🍔' },
  proverbs: { name: 'أمثال وحكم', icon: '🧠' },
  literature: { name: 'أدب ولغة عربية', icon: '📚' },
  gaming: { name: 'ألعاب إلكترونية', icon: '🎮' },
  space: { name: 'فضاء وفلك', icon: '🌌' },
  animals: { name: 'عالم الحيوان', icon: '🐾' },
  general_knowledge: { name: 'معلومات عامة', icon: '💡' },
  landmarks: { name: 'معالم وعجائب', icon: '🏛️' },
  tv_shows: { name: 'مسلسلات ودراما', icon: '📺' },
  tech: { name: 'تكنولوجيا وشبكات', icon: '📱' },
  art: { name: 'فنون ومعمار', icon: '🎨' },
  figures: { name: 'شخصيات وأعلام', icon: '👑' }
};

const DEFAULT_CATEGORY_IDS = ['sports', 'cinema', 'geography', 'history', 'islamic', 'science'];

export function createInitialState(roomId: string, categoryIds?: string[]): GameState {
  const selectedCatIds = (categoryIds && categoryIds.length === 6) ? categoryIds : DEFAULT_CATEGORY_IDS;
  
  const categoryNames = selectedCatIds.map(
    (id) => CATEGORY_MAP[id]?.name || id
  );

  const questions: { [id: string]: Question } = {};

  selectedCatIds.forEach((catId, catIdx) => {
    const categoryName = CATEGORY_MAP[catId]?.name || catId;

    // 2 Easy (10 points)
    for (let q = 1; q <= 2; q++) {
      const qId = `cat_${catIdx}_10_${q}`;
      questions[qId] = generateQuestionForCategory(catId, categoryName, 10, q, qId);
    }
    // 2 Medium (20 points)
    for (let q = 1; q <= 2; q++) {
      const qId = `cat_${catIdx}_20_${q}`;
      questions[qId] = generateQuestionForCategory(catId, categoryName, 20, q, qId);
    }
    // 2 Hard (30 points)
    for (let q = 1; q <= 2; q++) {
      const qId = `cat_${catIdx}_30_${q}`;
      questions[qId] = generateQuestionForCategory(catId, categoryName, 30, q, qId);
    }
  });

  return {
    roomId,
    gameMode: 'MULTIPLE_CHOICE',
    stage: GameStage.LOBBY,
    teams: {
      team_1: { id: 'team_1', name: 'شقردية التحدي', leaderSocketId: null, score: 0 },
      team_2: { id: 'team_2', name: 'سناعيس الكرو', leaderSocketId: null, score: 0 }
    },
    categories: categoryNames,
    questions,
    activeQuestionId: null,
    selectingTeamId: 'team_1',
    buzzedTeamId: null,
    buzzTimeRemaining: 20,
    answerTimeRemaining: 12,
    isStealTurn: false,
    isOpenAnswerRevealed: false,
    winnerTeamId: null
  };
}

function generateQuestionForCategory(
  catId: string,
  categoryName: string,
  points: number,
  qNum: number,
  qId: string
): Question {
  const db: { [catId: string]: { [key: string]: { text: string; options: string[]; correct: number } } } = {
    sports: {
      '10_1': { text: 'كم عدد لاعبين فريق كرة القدم داخل الملعب؟', options: ['11 لاعباً', '9 لاعبين', '10 لاعبين', '12 لاعباً'], correct: 0 },
      '10_2': { text: 'كم مدة الشوط الواحد في مباراة كرة القدم الرسمية؟', options: ['45 دقيقة', '30 دقيقة', '60 دقيقة', '40 دقيقة'], correct: 0 },
      '20_1': { text: 'أيها الدولة الأكثر فوزاً ببطولة كأس العالم لكرة القدم؟', options: ['البرازيل', 'ألمانيا', 'الأرجنتين', 'إيطاليا'], correct: 0 },
      '20_2': { text: 'كم عدد بطولات دوري أبطال أوروبا التي فاز بها نادي ريال مدريد؟', options: ['15 بطولة', '10 بطولات', '12 بطولة', '14 بطولة'], correct: 0 },
      '30_1': { text: 'في أي عام أقيمت أول بطولة كأس عالم لكرة القدم في التاريخ؟', options: ['1930م', '1924م', '1950م', '1938م'], correct: 0 },
      '30_2': { text: 'من هو الهداف التاريخي لبطولات كأس العالم برصيد 16 هدفاً؟', options: ['ميروسلاف كلوزه', 'رونالدو الظاهرة', 'ميسي', 'بيليه'], correct: 0 }
    },
    cinema: {
      '10_1': { text: 'ما اسم الجائزة السينمائية الأشهر في هوليوود والعالم؟', options: ['الأوسكار', 'الغولدن غلوب', 'البافتا', 'السيزر'], correct: 0 },
      '10_2': { text: 'ما اسم الفيلم الشهير الذي تدور أحداثه حول غرق سفينة عملاقة في 1912؟', options: ['تايتانيك', 'أفاتار', 'انترستيلار', 'جلاديتر'], correct: 0 },
      '20_1': { text: 'من هو مخرج فيلم "أفاتار" وفيلم "تايتانيك"؟', options: ['جيمس كاميرون', 'ستيفن سب Spielberg', 'كريستوفر نولان', 'مارتن سكورسيزي'], correct: 0 },
      '20_2': { text: 'ما هو الفيلم الأكثر تحقيقاً للإيرادات في تاريخ السينما؟', options: ['أفاتار (Avatar)', 'منتقمون: نهاية اللعبة', 'تايتانيك', 'حرب النجوم'], correct: 0 },
      '30_1': { text: 'في أي عام تم إنتاج الجزء الأول من سلسلة أفلام "العراب" (The Godfather)؟', options: ['1972م', '1968م', '1975م', '1980م'], correct: 0 },
      '30_2': { text: 'من هو الممثل الحاصل على أكبر عدد من جوائز الأوسكار كأفضل ممثل (3 جوائز)؟', options: ['دانيال داي لويس', 'جاك نيكلسون', 'ليوناردو دي كابريو', 'توم هانكس'], correct: 0 }
    },
    geography: {
      '10_1': { text: 'ما هي عاصمة المملكة العربية السعودية؟', options: ['الرياض', 'جدة', 'مكة المكرمة', 'الدمام'], correct: 0 },
      '10_2': { text: 'ما هي عاصمة مصر؟', options: ['القاهرة', 'الإسكندرية', 'الجيزة', 'أسوان'], correct: 0 },
      '20_1': { text: 'ما هو أكبر كوكب أو أكبر محيط في الكرة الأرضية؟', options: ['المحيط الهادئ', 'المحيط الأطلسي', 'المحيط الهندي', 'المحيط المتجمد'], correct: 0 },
      '20_2': { text: 'ما هي أكبر دولة في العالم من حيث المساحة؟', options: ['روسيا', 'كندا', 'الصين', 'أمريكا'], correct: 0 },
      '30_1': { text: 'ما هي أطول سلسلة جبال في العالم؟', options: ['جبال الأنديز', 'جبال الهيمالايا', 'جبال الألب', 'جبال الأطلس'], correct: 0 },
      '30_2': { text: 'ما هي الدولة الأكثر عدداً للسكان في العالم بعد 2023؟', options: ['الهند', 'الصين', 'إندونيسيا', 'باكستان'], correct: 0 }
    },
    history: {
      '10_1': { text: 'في أي قارة تقع أهرامات الجيزة الشهيرة؟', options: ['أفريقيا', 'آسيا', 'أوروبا', 'أمريكا الجنوبية'], correct: 0 },
      '10_2': { text: 'ما اسم سور الصين الشهير الذي يعد من عجائب العالم؟', options: ['سور الصين العظيم', 'سور برلين', 'سور القدس', 'سور بابل'], correct: 0 },
      '20_1': { text: 'في أي عام انتهت الحرب العالمية الثانية؟', options: ['1945م', '1939م', '1918م', '1950م'], correct: 0 },
      '20_2': { text: 'من هو القائد الإسلامي الذي فتح الأندلس؟', options: ['طارق بن زياد', 'صلاح الدين الأيوبي', 'خالد بن الوليد', 'عقبة بن نافع'], correct: 0 },
      '30_1': { text: 'ما هي المدينة التي كانت عاصمة الدولة العباسية؟', options: ['بغداد', 'دمشق', 'الكوفة', 'القاهرة'], correct: 0 },
      '30_2': { text: 'في أي عام سقطت القسطنطينية وفتحها السلطان محمد الفاتح؟', options: ['1453م', '1492م', '1258م', '1350م'], correct: 0 }
    },
    islamic: {
      '10_1': { text: 'كم عدد أركان الإسلام؟', options: ['5 أركان', '6 أركان', '4 أركان', '7 أركان'], correct: 0 },
      '10_2': { text: 'ما هي أطول سورة في القرآن الكريم؟', options: ['سورة البقرة', 'سورة آل عمران', 'سورة النساء', 'سورة الأعراف'], correct: 0 },
      '20_1': { text: 'ما هي السورة التي تسمى "عروس القرآن"؟', options: ['سورة الرحمن', 'سورة يس', 'سورة الملك', 'سورة الواقعة'], correct: 0 },
      '20_2': { text: 'من هو الصحابي الجليل الذي سمي "سيف الله المسلول"؟', options: ['خالد بن الوليد', 'علي بن أبي طالب', 'عمر بن الخطاب', 'حمزة بن عبد المطلب'], correct: 0 },
      '30_1': { text: 'كم عدد السور المكية في القرآن الكريم؟', options: ['86 سورة', '28 سورة', '114 سورة', '90 سورة'], correct: 0 },
      '30_2': { text: 'في أي سنة هجرية وقعت غزوة بدر الكبرى؟', options: ['السنة الثانية هجرية', 'السنة الثالثة هجرية', 'السنة الأولى هجرية', 'السنة الخامس هجرية'], correct: 0 }
    },
    science: {
      '10_1': { text: 'ما هو الرمز الكيميائي للماء؟', options: ['H2O', 'CO2', 'NaCl', 'O2'], correct: 0 },
      '10_2': { text: 'ما هو الغاز الرئيسي الذي يتنفسه الإنسان للبقاء على قيد الحياة؟', options: ['الأكسجين', 'النيتروجين', 'الهيدروجين', 'ثاني أكسيد الكربون'], correct: 0 },
      '20_1': { text: 'من هو العالم الذي اكتشف الجاذبية الأرضية بعد سقوط التفاحة؟', options: ['إسحاق نيوتن', 'أينشتاين', 'جاليليو', 'نيكولا تسلا'], correct: 0 },
      '20_2': { text: 'ما هو أسرع شيء في الكون؟', options: ['سرعة الضوء', 'سرعة الصوت', 'سرعة الطائرة', 'سرعة الرياح'], correct: 0 },
      '30_1': { text: 'ما هو العنصر الكيميائي الأكثر وفرة في الكون؟', options: ['الهيدروجين', 'الهيليوم', 'الأكسجين', 'الكربون'], correct: 0 },
      '30_2': { text: 'ما هي أسرع حاسة تعمل عند الإنسان عند استيقاظه؟', options: ['حاسة السمع', 'حاسة البصر', 'حاسة اللمس', 'حاسة الشم'], correct: 0 }
    }
  };

  const key = `${points}_${qNum}`;
  const defaultQ = {
    text: `سؤال في تصنيف (${categoryName}) بـ ${points} نقطة؟`,
    options: ['الإجابة الأولى', 'الإجابة الثانية', 'الإجابة الثالثة', 'الإجابة الرابعة'],
    correct: 0
  };

  const qData = db[catId]?.[key] || defaultQ;

  return {
    id: qId,
    category: categoryName,
    points,
    questionText: qData.text,
    options: qData.options,
    correctOptionIndex: qData.correct,
    played: false
  };
}
