import Image from 'next/image';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="relative flex-[0_0_60%] max-[900px]:hidden">
        <Image
          src="/images/banner.jpg"
          alt=""
          fill
          priority
          className="object-cover"
          sizes="60vw"
        />
        <div className="absolute inset-0 bg-linear-to-br from-auth-banner-overlay-dark to-auth-banner-overlay-primary" />
        <div className="absolute top-1/2 left-10 z-10 max-w-[500px] -translate-y-1/2 pr-10">
          <h1 className="mb-6 text-[36px] leading-[1.2] font-bold tracking-[-0.02em] text-auth-banner-text">
            Building with purpose, quality, and resilience
          </h1>
          <div className="mb-6 h-[3px] w-[60px] bg-primary" />
          <p className="text-base leading-relaxed text-auth-banner-text-muted">
            Solutions that turn ideas into reality
          </p>
        </div>
      </div>

      <div className="flex flex-[0_0_40%] items-center justify-center bg-background p-[var(--spacing-xl)] max-[900px]:flex-[0_0_100%] max-[900px]:p-[var(--spacing-lg)]">
        {children}
      </div>
    </div>
  );
}
