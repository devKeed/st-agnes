'use client';

import { FormEvent, useState } from 'react';
import { apiPost } from '@/lib/api';

export default function AdminLoginPage() {
  const [message, setMessage] = useState('');

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    try {
      const response = await apiPost<{ accessToken: string }>('/api/v1/admin/auth/login', {
        email: formData.get('email'),
        password: formData.get('password'),
      });
      localStorage.setItem('adminAccessToken', response.accessToken);
      setMessage('Login successful. Go to /admin.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Login failed');
    }
  }

  return (
    <div className="mx-auto max-w-md rounded border bg-white p-4">
      <h1 className="text-xl font-semibold">Admin Login</h1>
      <form onSubmit={onSubmit} className="mt-3 space-y-2">
        <input name="email" type="email" required placeholder="Email" className="w-full rounded border p-2 text-sm" />
        <input name="password" type="password" required placeholder="Password" className="w-full rounded border p-2 text-sm" />
        <button className="rounded bg-black px-4 py-2 text-sm text-white">Login</button>
      </form>
      <p className="mt-2 text-sm">{message}</p>
    </div>
  );
}
