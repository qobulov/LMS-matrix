'use client';

import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ChevronLeft, ChevronRight } from 'lucide-react';
import authImage1 from '../../assets/images/auth_image1.png';
import authImage2 from '../../assets/images/auth_image2.png';
import authImage3 from '../../assets/images/auth_image3.png';

const SLIDES = [
  {
    image: authImage1,
    heading: 'Access hundreds of high-quality courses designed to help you upskill anytime, anywhere.',
    title: 'Learn with Expert Video Courses',
    sub: 'in Damiun Indonesia',
  },
  {
    image: authImage2,
    heading: 'Connect with expert mentors through live 1-on-1 sessions from anywhere in the world.',
    title: 'Mentoring & Live Sessions',
    sub: 'in Damiun Indonesia',
  },
  {
    image: authImage3,
    heading: 'Collaborate on real projects and build your portfolio with hands-on learning.',
    title: 'Hands-on Collaborative Learning',
    sub: 'in Damiun Indonesia',
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
}

const inputClass =
  'h-14 w-full rounded-full border-0 bg-white/65 px-6 text-xl text-[#3f4960] placeholder:text-[#6a758f] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#149ad9] sm:h-16 sm:px-7 sm:text-2xl lg:text-[2rem]';

const labelClass =
  'text-[1.7rem] font-semibold leading-tight text-[#161f31] sm:text-[2rem]';

const TravelConnectSignIn = ({
  mode = 'login',
  onSubmit,
  onSwitchMode,
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
    <div className="min-h-screen w-full bg-[#d7dbe1]">
      <div className="grid max-h-screen w-full grid-cols-1 lg:grid-cols-2">
        <section className="relative flex min-h-screen w-full items-center justify-center px-5 py-8 sm:px-8 sm:py-10 lg:px-10 xl:px-16">
          <div className="flex w-full max-w-[720px] flex-col gap-8 sm:gap-10 lg:min-h-[78vh] lg:justify-between">
            <div className="space-y-7 sm:space-y-8 lg:space-y-9">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#149ad9] text-white sm:h-12 sm:w-12">
                  <div className="h-6 w-4 rounded-sm bg-white/90 sm:h-7" />
                </div>
                <div className="leading-none text-[#149ad9]">
                  <p className="text-xl font-semibold tracking-[0.08em] sm:text-2xl">Damiun</p>
                  <p className="mt-1 text-xl font-semibold tracking-[0.08em] sm:text-2xl">Indonesia</p>
                </div>
              </div>

              <div className="w-full space-y-6">
                <div className="space-y-2.5">
                  <h1 className="text-4xl font-semibold leading-tight text-[#161f31] sm:text-5xl lg:text-[3.1rem]">
                    {isRegister ? 'Create Account' : 'Sign In'}
                  </h1>
                  <p className="text-base leading-snug text-[#303948] sm:text-lg lg:text-xl">
                    {isRegister
                      ? 'Create your account to start learning and growing.'
                      : 'Sign In to your account to start learning and growing.'}
                  </p>
                </div>

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
                        placeholder={isRegister ? 'Create your password' : 'Input your password'}
                        className={`${inputClass} pr-14 sm:pr-16 lg:pr-20`}
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
                        className="absolute right-5 top-1/2 -translate-y-1/2 text-[#6c7388] transition hover:text-[#4e576f] sm:right-7"
                        onClick={() => setIsPasswordVisible((prev) => !prev)}
                      >
                        {isPasswordVisible ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                    {errors.password && (
                      <p className="pl-4 text-sm font-medium text-red-600">{errors.password.message}</p>
                    )}
                  </div>

                  {!isRegister && (
                    <div className="text-right text-base text-[#5f6880] sm:text-lg lg:text-2xl">
                      <button type="button" className="transition hover:text-[#149ad9]">
                        Forgot my password
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="h-14 w-full rounded-full bg-[#149ad9] text-2xl font-semibold text-white transition hover:bg-[#0f8dc8] disabled:opacity-70 sm:h-16 sm:text-3xl lg:text-[2.2rem]"
                  >
                    {isSubmitting
                      ? isRegister ? 'Creating...' : 'Signing in...'
                      : isRegister ? 'Create Account' : 'Sign In'}
                  </button>

                  <div className="text-center text-base text-[#5f6880] sm:text-lg lg:text-2xl">
                    {isRegister ? 'Already have an account? ' : "Don't have an account? "}
                    <button
                      type="button"
                      className="font-semibold text-[#149ad9] transition hover:text-[#0e85bc]"
                      onClick={onSwitchMode}
                    >
                      {isRegister ? 'Sign In' : 'Sign Up'}
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm text-[#65718c] sm:gap-x-12 sm:text-base">
              <a href="#">About</a>
              <a href="#">Terms &amp; Conditions</a>
              <a href="#">Privacy Policy</a>
            </div>
          </div>
        </section>

        <section className="relative hidden overflow-hidden lg:block">
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

          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-[#07122e]/85" />

          <div className="absolute bottom-12 left-8 right-8 text-white xl:bottom-14 xl:left-12 xl:right-12">
            {/* Slide text */}
            <p
              key={current}
              className="max-w-[840px] animate-fade-in text-4xl font-medium leading-[1.16] xl:text-6xl"
            >
              {SLIDES[current].heading}
            </p>
            <div className="mt-7 xl:mt-10">
              <p className="text-2xl font-semibold xl:text-4xl">{SLIDES[current].title}</p>
              <p className="mt-2 text-xl text-white/90 xl:mt-3 xl:text-4xl">{SLIDES[current].sub}</p>
            </div>

            <div className="mt-7 flex items-center justify-between xl:mt-10">
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
              <div className="flex items-center gap-3 xl:gap-4">
                <button
                  type="button"
                  aria-label="Previous"
                  onClick={prev}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 text-white transition hover:bg-white/20 xl:h-14 xl:w-14"
                >
                  <ChevronLeft size={22} />
                </button>
                <button
                  type="button"
                  aria-label="Next"
                  onClick={next}
                  className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-white/90 text-white transition hover:bg-white/20 xl:h-14 xl:w-14"
                >
                  <ChevronRight size={22} />
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
