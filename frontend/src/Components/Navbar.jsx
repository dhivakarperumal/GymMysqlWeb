import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuth } from "../PrivateRouter/AuthContext";
import api from "../api";
import { ShoppingCart } from "lucide-react";

const Navbar = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [cartCount, setCartCount] = useState(0);

  // user comes from AuthContext; we no longer decode token here
  // effect not needed except possibly to fetch cart below

  useEffect(() => {
    async function fetchCart() {
      if (!user?.id) return;
      try {
        const res = await api.get('/cart', { params: { userId: user.id } });
        const items = Array.isArray(res.data) ? res.data : [];
        const totalQty = items.reduce((a, c) => a + c.quantity, 0);
        setCartCount(totalQty);
      } catch (err) {
        console.error('Navbar cart fetch', err);
      }
    }
    fetchCart();
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const userInitial = user?.email?.[0]?.toUpperCase();

  return (
    <nav className="bg-black text-white px-6 py-3 flex justify-between items-center">
      {/* LEFT */}
      <Link to="/" className="text-xl font-bold text-red-500">
        Power Gym 💪
      </Link>
      <Link to="/products" className="hover:text-red-400 ml-6">
        Products
      </Link>

      {/* RIGHT */}
      <div className="flex items-center gap-6">
        {/* <Link to="/" className="hover:text-red-400">
          Home
        </Link> */}

        

        {user?.role === "admin" && (
          <Link to="/admin" className="hover:text-red-400">
            Admin
          </Link>
        )}

        {!user ? (
          <Link
            to="/login"
            className="bg-red-600 px-4 py-1 rounded-lg hover:bg-red-700"
          >
            Login
          </Link>
        ) : (
          <>
            <Link to="/cart" className="relative">
              <ShoppingCart size={20} className="hover:text-red-400" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center font-bold">
                {userInitial}
              </div>

              <button
                onClick={handleLogout}
                className="bg-gray-800 px-3 py-1 rounded-lg hover:bg-gray-700"
              >
                Logout
              </button>
            </div>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;