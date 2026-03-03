import React from "react";

// A simple header component that shows a background image with an optional
// title and subtitle centered in front of a semi-transparent overlay.
// Used by several pages (products list, cart, product details, etc.).
export default function PageHeader({ title, subtitle, bgImage }) {
  return (
    <div
      className="w-full h-60 sm:h-72 md:h-80 lg:h-96 bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-black/50 p-6 rounded-lg text-center max-w-2xl">
        {title && <h1 className="text-3xl sm:text-4xl font-bold text-white">{title}</h1>}
        {subtitle && <p className="mt-2 text-lg sm:text-xl text-white/90">{subtitle}</p>}
      </div>
    </div>
  );
}
