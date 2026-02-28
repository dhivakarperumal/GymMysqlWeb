import {
  collection,
  addDoc,
  updateDoc,
  doc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";

export const buildAddressHash = (data) =>
  [
    data.name,
    data.phone,
    data.email,
    data.address,
    data.city,
    data.state,
    data.zip,
    data.country,
  ]
    .map((v) => (v || "").trim().toLowerCase())
    .join("|");

/**
 * SAVE USER ADDRESS (NO DUPLICATES)
 * Used by BOTH Checkout & AddressForm
 */
export const saveUserAddress = async (
  uid,
  addressData,
  addressId = null // only for edit
) => {
  if (!uid) return;

  const addressHash = buildAddressHash(addressData);
  const addressesRef = collection(db, "users", uid, "addresses");

  // 🔍 DUPLICATE CHECK (QUERY-LEVEL)
  const q = query(addressesRef, where("addressHash", "==", addressHash));
  const snap = await getDocs(q);

  const duplicateExists = snap.docs.some(
    (doc) => doc.id !== addressId
  );

  if (duplicateExists) {
    throw new Error("DUPLICATE_ADDRESS");
  }

  if (addressId) {
    // 🔄 UPDATE
    await updateDoc(
      doc(db, "users", uid, "addresses", addressId),
      {
        ...addressData,
        addressHash,
        updatedAt: serverTimestamp(),
      }
    );
  } else {
    // ➕ ADD
    await addDoc(addressesRef, {
      ...addressData,
      addressHash,
      createdAt: serverTimestamp(),
    });
  }
};