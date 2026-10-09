import { supabase } from './supabaseClient';

import React from "react";
import { Routes, Route } from "react-router-dom";

import HomePage from "./pages/HomePage";

import CustomerLogin from "./pages/CustomerLogin";
import CustomerSignup from "./pages/CustomerSignup";
import CustomerSignup1 from "./pages/CustomerSignup1";
import CustomerSignup2 from "./pages/CustomerSignup2";

import ShopkeeperSignup from "./pages/ShopkeeperSignup";
import ShopkeeperLogin from "./pages/ShopkeeperLogin";
import ShopkeeperOp from "./pages/ShopkeeperOP";
import Shopekeeper3 from "./pages/Shopekeeper3";
import TemporaryShopSignup from './pages/TemporaryShopSignup';

import Adminlogin from "./pages/Adminlogin";

import CustomerDashboard from "./Dashboard/CustomerDashboard";
import Location from "./Dashboard/Location";
import Locaation_shopkeeper from "./Dashboard/locaation_shopkeeper";

import Nearby from "./Customer/Nearby";
import CustomerProductDetails from "./Customer/CustomerProductDetails";
import CustomerShopDetails from "./Customer/CustomerShopDetails";
import CustomerReservation from "./Customer/CustomerReservation";
import CustomerReservationConfirmation from "./Customer/CustomerReservationConfirmation";
import CustomerOrders from "./Customer/CustomerOrders";
import CustomerSaved from "./Customer/CustomerSaved";
import CustomerProfile from "./Customer/CustomerProfile";

import ShopkeeperDashboard from "./Shopkeeper/ShopkeeperDashboard";
import ShopkeeperInventory from "./Shopkeeper/ShopkeeperInventory";
import ShopkeeperProfile from "./Shopkeeper/ShopkeeperProfile";
import ShopkeeperReservations from "./Shopkeeper/ShopkeeperReservations";
import Update_Location from './Shopkeeper/Update_Location';

import AdminDashboard from "./Admin/AdminDashboard";
import AdminAnalytics from "./Admin/AdminAnalytics";
import AdminReservations from "./Admin/AdminReservations";
import AdminSettings from "./Admin/AdminSettings";
import AdminShops from "./Admin/AdminShops";
import AdminUsers from "./Admin/AdminUsers";

const App = () => {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} />

        <Route path="/CustomerLogin" element={<CustomerLogin />} />
        <Route path="/CustomerSignup" element={<CustomerSignup />} />
        <Route path="/CustomerSignup1" element={<CustomerSignup1 />} />
        <Route path="/CustomerSignup2" element={<CustomerSignup2 />} />

        <Route
          path="/CustomerDashboard"
          element={<CustomerDashboard />}
        />

        <Route
          path="/Customerdashboard"
          element={<CustomerDashboard />}
        />

        <Route path="/Location" element={<Location />} />

        <Route path="/Nearby" element={<Nearby />} />

        <Route
          path="/CustomerProductDetails/:productId"
          element={<CustomerProductDetails />}
        />

        <Route
          path="/CustomerShopDetails/:shopId"
          element={<CustomerShopDetails />}
        />

        <Route
          path="/CustomerReservation"
          element={<CustomerReservation />}
        />

        <Route
          path="/CustomerReservationConfirmation"
          element={<CustomerReservationConfirmation />}
        />

        <Route
          path="/CustomerOrders"
          element={<CustomerOrders />}
        />

        <Route
          path="/CustomerSaved"
          element={<CustomerSaved />}
        />

        <Route
          path="/CustomerProfile"
          element={<CustomerProfile />}
        />

        <Route
          path="/ShopkeeperSignup"
          element={<ShopkeeperSignup />}
        />

        <Route
          path="/ShopkeeperLogin"
          element={<ShopkeeperLogin />}
        />

        <Route
          path="/ShopkeeperOTP"
          element={<ShopkeeperOp />}
        />

        <Route
          path="/Shopkeeper3rd"
          element={<Shopekeeper3 />}
        />

        <Route
          path="/Location_shopkeeper"
          element={<Locaation_shopkeeper />}
        />

        <Route
          path="/shopkeeperdashboard"
          element={<ShopkeeperDashboard />}
        />

        <Route
          path="/ShopkeeperInventory"
          element={<ShopkeeperInventory />}
        />

      <Route path='/TemporaryShopSignup' element={<TemporaryShopSignup/>}/>
        <Route
          path="/ShopkeeperProfile"
          element={<ShopkeeperProfile />}
        />
        <Route  path='/Update_Location' element={<Update_Location />}/>

        <Route
          path="/ShopkeeperReservations"
          element={<ShopkeeperReservations />}
        />

        <Route
          path="/Adminlogin"
          element={<Adminlogin />}
        />

        <Route
          path="/AdminDashboard"
          element={<AdminDashboard />}
        />

        <Route
          path="/AdminShops"
          element={<AdminShops />}
        />

        <Route
          path="/AdminAnalytics"
          element={<AdminAnalytics />}
        />

        <Route
          path="/AdminReservations"
          element={<AdminReservations />}
        />

          <Route
            path="/AdminSettings"
            element={<AdminSettings />}
          />
          <Route
            path="/AdminUsers"
            element={<AdminUsers />}/>
      </Routes>
    </div>
  );
};

export default App;