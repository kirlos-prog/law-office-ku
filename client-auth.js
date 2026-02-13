import { auth, googleProvider } from './firebase-config.js';
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    signInWithPopup,
    signOut,
    createUserWithEmailAndPassword,
    updateProfile
} from "https://www.gstatic.com/firebasejs/12.8.0/firebase-auth.js";

let currentLanguage = 'ar';
let activeUser = null;

// Auth state observer
onAuthStateChanged(auth, (user) => {
    activeUser = user;
    updateUIForAuth(user);

    // Dispatch custom event for other scripts
    window.dispatchEvent(new CustomEvent('auth-state-changed', { detail: { user } }));
});

function updateUIForAuth(user) {
    const navLoginBtn = document.getElementById('navLoginBtn');
    const navUserBadge = document.getElementById('navUserBadge');
    const navUserName = document.getElementById('navUserName');
    const navUserAvatar = document.getElementById('navUserAvatar');

    if (user) {
        if (navLoginBtn) navLoginBtn.style.display = 'none';
        if (navUserBadge) {
            navUserBadge.style.display = 'flex';
            if (navUserName) navUserName.textContent = user.displayName || user.email.split('@')[0];
            if (navUserAvatar) navUserAvatar.textContent = (user.displayName || user.email)[0].toUpperCase();
        }
    } else {
        if (navLoginBtn) navLoginBtn.style.display = 'flex';
        if (navUserBadge) navUserBadge.style.display = 'none';
    }
}

export function showAuthModal() {
    const modal = document.getElementById('clientAuthModal');
    if (modal) modal.style.display = 'flex';
    toggleAuthView('login');
}

export function getCurrentUser() {
    return activeUser;
}

export function isUserLoggedIn() {
    return !!activeUser;
}

// UI Helpers
const loginView = document.getElementById('loginView');
const registerView = document.getElementById('registerView');

function toggleAuthView(view) {
    if (!loginView || !registerView) return;
    if (view === 'login') {
        loginView.style.display = 'block';
        registerView.style.display = 'none';
    } else {
        loginView.style.display = 'none';
        registerView.style.display = 'block';
    }
}

// Event Listeners for Toggles
document.getElementById('toRegister')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthView('register');
});

document.getElementById('toLogin')?.addEventListener('click', (e) => {
    e.preventDefault();
    toggleAuthView('login');
});

// LOGIN Handler
const clientLoginForm = document.getElementById('clientLoginForm');
if (clientLoginForm) {
    clientLoginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = document.getElementById('loginEmail').value;
        const pass = document.getElementById('loginPassword').value;

        try {
            await signInWithEmailAndPassword(auth, email, pass);
            document.getElementById('clientAuthModal').style.display = 'none';
        } catch (error) {
            console.error(error);
            alert(currentLanguage === 'ar' ? 'فشل تسجيل الدخول: تأكد من البيانات' : 'Login Failed: Check credentials');
        }
    });
}

// REGISTER Handler
const clientRegisterForm = document.getElementById('clientRegisterForm');
if (clientRegisterForm) {
    clientRegisterForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.getElementById('regName').value;
        const email = document.getElementById('regEmail').value;
        const pass = document.getElementById('regPassword').value;

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
            await updateProfile(userCredential.user, { displayName: name });
            document.getElementById('clientAuthModal').style.display = 'none';
            alert(currentLanguage === 'ar' ? 'تم إنشاء الحساب بنجاح' : 'Account created successfully');
        } catch (error) {
            console.error(error);
            alert(currentLanguage === 'ar' ? 'فشل التسجيل: ' + error.message : 'Registration Failed: ' + error.message);
        }
    });
}

// GOOGLE Sign-In Handler
const googleLoginBtn = document.getElementById('googleLoginBtn');
if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            await signInWithPopup(auth, googleProvider);
            document.getElementById('clientAuthModal').style.display = 'none';
        } catch (error) {
            console.error(error);
            alert('Google login failed');
        }
    });
}
