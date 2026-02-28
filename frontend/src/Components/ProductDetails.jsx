// import React, { useEffect, useState } from "react";
// import { useParams, useNavigate } from "react-router-dom";
// import {
//   doc,
//   getDoc,
//   collection,
//   addDoc,
//   getDocs,
//   updateDoc,
// } from "firebase/firestore";
// import { db } from "../firebase";
// import PageContainer from "./PageContainer";
// import PageHeader from "./PageHeader";
// import { auth } from "../firebase";

// export default function ProductDetails() {
//   const { id } = useParams();
//   const navigate = useNavigate();
//   const userId = auth.currentUser?.uid;

//   const [product, setProduct] = useState(null);
//   const [selectedImage, setSelectedImage] = useState(null);
//   const [loading, setLoading] = useState(true);

//   const [selectedWeight, setSelectedWeight] = useState(null);
//   const [selectedSize, setSelectedSize] = useState(null);
//   const [selectedGender, setSelectedGender] = useState(null);
//   const [quantity, setQuantity] = useState(1);
//   const [cartQuantity, setCartQuantity] = useState(0);

//   // ---------- CURRENT VARIANT ----------
//   const variantKey =
//     product?.category === "Food"
//       ? selectedWeight
//       : selectedSize && selectedGender
//         ? `${selectedSize}-${selectedGender}`
//         : null;

//   const currentVariant = variantKey ? product?.stock?.[variantKey] : null;

//   const pricing = (() => {
//     if (!currentVariant) return null;

//     // 🥤 FOOD → price inside stock
//     if (product.category === "Food") {
//       return {
//         mrp: currentVariant.mrp,
//         offerPrice: currentVariant.offerPrice,
//         offer: currentVariant.offer || 0,
//       };
//     }

//     // 👕 DRESS / ACCESSORIES → price at product level
//     if (product.mrp && product.offerPrice) {
//       return {
//         mrp: product.mrp,
//         offerPrice: product.offerPrice,
//         offer: product.offer || 0,
//       };
//     }

//     return null;
//   })();

//   useEffect(() => {
//     const fetchProduct = async () => {
//       try {
//         const ref = doc(db, "products", id);
//         const snap = await getDoc(ref);

//         if (snap.exists()) {
//           const data = { id: snap.id, ...snap.data() };
//           setProduct(data);
//           setSelectedImage(data.images?.[0] || null);

//           if (data.weight?.length) setSelectedWeight(data.weight[0]);
//           if (data.size?.length) setSelectedSize(data.size[0]);
//           if (data.gender?.length) setSelectedGender(data.gender[0]);
//         }
//       } catch (err) {
//         console.error(err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchProduct();
//   }, [id]);

//   useEffect(() => {
//     if (!product || !userId) return;

//     const fetchCartQuantity = async () => {
//       const snap = await getDocs(collection(db, "users", userId, "cart"));

//       const existing = snap.docs.find(
//         (d) =>
//           d.data().productId === product.id &&
//           d.data().size === (selectedSize || null) &&
//           d.data().gender === (selectedGender || null) &&
//           d.data().weight === (selectedWeight || null),
//       );

//       setCartQuantity(existing ? existing.data().quantity : 0);
//     };

//     fetchCartQuantity();
//   }, [product, selectedSize, selectedGender, selectedWeight, userId]);

//   if (loading)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black text-red-500 tracking-widest">
//         LOADING PRODUCT...
//       </div>
//     );

//   if (!product)
//     return (
//       <div className="min-h-screen flex items-center justify-center bg-black text-white">
//         Product not found
//       </div>
//     );

//   const stockKey =
//     selectedSize && selectedGender ? `${selectedSize}-${selectedGender}` : null;

//   const totalStock =
//     product.category === "Food"
//       ? product.stock?.[selectedWeight] || 0
//       : stockKey
//         ? product.stock?.[stockKey] || 0
//         : 0;

//   const availableStock = currentVariant?.qty ?? 0;
//   const remainingStock = Math.max(availableStock - cartQuantity, 0);

//   return (
//     <div className="bg-black text-white">
//       <PageHeader
//         title="Product Details"
//         subtitle="World-class gym equipment & training zones"
//         bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
//       />
//       <PageContainer>
//         <div className="flex flex-col lg:flex-row gap-10 py-15">

//           {/* LEFT - STICKY */}
//           <div className="lg:w-1/2 w-full">
//             <div className="sticky top-28">
//              <div className="flex flex-col items-center">

//   {/* IMAGE CARD */}
//   <div className="w-full max-w-md bg-gradient-to-br from-[#0e1016] via-black to-[#0e1016]
//     rounded-3xl p-6 border border-red-500/40
//     shadow-[0_0_40px_rgba(255,0,0,0.2)]">

//     <div className="flex items-center justify-center">
//       <img
//         src={selectedImage || product.images?.[0]}
//         alt={product.name}
//         className="h-[400px] w-auto object-contain"
//       />
//     </div>

//   </div>

//   {/* THUMBNAILS BELOW CARD */}
//   {product.images?.length > 1 && (
//     <div className="flex gap-3 mt-4">
//       {product.images.map((img, idx) => (
//         <img
//           key={idx}
//           src={img}
//           onClick={() => setSelectedImage(img)}
//           className={`
//             w-14 h-14 object-contain rounded-xl cursor-pointer border
//             transition-all duration-200
//             ${selectedImage === img
//               ? "border-red-500 ring-2 ring-red-500/60"
//               : "border-gray-600 hover:border-red-400"}
//           `}
//         />
//       ))}
//     </div>
//   )}

// </div>
//             </div>
//           </div>

//           {/* RIGHT - SCROLL */}
//           <div className="lg:w-1/2 w-full flex flex-col p-5">
//             <h1 className="text-3xl md:text-4xl font-bold text-red-500 mb-2 ">
//               {product.name}
//             </h1>

//             <p className="uppercase tracking-widest text-white/80 mb-5 text-xs font-medium">
//               {product.category}
//             </p>

//             {/* PRICE CARD */}
//             <div className="flex items-center gap-4 mb-4 bg-[#0e1016] p-3 rounded-2xl border border-red-500/30 shadow">
//               {pricing ? (
//                 <>
//                   <span className="text-3xl font-bold">
//                     ₹{pricing.offerPrice}
//                   </span>

//                   <span className="line-through text-white/40">
//                     ₹{pricing.mrp}
//                   </span>

//                   {pricing.offer > 0 && (
//                     <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
//                       {pricing.offer}% OFF
//                     </span>
//                   )}
//                 </>
//               ) : (
//                 <span className="text-white/60">Select variant</span>
//               )}
//             </div>

//             {/* FOOD */}
//             {product.category === "Food" && (
//               <div className="space-y-5 mb-8">
//                 <p className="text-red-500 text-sm">Select Weight :</p>

//                 <div className="flex gap-3 flex-wrap">
//                   {product.weight?.map((w) => (
//                     <button
//                       key={w}
//                       onClick={() => setSelectedWeight(w)}
//                       className={`px-5 py-1 rounded-full border text-md tracking-wide transition
//                         ${selectedWeight === w
//                           ? "bg-red-600 border-red-600"
//                           : "border-white/30 hover:border-red-500"
//                         }`}
//                     >
//                       {w}
//                     </button>
//                   ))}
//                 </div>

//                 <p className="inline-block text-md px-4 py-2 rounded-full text-red-500 ">
//                   Stock :{" "}
//                   <span className="text-white">
//                     {currentVariant?.qty ?? 0}{" "}
//                   </span>
//                 </p>
//               </div>
//             )}

//             {/* DRESS / ACCESSORIES */}
//             {(product.category === "Dress" ||
//               product.category === "Accessories") && (
//                 <div className="space-y-6 mb-8">
//                   <div>
//                     <p className="text-red-500 mb-2 text-md">Size</p>
//                     <div className="flex gap-3 flex-wrap">
//                       {product.size?.map((s) => (
//                         <button
//                           key={s}
//                           onClick={() => setSelectedSize(s)}
//                           className={`px-5 py-1 rounded-full border transition
//                           ${selectedSize === s
//                               ? "bg-red-600 border-red-600"
//                               : "border-white/30 hover:border-red-500"
//                             }`}
//                         >
//                           {s}
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   <div>
//                     <p className="text-red-500 mb-2 text-sm">Gender</p>
//                     <div className="flex gap-3 flex-wrap">
//                       {product.gender?.map((g) => (
//                         <button
//                           key={g}
//                           onClick={() => setSelectedGender(g)}
//                           className={`px-5 py-1 rounded-full border transition
//                           ${selectedGender === g
//                               ? "bg-red-600 border-red-600"
//                               : "border-white/30 hover:border-red-500"
//                             }`}
//                         >
//                           {g}
//                         </button>
//                       ))}
//                     </div>
//                   </div>

//                   <p className="inline-block text-md px-4 rounded-full text-red-500">
//                     Stock:{" "}
//                     <span className="text-white">{currentVariant?.qty ?? 0}</span>
//                   </p>
//                 </div>
//               )}

//             <p className="text-red-500 leading-relaxed mb-5">
//               Description :{" "}
//               <span className="text-white">
//                 {product.description || "No description available."}
//               </span>
//             </p>

//             {/* QUANTITY */}
//             <div className="flex items-center gap-4 mb-5">
//               <span className="text-red-500 tracking-widest text-sm">
//                 QUANTITY
//               </span>

//               <div className="flex items-center border border-red-500/40 rounded-full overflow-hidden">
//                 <button
//                   onClick={() => setQuantity((q) => Math.max(1, q - 1))}
//                   className="px-4 py-2 hover:bg-red-600 transition"
//                 >
//                   −
//                 </button>

//                 <span className="px-6 py-2 border-x border-red-500/40">
//                   {quantity}
//                 </span>

//                 <button
//                   onClick={() =>
//                     setQuantity((q) => Math.min(q + 1, remainingStock))
//                   }
//                   className="px-4 py-2 hover:bg-red-600 transition"
//                 >
//                   +
//                 </button>
//               </div>
//             </div>

//             {/* CTA */}
//             <div className="flex gap-4 flex-col sm:flex-row ">
//               <button
//                 disabled={remainingStock === 0 || quantity > remainingStock}
//                 onClick={async () => {
//                   if (quantity > remainingStock) {
//                     alert(`Only ${remainingStock} items available`);
//                     return;
//                   }

//                   const cartRef = collection(db, "users", userId, "cart");
//                   const snap = await getDocs(cartRef);

//                   const existing = snap.docs.find(
//                     (d) =>
//                       d.data().productId === product.id &&
//                       d.data().size === (selectedSize || null) &&
//                       d.data().gender === (selectedGender || null) &&
//                       d.data().weight === (selectedWeight || null),
//                   );

//                   if (existing) {
//                     await updateDoc(
//                       doc(db, "users", userId, "cart", existing.id),
//                       { quantity: existing.data().quantity + quantity },
//                     );
//                   } else {
//                     await addDoc(cartRef, {
//                       productId: product.id,
//                       name: product.name,
//                       image: product.images?.[0],
//                       price: pricing.offerPrice,
//                       quantity,
//                       size: selectedSize || null,
//                       gender: selectedGender || null,
//                       weight: selectedWeight || null,
//                       createdAt: new Date(),
//                     });
//                   }

//                   navigate("/cart");
//                 }}
//                 className={`flex-1 py-4 rounded-full tracking-widest text-sm transition cursor-pointer
//   ${remainingStock === 0
//                     ? "bg-gray-600 cursor-not-allowed"
//                     : "bg-gradient-to-r from-[#eb613e] to-red-700 shadow-[0_0_40px_rgba(255,0,0,0.6)] hover:scale-105"
//                   }
// `}
//               >
//                 ADD TO CART
//               </button>

//               <button
//                 disabled={remainingStock === 0 || quantity > remainingStock}
//                 onClick={async () => {
//                   if (quantity > remainingStock) {
//                     alert(`Only ${remainingStock} items available`);
//                     return;
//                   }

//                   navigate("/checkout", {
//                     state: {
//                       buyNowItem: {
//                         productId: product.id,
//                         name: product.name,
//                         image: product.images?.[0],
//                         price: pricing.offerPrice,
//                         quantity,
//                         size: selectedSize || null,
//                         gender: selectedGender || null,
//                         weight: selectedWeight || null,
//                       },
//                     },
//                   });
//                 }}
//                 className={`flex-1 border border-red-500 py-4 rounded-full tracking-widest text-sm transition
//     ${remainingStock === 0
//                     ? "bg-gray-600 cursor-not-allowed"
//                     : "hover:bg-red-600 hover:scale-105 cursor-pointer"
//                   }
//   `}
//               >
//                 BUY NOW
//               </button>
//             </div>
//           </div>

//         </div>
//       </PageContainer>
//     </div>
//   );
// }


import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  doc,
  getDoc,
  collection,
  addDoc,
  getDocs,
  updateDoc,
} from "firebase/firestore";
import { db, auth } from "../firebase";
import PageContainer from "./PageContainer";
import PageHeader from "./PageHeader";

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const userId = auth.currentUser?.uid;

  const [product, setProduct] = useState(null);
  const [selectedImage, setSelectedImage] = useState(null);
  const [loading, setLoading] = useState(true);

  const [selectedWeight, setSelectedWeight] = useState(null);
  const [selectedSize, setSelectedSize] = useState(null);
  const [selectedGender, setSelectedGender] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [cartQuantity, setCartQuantity] = useState(0);

  // 🔍 ZOOM STATE
  const [zoomStyle, setZoomStyle] = useState({});
  const [showZoom, setShowZoom] = useState(false);

  // ---------- CURRENT VARIANT ----------
  const variantKey =
    product?.category === "Food"
      ? selectedWeight
      : selectedSize && selectedGender
        ? `${selectedSize}-${selectedGender}`
        : null;

  const currentVariant = variantKey ? product?.stock?.[variantKey] : null;

  const pricing = (() => {
    if (!currentVariant) return null;

    if (product.category === "Food") {
      return {
        mrp: currentVariant.mrp,
        offerPrice: currentVariant.offerPrice,
        offer: currentVariant.offer || 0,
      };
    }

    if (product.mrp && product.offerPrice) {
      return {
        mrp: product.mrp,
        offerPrice: product.offerPrice,
        offer: product.offer || 0,
      };
    }

    return null;
  })();

  // 🔍 ZOOM HANDLERS
  const handleMouseMove = (e) => {
    const { left, top, width, height } = e.target.getBoundingClientRect();

    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    setZoomStyle({
      backgroundImage: `url(${selectedImage || product.images?.[0]})`,
      backgroundPosition: `${x}% ${y}%`,
      backgroundSize: "200%",
      backgroundRepeat: "no-repeat",
    });
  };

  const handleMouseEnter = () => setShowZoom(true);
  const handleMouseLeave = () => setShowZoom(false);

  // ---------- FETCH PRODUCT ----------
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const ref = doc(db, "products", id);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = { id: snap.id, ...snap.data() };
          setProduct(data);
          setSelectedImage(data.images?.[0] || null);

          if (data.weight?.length) setSelectedWeight(data.weight[0]);
          if (data.size?.length) setSelectedSize(data.size[0]);
          if (data.gender?.length) setSelectedGender(data.gender[0]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  // ---------- FETCH CART QUANTITY ----------
  useEffect(() => {
    if (!product || !userId) return;

    const fetchCartQuantity = async () => {
      const snap = await getDocs(collection(db, "users", userId, "cart"));

      const existing = snap.docs.find(
        (d) =>
          d.data().productId === product.id &&
          d.data().size === (selectedSize || null) &&
          d.data().gender === (selectedGender || null) &&
          d.data().weight === (selectedWeight || null)
      );

      setCartQuantity(existing ? existing.data().quantity : 0);
    };

    fetchCartQuantity();
  }, [product, selectedSize, selectedGender, selectedWeight, userId]);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-red-500 tracking-widest">
        LOADING PRODUCT...
      </div>
    );

  if (!product)
    return (
      <div className="min-h-screen flex items-center justify-center bg-black text-white">
        Product not found
      </div>
    );

  const availableStock = currentVariant?.qty ?? 0;
  const remainingStock = Math.max(availableStock - cartQuantity, 0);

  return (
    <div className="bg-black text-white">
      <PageHeader
        title="Product Details"
        subtitle="World-class gym equipment & training zones"
        bgImage="https://images.unsplash.com/photo-1571902943202-507ec2618e8f"
      />

      <PageContainer>
        <div className="flex flex-col lg:flex-row gap-10 py-15">

          {/* LEFT - IMAGE + ZOOM */}
          <div className="lg:w-1/2 w-full">
            <div className="sticky top-28">
              <div className="flex flex-col items-center">

                <div className="relative w-full max-w-md bg-gradient-to-br from-[#0e1016] via-black to-[#0e1016]
                  rounded-3xl p-6 border border-red-500/40
                  shadow-[0_0_40px_rgba(255,0,0,0.2)]">

                  {/* IMAGE */}
                  <div className="relative flex items-center justify-center">
                    <img
                      src={selectedImage || product.images?.[0]}
                      alt={product.name}
                      className="h-[450px] w-auto object-contain"
                      onMouseMove={handleMouseMove}
                      onMouseEnter={handleMouseEnter}
                      onMouseLeave={handleMouseLeave}
                    />

                    {/* 🔍 ZOOM BOX RIGHT */}
                    {showZoom && (
                      <div
                        className="hidden lg:block absolute left-full ml-10 top-1/2 -translate-y-1/2 w-[500px] h-[550px] rounded-2xl border border-red-500 shadow-[0_0_30px_rgba(255,0,0,0.4)]"
                        style={zoomStyle}
                      />
                    )}

                  </div>
                </div>

                {/* THUMBNAILS */}
                {product.images?.length > 1 && (
                  <div className="flex gap-3 mt-4">
                    {product.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img}
                        onClick={() => setSelectedImage(img)}
                        className={`w-14 h-14 object-contain rounded-xl cursor-pointer border
                        ${selectedImage === img
                            ? "border-red-500 ring-2 ring-red-500/60"
                            : "border-gray-600 hover:border-red-400"
                          }`}
                      />
                    ))}
                  </div>
                )}

              </div>
            </div>
          </div>

          {/* RIGHT SIDE (UNCHANGED UI) */}
          <div className="lg:w-1/2 w-full flex flex-col p-5">
            <h1 className="text-3xl md:text-4xl font-bold text-red-500 mb-2">
              {product.name}
            </h1>

            <p className="uppercase tracking-widest text-white/80 mb-5 text-xs font-medium">
              {product.category}
            </p>

            {/* PRICE */}
            <div className="flex items-center gap-4 mb-4 bg-[#0e1016] p-3 rounded-2xl border border-red-500/30 shadow">
              {pricing ? (
                <>
                  <span className="text-3xl font-bold">
                    ₹{pricing.offerPrice}
                  </span>
                  <span className="line-through text-white/40">
                    ₹{pricing.mrp}
                  </span>
                  {pricing.offer > 0 && (
                    <span className="text-xs px-3 py-1 rounded-full bg-green-500/20 text-green-400">
                      {pricing.offer}% OFF
                    </span>
                  )}
                </>
              ) : (
                <span className="text-white/60">Select variant</span>
              )}
            </div>

            {/* DESCRIPTION */}
            <p className="text-red-500 leading-relaxed mb-5">
              Description :
              <span className="text-white">
                {product.description || "No description available."}
              </span>
            </p>

            {/* QUANTITY */}
            <div className="flex items-center gap-4 mb-5">
              <span className="text-red-500 tracking-widest text-sm">
                QUANTITY
              </span>

              <div className="flex items-center border border-red-500/40 rounded-full overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-4 py-2 hover:bg-red-600"
                >
                  −
                </button>

                <span className="px-6 py-2 border-x border-red-500/40">
                  {quantity}
                </span>

                <button
                  onClick={() =>
                    setQuantity((q) => Math.min(q + 1, remainingStock))
                  }
                  className="px-4 py-2 hover:bg-red-600"
                >
                  +
                </button>
              </div>
            </div>

            {/* BUTTONS */}
            <div className="flex gap-4 flex-col sm:flex-row">
              <button
                disabled={remainingStock === 0}
                onClick={() => navigate("/cart")}
                className="flex-1 py-4 rounded-full bg-gradient-to-r from-[#eb613e] to-red-700 shadow hover:scale-105"
              >
                ADD TO CART
              </button>

              <button
                disabled={remainingStock === 0}
                onClick={() =>
                  navigate("/checkout", {
                    state: {
                      buyNowItem: {
                        productId: product.id,
                        name: product.name,
                        image: product.images?.[0],
                        price: pricing?.offerPrice,
                        quantity,
                        size: selectedSize || null,
                        gender: selectedGender || null,
                        weight: selectedWeight || null,
                      },
                    },
                  })
                }
                className="flex-1 border border-red-500 py-4 rounded-full hover:bg-red-600 hover:scale-105"
              >
                BUY NOW
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </div>
  );
}
