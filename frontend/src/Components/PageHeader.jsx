import { Link, useLocation } from "react-router-dom";

const DEFAULT_BG =
  "https://images.unsplash.com/photo-1517960413843-0aee8e2b3285?auto=format&fit=crop&w=1600&q=80";

const PageHeader = ({
  title,
  subtitle,
  bgImage,
}) => {
  const location = useLocation();

  // Generate breadcrumbs from URL
  const pathnames = location.pathname
    .split("/")
    .filter((x) => x);

  return (
    <section
      className="relative h-[40vh] flex items-end justify-center"
      style={{
        backgroundImage: `url(${bgImage || DEFAULT_BG})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" />

      {/* CONTENT */}
      <div className="relative z-10 text-center px-6 text-white">

        {/* TITLE */}
        <h1 className="text-4xl md:text-[52px] small-caps  font-extrabold tracking-widest text-red-500">
          {title}
        </h1>

        {/* SUBTITLE */}
        {/* {subtitle && (
          <p className="mt-4 text-white/70 max-w-2xl mx-auto">
            {subtitle}
          </p>
        )} */}

        {/* BREADCRUMBS */}
        <div className="mt-6 pb-10 flex items-center justify-center flex-wrap gap-2 text-sm tracking-widest text-white/80">
          <Link
            to="/"
            className="hover:text-red-500 transition"
          >
            HOME
          </Link>

          {pathnames.map((value, index) => {
            const to = `/${pathnames.slice(0, index + 1).join("/")}`;
            const isLast = index === pathnames.length - 1;

            return (
              <span key={to} className="flex items-center gap-2">
                <span className="text-red-500">/</span>
                {isLast ? (
                  <span className="text-red-500 uppercase">
                    {value.replace("-", " ")}
                  </span>
                ) : (
                  <Link
                    to={to}
                    className="hover:text-red-500 transition uppercase"
                  >
                    {value.replace("-", " ")}
                  </Link>
                )}
              </span>
            );
          })}
        </div>

      </div>
    </section>
  );
};

export default PageHeader;