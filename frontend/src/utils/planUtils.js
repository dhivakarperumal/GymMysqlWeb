import { collection, doc, getDocs, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";

/**
 * Validates and fixes user plan documents
 * Ensures all plan docs have required fields: planId, planName, status, startDate, endDate
 */
export const validateUserPlans = async (userId) => {
  try {
    const plansRef = collection(db, "users", userId, "plans");
    const snap = await getDocs(plansRef);
    
    snap.forEach(async (docSnap) => {
      const plan = docSnap.data();
      
      // Check for missing required fields
      const updates = {};
      let needsUpdate = false;

      // Ensure planId exists
      if (!plan.planId) {
        needsUpdate = true;
      }

      // Ensure status exists
      if (!plan.status) {
        updates.status = "active";
        needsUpdate = true;
      }

      // Ensure planName exists
      if (!plan.planName && !updates.planName) {
        updates.planName = "Membership Plan";
        needsUpdate = true;
      }

      // Update if needed
      if (needsUpdate) {
        await updateDoc(doc(db, "users", userId, "plans", docSnap.id), updates);
        console.log(`Fixed plan document: ${docSnap.id}`);
      }
    });

    return true;
  } catch (error) {
    console.error("Error validating user plans:", error);
    return false;
  }
};

/**
 * Get user's active plan
 */
export const getUserActivePlan = async (userId) => {
  try {
    const plansRef = collection(db, "users", userId, "plans");
    const snap = await getDocs(plansRef);
    
    const activePlans = snap.docs
      .map((doc) => ({ id: doc.id, ...doc.data() }))
      .filter((plan) => plan.status === "active");

    return activePlans.length > 0 ? activePlans[0] : null;
  } catch (error) {
    console.error("Error fetching active plan:", error);
    return null;
  }
};

/**
 * Check if planId is valid and references existing gym plan
 */
export const validatePlanReference = async (planId) => {
  try {
    const planRef = doc(db, "gym_plans", planId);
    const snap = await getDoc(planRef);
    return snap.exists();
  } catch (error) {
    console.error("Error validating plan reference:", error);
    return false;
  }
};
