import { PlaceCard } from "./card-22";

export function CourseCard({ course, isEnrolled }) {
  const categoryGalleries = {
    Programming: [
      "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1974&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1461749280684-dccba630e2f6?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1515879218367-8466d910aaa4?q=80&w=2070&auto=format&fit=crop",
    ],
    Design: [
      "https://images.unsplash.com/photo-1507238691740-187a5b1d37b8?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1558655146-d09347e92766?q=80&w=2074&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?q=80&w=1974&auto=format&fit=crop",
    ],
    Marketing: [
      "https://images.unsplash.com/photo-1432888622747-4eb9a8efeb07?q=80&w=1600&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2015&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1552664730-d307ca884978?q=80&w=2070&auto=format&fit=crop",
    ],
    Language: [
      "https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?q=80&w=1973&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=2128&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?q=80&w=2070&auto=format&fit=crop",
    ],
  };

  const fallbackGallery = categoryGalleries[course.category] || categoryGalleries.Programming;
  const images = [course.coverImage, ...fallbackGallery.filter((img) => img !== course.coverImage)];

  return (
    <PlaceCard
      images={images}
      tags={[course.category, course.difficulty]}
      rating={course.rating}
      title={course.title}
      dateRange={`${course.durationHours}h total`}
      hostType={isEnrolled ? "Enrolled course" : "Open enrollment"}
      isTopRated={course.rating >= 4.8}
      description={course.description}
      pricePerNight={course.price}
      priceSuffix="/ course"
      actionLabel={isEnrolled ? "Continue" : "View Details"}
      actionTo={`/courses/${course.id}`}
      className="h-full max-w-none"
    />
  );
}
