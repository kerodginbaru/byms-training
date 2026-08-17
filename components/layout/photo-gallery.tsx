import Image from "next/image";

const GALLERY_PHOTOS = [
  { src: "/images/gallery/gallery-4.jpg", alt: "የቤተ-ያሬድ ተመራቂ ተማሪዎች ከቤተክርስቲያኑ ፊት ለፊት" },
  { src: "/images/gallery/gallery-5.jpg", alt: "የበገና መሳርያዎች" },
  { src: "/images/gallery/gallery-3.jpg", alt: "መምህር ተማሪዎችን ሲያስተምር" },
  { src: "/images/gallery/gallery-1.jpg", alt: "የሻማ ማብራት ሥነ ሥርዓት" },
  { src: "/images/gallery/gallery-2.jpg", alt: "የሻማ ማብራት ሥነ ሥርዓት" }
];

export function PhotoGallery() {
  return (
    <section className="container-page py-16">
      <h2 className="amharic text-center text-2xl font-bold text-ink-900 sm:text-3xl">ፎቶዎች</h2>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {GALLERY_PHOTOS.map((photo) => (
          <div key={photo.src} className="aspect-[3/4] overflow-hidden rounded-xl shadow-sm">
            <Image
              src={photo.src}
              alt={photo.alt}
              width={400}
              height={533}
              className="h-full w-full object-cover transition hover:scale-105"
            />
          </div>
        ))}
      </div>
    </section>
  );
}