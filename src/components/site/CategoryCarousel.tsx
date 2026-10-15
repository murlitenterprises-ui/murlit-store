import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { shopMenuColumns } from "@/lib/menu";
import { img } from "@/lib/catalog";

type Item = {
  id: string;
  title: string;
  img: string;
  slug?: string;   // set → link to /category/$slug
  href?: string;   // set → plain anchor link
};

const items: Item[] = [
  { id: "0", title: shopMenuColumns[0].title, img: shopMenuColumns[0].img, slug: shopMenuColumns[0].slug },
  { id: "1", title: shopMenuColumns[1].title, img: shopMenuColumns[1].img, slug: shopMenuColumns[1].slug },
  { id: "2", title: shopMenuColumns[2].title, img: shopMenuColumns[2].img, slug: shopMenuColumns[2].slug },
  { id: "4", title: shopMenuColumns[4].title, img: shopMenuColumns[4].img, slug: shopMenuColumns[4].slug },
  { id: "3", title: shopMenuColumns[3].title, img: shopMenuColumns[3].img, slug: shopMenuColumns[3].slug },
  { id: "customized", title: "Customized", img: img.crochet, href: "/#custom" },
  { id: "bulk",       title: "Bulk Orders", img: img.hamper,  href: "/#b2b"    },
];

function ItemLink({ item, pathname, ghost }: { item: Item; pathname: string; ghost?: boolean }) {
  const isActive = !ghost && item.slug ? pathname === `/category/${item.slug}` : false;
  const circleClass = `h-[64px] w-[64px] rounded-full overflow-hidden border-2 transition-transform group-hover:scale-105 ${
    isActive ? "border-maroon" : "border-gray-200"
  }`;
  const labelClass = `mt-1 max-w-[150px] text-[13px] font-medium text-center leading-snug ${
    isActive ? "text-maroon" : ""
  }`;
  const inner = (
    <>
      <div className={circleClass}>
        <img src={item.img} alt={item.title} className="h-full w-full object-cover" loading="lazy" decoding="async" width={1024} height={1024} />
      </div>
      <span className={labelClass} title={item.title}>{item.title}</span>
    </>
  );
  const linkClass = "group flex w-[140px] shrink-0 snap-start flex-col items-center lg:w-auto lg:flex-1";

  if (item.slug) {
    return (
      <Link
        to="/category/$slug"
        params={{ slug: item.slug }}
        role={ghost ? undefined : "listitem"}
        tabIndex={ghost ? -1 : undefined}
        aria-hidden={ghost ? true : undefined}
        className={linkClass}
      >
        {inner}
      </Link>
    );
  }
  return (
    <a
      href={item.href}
      role={ghost ? undefined : "listitem"}
      tabIndex={ghost ? -1 : undefined}
      aria-hidden={ghost ? true : undefined}
      className={linkClass}
    >
      {inner}
    </a>
  );
}

export function CategoryCarousel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sectionRef = useRef<HTMLElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  // Keep --carousel-h in sync
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const update = () =>
      document.documentElement.style.setProperty("--carousel-h", `${el.getBoundingClientRect().height}px`);
    const ro = new ResizeObserver(update);
    ro.observe(el);
    update();
    return () => {
      ro.disconnect();
      document.documentElement.style.setProperty("--carousel-h", "0px");
    };
  }, []);

  // Touch: pause animation while finger is down, resume on lift
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const pause = () => track.style.animationPlayState = "paused";
    const resume = () => track.style.animationPlayState = "";
    track.addEventListener("touchstart", pause, { passive: true });
    track.addEventListener("touchend", resume, { passive: true });
    track.addEventListener("touchcancel", resume, { passive: true });
    return () => {
      track.removeEventListener("touchstart", pause);
      track.removeEventListener("touchend", resume);
      track.removeEventListener("touchcancel", resume);
    };
  }, []);

  return (
    <section ref={sectionRef} data-category-strip className="border-b bg-ivory-fade">
      {/* Desktop (≥ 768px): static evenly-spaced row — unchanged */}
      <div className="container-x hidden md:block">
        <div role="list" className="flex items-start justify-between py-[10px]">
          {items.map((item) => <ItemLink key={item.id} item={item} pathname={pathname} />)}
        </div>
      </div>

      {/* Mobile (< 768px): seamless marquee */}
      <div className="relative overflow-hidden md:hidden" style={{ maskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)", WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)" }}>
        <div
          ref={trackRef}
          role="list"
          className="cat-marquee-track flex items-start gap-3 py-[10px]"
        >
          {/* Primary copy */}
          {items.map((item) => <ItemLink key={item.id} item={item} pathname={pathname} />)}
          {/* Ghost copy — aria-hidden, for seamless loop */}
          {items.map((item) => <ItemLink key={`g-${item.id}`} item={item} pathname={pathname} ghost />)}
        </div>
      </div>
    </section>
  );
}
