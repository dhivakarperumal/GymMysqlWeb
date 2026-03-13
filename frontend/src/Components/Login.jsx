import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import api from "../api";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "../PrivateRouter/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

const Login = () => {
  const [identifier, setIdentifier] = useState(""); // email OR username
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  // 🔹 Redirect by role
  const redirectByRole = (role) => {
    if (role === "admin") {
      navigate("/admin");
    } else if (role === "trainer") {
      navigate("/trainer");
    } else {
      navigate("/");
    }
  };

  const { login: contextLogin } = useAuth();

  const handleLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      // if password empty and identifier looks like a phone number, auto-fill password
      let loginPassword = password;
      if (!loginPassword && /^\d+$/.test(identifier)) {
        loginPassword = identifier;
      }
      const res = await api.post("/auth/login", {
        identifier,
        password: loginPassword,
      });

      const userData = res.data.user;
      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(userData));

      // update context too
      contextLogin(userData, res.data.token);

      redirectByRole(userData.role);
    } catch (err) {
      toast.error(err?.response?.data?.message || err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);

      const googleUser = {
        name: decoded.name,
        email: decoded.email,
        picture: decoded.picture,
        googleId: decoded.sub
      };

      // send to backend
      const res = await api.post(
        "/auth/google-login",
        googleUser
      );

      login(res.data.user, res.data.token);

      toast.success("Google Login Successful!");

      if (res.data.user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }

    } catch (error) {
      console.error("Google Login Error:", error);
      toast.error(error.response?.data?.message || error.message || "Google Login Failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-black via-gray-900 to-black px-4">
      <div className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 
                      bg-black/70 backdrop-blur-xl border border-gray-800 
                      rounded-3xl shadow-2xl overflow-hidden">

        {/* LEFT – BRAND */}
        <div className="hidden md:flex flex-col justify-center px-12 
                        bg-gradient-to-br from-red-600 to-orange-500 text-white">

          <h1 className="text-4xl font-extrabold mb-4 tracking-wide">
            POWER GYM
          </h1>

          <p className="text-lg text-red-100 leading-relaxed">
            Train harder. Track progress. Become unstoppable 💪
          </p>

          <ul className="mt-8 space-y-3 text-red-100 font-medium">
            <li>✔ Personal workout plans</li>
            <li>✔ Membership & attendance</li>
            <li>✔ Progress tracking</li>
          </ul>
        </div>

        {/* RIGHT – FORM */}
        <div className="flex items-center justify-center px-6 py-10">
          <div className="w-full max-w-md">

            <h2 className="text-3xl font-bold text-center text-white mb-2">
              Member Login
            </h2>

            <p className="text-center text-gray-400 mb-6">
              Enter your credentials to continue
            </p>

            {/* FORM */}
            <form onSubmit={handleLogin} className="space-y-4">

              {/* EMAIL / USERNAME */}
              <input
                type="text"
                placeholder="Email, Username or Phone"
                className="w-full bg-gray-900 text-white border border-gray-700 
                           p-3 rounded-lg focus:outline-none 
                           focus:ring-2 focus:ring-red-500"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
              />

              {/* PASSWORD */}
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  className="w-full bg-gray-900 text-white border border-gray-700 
                             p-3 pr-12 rounded-lg focus:outline-none 
                             focus:ring-2 focus:ring-red-500"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center 
                             text-gray-400 hover:text-red-500 cursor-pointer"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>

              {/* LOGIN */}
              <button
                disabled={loading}
                className="w-full bg-gradient-to-r from-red-600 to-orange-500 
                           text-white py-3 rounded-lg font-bold tracking-wide 
                           hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>

            <div className="flex justify-center">
              <GoogleLogin
                onSuccess={handleSuccess}
                onError={() => console.log("Login Failed")}
              />
            </div>

            <p className="text-sm mt-5 text-center text-gray-400">
              New member? <Link to="/register" className="text-red-500 font-semibold hover:underline">Join Now</Link>
            </p>

            <p className="text-sm mt-5 text-center text-gray-400">
              <Link to="/" className="text-red-500 font-semibold hover:underline">Back to Home</Link>
            </p>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;



