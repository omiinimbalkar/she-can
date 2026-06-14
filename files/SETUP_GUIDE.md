# ⚡ VoltWay – EV Charging & Battery Swap Platform
## Complete Setup Guide

---

## 📁 Production Project Structure

```
voltway/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Navbar.jsx
│   │   ├── Sidebar.jsx
│   │   ├── MapView.jsx
│   │   ├── StationCard.jsx
│   │   ├── BookingModal.jsx
│   │   ├── StationDetailModal.jsx
│   │   ├── Icon.jsx
│   │   └── ui/
│   │       ├── Button.jsx
│   │       ├── Input.jsx
│   │       ├── Badge.jsx
│   │       ├── Modal.jsx
│   │       ├── Toast.jsx
│   │       ├── Spinner.jsx
│   │       └── Tabs.jsx
│   ├── pages/
│   │   ├── Home.jsx
│   │   ├── Auth.jsx
│   │   ├── UserDashboard.jsx
│   │   ├── OwnerDashboard.jsx
│   │   └── AdminPanel.jsx
│   ├── context/
│   │   ├── AuthContext.jsx
│   │   └── ToastContext.jsx
│   ├── firebase/
│   │   ├── config.js          ← Firebase initialization
│   │   ├── auth.js            ← Auth helper functions
│   │   ├── firestore.js       ← DB helper functions
│   │   └── storage.js         ← Storage helper functions
│   ├── hooks/
│   │   ├── useAuth.js
│   │   ├── useStations.js     ← Real-time stations listener
│   │   ├── useBookings.js
│   │   └── useToast.js
│   ├── utils/
│   │   ├── constants.js
│   │   ├── formatters.js
│   │   └── validators.js
│   ├── App.jsx
│   └── main.jsx
├── .env                       ← Firebase config (NEVER commit)
├── .env.example
├── .gitignore
├── firebase.json
├── firestore.rules
├── firestore.indexes.json
├── package.json
└── vite.config.js
```

---

## 🚀 Step 1: Project Setup

```bash
# Create Vite + React project
npm create vite@latest voltway -- --template react
cd voltway

# Install dependencies
npm install firebase react-router-dom
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional packages
npm install react-hot-toast         # Better toast notifications
npm install @react-google-maps/api  # Google Maps integration
npm install razorpay                # Payment gateway (optional)
npm install date-fns                # Date utilities
npm install zustand                 # Lightweight state management (alt to Redux)
```

---

## 🔥 Step 2: Firebase Setup

### 2.1 Create Firebase Project
1. Go to [console.firebase.google.com](https://console.firebase.google.com)
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyD04AqOBPvIY0AXPdOKZwJ67zfoF3t67MQ",
  authDomain: "ev-charging-d1242.firebaseapp.com",
  projectId: "ev-charging-d1242",
  storageBucket: "ev-charging-d1242.firebasestorage.app",
  messagingSenderId: "506460711622",
  appId: "1:506460711622:web:24b549de7ce97c11ca05c7",
  measurementId: "G-QCMG0C8LLE"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);

2. Click **Add project** → Name it "voltway"
3. Enable **Google Analytics** (optional)

### 2.2 Enable Services
- **Authentication** → Sign-in methods → Enable Email/Password + Google
- **Firestore Database** → Create database → Start in **production mode**
- **Storage** → Get started (for station images)
- **Hosting** → Get started

### 2.3 Get Config Keys
Project Settings → Your apps → Add web app → Copy config

### 2.4 Create `.env` file
```env
# .env (root of project — NEVER commit to git)
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abcdef
VITE_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

---

## 🔐 Step 3: Firebase Config & Auth

### `src/firebase/config.js`
```javascript
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;
```

### `src/firebase/auth.js`
```javascript
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from './config';

// Sign up new user and create Firestore profile
export const signUp = async (email, password, name, role = 'user') => {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const userProfile = {
    uid: credential.user.uid,
    name,
    email,
    role,
    createdAt: new Date().toISOString(),
  };
  await setDoc(doc(db, 'users', credential.user.uid), userProfile);
  return { user: credential.user, profile: userProfile };
};

// Sign in with email + password
export const signIn = (email, password) =>
  signInWithEmailAndPassword(auth, email, password);

// Sign in with Google OAuth
export const googleSignIn = async () => {
  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth, provider);
  const userRef = doc(db, 'users', credential.user.uid);
  const userSnap = await getDoc(userRef);
  if (!userSnap.exists()) {
    await setDoc(userRef, {
      uid: credential.user.uid,
      name: credential.user.displayName,
      email: credential.user.email,
      role: 'user',
      createdAt: new Date().toISOString(),
    });
  }
  return credential;
};

// Sign out
export const logout = () => signOut(auth);

// Auth state observer
export const onAuthChange = (callback) => onAuthStateChanged(auth, callback);
```

---

## 🗄️ Step 4: Firestore Database Structure

### `firestore.rules`
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: can read/write own doc; admin can read all
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Stations: anyone can read approved; owner can write own; admin can write all
    match /stations/{stationId} {
      allow read: if resource.data.status == 'approved' || 
                     request.auth.uid == resource.data.ownerId ||
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow create: if request.auth != null;
      allow update, delete: if request.auth.uid == resource.data.ownerId ||
                               get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Bookings: user can read/write own; owner can read for their stations
    match /bookings/{bookingId} {
      allow read, write: if request.auth.uid == resource.data.userId;
      allow read: if request.auth != null;
      allow create: if request.auth != null;
      allow read: if get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
  }
}
```

### Firestore Indexes (`firestore.indexes.json`)
```json
{
  "indexes": [
    {
      "collectionGroup": "stations",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "status", "order": "ASCENDING" },
        { "fieldPath": "type", "order": "ASCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "userId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    },
    {
      "collectionGroup": "bookings",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "stationId", "order": "ASCENDING" },
        { "fieldPath": "date", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 🔄 Step 5: Real-time Hooks

### `src/hooks/useStations.js`
```javascript
import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config';

// Real-time stations listener with optional filters
export function useStations(filters = {}) {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let q = query(collection(db, 'stations'), where('status', '==', 'approved'));
    if (filters.type) q = query(q, where('type', '==', filters.type));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setStations(data);
        setLoading(false);
      },
      (err) => { setError(err.message); setLoading(false); }
    );

    return () => unsubscribe(); // Cleanup on unmount
  }, [filters.type]);

  return { stations, loading, error };
}
```

### `src/hooks/useBookings.js`
```javascript
import { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc } from 'firebase/firestore';
import { db } from '../firebase/config';

export function useBookings(userId) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    const q = query(
      collection(db, 'bookings'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    const unsubscribe = onSnapshot(q, (snap) => {
      setBookings(snap.docs.map(d => ({ id: d.id, ...d.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, [userId]);

  // Create a new booking
  const createBooking = async (bookingData) => {
    const docRef = await addDoc(collection(db, 'bookings'), {
      ...bookingData,
      createdAt: new Date().toISOString(),
      status: 'confirmed',
      paymentStatus: 'paid',
    });
    return docRef.id;
  };

  return { bookings, loading, createBooking };
}
```

---

## 💳 Step 6: Razorpay Integration

```javascript
// src/utils/payment.js

// Load Razorpay SDK
const loadRazorpay = () => new Promise((resolve) => {
  const script = document.createElement('script');
  script.src = 'https://checkout.razorpay.com/v1/checkout.js';
  script.onload = () => resolve(true);
  script.onerror = () => resolve(false);
  document.body.appendChild(script);
});

export const initiatePayment = async ({ amount, name, email, bookingId, onSuccess, onFailure }) => {
  const loaded = await loadRazorpay();
  if (!loaded) throw new Error('Razorpay SDK failed to load');

  const options = {
    key: import.meta.env.VITE_RAZORPAY_KEY_ID,  // From .env
    amount: amount * 100,                          // Razorpay uses paise
    currency: 'INR',
    name: 'VoltWay',
    description: `Booking #${bookingId}`,
    image: '/logo.png',
    prefill: { name, email },
    theme: { color: '#00e5a0' },
    handler: (response) => {
      // Verify on backend before confirming
      onSuccess({
        razorpayPaymentId: response.razorpay_payment_id,
        razorpayOrderId: response.razorpay_order_id,
        razorpaySignature: response.razorpay_signature,
      });
    },
    modal: { ondismiss: () => onFailure('Payment cancelled') },
  };

  const rzp = new window.Razorpay(options);
  rzp.open();
};
```

---

## 🗺️ Step 7: Google Maps Integration

```javascript
// src/components/MapView.jsx
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';

export function MapView({ stations, onStationSelect }) {
  const { isLoaded } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const [selected, setSelected] = useState(null);
  const center = { lat: 19.0760, lng: 72.8777 }; // Mumbai default

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <GoogleMap mapContainerStyle={{ width: '100%', height: '400px' }} center={center} zoom={12}>
      {stations.map(station => (
        <Marker
          key={station.id}
          position={{ lat: station.location.lat, lng: station.location.lng }}
          onClick={() => setSelected(station)}
          icon={{
            url: station.type === 'charging' ? '/icons/charge-pin.png' : '/icons/swap-pin.png',
            scaledSize: new window.google.maps.Size(40, 40),
          }}
        />
      ))}
      {selected && (
        <InfoWindow position={{ lat: selected.location.lat, lng: selected.location.lng }} onCloseClick={() => setSelected(null)}>
          <div>
            <h3>{selected.name}</h3>
            <p>₹{selected.price} {selected.priceUnit}</p>
            <p>{selected.availability} ports available</p>
            <button onClick={() => { onStationSelect(selected); setSelected(null); }}>Book Now</button>
          </div>
        </InfoWindow>
      )}
    </GoogleMap>
  );
}
```

---

## 📸 Step 8: Firebase Storage (Station Images)

```javascript
// src/firebase/storage.js
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './config';

export const uploadStationImage = (file, stationId, onProgress) => {
  return new Promise((resolve, reject) => {
    const storageRef = ref(storage, `stations/${stationId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      reject,
      async () => {
        const url = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(url);
      }
    );
  });
};
```

---

## 🚀 Step 9: Deployment

### 9.1 Firebase Hosting Setup
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login and initialize
firebase login
firebase init

# Select:
# ✅ Firestore
# ✅ Hosting
# ✅ Storage

# Build the project
npm run build

# Deploy everything
firebase deploy
```

### 9.2 `firebase.json`
```json
{
  "hosting": {
    "public": "dist",
    "ignore": ["firebase.json", "**/.*", "**/node_modules/**"],
    "rewrites": [
      { "source": "**", "destination": "/index.html" }
    ]
  },
  "firestore": {
    "rules": "firestore.rules",
    "indexes": "firestore.indexes.json"
  },
  "storage": {
    "rules": "storage.rules"
  }
}
```

### 9.3 `.gitignore`
```gitignore
node_modules/
dist/
.env
.env.local
.firebase/
*.log
```

---

## 🔒 Security Checklist

- [ ] Never expose Firebase API keys in client code (use Vite env vars)
- [ ] Set up strict Firestore security rules
- [ ] Validate all inputs server-side via Cloud Functions
- [ ] Verify Razorpay payments server-side (webhook)
- [ ] Enable Firebase App Check to prevent abuse
- [ ] Set up rate limiting on booking endpoints
- [ ] Use Firebase Admin SDK for privileged operations

---

## 📦 All Dependencies

```json
{
  "dependencies": {
    "firebase": "^10.x.x",
    "react": "^18.x.x",
    "react-dom": "^18.x.x",
    "react-router-dom": "^6.x.x",
    "@react-google-maps/api": "^2.x.x",
    "react-hot-toast": "^2.x.x",
    "date-fns": "^3.x.x",
    "zustand": "^4.x.x"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.x.x",
    "vite": "^5.x.x",
    "tailwindcss": "^3.x.x",
    "autoprefixer": "^10.x.x",
    "postcss": "^8.x.x"
  }
}
```

---

## 🎯 Quick Demo Login

The app works in **demo mode** without Firebase:

| Role | Email | Password |
|------|-------|----------|
| User | user@demo.com | demo123 |
| Station Owner | owner@demo.com | demo123 |
| Admin | admin@demo.com | demo123 |

---

*Built with ⚡ React + 🔥 Firebase · VoltWay © 2026*
