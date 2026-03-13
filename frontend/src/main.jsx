// import { StrictMode } from "react";
// import { createRoot } from "react-dom/client";
// import "./index.css";
// import App from "./App.jsx";
// import { createBrowserRouter, RouterProvider } from "react-router-dom";
// import Home from "./Home/Home.jsx";
// import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
// import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";

// import { Toaster, toast } from "react-hot-toast";
// import Login from "./Components/Login.jsx";
// import Register from "./Components/Register.jsx";
// import Products from "./Pages/Products.jsx";
// import ProductDetails from "./Components/ProductDetails.jsx";
// import Cart from "./Components/Cart.jsx";


// // // Admin
// import AdminPanel from "./Admin/AdminPanel.jsx";
// import Dashboard from "./Admin/Dashboard/Dashboard.jsx";

// import Billings  from "./Admin/Billing/Billins.jsx";
// import Equipment from "./Admin/Equipment/Equipment.jsx";
// import Reports from "./Admin/Reports/Reports.jsx";
// import Settings from "./Admin/Settingss/Settings.jsx"



// import AddEditEquipment from "./Admin/Equipment/AddEquipments.jsx";
// import ViewEquipment from "./Admin/Equipment/ViewEquipment.jsx";
// import ProfileSettings from "./Admin/Settingss/ProfileSettings.jsx";

// // import BillingSettings from "./Admin/Settingss/BillingSettings.jsx";
// import UserManagement  from "./Admin/Settingss/UserManagement.jsx";

// import Staffs from "./Admin/Staff/Staffs.jsx";
// import AddEditStaff from "./Admin/Staff/AddStaff.jsx";
// import ViewStaff from "./Admin/Staff/ViewStaff.jsx";
// import Users from "./Admin/Users/Users.jsx";

// import ReviewsSettings from "./Admin/Settingss/Review.jsx";




// import OverallAttendance from "./Admin/Attendance/OverallAttendance.jsx";
// import AllProducts from "./Admin/Products/AllProducts.jsx";
// import AddProducts from "./Admin/Products/AddProducts.jsx";
// import AllOrders from "./Admin/Orders/All Orders.jsx";
// import Members from "./Admin/Members/Members.jsx"
// import AddMember from "./Admin/Members/AddMembers.jsx";
// import AddStock from "./Admin/Products/AddStock.jsx";
// import StockDetails from "./Admin/Products/Stockdetails.jsx";
// import PlansAll from "./Admin/Plans/PlansPage.jsx";
// import AddEditGymPlan from "./Admin/Plans/AddPlans.jsx";
// import AddEditFacility from "./Admin/Fecilieties/Addfecilities.jsx";
// import FacilitiesAll from "./Admin/Fecilieties/Fecilitiesall.jsx";
// import ServicesList from "./Admin/Servicess/servicesAll.jsx";
// import AddServices from "./Admin/Servicess/AddService.jsx";
// import OrderDetails from "./Admin/Orders/OrderDetails.jsx";
// import ProductDetail from "./Admin/Products/ProductDetail.jsx";
// import MemberAttendance from "./Admin/Staff/Memberattendance.jsx";

// import BuyPlanadmin from "./Admin/Plans/BuyPlan.jsx";


// // Trainer Admin Panel
// import TrainerAdminPanel from "./TrainerAdminPanel/TrainerAdminPanel.jsx";
// import TrainerDashboard from "./TrainerAdminPanel/TrainerDashboard/TrainerDashboard.jsx";
// import Payments from "./Admin/Payments/Payments.jsx";
// import AddWorkout from "./TrainerAdminPanel/AddWrokouts/AddWorkout.jsx";
// import AllWorkouts from "./TrainerAdminPanel/AddWrokouts/AllWorkouts.jsx";
// import AddDietPlans from "./TrainerAdminPanel/DietPlans/AddDietPlans.jsx";
// import AllDietPlans from "./TrainerAdminPanel/DietPlans/AllDietPlans.jsx";
// import TrainerOverallAttendance from "./TrainerAdminPanel/TrainerAttendance/OverallAttendance.jsx";
// import TrainerReports from "./TrainerAdminPanel/TrainerReports/Reports.jsx";
// import AssingnedTrainers from "./Admin/Payments/AssingnedTrainers.jsx";
// import GymWorkoutManager from "./Admin/CommenWorkDiet/CommenWorkDiet.jsx";


// const router = createBrowserRouter([
//   {
//     path: "/",
//     element: <App />,
//     children: [
//       { path: "/", element: <Home /> },
//       { path: "/login", element: <Login /> },
//       { path: "/register", element: <Register /> },
//       { path: "/products", element: <Products /> },
//       { path: "/products/:id", element: <ProductDetails /> },
//       { path: "/cart", element: <Cart /> },
//     ],
// },




//   {
//     path: "/admin",
//     element: (
//       <PrivateRoute allowedRoles={["admin"]}>
//         <AdminPanel />
//       </PrivateRoute>
//     ),
//     children: [
//       { index: true, element: <Dashboard /> },
//       { path: "products", element: <AllProducts /> },
//       { path: "products/:id", element: <AllProducts /> },
//       { path: "productdetail/:id", element: <ProductDetail /> },
//       { path: "addproducts", element: <AddProducts /> },
//       { path: "addproducts/:id", element: <AddProducts /> },


//       { path: "stockdetails", element: <StockDetails /> },
//       { path: "add-stock", element: <AddStock /> },

//       { path: "orders", element: <AllOrders /> },
//       { path: "orders/:id", element: <OrderDetails /> },
//       { path: "members", element: <Members /> },
//       { path: "addmembers", element: <AddMember /> },
//       { path: "addmembers/:id", element: <AddMember /> },


//       { path: "billing", element: <Billings /> },


//       { path: "plansall", element: <PlansAll /> },
//       { path: "addplan", element: <AddEditGymPlan /> },
//       { path: "addplan/:id", element: <AddEditGymPlan /> },

//       { path: "fecilities", element: <FacilitiesAll /> },
//       { path: "addfecilities", element: <AddEditFacility /> },
//       { path: "addfecilities/:id", element: <AddEditFacility /> },




//       { path: "equipment", element: <Equipment /> },
//       { path: "addequipment", element: <AddEditEquipment /> },
//       { path: "addequipment/:id", element: <AddEditEquipment /> },
//       { path: "viewequipment/:id", element: <ViewEquipment /> },


//       { path: "reports", element: <Reports /> },
//       { path: "overall-attendance", element: <OverallAttendance /> },
//       { path: "users", element: <Users /> },
//       { path: "settings", element: <Settings /> },
//       { path: "settings/profile", element: <ProfileSettings /> },
//       { path: "settings/servicelist", element: <ServicesList /> },
//       { path: "addservice", element: <AddServices /> },
//       { path: "addservice/:id", element: <AddServices /> },

//       { path: "commenworkoutdiet", element: <GymWorkoutManager /> },


//       { path: "settings/usermanagement", element: <UserManagement /> },
//       { path: "settings/reviews", element: <ReviewsSettings /> },

//       { path: "staff", element: <Staffs /> },
//       { path: "addstaff", element: <AddEditStaff /> },
//       { path: "addstaff/:id", element: <AddEditStaff /> },
//       { path: "viewstaff/:id", element: <ViewStaff /> },
//       { path: "assignedtrainers", element: <AssingnedTrainers /> },
//       { path: "payments", element: <Payments /> },
//       { path: "buyplanadmin", element: <BuyPlanadmin /> },

//     ],
//   },


//   {
//     path: "/trainer",
//     element: (
//       <PrivateRoute allowedRoles={["trainer"]}>
//         <TrainerAdminPanel />
//       </PrivateRoute>
//     ),
//     children: [
//       { index: true, element: <TrainerDashboard /> },
//       { path: "reports", element: <TrainerReports /> },
//       { path: "overall-attendance", element: <TrainerOverallAttendance /> },
//       { path: "addworkouts", element: <AddWorkout /> },
//       { path: "addworkouts/:id", element: <AddWorkout /> },
//       { path: "alladdworkouts", element: <AllWorkouts /> },
//       { path: "adddietplans", element: <AddDietPlans /> },
//       { path: "adddietplans/:id", element: <AddDietPlans /> },
//       { path: "alladddietplans", element: <AllDietPlans /> },

//       { path: "settings", element: <Settings /> },
//       { path: "settings/profile", element: <ProfileSettings /> },



//       { path: "settings/usermanagement", element: <UserManagement /> },
//       { path: "settings/reviews", element: <ReviewsSettings /> },




//       { path: "member-attendance", element: <MemberAttendance /> },



//     ],
//   },

// //   { path: "/*", element: <NotFound /> },


// ])

// createRoot(document.getElementById("root")).render(
//   <StrictMode>
//       <AuthProvider>
//          {/* 🔔 GLOBAL TOASTER */}
//         <Toaster
//           position="top-left"
//           reverseOrder={false}
//           toastOptions={{
//             duration: 4000,
//             style: {
//               borderRadius: "12px",
//               background: "#0B3C8A",
//               color: "#fff",
//             },
//             success: {
//               iconTheme: {
//                 primary: "#7CB9FF",
//                 secondary: "#fff",
//               },
//             },
//             error: {
//               style: {
//                 background: "#DC2626",
//               },
//             },
//           }}
//         />
//         <RouterProvider router={router} />
//       </AuthProvider>
//     </StrictMode>
// );



import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Home from "./Home/Home.jsx";
import { AuthProvider } from "./PrivateRouter/AuthContext.jsx";
import PrivateRoute from "./PrivateRouter/PrivateRouter.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";

import { Toaster, toast } from "react-hot-toast";
import Login from "./Components/Login.jsx";
import Register from "./Components/Register.jsx";
import TrainerDetails from "./Components/TrainersDetails.jsx";
import Trainers from "./Components/Trainers.jsx";
import Facilities from "./Components/Facilities.jsx";
import FacilityDetail from "./Components/FacilityDetail.jsx";
import Pricing from "./Components/Pricing.jsx";

import BuyPlan from "./Components/BuyPlan.jsx";
import Products from "./Pages/Products.jsx";
import Services from "./Components/Services.jsx";
import ServicesDetails from "./Components/ServicesDetails.jsx";
import ProductDetails from "./Components/ProductDetails.jsx";
import Cart from "./Components/Cart.jsx";
import ClassesTable from "./Components/ClassesTable.jsx";
import Contact from "./Components/Contact.jsx";

import Account from "./Components/Account.jsx";
import Checkout from "./Components/Checkout.jsx";

// // Admin
import AdminPanel from "./Admin/AdminPanel.jsx";
import Dashboard from "./Admin/Dashboard/Dashboard.jsx";

import Billings from "./Admin/Billing/Billing.jsx";
import Equipment from "./Admin/Equipment/Equipment.jsx";
import Reports from "./Admin/Reports/Reports.jsx";
import Settings from "./Admin/Settingss/Settings.jsx"
import Enquiry from "./Admin/Enquiry/Enquiry.jsx";



import AddEditEquipment from "./Admin/Equipment/AddEquipments.jsx";
import ViewEquipment from "./Admin/Equipment/ViewEquipment.jsx";
import ProfileSettings from "./Admin/Settingss/ProfileSettings.jsx";

// import BillingSettings from "./Admin/Settingss/BillingSettings.jsx";
import UserManagement from "./Admin/Settingss/UserManagement.jsx";

import Staffs from "./Admin/Staff/Staffs.jsx";
import AddEditStaff from "./Admin/Staff/AddStaff.jsx";
import ViewStaff from "./Admin/Staff/ViewStaff.jsx";
import Users from "./Admin/Users/Users.jsx";

import ReviewsSettings from "./Admin/Settingss/Review.jsx";




import OverallAttendance from "./Admin/Attendance/OverallAttendance.jsx";
import AllProducts from "./Admin/Products/AllProducts.jsx";
import AddProducts from "./Admin/Products/AddProducts.jsx";
import AllOrders from "./Admin/Orders/All Orders.jsx";
import Members from "./Admin/Members/Members.jsx"
import AddMember from "./Admin/Members/AddMembers.jsx";
import AddStock from "./Admin/Products/AddStock.jsx";
import StockDetails from "./Admin/Products/Stockdetails.jsx";
import PlansAll from "./Admin/Plans/PlansPage.jsx";
import AddEditGymPlan from "./Admin/Plans/AddPlans.jsx";
import AddEditFacility from "./Admin/Fecilieties/Addfecilities.jsx";
import FacilitiesAll from "./Admin/Fecilieties/Fecilitiesall.jsx";
import ServicesList from "./Admin/Servicess/servicesAll.jsx";
import AddServices from "./Admin/Servicess/AddService.jsx";
import OrderDetails from "./Admin/Orders/OrderDetails.jsx";
import ProductDetail from "./Admin/Products/ProductDetail.jsx";
import MemberAttendance from "./Admin/Staff/Memberattendance.jsx";

import BuyPlanadmin from "./Admin/Plans/BuyPlan.jsx";


// Trainer Admin Panel
import TrainerAdminPanel from "./TrainerAdminPanel/TrainerAdminPanel.jsx";
import TrainerDashboard from "./TrainerAdminPanel/TrainerDashboard/TrainerDashboard.jsx";
import Payments from "./Admin/Payments/Payments.jsx";
import AddWorkout from "./TrainerAdminPanel/AddWrokouts/AddWorkout.jsx";
import AllWorkouts from "./TrainerAdminPanel/AddWrokouts/AllWorkouts.jsx";
import AddDietPlans from "./TrainerAdminPanel/DietPlans/AddDietPlans.jsx";
import AllDietPlans from "./TrainerAdminPanel/DietPlans/AllDietPlans.jsx";
import TrainerOverallAttendance from "./TrainerAdminPanel/TrainerAttendance/OverallAttendance.jsx";
import TrainerReports from "./TrainerAdminPanel/TrainerReports/Reports.jsx";
import AssingnedTrainers from "./Admin/Payments/AssingnedTrainers.jsx";
import GymWorkoutManager from "./Admin/CommenWorkDiet/CommenWorkDiet.jsx";


const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
    children: [
      { path: "/", element: <Home /> },
      { path: "/trainers", element: <Trainers /> },
      { path: "trainersdetails/:id", element: <TrainerDetails /> },
      { path: "facilities", element: <Facilities /> },
      { path: "account", element: <Account /> },
      { path: "facilities/:slug", element: <FacilityDetail /> },
      { path: "pricing", element: <Pricing /> },
      { path: "buy-plan", element: <BuyPlan /> },
      { path: "products", element: <Products /> },
      { path: "/cart", element: <Cart /> },
      { path: "/checkout", element: <Checkout /> },
      { path: "/products/:id", element: <ProductDetails /> },
      { path: "/services", element: <Services /> },
      { path: "/services/:slug", element: <ServicesDetails /> },
      { path: "/calendar", element: <ClassesTable /> },
      { path: "/contact", element: <Contact /> },
      { path: "/login", element: <Login /> },
      { path: "/register", element: <Register /> },
    ]
  },


  {
    path: "/admin",
    element: (
      <PrivateRoute allowedRoles={["admin"]}>
        <AdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <Dashboard /> },
      { path: "products", element: <AllProducts /> },
      { path: "products/:id", element: <AllProducts /> },
      { path: "productdetail/:id", element: <ProductDetail /> },
      { path: "addproducts", element: <AddProducts /> },
      { path: "addproducts/:id", element: <AddProducts /> },


      { path: "stockdetails", element: <StockDetails /> },
      { path: "add-stock", element: <AddStock /> },

      { path: "orders", element: <AllOrders /> },
      { path: "orders/:id", element: <OrderDetails /> },
      { path: "members", element: <Members /> },
      { path: "addmembers", element: <AddMember /> },
      { path: "addmembers/:id", element: <AddMember /> },


      { path: "billing", element: <Billings /> },


      { path: "plansall", element: <PlansAll /> },
      { path: "addplan", element: <AddEditGymPlan /> },
      { path: "addplan/:id", element: <AddEditGymPlan /> },

      { path: "fecilities", element: <FacilitiesAll /> },
      { path: "addfecilities", element: <AddEditFacility /> },
      { path: "addfecilities/:id", element: <AddEditFacility /> },




      { path: "equipment", element: <Equipment /> },
      { path: "addequipment", element: <AddEditEquipment /> },
      { path: "addequipment/:id", element: <AddEditEquipment /> },
      { path: "viewequipment/:id", element: <ViewEquipment /> },


      { path: "reports", element: <Reports /> },
      { path: "enquiry", element: <Enquiry /> },
      { path: "overall-attendance", element: <OverallAttendance /> },
      { path: "users", element: <Users /> },
      { path: "settings", element: <Settings /> },
      { path: "settings/profile", element: <ProfileSettings /> },
      { path: "settings/servicelist", element: <ServicesList /> },
      { path: "addservice", element: <AddServices /> },
      { path: "addservice/:id", element: <AddServices /> },

      { path: "commenworkoutdiet", element: <GymWorkoutManager /> },


      { path: "settings/usermanagement", element: <UserManagement /> },
      { path: "settings/reviews", element: <ReviewsSettings /> },

      { path: "staff", element: <Staffs /> },
      { path: "addstaff", element: <AddEditStaff /> },
      { path: "addstaff/:id", element: <AddEditStaff /> },
      { path: "viewstaff/:id", element: <ViewStaff /> },
      { path: "assignedtrainers", element: <AssingnedTrainers /> },
      { path: "payments", element: <Payments /> },
      { path: "buyplanadmin", element: <BuyPlanadmin /> },

    ],
  },


  {
    path: "/trainer",
    element: (
      <PrivateRoute allowedRoles={["trainer"]}>
        <TrainerAdminPanel />
      </PrivateRoute>
    ),
    children: [
      { index: true, element: <TrainerDashboard /> },
      { path: "reports", element: <TrainerReports /> },
      { path: "overall-attendance", element: <TrainerOverallAttendance /> },
      { path: "addworkouts", element: <AddWorkout /> },
      { path: "addworkouts/:id", element: <AddWorkout /> },
      { path: "alladdworkouts", element: <AllWorkouts /> },
      { path: "adddietplans", element: <AddDietPlans /> },
      { path: "adddietplans/:id", element: <AddDietPlans /> },
      { path: "alladddietplans", element: <AllDietPlans /> },

      { path: "settings", element: <Settings /> },
      { path: "settings/profile", element: <ProfileSettings /> },



      { path: "settings/usermanagement", element: <UserManagement /> },
      { path: "settings/reviews", element: <ReviewsSettings /> },




      { path: "member-attendance", element: <MemberAttendance /> },



    ],
  },

  //   { path: "/*", element: <NotFound /> },


])

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <GoogleOAuthProvider clientId="788596465962-h22auho4kp5sfnuc59udl0k10e8uu6ra.apps.googleusercontent.com">
      <AuthProvider>
        {/* 🔔 GLOBAL TOASTER */}
        <Toaster
          position="top-left"
          reverseOrder={false}
          toastOptions={{
            duration: 4000,
            style: {
              borderRadius: "12px",
              background: "#0B3C8A",
              color: "#fff",
            },
            success: {
              iconTheme: {
                primary: "#7CB9FF",
                secondary: "#fff",
              },
            },
            error: {
              style: {
                background: "#DC2626",
              },
            },
          }}
        />
        <RouterProvider router={router} />
      </AuthProvider>
    </GoogleOAuthProvider>
  </StrictMode>
);

