"use client";

import { useState } from "react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  if (sent) {
    return (
      <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50 py-12 px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 bg-success/10 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
            ✉️
          </div>
          <h1 className="text-2xl font-bold text-secondary mb-4">Письмо отправлено!</h1>
          <p className="text-gray-500 mb-8">
            Мы отправили инструкции по сбросу пароля на <span className="font-semibold text-secondary">{email}</span>
          </p>
          <a
            href="/auth/login"
            className="inline-flex items-center justify-center h-12 px-8 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg"
          >
            Вернуться к входу
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-120px)] flex items-center justify-center bg-gray-50 py-12 px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <a href="/" className="inline-flex items-center gap-2">
            <div className="w-12 h-12 bg-primary rounded-2xl flex items-center justify-center text-white font-bold text-xl">T</div>
            <span className="text-2xl font-bold text-secondary">Travel<span className="text-primary">Hub</span></span>
          </a>
          <h1 className="text-2xl font-bold text-secondary mt-6 mb-2">Забыли пароль?</h1>
          <p className="text-gray-500">Введите email для восстановления</p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-6 border border-gray-100">
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }}>
            <div className="mb-6">
              <label className="block text-sm font-semibold text-secondary mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">📧</span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full h-12 pl-10 pr-4 rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-0 outline-none transition-colors text-sm bg-gray-50"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full h-12 bg-primary hover:bg-primary-dark text-white rounded-xl font-bold transition-all hover:shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
            >
              Отправить ссылку
            </button>
          </form>

          <p className="text-center text-sm text-gray-500 mt-6">
            Вспомнили пароль?{" "}
            <a href="/auth/login" className="text-primary hover:text-primary-dark font-semibold">Войти</a>
          </p>
        </div>
      </div>
    </div>
  );
}
