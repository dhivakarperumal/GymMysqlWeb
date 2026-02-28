import React, { useEffect, useState } from "react";
import { auth, db } from "../firebase";
import { collection, onSnapshot, orderBy, query } from "firebase/firestore";
import AddressForm from "./AddressForm";

const UserAddresses = () => {
  const uid = auth.currentUser?.uid;

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editAddress, setEditAddress] = useState(null);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "users", uid, "addresses"),
      orderBy("createdAt", "desc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const data = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setAddresses(data);
      setLoading(false);

      if (data.length === 0) {
        setShowForm(true);
      }
    });

    return () => unsub();
  }, [uid]);

  if (loading) {
    return <div className="p-10 text-center text-red-500">LOADING...</div>;
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => {
          setEditAddress(null);
          setShowForm(true);
        }}
        className="bg-red-600 px-4 py-2 rounded"
      >
        ➕ Add Address
      </button>

      {showForm && (
        <AddressForm
          editAddress={editAddress}
          onClose={() => setShowForm(false)}
        />
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-gray-900 border border-red-500/30 rounded-xl p-5 text-white"
          >
            <h3 className="font-bold text-red-500">{addr.name}</h3>

            <p className="text-sm">{addr.address}</p>
            <p className="text-sm text-gray-400">
              {addr.city}, {addr.state} - {addr.zip}
            </p>
            <p className="text-sm text-gray-400">{addr.country}</p>
            <p className="text-sm mt-2">📞 {addr.phone}</p>

            <button
              onClick={() => {
                setEditAddress(addr);
                setShowForm(true);
              }}
              className="mt-3 text-sm text-red-400 hover:underline"
            >
              ✏ Edit
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default UserAddresses;