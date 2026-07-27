"use client";

const features = [
  { icon: "💳", title: "Централизованная оплата", desc: "Единый счёт для всей компании с детализацией по сотрудникам" },
  { icon: "✅", title: "Согласование поездок", desc: "Система одобрения заявок от руководителей" },
  { icon: "📊", title: "Лимиты расходов", desc: "Установка бюджетов по отделам и проектам" },
  { icon: "📋", title: "Отчётность", desc: "Автоматические отчёты для бухгалтерии и налоговой" },
  { icon: "👤", title: "Личный менеджер", desc: "Персональный менеджер для решения любых вопросов" },
  { icon: "🔒", title: "Безопасность", desc: "Защита данных и безопасная оплата" },
];

const stats = [
  { value: "500+", label: "Компаний-партнёров" },
  { value: "15 000+", label: "Командировок в год" },
  { value: "30%", label: "Экономия на бронированиях" },
  { value: "24/7", label: "Поддержка" },
];

const testimonials = [
  {
    company: "TechCorp Azerbaijan",
    name: "Эльчин Мамедов",
    role: "Директор по HR",
    text: "TravelHub значительно упростил процесс организации командировок. Экономия бюджета и удобство — главные преимущества.",
    avatar: "EM",
  },
  {
    company: "Global Trade LLC",
    name: "Анна Петрова",
    role: "Финансовый директор",
    text: "Отчётность и детализация расходов позволяют нам контролировать бюджет по каждому отделу. Очень довольны сервисом.",
    avatar: "АП",
  },
  {
    company: "Baku Construction",
    name: "Руслан Гасымов",
    role: "Управление проектами",
    text: "Личный менеджер решает все вопросы оперативно. Рекомендую для компаний, которые часто отправляют сотрудников в командировки.",
    avatar: "РГ",
  },
];

export default function BusinessPage() {
  return (
    <div className="min-h-[calc(100vh-120px)] bg-gray-50">
      {/* Hero */}
      <section className="bg-gradient-to-br from-secondary via-gray-900 to-secondary py-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        <div className="max-w-5xl mx-auto px-4 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
            <span className="text-sm font-medium text-white">🏢 TravelHub Business</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Командировки <span className="text-primary">без забот</span>
          </h1>
          <p className="text-lg text-white/70 max-w-2xl mx-auto mb-8">
            Бронируйте командировки для сотрудников с централизованной оплатой, согласованием и отчётностью. Экономьте до 30% на бронированиях.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <a href="/auth/register" className="h-14 px-8 bg-primary hover:bg-primary-dark text-white rounded-2xl font-bold text-lg transition-all hover:shadow-lg hover:shadow-primary/30">
              Подключить бизнес
            </a>
            <a href="#features" className="h-14 px-8 bg-white/10 backdrop-blur-sm hover:bg-white/20 text-white rounded-2xl font-bold text-lg transition-all border border-white/20">
              Узнать больше
            </a>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-14 pt-8 border-t border-white/10">
            {stats.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-sm text-white/60 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-secondary mb-3">Возможности для бизнеса</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">Всё, что нужно для управления корпоративными поездками</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <div key={feature.title} className="p-6 bg-gray-50 rounded-2xl hover:shadow-md transition-shadow">
                <span className="text-3xl mb-4 block">{feature.icon}</span>
                <h3 className="font-bold text-secondary mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-secondary mb-3">Как это работает</h2>
            <p className="text-gray-500 text-lg">Три простых шага до первой командировки</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { step: "01", title: "Регистрация", desc: "Создайте корпоративный аккаунт и пригласите сотрудников", icon: "📝" },
              { step: "02", title: "Бронирование", desc: "Сотрудники бронируют поездки с учётом лимитов и согласований", icon: "✈" },
              { step: "03", title: "Отчётность", desc: "Получайте автоматические отчёты и инвойсы для бухгалтерии", icon: "📊" },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4">
                  {item.icon}
                </div>
                <div className="text-xs font-bold text-primary mb-2">Шаг {item.step}</div>
                <h3 className="font-bold text-secondary text-lg mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-secondary mb-3">Отзывы компаний</h2>
            <p className="text-gray-500 text-lg">Что говорят наши корпоративные клиенты</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.company} className="bg-gray-50 rounded-2xl p-6">
                <p className="text-gray-600 text-sm leading-relaxed mb-6 italic">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-secondary text-sm">{t.name}</p>
                    <p className="text-xs text-gray-500">{t.role}, {t.company}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-gradient-to-r from-primary via-orange-500 to-primary-dark">
        <div className="max-w-3xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Готовы начать?</h2>
          <p className="text-white/80 text-lg mb-8">Подключите TravelHub Business и экономьте на командировках уже сегодня</p>
          <a href="/auth/register" className="inline-flex h-14 px-10 bg-white text-primary rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all hover:shadow-lg active:scale-95">
            Создать аккаунт
          </a>
        </div>
      </section>
    </div>
  );
}
