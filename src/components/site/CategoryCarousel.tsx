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

export function CategoryCarousel() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const sectionRef = useRef<HTMLElement>(null);

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

  return (
    <section ref={sectionRef} data-category-strip className="border-b bg-ivory-fade">
      <div className="container-x">
        <div
          role="list"
          className="no-scrollbar flex snap-x snap-mandatory items-start overflow-x-auto py-[10px] gap-3 lg:snap-none lg:gap-0 lg:justify-between"
        >
          {items.map((item) => {
            const isActive = item.slug
              ? pathname === `/category/${item.slug}`
              : false;

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

            if (item.slug) {
              return (
                <Link
                  key={item.id}
                  to="/category/$slug"
                  params={{ slug: item.slug }}
                  role="listitem"
                  className="group flex w-[140px] shrink-0 snap-start flex-col items-center lg:w-auto lg:flex-1"
                >
                  {inner}
                </Link>
              );
            }

            return (
              <a
                key={item.id}
                href={item.href}
                role="listitem"
                className="group flex w-[140px] shrink-0 snap-start flex-col items-center lg:w-auto lg:flex-1"
              >
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
