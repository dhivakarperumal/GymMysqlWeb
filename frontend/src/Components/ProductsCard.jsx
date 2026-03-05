import { FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

const getProductPricing = (product) => {
  if (!product) return null;

  // 🥤 Food products (price inside stock)
  if (product.stock) {
    const stockValues = Object.values(product.stock);
    if (stockValues.length) {
      const stock = stockValues[0];

      if (stock.mrp || stock.offerPrice) {
        return {
          mrp: stock.mrp ?? stock.offerPrice,
          offerPrice: stock.offerPrice ?? stock.mrp,
          offer: stock.offer || 0,
        };
      }
    }
  }

  // 👕 Dress / Accessories (product level)
  if (product.mrp || product.offerPrice) {
    return {
      mrp: product.mrp ?? product.offerPrice,
      offerPrice: product.offerPrice ?? product.mrp,
      offer: product.offer || 0,
    };
  }

  // 🆕 API structure you used in addToCart
  const price =
    Number(product.offer_price ?? product.mrp ?? product.offerPrice ?? product.price ?? 0) ||
    0;

  if (price) {
    return {
      mrp: price,
      offerPrice: price,
      offer: 0,
    };
  }

  return null;
};

export default function ProductCard({ product, index = 0 }) {
  const navigate = useNavigate();

  const pricing = getProductPricing(product);

  const goToDetails = () => {
    navigate(`/products/${product.id}`);
  };

  return (
    <div
      data-aos="fade-up"
      data-aos-delay={index * 120}
      className="
        relative h-full flex flex-col
        bg-gradient-to-br from-[#0e1016] via-black to-[#0e1016]
        border-2 border-red-500/60 rounded-3xl overflow-hidden
        shadow-[0_0_45px_rgba(255,0,0,0.15)]
        hover:shadow-[0_0_80px_rgba(255,0,0,0.35)]
        hover:-translate-y-1
        transition-all duration-500
        group
      "
    >
      {/* glow overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-transparent via-red-500/5 to-transparent pointer-events-none" />

      {/* IMAGE */}
      <div className="h-50 md:h-55 flex items-center justify-center bg-black overflow-hidden relative">
        <div className="absolute inset-0 bg-red-500/10 blur-2xl" />

        <img
          onClick={goToDetails}
          src={
            product.images?.[0] ||
            "https://via.placeholder.com/300x300?text=No+Image"
          }
          alt={product.name}
          className="
    cursor-pointer
    relative z-10
    w-full h-full object-cover 
    group-hover:scale-105 transition duration-700
  "
        />
      </div>

      <div className="h-[1px] w-full bg-gradient-to-r from-transparent via-red-500/90 to-transparent" />

      {/* CONTENT */}
      <div className="p-5 flex flex-col flex-1">
        <h3
          onClick={goToDetails}
          className="
    cursor-pointer
    text-lg font-semibold text-red-500 tracking-wide mb-1 line-clamp-1
    hover:text-red-400 transition
  "
        >
          {product.name}
        </h3>

        <p className="text-[11px] font-medium uppercase tracking-widest text-white/70 mb-4 line-clamp-1">
          {product.category}
          {product.subcategory && ` • ${product.subcategory}`}
        </p>

        {/* PRICE ROW */}
        {/* PRICE */}
        <div className="flex items-center gap-3 mb-4">
          {pricing ? (
            <>
              <span className="text-xl font-bold text-white">
                ₹{pricing.offerPrice}
              </span>

              <span className="text-sm line-through text-white/60">
                ₹{pricing.mrp}
              </span>

              {pricing.offer > 0 && (
                <span className="text-[10px] px-2 py-[2px] rounded-full bg-green-500/20 text-green-400">
                  {pricing.offer}% OFF
                </span>
              )}
            </>
          ) : (
            <span className="text-sm text-gray-400">Price unavailable</span>
          )}
        </div>

        {/* PUSH BUTTON TO BOTTOM */}
        <div className="mt-auto">
          <button
            onClick={goToDetails}
            className="
      w-full py-2 rounded-xl
      text-sm font-semibold tracking-wider
     bg-gradient-to-r from-red-600 to-orange-500 text-white
              shadow-[0_0_20px_rgba(255,0,0,.4)] cursor-pointer
      hover:scale-105 transition
    "
          >
            VIEW DETAILS
          </button>
        </div>
      </div>
    </div>
  );
}
