export interface QuestionCategoryData {
  id: string;
  name: string;
  icon: string;
  description: string;
  tags: string[];
}

export const GENERAL_CATEGORIES: QuestionCategoryData[] = [
  {
    id: 'sports',
    name: 'رياضة كرة القدم',
    icon: '⚽',
    description: 'بطولات كأس العالم، دوري الأبطال، وأساطير الكرة',
    tags: ['رياضة', 'كرة قدم']
  },
  {
    id: 'cinema',
    name: 'سينما وأفلام',
    icon: '🎬',
    description: 'أفلام هوليوود، أفلام عربية، وجوائز الأوسكار',
    tags: ['سينما', 'أفلام']
  },
  {
    id: 'geography',
    name: 'جغرافيا ودول',
    icon: '🌍',
    description: 'العواصم، الدول، الأنهار، والجبال حول العالم',
    tags: ['جغرافيا', 'دول']
  },
  {
    id: 'history',
    name: 'تاريخ وحضارات',
    icon: '📜',
    description: 'الحضارات القديمة، الأحداث التاريخية العظمى',
    tags: ['تاريخ']
  },
  {
    id: 'islamic',
    name: 'ثقافة إسلامية',
    icon: '🕌',
    description: 'القرآن الكريم، السيرة النبوية، والتاريخ الإسلامي',
    tags: ['إسلاميات']
  },
  {
    id: 'science',
    name: 'علوم واكتشافات',
    icon: '🧪',
    description: 'الفيزياء، الكيمياء، النظريات والعلماء المقترنون بها',
    tags: ['علوم']
  },
  {
    id: 'cars',
    name: 'سيارات ومحركات',
    icon: '🚗',
    description: 'ماركات السيارات، المحركات، وعالم السرعة',
    tags: ['سيارات']
  },
  {
    id: 'health',
    name: 'صحة وطب',
    icon: '🍏',
    description: 'جسم الإنسان، الفيتامينات، والنصائح الطبية',
    tags: ['طب', 'صحة']
  },
  {
    id: 'music',
    name: 'موسيقى وأغاني',
    icon: '🎵',
    description: 'الآلات الموسيقية، الألحان، والمطربون الكبار',
    tags: ['موسيقى']
  },
  {
    id: 'food',
    name: 'أطعمة ومطابخ',
    icon: '🍔',
    description: 'المطبخ العربي والعالمي، المكونات والأطباق المشهورة',
    tags: ['أطعمة']
  },
  {
    id: 'proverbs',
    name: 'أمثال وحكم',
    icon: '🧠',
    description: 'الأمثال الشعبية، معاني الكلمات، والحكم الشهيرة',
    tags: ['ثقافة']
  },
  {
    id: 'literature',
    name: 'أدب ولغة عربية',
    icon: '📚',
    description: 'الشعر العربي، الروايات، وقواعد اللغة',
    tags: ['أدب', 'شعر']
  },
  {
    id: 'gaming',
    name: 'ألعاب إلكترونية',
    icon: '🎮',
    description: 'ألعاب الفيديو، البلايستيشن، والشخصيات الأيقونية',
    tags: ['ألعاب']
  },
  {
    id: 'space',
    name: 'فضاء وفلك',
    icon: '🌌',
    description: 'الكواكب، المجرات، رحلات الفضاء والنجوم',
    tags: ['فضاء']
  },
  {
    id: 'animals',
    name: 'عالم الحيوان',
    icon: '🐾',
    description: 'الحيوانات المفترسة، الكائنات البحرية والطيور',
    tags: ['حيوانات']
  },
  {
    id: 'general_knowledge',
    name: 'معلومات عامة',
    icon: '💡',
    description: 'ألغاز، معلومات طريفة، وثقافة متنوعة',
    tags: ['عامة']
  },
  {
    id: 'landmarks',
    name: 'معالم وعجائب',
    icon: '🏛️',
    description: 'عجائب العالم السبع، المتاحف، والمباني الأيقونية',
    tags: ['معالم']
  },
  {
    id: 'tv_shows',
    name: 'مسلسلات ودراما',
    icon: '📺',
    description: 'المسلسلات العالمية المشهورة والدراما العربية',
    tags: ['مسلسلات']
  },
  {
    id: 'tech',
    name: 'تكنولوجيا وشبكات',
    icon: '📱',
    description: 'الهواتف الذكية، الذكاء الاصطناعي، والإنترنت',
    tags: ['تقنية']
  },
  {
    id: 'art',
    name: 'فنون ومعمار',
    icon: '🎨',
    description: 'اللوحات العالمية، الرسامين المشهورين، والأنماط المعمارية',
    tags: ['فنون']
  },
  {
    id: 'figures',
    name: 'شخصيات وأعلام',
    icon: '👑',
    description: 'القادة التاريخيون، الشخصيات المؤثرة، وأباطرة العالم',
    tags: ['شخصيات', 'تاريخ']
  }
];
