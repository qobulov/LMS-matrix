'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import authImage1 from '../../assets/images/auth_image1.png';
import authImage2 from '../../assets/images/auth_image2.png';
import authImage3 from '../../assets/images/auth_image3.png';
import { APP_NAME } from '../../constants/branding';

const slideSub = `on ${APP_NAME}`;

const SLIDES = [
  {
    image: authImage1,
    heading: 'Access hundreds of high-quality courses designed to help you upskill anytime, anywhere.',
    title: 'Learn with Expert Video Courses',
    sub: slideSub,
  },
  {
    image: authImage2,
    heading: 'Get guidance from industry professionals to help you grow faster and build a strong portfolio.',
    title: 'Personalized 1-on-1 Mentoring',
    sub: slideSub,
  },
  {
    image: authImage3,
    heading: 'Join talent pools, apply for internships, and get matched with jobs that fit your profile.',
    title: 'Connect with Job Opportunities',
    sub: slideSub,
  },
];

interface LoginFields {
  email: string;
  password: string;
}

interface RegisterFields extends LoginFields {
  fullName: string;
}

interface TravelConnectSignInProps {
  mode?: 'login' | 'register';
  onSubmit: (values: LoginFields | RegisterFields) => Promise<void> | void;
  onSwitchMode?: () => void;
  /** Server-side validation (e.g. register API) */
  error?: string;
  /** Disables submit while parent handles async work */
  loading?: boolean;
}

/** Brand + surfaces for auth layout (design reference). */
const brand = {
  primary: '#0099d8',
  pageBg: '#e6ebf1',
  wordmark: '#1a2235',
  body: '#303948',
  muted: '#5f6880',
  heroSub: '#9fd9ff',
} as const;

const inputClass =
  'h-12 w-full rounded-full border border-white/60 bg-[rgba(255,255,255,0.82)] px-5 text-base text-[#3f4960] shadow-[0_1px_0_rgba(255,255,255,0.6)] placeholder:text-[#6a758f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-damiun-primary focus-visible:ring-offset-0 sm:h-12 sm:px-6 sm:text-[0.9375rem]';

const labelClass =
  'text-[0.9375rem] font-semibold leading-tight text-[#1a2235] sm:text-base';

const TravelConnectSignIn = ({
  mode = 'login',
  onSubmit,
  onSwitchMode,
  error: externalError,
  loading = false,
}: TravelConnectSignInProps) => {
  const isRegister = mode === 'register';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [current, setCurrent] = useState(0);
  const [animating, setAnimating] = useState(false);

  const goTo = (index: number) => {
    if (animating) return;
    setAnimating(true);
    setTimeout(() => {
      setCurrent(index);
      setAnimating(false);
    }, 300);
  };

  const prev = () => goTo((current - 1 + SLIDES.length) % SLIDES.length);
  const next = () => goTo((current + 1) % SLIDES.length);

  useEffect(() => {
    const id = setInterval(next, 4500);
    return () => clearInterval(id);
  }, [current]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFields>({ mode: 'onTouched' });

  return (
    <div className="min-h-screen w-full font-dm-sans" style={{ backgroundColor: brand.pageBg }}>
      <div className="mx-auto grid min-h-screen w-full max-w-[1280px] grid-cols-1 lg:grid-cols-2 lg:max-h-screen">
        <section className="relative flex min-h-screen w-full items-center justify-center px-6 py-8 sm:px-10 sm:py-10 lg:min-h-screen lg:px-12 lg:py-12">
          <div className="flex w-full max-w-[440px] flex-col gap-8 sm:gap-9 lg:min-h-[72vh] lg:justify-between xl:max-w-[460px]">
            <div className="space-y-6 sm:space-y-7">
              <div className="flex items-center gap-3">
                <div
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white sm:h-11 sm:w-11"
                  style={{ backgroundColor: brand.primary }}
                >
                  <div className="h-5 w-3.5 rounded-sm bg-white/95 sm:h-6 sm:w-4" />
                </div>
                <p
                  className="text-[1.05rem] font-semibold leading-snug tracking-tight sm:text-lg"
                  style={{ color: brand.wordmark }}
                >
                  {APP_NAME}
                </p>
              </div>

              <div className="w-full space-y-5 sm:space-y-6">
                <div className="space-y-2">
                  <h1
                    className="text-[1.75rem] font-semibold leading-tight tracking-tight sm:text-[2rem]"
                    style={{ color: brand.wordmark }}
                  >
                    {isRegister ? 'Sign Up' : 'Sign In'}
                  </h1>
                  <p className="text-sm leading-relaxed sm:text-[0.9375rem]" style={{ color: brand.body }}>
                    {isRegister
                      ? 'Create an account and start your career journey today.'
                      : 'Sign In to your account to start learning and growing.'}
                  </p>
                </div>

                {externalError ? (
                  <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700 sm:text-base">
                    {externalError}
                  </p>
                ) : null}

                <form className="space-y-5 sm:space-y-6" noValidate onSubmit={handleSubmit(onSubmit)}>
                  {isRegister && (
                    <div className="space-y-2.5">
                      <label htmlFor="fullName" className={labelClass}>
                        Full Name
                      </label>
                      <input
                        id="fullName"
                        placeholder="Write your full name"
                        className={inputClass}
                        {...register('fullName', {
                          required: 'Full name is required',
                          minLength: { value: 2, message: 'Name must be at least 2 characters' },
                        })}
                      />
                      {errors.fullName && (
                        <p className="pl-4 text-sm font-medium text-red-600">{errors.fullName.message}</p>
                      )}
                    </div>
                  )}

                  <div className="space-y-2.5">
                    <label htmlFor="email" className={labelClass}>
                      Email Address
                    </label>
                    <input
                      id="email"
                      type="email"
                      placeholder="Write your email"
                      className={inputClass}
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                          message: 'Enter a valid email address',
                        },
                      })}
                    />
                    {errors.email && (
                      <p className="pl-4 text-sm font-medium text-red-600">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2.5">
                    <label htmlFor="password" className={labelClass}>
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={isPasswordVisible ? 'text' : 'password'}
                        placeholder="Input your password"
                        className={`${inputClass} pr-12 sm:pr-14`}
                        {...register('password', {
                          required: 'Password is required',
                          minLength: { value: 8, message: 'Password must be at least 8 characters' },
                          ...(isRegister && {
                            pattern: {
                              value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                              message: 'Must include uppercase, lowercase, and a number',
                            },
                          }),
                        })}
                      />
                      <button
                        type="button"
                        aria-label="Toggle password visibility"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[#6c7388] transition hover:text-[#4e576f] sm:right-5"
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                      >
                        {isPasswordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="pl-4 text-sm font-medium text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  <div className="text-right text-sm sm:text-[0.9375rem]" style={{ color: brand.muted }}>
                    <button
                      type="button"
                      className="transition hover:text-damiun-primary"
                      style={{ color: brand.muted }}
                    >
                      Forgot my password
                    </button>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || loading}
                    className="h-12 w-full rounded-full bg-damiun-primary text-[0.9375rem] font-semibold text-white shadow-sm transition hover:bg-damiun-primary-hover disabled:opacity-70 disabled:hover:bg-damiun-primary sm:h-12 sm:text-base"
                  >
                    {isSubmitting || loading
                      ? isRegister
                        ? 'Signing up...'
                        : 'Signing in...'
                      : isRegister
                        ? 'Sign Up'
                        : 'Sign In'}
                  </button>

                  <div className="text-center text-sm sm:text-[0.9375rem]" style={{ color: brand.muted }}>
                    {isRegister ? 'Have an account? ' : "Don't have an account? "}
                    <button
                      type="button"
                      className="font-semibold transition hover:opacity-90"
                      style={{ color: brand.primary }}
                      onClick={onSwitchMode}
                    >
                      {isRegister ? 'Sign In' : 'Sign Up'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div
              className="flex flex-wrap gap-x-6 gap-y-2 text-xs sm:gap-x-8 sm:text-[0.8125rem]"
              style={{ color: brand.muted }}
            >
              <a href="#" className="transition hover:text-damiun-primary">
                About
              </a>
              <a href="#" className="transition hover:text-damiun-primary">
                Terms &amp; Conditions
              </a>
              <a href="#" className="transition hover:text-damiun-primary">
                Privacy Policy
              </a>
            </div>
          </div>
        </section>

        <section className="relative hidden min-h-screen overflow-hidden lg:block">
          {/* Slide images */}
          {SLIDES.map((slide, i) => (
            <img
              key={i}
              src={slide.image}
              alt={slide.title}
              className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-700 ${
                i === current && !animating ? 'opacity-100' : 'opacity-0'
              }`}
            />
          ))}

          <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[35%] via-transparent to-[#0e1626]/80" />

          <div className="absolute bottom-8 left-6 right-6 text-white sm:bottom-10 sm:left-8 sm:right-8 lg:bottom-10 lg:left-8 lg:right-8">
            {/* Slide text */}
            <p
              key={current}
              className="max-w-[32rem] animate-fade-in text-xl font-medium leading-snug sm:text-2xl lg:text-3xl"
            >
              {SLIDES[current].heading}
            </p>
            <div className="mt-5 sm:mt-6">
              <p className="text-lg font-semibold text-white sm:text-xl lg:text-2xl">{SLIDES[current].title}</p>
              <p
                className="mt-1 text-base font-semibold sm:mt-1.5 sm:text-lg lg:text-xl"
                style={{ color: brand.heroSub }}
              >
                {SLIDES[current].sub}
              </p>
            </div>

            <div className="mt-6 flex items-center justify-between sm:mt-7">
              {/* Dot indicators */}
              <div className="flex items-center gap-2">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    aria-label={`Go to slide ${i + 1}`}
                    onClick={() => goTo(i)}
                    className={`rounded-full transition-all duration-300 ${
                      i === current
                        ? 'h-2.5 w-8 bg-white'
                        : 'h-2.5 w-2.5 bg-white/40 hover:bg-white/70'
                    }`}
                  />
                ))}
              </div>

              {/* Prev / Next */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={prev}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 text-white transition hover:bg-white/20 sm:h-11 sm:w-11"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={next}
                  className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-white/90 text-white transition hover:bg-white/20 sm:h-11 sm:w-11"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default TravelConnectSignIn;
