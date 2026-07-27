// Comprehensive countries database with cities and trilingual localization
// Used by CountryFilter, RegionCountryFilter, and API routes

export interface City {
  name: { ru: string; en: string; az: string };
}

export interface CountryData {
  code: string;
  name: { ru: string; en: string; az: string };
  cities: City[];
}

export const countriesDatabase: CountryData[] = [
  // ==================== EUROPE ====================
  { code: "TR", name: { ru: "Турция", en: "Turkey", az: "Türkiyə" }, cities: [
    { name: { ru: "Стамбул", en: "Istanbul", az: "İstanbul" } },
    { name: { ru: "Анталья", en: "Antalya", az: "Antalya" } },
    { name: { ru: "Бодрум", en: "Bodrum", az: "Bodrum" } },
    { name: { ru: "Мармарис", en: "Marmaris", az: "Marmaris" } },
    { name: { ru: "Кемер", en: "Kemer", az: "Kemer" } },
    { name: { ru: "Каппадокия", en: "Cappadocia", az: "Kapadokiya" } },
    { name: { ru: "Измир", en: "Izmir", az: "İzmir" } },
    { name: { ru: "Аланья", en: "Alanya", az: "Alanya" } },
    { name: { ru: "Даламан", en: "Dalaman", az: "Dalaman" } },
    { name: { ru: "Фетхие", en: "Fethiye", az: "Fethiye" } },
    { name: { ru: "Кушадасы", en: "Kusadasi", az: "Kuşadası" } },
    { name: { ru: "Памуккале", en: "Pamukkale", az: "Pamukkale" } },
  ]},
  { code: "IT", name: { ru: "Италия", en: "Italy", az: "İtaliya" }, cities: [
    { name: { ru: "Рим", en: "Rome", az: "Roma" } },
    { name: { ru: "Милан", en: "Milan", az: "Milan" } },
    { name: { ru: "Венеция", en: "Venice", az: "Venesiya" } },
    { name: { ru: "Флоренция", en: "Florence", az: "Florensiya" } },
    { name: { ru: "Неаполь", en: "Naples", az: "Napoli" } },
    { name: { ru: "Турин", en: "Turin", az: "Turin" } },
    { name: { ru: "Генуя", en: "Genoa", az: "Cenuya" } },
    { name: { ru: "Палермо", en: "Palermo", az: "Palermo" } },
    { name: { ru: "Катания", en: "Catania", az: "Katanıya" } },
    { name: { ru: "Болонья", en: "Bologna", az: "Bolonya" } },
  ]},
  { code: "ES", name: { ru: "Испания", en: "Spain", az: "İspaniya" }, cities: [
    { name: { ru: "Барселона", en: "Barcelona", az: "Barselona" } },
    { name: { ru: "Мадрид", en: "Madrid", az: "Madrid" } },
    { name: { ru: "Малага", en: "Malaga", az: "Malaga" } },
    { name: { ru: "Севилья", en: "Seville", az: "Sevilya" } },
    { name: { ru: "Валенсия", en: "Valencia", az: "Valensiya" } },
    { name: { ru: "Бильбао", en: "Bilbao", az: "Bilbao" } },
    { name: { ru: "Ивиса", en: "Ibiza", az: "İbiza" } },
    { name: { ru: "Тенерифе", en: "Tenerife", az: "Tenerife" } },
    { name: { ru: "Гран-Канария", en: "Gran Canaria", az: "Qran-Kanariya" } },
    { name: { ru: "Пальма-де-Майорка", en: "Palma de Mallorca", az: "Palma-de-Mayorka" } },
  ]},
  { code: "FR", name: { ru: "Франция", en: "France", az: "Fransa" }, cities: [
    { name: { ru: "Париж", en: "Paris", az: "Paris" } },
    { name: { ru: "Ницца", en: "Nice", az: "Nitsa" } },
    { name: { ru: "Лион", en: "Lyon", az: "Lyon" } },
    { name: { ru: "Марсель", en: "Marseille", az: "Marsel" } },
    { name: { ru: "Бордо", en: "Bordeaux", az: "Bordo" } },
    { name: { ru: "Тулуза", en: "Toulouse", az: "Tuluza" } },
    { name: { ru: "Страсбург", en: "Strasbourg", az: "Strazburq" } },
  ]},
  { code: "DE", name: { ru: "Германия", en: "Germany", az: "Almaniya" }, cities: [
    { name: { ru: "Берлин", en: "Berlin", az: "Berlin" } },
    { name: { ru: "Мюнхен", en: "Munich", az: "Münhen" } },
    { name: { ru: "Гамбург", en: "Hamburg", az: "Hamburq" } },
    { name: { ru: "Франкфурт", en: "Frankfurt", az: "Frankfurt" } },
    { name: { ru: "Кёльн", en: "Cologne", az: "Köln" } },
    { name: { ru: "Дрезден", en: "Dresden", az: "Drezden" } },
  ]},
  { code: "GB", name: { ru: "Великобритания", en: "United Kingdom", az: "Böyük Britaniya" }, cities: [
    { name: { ru: "Лондон", en: "London", az: "London" } },
    { name: { ru: "Эдинбург", en: "Edinburgh", az: "Edinburq" } },
    { name: { ru: "Манчестер", en: "Manchester", az: "Mançester" } },
    { name: { ru: "Ливерпуль", en: "Liverpool", az: "Liverpul" } },
    { name: { ru: "Оксфорд", en: "Oxford", az: "Oksford" } },
    { name: { ru: "Кембридж", en: "Cambridge", az: "Kembric" } },
  ]},
  { code: "GR", name: { ru: "Греция", en: "Greece", az: "Yunanıstan" }, cities: [
    { name: { ru: "Афины", en: "Athens", az: "Afina" } },
    { name: { ru: "Санторини", en: "Santorini", az: "Santorini" } },
    { name: { ru: "Крит", en: "Crete", az: "Krit" } },
    { name: { ru: "Родос", en: "Rhodes", az: "Rodost" } },
    { name: { ru: "Миконос", en: "Mykonos", az: "Mikonos" } },
    { name: { ru: "Корфу", en: "Corfu", az: "Korfu" } },
  ]},
  { code: "PT", name: { ru: "Португалия", en: "Portugal", az: "Portuqaliya" }, cities: [
    { name: { ru: "Лиссабон", en: "Lisbon", az: "Lissabon" } },
    { name: { ru: "Порту", en: "Porto", az: "Portu" } },
    { name: { ru: "Фару", en: "Faro", az: "Farou" } },
    { name: { ru: "Мадейра", en: "Madeira", az: "Madeyra" } },
  ]},
  { code: "NL", name: { ru: "Нидерланды", en: "Netherlands", az: "Niderlandlar" }, cities: [
    { name: { ru: "Амстердам", en: "Amsterdam", az: "Amsterdam" } },
    { name: { ru: "Роттердам", en: "Rotterdam", az: "Rotterdam" } },
    { name: { ru: "Гаага", en: "The Hague", az: "Haqua" } },
  ]},
  { code: "BE", name: { ru: "Бельгия", en: "Belgium", az: "Belçika" }, cities: [
    { name: { ru: "Брюссель", en: "Brussels", az: "Büssel" } },
    { name: { ru: "Брюгге", en: "Bruges", az: "Brügge" } },
    { name: { ru: "Антверпен", en: "Antwerp", az: "Antverpen" } },
  ]},
  { code: "CH", name: { ru: "Швейцария", en: "Switzerland", az: "İsveçrə" }, cities: [
    { name: { ru: "Цюрих", en: "Zurich", az: "Zürix" } },
    { name: { ru: "Женева", en: "Geneva", az: "Cenevrə" } },
    { name: { ru: "Люцерн", en: "Lucerne", az: "Lusern" } },
    { name: { ru: "Интерлакен", en: "Interlaken", az: "İnterlaken" } },
  ]},
  { code: "AT", name: { ru: "Австрия", en: "Austria", az: "Avstriya" }, cities: [
    { name: { ru: "Вена", en: "Vienna", az: "Vena" } },
    { name: { ru: "Зальцбург", en: "Salzburg", az: "Saltsburq" } },
    { name: { ru: "Инсбрук", en: "Innsbruck", az: "İnsbruk" } },
  ]},
  { code: "CZ", name: { ru: "Чехия", en: "Czech Republic", az: "Çexiya" }, cities: [
    { name: { ru: "Прага", en: "Prague", az: "Praqua" } },
    { name: { ru: "Карловы Вары", en: "Karlovy Vary", az: "Karlovı Varı" } },
  ]},
  { code: "PL", name: { ru: "Польша", en: "Poland", az: "Polşa" }, cities: [
    { name: { ru: "Варшава", en: "Warsaw", az: "Varşava" } },
    { name: { ru: "Краков", en: "Krakow", az: "Krakov" } },
    { name: { ru: "Гданьск", en: "Gdansk", az: "Qdansk" } },
  ]},
  { code: "HU", name: { ru: "Венгрия", en: "Hungary", az: "Macarıstan" }, cities: [
    { name: { ru: "Будапешт", en: "Budapest", az: "Budapeşt" } },
  ]},
  { code: "RO", name: { ru: "Румыния", en: "Romania", az: "Rumıniya" }, cities: [
    { name: { ru: "Бухарест", en: "Bucharest", az: "Buxarest" } },
    { name: { ru: "Клуж-Напока", en: "Cluj-Napoca", az: "Kluj-Napoka" } },
  ]},
  { code: "HR", name: { ru: "Хорватия", en: "Croatia", az: "Xorvatiya" }, cities: [
    { name: { ru: "Дубровник", en: "Dubrovnik", az: "Dubrovnik" } },
    { name: { ru: "Сплит", en: "Split", az: "Split" } },
    { name: { ru: "Загреб", en: "Zagreb", az: "Zaqreb" } },
  ]},
  { code: "BG", name: { ru: "Болгария", en: "Bulgaria", az: "Bolqarıstan" }, cities: [
    { name: { ru: "София", en: "Sofia", az: "Sofiya" } },
    { name: { ru: "Варна", en: "Varna", az: "Varna" } },
    { name: { ru: "Бургас", en: "Burgas", az: "Burgaz" } },
  ]},
  { code: "ME", name: { ru: "Черногория", en: "Montenegro", az: "Monteneqro" }, cities: [
    { name: { ru: "Подгорица", en: "Podgorica", az: "Podqoritsa" } },
    { name: { ru: "Будва", en: "Budva", az: "Budva" } },
    { name: { ru: "Котор", en: "Kotor", az: "Kotor" } },
  ]},
  { code: "GE", name: { ru: "Грузия", en: "Georgia", az: "Gürcüstan" }, cities: [
    { name: { ru: "Тбилиси", en: "Tbilisi", az: "Tbilisi" } },
    { name: { ru: "Батуми", en: "Batumi", az: "Batumi" } },
    { name: { ru: "Кутаиси", en: "Kutaisi", az: "Kutaisi" } },
  ]},
  { code: "AM", name: { ru: "Армения", en: "Armenia", az: "Ermənistan" }, cities: [
    { name: { ru: "Ереван", en: "Yerevan", az: "Yerevan" } },
    { name: { ru: "Гюмри", en: "Gyumri", az: "Gümrü" } },
  ]},
  { code: "CY", name: { ru: "Кипр", en: "Cyprus", az: "Kipr" }, cities: [
    { name: { ru: "Ларнака", en: "Larnaca", az: "Larnaka" } },
    { name: { ru: "Пафос", en: "Paphos", az: "Pafos" } },
    { name: { ru: "Лимассол", en: "Limassol", az: "Limasol" } },
  ]},
  { code: "IS", name: { ru: "Исландия", en: "Iceland", az: "İslandiya" }, cities: [
    { name: { ru: "Рейкьявик", en: "Reykjavik", az: "Reykyavik" } },
  ]},
  { code: "IE", name: { ru: "Ирландия", en: "Ireland", az: "İrlandiya" }, cities: [
    { name: { ru: "Дублин", en: "Dublin", az: "Dublin" } },
    { name: { ru: "Голуэй", en: "Galway", az: "Qoluey" } },
  ]},
  { code: "SE", name: { ru: "Швеция", en: "Sweden", az: "İsveç" }, cities: [
    { name: { ru: "Стокгольм", en: "Stockholm", az: "Stokholm" } },
    { name: { ru: "Гётеборг", en: "Gothenburg", az: "Töteborq" } },
  ]},
  { code: "NO", name: { ru: "Норвегия", en: "Norway", az: "Norveç" }, cities: [
    { name: { ru: "Осло", en: "Oslo", az: "Oslo" } },
    { name: { ru: "Берген", en: "Bergen", az: "Bergen" } },
  ]},
  { code: "FI", name: { ru: "Финляндия", en: "Finland", az: "Finlandiya" }, cities: [
    { name: { ru: "Хельсинки", en: "Helsinki", az: "Helsinqi" } },
  ]},
  { code: "DK", name: { ru: "Дания", en: "Denmark", az: "Danimarka" }, cities: [
    { name: { ru: "Копенгаген", en: "Copenhagen", az: "Kopenhagen" } },
  ]},
  { code: "SI", name: { ru: "Словения", en: "Slovenia", az: "Sloveniya" }, cities: [
    { name: { ru: "Любляна", en: "Ljubljana", az: "Lyublyana" } },
    { name: { ru: "Блед", en: "Bled", az: "Bled" } },
  ]},
  { code: "SK", name: { ru: "Словакия", en: "Slovakia", az: "Slovakiya" }, cities: [
    { name: { ru: "Братислава", en: "Bratislava", az: "Bratislava" } },
  ]},
  { code: "RS", name: { ru: "Сербия", en: "Serbia", az: "Serbiya" }, cities: [
    { name: { ru: "Белград", en: "Belgrade", az: "Belqrad" } },
  ]},
  { code: "BA", name: { ru: "Босния и Герцеговина", en: "Bosnia and Herzegovina", az: "Bosniya və Herseqovina" }, cities: [
    { name: { ru: "Сараево", en: "Sarajevo", az: "Sarayevo" } },
  ]},
  { code: "AL", name: { ru: "Албания", en: "Albania", az: "Albaniya" }, cities: [
    { name: { ru: "Тирана", en: "Tirana", az: "Tirana" } },
    { name: { ru: "Саранда", en: "Saranda", az: "Saranda" } },
  ]},
  { code: "MK", name: { ru: "Северная Македония", en: "North Macedonia", az: "Şimali Makedoniya" }, cities: [
    { name: { ru: "Скопье", en: "Skopje", az: "Skopye" } },
    { name: { ru: "Охрид", en: "Ohrid", az: "Ohrid" } },
  ]},
  { code: "MT", name: { ru: "Мальта", en: "Malta", az: "Malta" }, cities: [
    { name: { ru: "Валлетта", en: "Valletta", az: "Valletta" } },
  ]},
  { code: "LV", name: { ru: "Латвия", en: "Latvia", az: "Latviya" }, cities: [
    { name: { ru: "Рига", en: "Riga", az: "Riqa" } },
  ]},
  { code: "LT", name: { ru: "Литва", en: "Lithuania", az: "Litva" }, cities: [
    { name: { ru: "Вильнюс", en: "Vilnius", az: "Vilnüs" } },
  ]},
  { code: "EE", name: { ru: "Эстония", en: "Estonia", az: "Estoniya" }, cities: [
    { name: { ru: "Таллин", en: "Tallinn", az: "Tallin" } },
  ]},
  { code: "UA", name: { ru: "Украина", en: "Ukraine", az: "Ukrayna" }, cities: [
    { name: { ru: "Киев", en: "Kyiv", az: "Kiev" } },
    { name: { ru: "Львов", en: "Lviv", az: "Lvov" } },
    { name: { ru: "Одесса", en: "Odesa", az: "Odesa" } },
  ]},
  { code: "AD", name: { ru: "Андорра", en: "Andorra", az: "Andorra" }, cities: [
    { name: { ru: "Андорра-ла-Велья", en: "Andorra la Vella", az: "Andorra-la-Velya" } },
  ]},
  { code: "MC", name: { ru: "Монако", en: "Monaco", az: "Monako" }, cities: [
    { name: { ru: "Монако", en: "Monaco", az: "Monako" } },
  ]},
  { code: "SM", name: { ru: "Сан-Марино", en: "San Marino", az: "San-Marino" }, cities: [
    { name: { ru: "Сан-Марино", en: "San Marino", az: "San-Marino" } },
  ]},
  { code: "LI", name: { ru: "Лихтенштейн", en: "Liechtenstein", az: "Lixtenşteyn" }, cities: [
    { name: { ru: "Вадуц", en: "Vaduz", az: "Vaduz" } },
  ]},
  { code: "XK", name: { ru: "Косово", en: "Kosovo", az: "Kosovo" }, cities: [
    { name: { ru: "Приштина", en: "Pristina", az: "Priştinə" } },
  ]},
  { code: "MD", name: { ru: "Молдова", en: "Moldova", az: "Moldova" }, cities: [
    { name: { ru: "Кишинёв", en: "Chisinau", az: "Kişinəu" } },
  ]},

  // ==================== AZERBAIJAN ====================
  { code: "AZ", name: { ru: "Азербайджан", en: "Azerbaijan", az: "Azərbaycan" }, cities: [
    { name: { ru: "Баку", en: "Baku", az: "Bakı" } },
    { name: { ru: "Гянджа", en: "Ganja", az: "Gəncə" } },
    { name: { ru: "Нафталан", en: "Naftalan", az: "Naftalan" } },
    { name: { ru: "Ленкорань", en: "Lankaran", az: "Lənkəran" } },
    { name: { ru: "Шеки", en: "Sheki", az: "Şəki" } },
    { name: { ru: "Габала", en: "Gabala", az: "Qəbələ" } },
    { name: { ru: "Нахичевань", en: "Nakhchivan", az: "Naxçıvan" } },
    { name: { ru: "Загатала", en: "Zagatala", az: "Zaqatala" } },
    { name: { ru: "Гусар", en: "Gusar", az: "Qusar" } },
  ]},

  // ==================== RUSSIA & CIS ====================
  { code: "RU", name: { ru: "Россия", en: "Russia", az: "Rusiya" }, cities: [
    { name: { ru: "Москва", en: "Moscow", az: "Moskva" } },
    { name: { ru: "Санкт-Петербург", en: "Saint Petersburg", az: "Sankt-Peterburq" } },
    { name: { ru: "Сочи", en: "Sochi", az: "Soçi" } },
    { name: { ru: "Казань", en: "Kazan", az: "Kazan" } },
    { name: { ru: "Калининград", en: "Kaliningrad", az: "Kaliningrad" } },
    { name: { ru: "Новосибирск", en: "Novosibirsk", az: "Novosibirsk" } },
    { name: { ru: "Екатеринбург", en: "Yekaterinburg", az: "Yekaterinburq" } },
    { name: { ru: "Краснодар", en: "Krasnodar", az: "Krasnodar" } },
  ]},
  { code: "KZ", name: { ru: "Казахстан", en: "Kazakhstan", az: "Qazaxıstan" }, cities: [
    { name: { ru: "Алматы", en: "Almaty", az: "Almatı" } },
    { name: { ru: "Астана", en: "Astana", az: "Astana" } },
    { name: { ru: "Шымкент", en: "Shymkent", az: "Şımkent" } },
  ]},
  { code: "UZ", name: { ru: "Узбекистан", en: "Uzbekistan", az: "Özbəkistan" }, cities: [
    { name: { ru: "Ташкент", en: "Tashkent", az: "Təşkənt" } },
    { name: { ru: "Самарканд", en: "Samarkand", az: "Səmərənd" } },
    { name: { ru: "Бухара", en: "Bukhara", az: "Buxara" } },
  ]},
  { code: "KG", name: { ru: "Кыргызстан", en: "Kyrgyzstan", az: "Qırğızıstan" }, cities: [
    { name: { ru: "Бишкек", en: "Bishkek", az: "Bişkek" } },
    { name: { ru: "Иссык-Куль", en: "Issyk-Kul", az: "İssık-Köl" } },
  ]},
  { code: "TJ", name: { ru: "Таджикистан", en: "Tajikistan", az: "Tacikistan" }, cities: [
    { name: { ru: "Душанбе", en: "Dushanbe", az: "Düşənbə" } },
  ]},
  { code: "TM", name: { ru: "Туркменистан", en: "Turkmenistan", az: "Türkmənistan" }, cities: [
    { name: { ru: "Ашхабад", en: "Ashgabat", az: "Aşqabad" } },
  ]},

  // ==================== MIDDLE EAST ====================
  { code: "AE", name: { ru: "ОАЭ", en: "UAE", az: "BƏƏ" }, cities: [
    { name: { ru: "Дубай", en: "Dubai", az: "Dubay" } },
    { name: { ru: "Абу-Даби", en: "Abu Dhabi", az: "Abu-Dabi" } },
    { name: { ru: "Шарджа", en: "Sharjah", az: "Şarja" } },
    { name: { ru: "Рас-эль-Хайма", en: "Ras Al Khaimah", az: "Ras-əl-Xayma" } },
  ]},
  { code: "SA", name: { ru: "Саудовская Аравия", en: "Saudi Arabia", az: "Səudiyyə Ərəbistanı" }, cities: [
    { name: { ru: "Эр-Рияд", en: "Riyadh", az: "Riyad" } },
    { name: { ru: "Джидда", en: "Jeddah", az: "Ciddə" } },
    { name: { ru: "Мекка", en: "Mecca", az: "Məkkə" } },
  ]},
  { code: "IL", name: { ru: "Израиль", en: "Israel", az: "İsrail" }, cities: [
    { name: { ru: "Тель-Авив", en: "Tel Aviv", az: "Təl-Əviv" } },
    { name: { ru: "Иерусалим", en: "Jerusalem", az: "Yerusəlim" } },
    { name: { ru: "Хайфа", en: "Haifa", az: "Hayfa" } },
  ]},
  { code: "JO", name: { ru: "Иордания", en: "Jordan", az: "İordaniya" }, cities: [
    { name: { ru: "Амман", en: "Amman", az: "Əmmən" } },
    { name: { ru: "Акаба", en: "Aqaba", az: "Əqəbə" } },
  ]},
  { code: "OM", name: { ru: "Оман", en: "Oman", az: "Oman" }, cities: [
    { name: { ru: "Маскат", en: "Muscat", az: "Muskat" } },
  ]},
  { code: "QA", name: { ru: "Катар", en: "Qatar", az: "Qətər" }, cities: [
    { name: { ru: "Доха", en: "Doha", az: "Doha" } },
  ]},
  { code: "BH", name: { ru: "Бахрейн", en: "Bahrain", az: "Bəhreyn" }, cities: [
    { name: { ru: "Манама", en: "Manama", az: "Manama" } },
  ]},
  { code: "KW", name: { ru: "Кувейт", en: "Kuwait", az: "Küveyt" }, cities: [
    { name: { ru: "Кувейт-Сити", en: "Kuwait City", az: "Küveyt-şəhər" } },
  ]},
  { code: "LB", name: { ru: "Ливан", en: "Lebanon", az: "Livan" }, cities: [
    { name: { ru: "Бейрут", en: "Beirut", az: "Beyrut" } },
  ]},
  { code: "IQ", name: { ru: "Ирак", en: "Iraq", az: "İraq" }, cities: [
    { name: { ru: "Багдад", en: "Baghdad", az: "Bağdad" } },
    { name: { ru: "Басра", en: "Basra", az: "Basra" } },
  ]},
  { code: "IR", name: { ru: "Иран", en: "Iran", az: "İran" }, cities: [
    { name: { ru: "Тегеран", en: "Tehran", az: "Tehran" } },
    { name: { ru: "Исфахан", en: "Isfahan", az: "İsfahan" } },
    { name: { ru: "Шираз", en: "Shiraz", az: "Şiraz" } },
  ]},
  { code: "SY", name: { ru: "Сирия", en: "Syria", az: "Suriya" }, cities: [
    { name: { ru: "Дамаск", en: "Damascus", az: "Dəməşq" } },
  ]},
  { code: "YE", name: { ru: "Йемен", en: "Yemen", az: "Yəmən" }, cities: [
    { name: { ru: "Сана", en: "Sana'a", az: "Səna" } },
  ]},

  // ==================== NORTH AFRICA ====================
  { code: "EG", name: { ru: "Египет", en: "Egypt", az: "Misir" }, cities: [
    { name: { ru: "Каир", en: "Cairo", az: "Qahirə" } },
    { name: { ru: "Шарм-эль-Шейх", en: "Sharm El Sheikh", az: "Şarm-əş-Şeyx" } },
    { name: { ru: "Хургада", en: "Hurghada", az: "Hurqada" } },
    { name: { ru: "Александрия", en: "Alexandria", az: "İsgəndəriyyə" } },
    { name: { ru: "Луксор", en: "Luxor", az: "Luksor" } },
  ]},
  { code: "MA", name: { ru: "Марокко", en: "Morocco", az: "Mərakeş" }, cities: [
    { name: { ru: "Марракеш", en: "Marrakech", az: "Mərakeş" } },
    { name: { ru: "Касабланка", en: "Casablanca", az: "Kasablanka" } },
    { name: { ru: "Фес", en: "Fez", az: "Fez" } },
  ]},
  { code: "TN", name: { ru: "Тунис", en: "Tunisia", az: "Tunis" }, cities: [
    { name: { ru: "Тунис", en: "Tunis", az: "Tunis" } },
    { name: { ru: "Сусс", en: "Sousse", az: "Susu" } },
    { name: { ru: "Хаммамет", en: "Hammamet", az: "Hammamet" } },
  ]},
  { code: "DZ", name: { ru: "Алжир", en: "Algeria", az: "Əlcəzair" }, cities: [
    { name: { ru: "Алжир", en: "Algiers", az: "Əlcəzair" } },
    { name: { ru: "Оран", en: "Oran", az: "Oran" } },
  ]},
  { code: "LY", name: { ru: "Ливия", en: "Libya", az: "Liviya" }, cities: [
    { name: { ru: "Триполи", en: "Tripoli", az: "Tripoli" } },
  ]},
  { code: "SD", name: { ru: "Судан", en: "Sudan", az: "Sudan" }, cities: [
    { name: { ru: "Хартум", en: "Khartoum", az: "Xartum" } },
  ]},
  { code: "SS", name: { ru: "Южный Судан", en: "South Sudan", az: "Cənub Sudan" }, cities: [
    { name: { ru: "Джуба", en: "Juba", az: "Cuba" } },
  ]},

  // ==================== SUB-SAHARAN AFRICA ====================
  { code: "ZA", name: { ru: "ЮАР", en: "South Africa", az: "Cənub Afrika" }, cities: [
    { name: { ru: "Кейптаун", en: "Cape Town", az: "Keyptaun" } },
    { name: { ru: "Йоханнесбург", en: "Johannesburg", az: "Yoxannesburq" } },
  ]},
  { code: "KE", name: { ru: "Кения", en: "Kenya", az: "Keniya" }, cities: [
    { name: { ru: "Найроби", en: "Nairobi", az: "Nayrobi" } },
    { name: { ru: "Момбаса", en: "Mombasa", az: "Mombasa" } },
  ]},
  { code: "TZ", name: { ru: "Танзания", en: "Tanzania", az: "Tanzaniya" }, cities: [
    { name: { ru: "Дар-эс-Салам", en: "Dar es Salaam", az: "Dar-əs-Salam" } },
    { name: { ru: "Аруш", en: "Arusha", az: "Arusha" } },
  ]},
  { code: "NG", name: { ru: "Нигерия", en: "Nigeria", az: "Nigiriya" }, cities: [
    { name: { ru: "Лагос", en: "Lagos", az: "Laqos" } },
    { name: { ru: "Абуджа", en: "Abuja", az: "Abuja" } },
  ]},
  { code: "GH", name: { ru: "Гана", en: "Ghana", az: "Qana" }, cities: [
    { name: { ru: "Аккра", en: "Accra", az: "Akra" } },
  ]},
  { code: "ET", name: { ru: "Эфиопия", en: "Ethiopia", az: "Efiopiya" }, cities: [
    { name: { ru: "Аддис-Абеба", en: "Addis Ababa", az: "Addis-Abəbə" } },
  ]},
  { code: "UG", name: { ru: "Уганда", en: "Uganda", az: "Uqanda" }, cities: [
    { name: { ru: "Кампала", en: "Kampala", az: "Kampala" } },
  ]},
  { code: "RW", name: { ru: "Руанда", en: "Rwanda", az: "Ruanda" }, cities: [
    { name: { ru: "Кигали", en: "Kigali", az: "Kiqali" } },
  ]},
  { code: "MZ", name: { ru: "Мозамбик", en: "Mozambique", az: "Mozambik" }, cities: [
    { name: { ru: "Мапуту", en: "Maputo", az: "Maputu" } },
  ]},
  { code: "MG", name: { ru: "Мадагаскар", en: "Madagascar", az: "Madaqaskar" }, cities: [
    { name: { ru: "Антананариву", en: "Antananarivo", az: "Antananarivu" } },
  ]},
  { code: "MU", name: { ru: "Маврикий", en: "Mauritius", az: "Mavriki" }, cities: [
    { name: { ru: "Порт-Луи", en: "Port Louis", az: "Port-Lui" } },
  ]},
  { code: "SC", name: { ru: "Сейшелы", en: "Seychelles", az: "Seyşel adaları" }, cities: [
    { name: { ru: "Виктория", en: "Victoria", az: "Viktoriya" } },
  ]},
  { code: "NA", name: { ru: "Намибия", en: "Namibia", az: "Namibiya" }, cities: [
    { name: { ru: "Виндхук", en: "Windhoek", az: "Vindxuk" } },
  ]},
  { code: "BW", name: { ru: "Ботсвана", en: "Botswana", az: "Botsvana" }, cities: [
    { name: { ru: "Габороне", en: "Gaborone", az: "Qaborone" } },
  ]},
  { code: "ZM", name: { ru: "Замбия", en: "Zambia", az: "Zambiya" }, cities: [
    { name: { ru: "Лусака", en: "Lusaka", az: "Lusaka" } },
  ]},
  { code: "ZW", name: { ru: "Зимбабве", en: "Zimbabwe", az: "Zimbabve" }, cities: [
    { name: { ru: "Хараре", en: "Harare", az: "Xarare" } },
  ]},
  { code: "SN", name: { ru: "Сенегал", en: "Senegal", az: "Senegal" }, cities: [
    { name: { ru: "Дакар", en: "Dakar", az: "Dakar" } },
  ]},
  { code: "CI", name: { ru: "Кот-д'Ивуар", en: "Côte d'Ivoire", az: "Fil Sümüklü Ölkə" }, cities: [
    { name: { ru: "Абиджан", en: "Abidjan", az: "Abidjan" } },
  ]},
  { code: "CM", name: { ru: "Камерун", en: "Cameroon", az: "Kamerun" }, cities: [
    { name: { ru: "Дуала", en: "Douala", az: "Duala" } },
    { name: { ru: "Яунде", en: "Yaoundé", az: "Yaundé" } },
  ]},
  { code: "AO", name: { ru: "Ангола", en: "Angola", az: "Anqola" }, cities: [
    { name: { ru: "Луанда", en: "Luanda", az: "Luanda" } },
  ]},
  { code: "CG", name: { ru: "Республика Конго", en: "Republic of the Congo", az: "Konqo Respublikası" }, cities: [
    { name: { ru: "Браззавиль", en: "Brazzaville", az: "Brazzavil" } },
  ]},
  { code: "CD", name: { ru: "ДР Конго", en: "DR Congo", az: "DR Konqo" }, cities: [
    { name: { ru: "Киншаса", en: "Kinshasa", az: "Kinşasa" } },
  ]},
  { code: "BF", name: { ru: "Буркина-Фасо", en: "Burkina Faso", az: "Burkina-Faso" }, cities: [
    { name: { ru: "Уагадугу", en: "Ouagadougou", az: "Uaqaduqu" } },
  ]},
  { code: "ML", name: { ru: "Мали", en: "Mali", az: "Mali" }, cities: [
    { name: { ru: "Бамако", en: "Bamako", az: "Bamako" } },
  ]},
  { code: "NE", name: { ru: "Нигер", en: "Niger", az: "Niger" }, cities: [
    { name: { ru: "Ниамей", en: "Niamey", az: "Niyamay" } },
  ]},
  { code: "TD", name: { ru: "Чад", en: "Chad", az: "Çad" }, cities: [
    { name: { ru: "Нджамена", en: "N'Djamena", az: "Njamena" } },
  ]},
  { code: "ER", name: { ru: "Эритрея", en: "Eritrea", az: "Eritreya" }, cities: [
    { name: { ru: "Асмара", en: "Asmara", az: "Asmara" } },
  ]},
  { code: "DJ", name: { ru: "Джибути", en: "Djibouti", az: "Cibuti" }, cities: [
    { name: { ru: "Джибути", en: "Djibouti", az: "Cibuti" } },
  ]},
  { code: "SO", name: { ru: "Сомали", en: "Somalia", az: "Somali" }, cities: [
    { name: { ru: "Могадишо", en: "Mogadishu", az: "Moqadişu" } },
  ]},
  { code: "LR", name: { ru: "Либерия", en: "Liberia", az: "Liberiya" }, cities: [
    { name: { ru: "Монровия", en: "Monrovia", az: "Monroviya" } },
  ]},
  { code: "SL", name: { ru: "Сьерра-Леоне", en: "Sierra Leone", az: "Syerra-Leone" }, cities: [
    { name: { ru: "Фритаун", en: "Freetown", az: "Fritavon" } },
  ]},
  { code: "GN", name: { ru: "Гвинея", en: "Guinea", az: "Qvineya" }, cities: [
    { name: { ru: "Конакри", en: "Conakry", az: "Konakri" } },
  ]},
  { code: "TG", name: { ru: "Того", en: "Togo", az: "Toqo" }, cities: [
    { name: { ru: "Ломе", en: "Lomé", az: "Lome" } },
  ]},
  { code: "BJ", name: { ru: "Бенин", en: "Benin", az: "Benin" }, cities: [
    { name: { ru: "Порто-Ново", en: "Porto-Novo", az: "Porto-Novo" } },
  ]},
  { code: "GA", name: { ru: "Габон", en: "Gabon", az: "Qabon" }, cities: [
    { name: { ru: "Либревиль", en: "Libreville", az: "Librevil" } },
  ]},
  { code: "GQ", name: { ru: "Экваториальная Гвинея", en: "Equatorial Guinea", az: "Ekvatorial Qvineya" }, cities: [
    { name: { ru: "Малабо", en: "Malabo", az: "Malabo" } },
  ]},
  { code: "CV", name: { ru: "Кабо-Верде", en: "Cape Verde", az: "Kabo-Verde" }, cities: [
    { name: { ru: "Прая", en: "Praia", az: "Praia" } },
  ]},
  { code: "ST", name: { ru: "Сан-Томе и Принсипи", en: "São Tomé and Príncipe", az: "San-Tome və Prinsipi" }, cities: [
    { name: { ru: "Сан-Томе", en: "São Tomé", az: "San-Tome" } },
  ]},
  { code: "KM", name: { ru: "Коморы", en: "Comoros", az: "Komor adaları" }, cities: [
    { name: { ru: "Морони", en: "Moroni", az: "Moroni" } },
  ]},
  { code: "MW", name: { ru: "Малави", en: "Malawi", az: "Malavi" }, cities: [
    { name: { ru: "Лилонгве", en: "Lilongwe", az: "Lilonqve" } },
  ]},
  { code: "SZ", name: { ru: "Эсватини", en: "Eswatini", az: "Esvatini" }, cities: [
    { name: { ru: "Мбабане", en: "Mbabane", az: "Mbabane" } },
  ]},
  { code: "LS", name: { ru: "Лесото", en: "Lesotho", az: "Lesoto" }, cities: [
    { name: { ru: "Масеру", en: "Maseru", az: "Maseru" } },
  ]},
  { code: "CF", name: { ru: "ЦАР", en: "Central African Republic", az: "Mərkəzi Afrika Respublikası" }, cities: [
    { name: { ru: "Банги", en: "Bangui", az: "Banqi" } },
  ]},
  { code: "GM", name: { ru: "Гамбия", en: "Gambia", az: "Qambiya" }, cities: [
    { name: { ru: "Банжул", en: "Banjul", az: "Banjul" } },
  ]},
  { code: "GW", name: { ru: "Гвинея-Бисау", en: "Guinea-Bissau", az: "Qvineya-Bisau" }, cities: [
    { name: { ru: "Бисау", en: "Bissau", az: "Bisau" } },
  ]},
  { code: "MR", name: { ru: "Мавритания", en: "Mauritania", az: "Mavritaniya" }, cities: [
    { name: { ru: "Нуакшот", en: "Nouakchott", az: "Nuakşot" } },
  ]},
  { code: "BI", name: { ru: "Бурунди", en: "Burundi", az: "Burundi" }, cities: [
    { name: { ru: "Гитега", en: "Gitega", az: "Qiteqa" } },
  ]},

  // ==================== ASIA ====================
  { code: "TH", name: { ru: "Таиланд", en: "Thailand", az: "Tayland" }, cities: [
    { name: { ru: "Бангкок", en: "Bangkok", az: "Banqkok" } },
    { name: { ru: "Пхукет", en: "Phuket", az: "Puket" } },
    { name: { ru: "Паттайя", en: "Pattaya", az: "Pattaya" } },
    { name: { ru: "Чиангмай", en: "Chiang Mai", az: "Chiang May" } },
    { name: { ru: "Краби", en: "Krabi", az: "Krabi" } },
    { name: { ru: "Ко-Самуи", en: "Koh Samui", az: "Ko-Samui" } },
  ]},
  { code: "VN", name: { ru: "Вьетнам", en: "Vietnam", az: "Vyetnam" }, cities: [
    { name: { ru: "Хо Ши Мин", en: "Ho Chi Minh City", az: "Ho Şi Min" } },
    { name: { ru: "Ханой", en: "Hanoi", az: "Hanoy" } },
    { name: { ru: "Дананг", en: "Da Nang", az: "Danаng" } },
    { name: { ru: "Халонг", en: "Ha Long", az: "Ha-Lonq" } },
  ]},
  { code: "ID", name: { ru: "Индонезия", en: "Indonesia", az: "İndoneziya" }, cities: [
    { name: { ru: "Бали", en: "Bali", az: "Bali" } },
    { name: { ru: "Джакарта", en: "Jakarta", az: "Cakarta" } },
    { name: { ru: "Ломбок", en: "Lombok", az: "Lombok" } },
  ]},
  { code: "PH", name: { ru: "Филиппины", en: "Philippines", az: "Filippin" }, cities: [
    { name: { ru: "Манила", en: "Manila", az: "Manila" } },
    { name: { ru: "Боракай", en: "Boracay", az: "Borakay" } },
    { name: { ru: "Себу", en: "Cebu", az: "Sebu" } },
  ]},
  { code: "MY", name: { ru: "Малайзия", en: "Malaysia", az: "Malayziya" }, cities: [
    { name: { ru: "Куала-Лумпур", en: "Kuala Lumpur", az: "Kuala-Lumpur" } },
    { name: { ru: "Лангкави", en: "Langkawi", az: "Lanqkavi" } },
  ]},
  { code: "SG", name: { ru: "Сингапур", en: "Singapore", az: "Sinqapur" }, cities: [
    { name: { ru: "Сингапур", en: "Singapore", az: "Sinqapur" } },
  ]},
  { code: "KH", name: { ru: "Камбоджа", en: "Cambodia", az: "Kamboca" }, cities: [
    { name: { ru: "Пномпень", en: "Phnom Penh", az: "Pnompen" } },
    { name: { ru: "Сиемреап", en: "Siem Reap", az: "Siem-Rip" } },
  ]},
  { code: "MM", name: { ru: "Мьянма", en: "Myanmar", az: "Myanma" }, cities: [
    { name: { ru: "Янгон", en: "Yangon", az: "Yanqon" } },
  ]},
  { code: "LA", name: { ru: "Лаос", en: "Laos", az: "Laos" }, cities: [
    { name: { ru: "Луангпхабанг", en: "Luang Prabang", az: "Luang-Prabаng" } },
    { name: { ru: "Вьентьян", en: "Vientiane", az: "Vyençyan" } },
  ]},
  { code: "LK", name: { ru: "Шри-Ланка", en: "Sri Lanka", az: "Şri-Lanka" }, cities: [
    { name: { ru: "Коломбо", en: "Colombo", az: "Kolombo" } },
    { name: { ru: "Канди", en: "Kandy", az: "Kandi" } },
  ]},
  { code: "MV", name: { ru: "Мальдивы", en: "Maldives", az: "Maldİv adaları" }, cities: [
    { name: { ru: "Мале", en: "Male", az: "Malə" } },
  ]},
  { code: "IN", name: { ru: "Индия", en: "India", az: "Hindistan" }, cities: [
    { name: { ru: "Дели", en: "Delhi", az: "Dəhli" } },
    { name: { ru: "Мумбаи", en: "Mumbai", az: "Mumbay" } },
    { name: { ru: "Джайпур", en: "Jaipur", az: "Ceypur" } },
    { name: { ru: "Гоа", en: "Goa", az: "Goa" } },
    { name: { ru: "Агра", en: "Agra", az: "Aqra" } },
  ]},
  { code: "NP", name: { ru: "Непал", en: "Nepal", az: "Nepal" }, cities: [
    { name: { ru: "Катманду", en: "Kathmandu", az: "Katmandu" } },
  ]},
  { code: "BD", name: { ru: "Бангладеш", en: "Bangladesh", az: "Banqladeş" }, cities: [
    { name: { ru: "Дакка", en: "Dhaka", az: "Dakka" } },
  ]},
  { code: "JP", name: { ru: "Япония", en: "Japan", az: "Yaponiya" }, cities: [
    { name: { ru: "Токио", en: "Tokyo", az: "Tokio" } },
    { name: { ru: "Осака", en: "Osaka", az: "Osaka" } },
    { name: { ru: "Киото", en: "Kyoto", az: "Kioto" } },
  ]},
  { code: "CN", name: { ru: "Китай", en: "China", az: "Çin" }, cities: [
    { name: { ru: "Пекин", en: "Beijing", az: "Pekin" } },
    { name: { ru: "Шанхай", en: "Shanghai", az: "Şanxay" } },
    { name: { ru: "Гуанчжоу", en: "Guangzhou", az: "Quancjou" } },
  ]},
  { code: "KR", name: { ru: "Южная Корея", en: "South Korea", az: "Cənubî Koreya" }, cities: [
    { name: { ru: "Сеул", en: "Seoul", az: "Seul" } },
    { name: { ru: "Пусан", en: "Busan", az: "Pusan" } },
  ]},
  { code: "KP", name: { ru: "Северная Корея", en: "North Korea", az: "Şimali Koreya" }, cities: [
    { name: { ru: "Пхеньян", en: "Pyongyang", az: "Phenyan" } },
  ]},
  { code: "TW", name: { ru: "Тайвань", en: "Taiwan", az: "Tayvan" }, cities: [
    { name: { ru: "Тайбэй", en: "Taipei", az: "Taybey" } },
  ]},
  { code: "MN", name: { ru: "Монголия", en: "Mongolia", az: "Monqolustan" }, cities: [
    { name: { ru: "Улан-Батор", en: "Ulaanbaatar", az: "Ulan-Bator" } },
  ]},
  { code: "PK", name: { ru: "Пакистан", en: "Pakistan", az: "Pakistan" }, cities: [
    { name: { ru: "Исламабад", en: "Islamabad", az: "İslamabad" } },
    { name: { ru: "Карачи", en: "Karachi", az: "Karachi" } },
  ]},
  { code: "AF", name: { ru: "Афганистан", en: "Afghanistan", az: "Əfqanıstan" }, cities: [
    { name: { ru: "Кабул", en: "Kabul", az: "Kəbul" } },
  ]},
  { code: "BN", name: { ru: "Бруней", en: "Brunei", az: "Bruney" }, cities: [
    { name: { ru: "Бандар-Сери-Бегаван", en: "Bandar Seri Begawan", az: "Bandar-Seri-Beqavan" } },
  ]},
  { code: "BT", name: { ru: "Бутан", en: "Bhutan", az: "Butan" }, cities: [
    { name: { ru: "Тхимпху", en: "Thimphu", az: "Timfu" } },
  ]},
  { code: "TL", name: { ru: "Восточный Тимор", en: "East Timor", az: "Şərqi Timor" }, cities: [
    { name: { ru: "Дили", en: "Dili", az: "Dili" } },
  ]},

  // ==================== AMERICAS ====================
  { code: "US", name: { ru: "США", en: "USA", az: "ABŞ" }, cities: [
    { name: { ru: "Нью-Йорк", en: "New York", az: "Nyú-York" } },
    { name: { ru: "Лос-Анджелес", en: "Los Angeles", az: "Los-Anceles" } },
    { name: { ru: "Лас-Вегас", en: "Las Vegas", az: "Las-Veqas" } },
    { name: { ru: "Майами", en: "Miami", az: "Mayami" } },
    { name: { ru: "Сан-Франциско", en: "San Francisco", az: "San-Fransisko" } },
    { name: { ru: "Чикаго", en: "Chicago", az: "Çikaqo" } },
  ]},
  { code: "CA", name: { ru: "Канада", en: "Canada", az: "Kanada" }, cities: [
    { name: { ru: "Торонто", en: "Toronto", az: "Toronto" } },
    { name: { ru: "Ванкувер", en: "Vancouver", az: "Vankuver" } },
    { name: { ru: "Монтреаль", en: "Montreal", az: "Monreal" } },
  ]},
  { code: "MX", name: { ru: "Мексика", en: "Mexico", az: "Meksika" }, cities: [
    { name: { ru: "Мехико", en: "Mexico City", az: "Mexiko" } },
    { name: { ru: "Канкун", en: "Cancun", az: "Kankun" } },
    { name: { ru: "Пуэрто-Вальярта", en: "Puerto Vallarta", az: "Puerto-Vallarta" } },
  ]},
  { code: "BR", name: { ru: "Бразилия", en: "Brazil", az: "Braziliya" }, cities: [
    { name: { ru: "Рио-де-Жанейро", en: "Rio de Janeiro", az: "Rio-de-Janeyro" } },
    { name: { ru: "Сан-Паулу", en: "São Paulo", az: "San-Paulo" } },
  ]},
  { code: "AR", name: { ru: "Аргентина", en: "Argentina", az: "Arqentina" }, cities: [
    { name: { ru: "Буэнос-Айрес", en: "Buenos Aires", az: "Buenos-Ayres" } },
  ]},
  { code: "CL", name: { ru: "Чили", en: "Chile", az: "Çili" }, cities: [
    { name: { ru: "Сантьяго", en: "Santiago", az: "Santyaqo" } },
  ]},
  { code: "CO", name: { ru: "Колумбия", en: "Colombia", az: "Kolumbiya" }, cities: [
    { name: { ru: "Богота", en: "Bogota", az: "Boqota" } },
    { name: { ru: "Медельин", en: "Medellin", az: "Medelyin" } },
  ]},
  { code: "PE", name: { ru: "Перу", en: "Peru", az: "Peru" }, cities: [
    { name: { ru: "Лима", en: "Lima", az: "Lima" } },
    { name: { ru: "Куско", en: "Cusco", az: "Kusko" } },
  ]},
  { code: "EC", name: { ru: "Эквадор", en: "Ecuador", az: "Ekvador" }, cities: [
    { name: { ru: "Кито", en: "Quito", az: "Kito" } },
  ]},
  { code: "BO", name: { ru: "Боливия", en: "Bolivia", az: "Boliviya" }, cities: [
    { name: { ru: "Ла-Пас", en: "La Paz", az: "La-Pas" } },
  ]},
  { code: "UY", name: { ru: "Уругвай", en: "Uruguay", az: "Uruqvay" }, cities: [
    { name: { ru: "Монтевидео", en: "Montevideo", az: "Montevideo" } },
  ]},
  { code: "PY", name: { ru: "Парагвай", en: "Paraguay", az: "Parqvay" }, cities: [
    { name: { ru: "Асунсьон", en: "Asunción", az: "Asunson" } },
  ]},
  { code: "VE", name: { ru: "Венесуэла", en: "Venezuela", az: "Venesuela" }, cities: [
    { name: { ru: "Каракас", en: "Caracas", az: "Karakas" } },
  ]},
  { code: "PA", name: { ru: "Панама", en: "Panama", az: "Panama" }, cities: [
    { name: { ru: "Панама-Сити", en: "Panama City", az: "Panama-şəhər" } },
  ]},
  { code: "CR", name: { ru: "Коста-Рика", en: "Costa Rica", az: "Kosta-Rika" }, cities: [
    { name: { ru: "Сан-Хосе", en: "San Jose", az: "San-Xose" } },
  ]},
  { code: "GT", name: { ru: "Гватемала", en: "Guatemala", az: "Qvatemala" }, cities: [
    { name: { ru: "Гватемала", en: "Guatemala City", az: "Qvatemala-şəhər" } },
  ]},
  { code: "HN", name: { ru: "Гондурас", en: "Honduras", az: "Qonduras" }, cities: [
    { name: { ru: "Тегусигальпа", en: "Tegucigalpa", az: "Tequsiqalpa" } },
  ]},
  { code: "SV", name: { ru: "Сальвадор", en: "El Salvador", az: "El-Salvador" }, cities: [
    { name: { ru: "Сан-Сальвадор", en: "San Salvador", az: "San-Salvador" } },
  ]},
  { code: "NI", name: { ru: "Никарагуа", en: "Nicaragua", az: "Nikaraqua" }, cities: [
    { name: { ru: "Манагуа", en: "Managua", az: "Manaqqua" } },
  ]},
  { code: "BZ", name: { ru: "Белиз", en: "Belize", az: "Beliz" }, cities: [
    { name: { ru: "Белиз-Сити", en: "Belize City", az: "Beliz-şəhər" } },
  ]},
  { code: "GY", name: { ru: "Гайана", en: "Guyana", az: "Qayana" }, cities: [
    { name: { ru: "Джорджтаун", en: "Georgetown", az: "Cordjtaun" } },
  ]},
  { code: "SR", name: { ru: "Суринам", en: "Suriname", az: "Surinam" }, cities: [
    { name: { ru: "Парамарибо", en: "Paramaribo", az: "Paramaribo" } },
  ]},
  { code: "GF", name: { ru: "Французская Гвиана", en: "French Guiana", az: "Fransız Qvianası" }, cities: [
    { name: { ru: "Кайенна", en: "Cayenne", az: "Kayenna" } },
  ]},

  // ==================== CARIBBEAN ====================
  { code: "CU", name: { ru: "Куба", en: "Cuba", az: "Kuba" }, cities: [
    { name: { ru: "Гавана", en: "Havana", az: "Havana" } },
    { name: { ru: "Варадеро", en: "Varadero", az: "Varadero" } },
  ]},
  { code: "DO", name: { ru: "Доминикана", en: "Dominican Republic", az: "Dominikan Respublikası" }, cities: [
    { name: { ru: "Пунта-Кана", en: "Punta Cana", az: "Punta-Kana" } },
    { name: { ru: "Санто-Доминго", en: "Santo Domingo", az: "Santo-Dominqo" } },
  ]},
  { code: "JM", name: { ru: "Ямайка", en: "Jamaica", az: "Yamayka" }, cities: [
    { name: { ru: "Монтего-Бей", en: "Montego Bay", az: "Monteqo-Bey" } },
    { name: { ru: "Кингстон", en: "Kingston", az: "Kinqston" } },
  ]},
  { code: "PR", name: { ru: "Пуэрто-Рико", en: "Puerto Rico", az: "Puerto-Riko" }, cities: [
    { name: { ru: "Сан-Хуан", en: "San Juan", az: "San-Xuan" } },
  ]},
  { code: "BB", name: { ru: "Барбадос", en: "Barbados", az: "Barbados" }, cities: [
    { name: { ru: "Бриджтаун", en: "Bridgetown", az: "Bricjtaun" } },
  ]},
  { code: "BS", name: { ru: "Багамы", en: "Bahamas", az: "Baham adaları" }, cities: [
    { name: { ru: "Нассау", en: "Nassau", az: "Nassau" } },
  ]},
  { code: "TT", name: { ru: "Тринидад и Тобаго", en: "Trinidad and Tobago", az: "Trinidad və Tobaqo" }, cities: [
    { name: { ru: "Порт-оф-Спейн", en: "Port of Spain", az: "Port-of-Speyn" } },
  ]},
  { code: "AG", name: { ru: "Антигуа и Барбуда", en: "Antigua and Barbuda", az: "Antiqua və Barbuda" }, cities: [
    { name: { ru: "Сент-Джонс", en: "St. John's", az: "Sent-Conz" } },
  ]},
  { code: "DM", name: { ru: "Доминика", en: "Dominica", az: "Dominika" }, cities: [
    { name: { ru: "Розо", en: "Roseau", az: "Rozо" } },
  ]},
  { code: "GD", name: { ru: "Гренада", en: "Grenada", az: "Qrenada" }, cities: [
    { name: { ru: "Сент-Джорджес", en: "St. George's", az: "Sent-Cordjes" } },
  ]},
  { code: "KN", name: { ru: "Сент-Китс и Невис", en: "Saint Kitts and Nevis", az: "Sent-Kits və Nevis" }, cities: [
    { name: { ru: "Бастер", en: "Basseterre", az: "Basterre" } },
  ]},
  { code: "LC", name: { ru: "Сент-Люсия", en: "Saint Lucia", az: "Sent-Lusiya" }, cities: [
    { name: { ru: "Кастри", en: "Castries", az: "Kastri" } },
  ]},
  { code: "VC", name: { ru: "Сент-Винсент и Гренадины", en: "Saint Vincent and the Grenadines", az: "Sent-Vinsent və Qrenadinlər" }, cities: [
    { name: { ru: "Кингстаун", en: "Kingstown", az: "Kinqstaun" } },
  ]},
  { code: "AW", name: { ru: "Аруба", en: "Aruba", az: "Aruba" }, cities: [
    { name: { ru: "Ораньестад", en: "Oranjestad", az: "Oranyestad" } },
  ]},
  { code: "KY", name: { ru: "Каймановы острова", en: "Cayman Islands", az: "Kayman adaları" }, cities: [
    { name: { ru: "Джорджтаун", en: "George Town", az: "Cordjtaun" } },
  ]},
  { code: "TC", name: { ru: "Теркс и Кайкос", en: "Turks and Caicos", az: "Terks və Kaykos" }, cities: [
    { name: { ru: "Кокберн-Таун", en: "Cockburn Town", az: "Kokbern-Taun" } },
  ]},
  { code: "BM", name: { ru: "Бермуды", en: "Bermuda", az: "Bermud adaları" }, cities: [
    { name: { ru: "Гамильтон", en: "Hamilton", az: "Hamilton" } },
  ]},
  { code: "VI", name: { ru: "Виргинские острова", en: "US Virgin Islands", az: "ABŞ Virgin adaları" }, cities: [
    { name: { ru: "Шарлотта-Амалия", en: "Charlotte Amalie", az: "Şarlotта-Amaliya" } },
  ]},

  // ==================== OCEANIA ====================
  { code: "AU", name: { ru: "Австралия", en: "Australia", az: "Avstraliya" }, cities: [
    { name: { ru: "Сидней", en: "Sydney", az: "Sidney" } },
    { name: { ru: "Мельбурн", en: "Melbourne", az: "Melburn" } },
    { name: { ru: "Брисбен", en: "Brisbane", az: "Brisben" } },
    { name: { ru: "Перт", en: "Perth", az: "Pert" } },
  ]},
  { code: "NZ", name: { ru: "Новая Зеландия", en: "New Zealand", az: "Yeni Zelandiya" }, cities: [
    { name: { ru: "Окленд", en: "Auckland", az: "Oklend" } },
    { name: { ru: "Веллингтон", en: "Wellington", az: "Uellinqton" } },
  ]},
  { code: "FJ", name: { ru: "Фиджи", en: "Fiji", az: "Fici" }, cities: [
    { name: { ru: "Нади", en: "Nadi", az: "Nadi" } },
  ]},
  { code: "PG", name: { ru: "Папуа-Новая Гвинея", en: "Papua New Guinea", az: "Papua-Yeni Qvineya" }, cities: [
    { name: { ru: "Порт-Морсби", en: "Port Moresby", az: "Port-Morsbi" } },
  ]},
  { code: "SB", name: { ru: "Соломоновы острова", en: "Solomon Islands", az: "Solomon adaları" }, cities: [
    { name: { ru: "Хониара", en: "Honiara", az: "Xoniara" } },
  ]},
  { code: "VU", name: { ru: "Вануату", en: "Vanuatu", az: "Vanuatu" }, cities: [
    { name: { ru: "Порт-Вила", en: "Port Vila", az: "Port-Vila" } },
  ]},
  { code: "WS", name: { ru: "Самоа", en: "Samoa", az: "Samoa" }, cities: [
    { name: { ru: "Апиа", en: "Apia", az: "Apiya" } },
  ]},
  { code: "TO", name: { ru: "Тонга", en: "Tonga", az: "Tonqa" }, cities: [
    { name: { ru: "Нукуалофа", en: "Nuku'alofa", az: "Nukualofa" } },
  ]},
  { code: "FM", name: { ru: "Микронезия", en: "Micronesia", az: "Mikroneziya" }, cities: [
    { name: { ru: "Паликир", en: "Palikir", az: "Palikir" } },
  ]},
  { code: "PW", name: { ru: "Палау", en: "Palau", az: "Palau" }, cities: [
    { name: { ru: "Нгерулмуд", en: "Ngerulmud", az: "Ngerulmud" } },
  ]},
  { code: "MH", name: { ru: "Маршалловы острова", en: "Marshall Islands", az: "Marşall adaları" }, cities: [
    { name: { ru: "Маджуро", en: "Majuro", az: "Madjuro" } },
  ]},
  { code: "KI", name: { ru: "Кирибати", en: "Kiribati", az: "Kiribati" }, cities: [
    { name: { ru: "Тарауа", en: "Tarawa", az: "Tarava" } },
  ]},
  { code: "NR", name: { ru: "Науру", en: "Nauru", az: "Nauru" }, cities: [
    { name: { ru: "Ярен", en: "Yaren", az: "Yaren" } },
  ]},
  { code: "TV", name: { ru: "Тувалу", en: "Tuvalu", az: "Tuvalu" }, cities: [
    { name: { ru: "Фунафути", en: "Funafuti", az: "Funafuti" } },
  ]},

];

// Helper: get country name by locale
export function getCountryName(country: CountryData, locale: string = "ru"): string {
  if (locale === "en") return country.name.en;
  if (locale === "az") return country.name.az;
  return country.name.ru;
}

// Helper: get city name by locale
export function getCityName(city: City, locale: string = "ru"): string {
  if (locale === "en") return city.name.en;
  if (locale === "az") return city.name.az;
  return city.name.ru;
}

// Helper: search countries by name (any locale)
export function searchCountries(query: string): CountryData[] {
  const q = query.toLowerCase();
  return countriesDatabase.filter(
    (c) =>
      c.name.ru.toLowerCase().includes(q) ||
      c.name.en.toLowerCase().includes(q) ||
      c.name.az.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q)
  );
}

// Helper: search cities within a country
export function searchCities(countryCode: string, query: string, locale: string = "ru"): City[] {
  const country = countriesDatabase.find((c) => c.code === countryCode);
  if (!country) return [];
  const q = query.toLowerCase();
  return country.cities.filter(
    (city) =>
      city.name.ru.toLowerCase().includes(q) ||
      city.name.en.toLowerCase().includes(q) ||
      city.name.az.toLowerCase().includes(q)
  );
}
