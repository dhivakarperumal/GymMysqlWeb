# Order Payment Fix - Testing Checklist

## 🔐 Quick Test Razorpay Payment Flow

### Step 1: Backend Setup
- [ ] Run migrations: `npm run migrate` in backend folder
- [ ] Restart backend server: `npm start`
- [ ] Check console for "Database setup complete!" message

### Step 2: Frontend Testing  
- [ ] Start frontend: `npm run dev` in frontend folder
- [ ] Navigate to Checkout page
- [ ] Ensure you're logged in (check user ID)

### Step 3: Test Payment Flow
- [ ] Add item to cart or use "Buy Now"
- [ ] Fill shipping details (Name, Phone, Address, State)
- [ ] Select delivery type (DELIVERY or PICKUP)
- [ ] Select "Online Payment" option
- [ ] Click "Place Order"

### Step 4: Complete Razorpay Payment
- [ ] Razorpay modal opens
- [ ] Use test card: **4111 1111 1111 1111**
- [ ] Expiry: Any future date (e.g., 12/25)
- [ ] CVV: Any 3 digits (e.g., 123)
- [ ] Complete payment

### Step 5: Verify Order Saved
Open browser DevTools (F12) and check:
- [ ] "Order Data:" shows full order payload in Console
- [ ] "Payment successful:" shows razorpay response
- [ ] "Order created successfully:" appears
- [ ] Redirected to Account page with Orders tab

### Step 6: Check Database
Open MySQL client and run:

```sql
-- Check if order was saved
SELECT * FROM orders 
WHERE user_id = [YOUR_USER_ID] 
ORDER BY created_at DESC LIMIT 1;

-- Check if order items were saved
SELECT * FROM order_items 
WHERE order_id = 'ORD001';  -- adjust order_id as needed

-- Check if address was saved
SELECT * FROM user_addresses 
WHERE user_id = [YOUR_USER_ID] 
ORDER BY created_at DESC LIMIT 1;
```

Should see:
- [ ] Order with payment_method = 'ONLINE'
- [ ] Order with payment_id = (Razorpay ID)
- [ ] Order status = 'orderPlaced'
- [ ] Order items with product details
- [ ] Address saved with user info

## 🐛 Debug If Something Goes Wrong

### If order doesn't save after payment:
1. Check backend console for errors
2. Check browser console for API errors
3. Verify database migrations ran: 
   ```sql
   DESCRIBE orders;  -- Should show payment_id, payment_method columns
   DESCRIBE user_addresses;  -- Should exist
   ```

### If payment completes but no confirmation:
- Check if order save API call returns error in Network tab
- Look for "Order creation error:" in backend console
- Check if tables exist: `SHOW TABLES;`

### If address not saving:
- Ensure user_addresses table exists
- Check if user_id is being sent correctly
- Look for duplicate address prevention error (expected if same address)

## 📱 Test Case: Cash on Delivery
- [ ] Select "Cash on Delivery" option
- [ ] Click "Place Order" (no payment required)
- [ ] Should save immediately with payment_status = 'Pending'
- [ ] Verify in database

## ✅ Success Indicators
- ✓ Order appears in database with all fields
- ✓ Payment ID is stored (for online payments)
- ✓ Order items linked correctly
- ✓ Address saved without duplicates
- ✓ User redirected to account/orders page
- ✓ Toast notification shows success message

## ✏️ Address Editing Test

- [ ] Open Account > Address tab
- [ ] Click edit on an existing address and change a field
- [ ] Click Save - modal should close and a success toast appears
- [ ] Verify the updated address shows in the list

## 📝 Key Fields to Verify in Database

| Field | Expected Value | Notes |
|-------|---|---|
| order_id | ORD001 (or similar) | Unique identifier |
| user_id | (user's ID) | Foreign key to users table |
| payment_status | 'Paid' or 'Pending' | Based on payment method |
| payment_method | 'ONLINE' or 'CASH' | NEW field - must be stored |
| payment_id | (Razorpay ID) | NEW field - UUID from Razorpay |
| total | 500.00 (or amount) | Order total |
| status | 'orderPlaced' | Initial status |
| shipping | JSON with address | Address details as JSON |
| created_at | Current timestamp | When order was created |

## 🔍 Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| "order_id required" error | Check if order ID generation endpoint works |
| Payment completes but order blank | Check backend logs for database error |
| Duplicate address error (expected) | Normal behavior - prevents duplicate saves |
| No payment_id in database | Column may not exist - run migrations |
| Tables don't exist | Run: `npm run migrate` in backend |

## 📞 If Still Having Issues

Check in this order:
1. Backend console for detailed error message
2. MySQL with: `SHOW TABLES;` and `DESCRIBE orders;`
3. Order payload logged in frontend console
4. Network tab in DevTools - check API response
5. Backend logs for transaction errors
