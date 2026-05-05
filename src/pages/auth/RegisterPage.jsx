import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TravelConnectSignIn from '../../components/ui/travel-connect-signin-1';
import { useLms } from '../../data/LmsContext';

export function RegisterPage() {
  const { register } = useLms();
  const navigate = useNavigate();

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onSubmit = async ({ fullName, email, password, role }) => {
    setError('');

    const normalizedFullName = String(fullName || '').trim();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPassword = String(password || '').trim();

    if (!normalizedFullName || !normalizedEmail || !normalizedPassword) {
      setError("Barcha maydonlarni to'ldiring");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError("Email formati noto'g'ri");
      return;
    }

    if (normalizedPassword.length < 6) {
      setError("Parol kamida 6 ta belgidan iborat bo'lsin");
      return;
    }

    setLoading(true);
    const result = await register({
      fullName: normalizedFullName,
      email: normalizedEmail,
      password: normalizedPassword,
      role: role || 'student',
    });
    setLoading(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    navigate('/', { replace: true });
  };

  return (
    <TravelConnectSignIn
      mode="register"
      loading={loading}
      error={error}
      onSubmit={onSubmit}
      onSwitchMode={() => navigate('/login')}
    />
  );
}
