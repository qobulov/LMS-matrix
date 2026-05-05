import * as React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { AvatarUploader } from '@/components/ui/avatar-uploader';
import { AuroraBackground } from '@/components/ui/aurora-background';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PlaceCard } from '@/components/ui/card-22';
import { Button } from '@/components/ui/button-1';
import { NotFoundGhost } from '@/components/ui/ghost-404-page';
import { MagneticButton } from '@/components/ui/magnetic-button';
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem } from '@/components/ui/pagination';
import { GlowCard } from '@/components/ui/spotlight-card';
import Index from '@/components/ui/travel-connect-signin-1';

function DemoAiAssistatBasic() {
  return <Index onSubmit={() => {}} />;
}

function AuroraBackgroundDemo() {
  return (
    <AuroraBackground>
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{
          delay: 0.3,
          duration: 0.8,
          ease: 'easeInOut',
        }}
        className="relative flex flex-col items-center justify-center gap-4 px-4"
      >
        <div className="text-center text-3xl font-bold md:text-7xl dark:text-white">
          Background lights are cool you know.
        </div>
        <div className="py-4 text-base font-extralight dark:text-neutral-200 md:text-4xl">
          And this, is chemical burn.
        </div>
        <button className="w-fit rounded-full bg-black px-4 py-2 text-white dark:bg-white dark:text-black">
          Debug now
        </button>
      </motion.div>
    </AuroraBackground>
  );
}

function SpotlightCardDemo() {
  return (
    <div className="flex min-h-screen w-screen flex-wrap items-center justify-center gap-8 bg-slate-950 px-6 py-10">
      {['Programming', 'Design', 'Marketing'].map((label, index) => (
        <GlowCard
          key={label}
          customSize
          glowColor={index === 0 ? 'blue' : index === 1 ? 'purple' : 'orange'}
          className="h-[320px] w-[260px] bg-white/10 p-0"
        >
          <div className="flex h-full flex-col justify-end rounded-[inherit] bg-gradient-to-b from-white/5 via-white/5 to-slate-950/90 p-6 text-white">
            <p className="text-sm uppercase tracking-[0.24em] text-white/60">{label}</p>
            <h3 className="mt-3 text-2xl font-semibold">Interactive Spotlight</h3>
            <p className="mt-2 text-sm leading-6 text-white/70">
              Pointer harakatiga qarab chetlar yaltirab turadigan course card preview.
            </p>
          </div>
        </GlowCard>
      ))}
    </div>
  );
}

function MagneticButtonExample() {
  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-slate-100">
      <MagneticButton>
        <button className="rounded-full bg-indigo-500 px-10 py-4 text-lg text-white transition-colors hover:bg-indigo-600">
          Magnetic Button
        </button>
      </MagneticButton>
    </div>
  );
}

function PaginationDemo() {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <Button variant="ghost" asChild>
            <Link to="#">
              <ChevronLeft className="rtl:rotate-180" /> Preview
            </Link>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button variant="ghost" mode="icon" asChild>
            <Link to="#">1</Link>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button variant="outline" mode="icon" asChild>
            <Link to="#">2</Link>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <Button variant="ghost" mode="icon" asChild>
            <Link to="#">3</Link>
          </Button>
        </PaginationItem>
        <PaginationItem>
          <PaginationEllipsis />
        </PaginationItem>
        <PaginationItem>
          <Button variant="ghost" asChild>
            <Link to="#">
              Next <ChevronRight className="rtl:rotate-180" />
            </Link>
          </Button>
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

function AvatarUploaderDemo() {
  const [photo, setPhoto] = React.useState<string>(
    'https://avatar.vercel.sh/john',
  );

  const handleUpload = async (file: File) => {
    setPhoto(URL.createObjectURL(file));
    return { success: true };
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center">
      <div
        aria-hidden="true"
        className={cn(
          'pointer-events-none absolute -top-10 left-1/2 size-full -translate-x-1/2 rounded-full',
          'bg-[radial-gradient(ellipse_at_center,--theme(--color-foreground/.1),transparent_50%)]',
          'blur-[30px]',
        )}
      />

      <AvatarUploader onUpload={handleUpload}>
        <Avatar className="relative size-20 cursor-pointer hover:opacity-50">
          <AvatarImage src={photo} />
          <AvatarFallback className="border text-2xl font-bold">
            JD
          </AvatarFallback>
        </Avatar>
      </AvatarUploader>
    </div>
  );
}

function Ghost404Demo() {
  return (
    <div className="min-h-screen w-full bg-white">
      <NotFoundGhost />
    </div>
  );
}

const demoPlaceData = {
  images: [
    'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?q=80&w=2940&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1596622247990-84877175438a?q=80&w=2864&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1543332164-6e82f355badc?q=80&w=2940&auto=format&fit=crop',
  ],
  tags: ['Adventure', 'Ancient Monuments'],
  rating: 4.8,
  title: 'Petra, Jordan',
  dateRange: 'May 1 - 6',
  hostType: 'Business host',
  isTopRated: true,
  description: 'A lost city carved in rose-colored stone, hidden in majestic desert canyons.',
  pricePerNight: 139,
};

function PlaceCardDemo() {
  return (
    <div className="flex min-h-[500px] w-full items-center justify-center bg-background p-4">
      <PlaceCard
        images={demoPlaceData.images}
        tags={demoPlaceData.tags}
        rating={demoPlaceData.rating}
        title={demoPlaceData.title}
        dateRange={demoPlaceData.dateRange}
        hostType={demoPlaceData.hostType}
        isTopRated={demoPlaceData.isTopRated}
        description={demoPlaceData.description}
        pricePerNight={demoPlaceData.pricePerNight}
      />
    </div>
  );
}

export {
  AvatarUploaderDemo,
  AuroraBackgroundDemo,
  DemoAiAssistatBasic,
  Ghost404Demo,
  MagneticButtonExample,
  PaginationDemo,
  PlaceCardDemo,
  SpotlightCardDemo,
};
