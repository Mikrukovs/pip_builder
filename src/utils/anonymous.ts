// Генератор случайных имен для анонимных пользователей

const adjectives = [
  'Смешной', 'Веселый', 'Быстрый', 'Умный', 'Добрый',
  'Храбрый', 'Сильный', 'Ловкий', 'Милый', 'Яркий',
  'Тихий', 'Громкий', 'Пушистый', 'Гладкий', 'Мудрый',
  'Забавный', 'Радостный', 'Дружелюбный', 'Энергичный', 'Спокойный'
];

const animals = [
  'Кролик', 'Панда', 'Лиса', 'Волк', 'Медведь',
  'Тигр', 'Лев', 'Енот', 'Барсук', 'Белка',
  'Хомяк', 'Пингвин', 'Сова', 'Орел', 'Дельфин',
  'Кот', 'Пес', 'Жираф', 'Слон', 'Коала'
];

export function generateAnonymousName(): string {
  const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
  const animal = animals[Math.floor(Math.random() * animals.length)];
  return `${adjective} ${animal}`;
}

export function generateAnonymousUser() {
  const id = Math.floor(Math.random() * 1000000);
  const name = generateAnonymousName();
  
  return {
    id,
    telegramId: null,
    username: null,
    firstName: name,
    lastName: null,
    photoUrl: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
