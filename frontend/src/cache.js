// Basic in-memory cache for data to prevent redundant loading spinners on back navigation
const cache = {
  products: null,
  plans: null,
  facilities: null,
  trainers: null,
  services: null,
  workouts: null,
  diets: null,
  dietTitle: null,
  userInfo: null,
  userPlans: null,
  
  clear() {
    this.products = null;
    this.plans = null;
    this.facilities = null;
    this.trainers = null;
    this.services = null;
    this.workouts = null;
    this.diets = null;
    this.dietTitle = null;
    this.userInfo = null;
    this.userPlans = null;
  }
};

export default cache;
