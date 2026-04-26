/**
 * pages.config.js - Page routing configuration
 * 
 * This file is AUTO-GENERATED. Do not add imports or modify PAGES manually.
 * Pages are auto-registered when you create files in the ./pages/ folder.
 * 
 * THE ONLY EDITABLE VALUE: mainPage
 * This controls which page is the landing page (shown when users visit the app).
 * 
 * Example file structure:
 * 
 *   import HomePage from './pages/HomePage';
 *   import Dashboard from './pages/Dashboard';
 *   import Settings from './pages/Settings';
 *   
 *   export const PAGES = {
 *       "HomePage": HomePage,
 *       "Dashboard": Dashboard,
 *       "Settings": Settings,
 *   }
 *   
 *   export const pagesConfig = {
 *       mainPage: "HomePage",
 *       Pages: PAGES,
 *   };
 * 
 * Example with Layout (wraps all pages):
 *
 *   import Home from './pages/Home';
 *   import Settings from './pages/Settings';
 *   import __Layout from './Layout.jsx';
 *
 *   export const PAGES = {
 *       "Home": Home,
 *       "Settings": Settings,
 *   }
 *
 *   export const pagesConfig = {
 *       mainPage: "Home",
 *       Pages: PAGES,
 *       Layout: __Layout,
 *   };
 *
 * To change the main page from HomePage to Dashboard, use find_replace:
 *   Old: mainPage: "HomePage",
 *   New: mainPage: "Dashboard",
 *
 * The mainPage value must match a key in the PAGES object exactly.
 */
import BookTrip from './pages/BookTrip';
import BookingRequest from './pages/BookingRequest';
import ContractorDashboard from './pages/ContractorDashboard';
import Dashboard from './pages/Dashboard';
import DriverPortal from './pages/DriverPortal';
import DriverProfile from './pages/DriverProfile';
import Drivers from './pages/Drivers';
import EmergencyProtocols from './pages/EmergencyProtocols';
import HealthLogs from './pages/HealthLogs';
import Messages from './pages/Messages';
import Pets from './pages/Pets';
import PublicSite from './pages/PublicSite';
import RevenueAnalytics from './pages/RevenueAnalytics';
import SafetyStandards from './pages/SafetyStandards';
import TrackRide from './pages/TrackRide';
import TripDetail from './pages/TripDetail';
import Trips from './pages/Trips';
import VetPartners from './pages/VetPartners';
import __Layout from './Layout.jsx';


export const PAGES = {
    "BookTrip": BookTrip,
    "BookingRequest": BookingRequest,
    "ContractorDashboard": ContractorDashboard,
    "Dashboard": Dashboard,
    "DriverPortal": DriverPortal,
    "DriverProfile": DriverProfile,
    "Drivers": Drivers,
    "EmergencyProtocols": EmergencyProtocols,
    "HealthLogs": HealthLogs,
    "Messages": Messages,
    "Pets": Pets,
    "PublicSite": PublicSite,
    "RevenueAnalytics": RevenueAnalytics,
    "SafetyStandards": SafetyStandards,
    "TrackRide": TrackRide,
    "TripDetail": TripDetail,
    "Trips": Trips,
    "VetPartners": VetPartners,
}

export const pagesConfig = {
    mainPage: "BookTrip",
    Pages: PAGES,
    Layout: __Layout,
};