const AUTH_KEY = 'user';
const AUTH_TIMESTAMP_KEY = 'auth_timestamp';

const getAuth = () => {
    const lsValue = localStorage?.getItem(AUTH_KEY);
    if (!lsValue) return;

    try {
        const auth = JSON.parse(lsValue);
      
        return auth || undefined;
    } catch { /* empty */ }
};

const setAuth = (auth) => {
    try {
        const lsValue = JSON.stringify(auth);
        localStorage?.setItem(AUTH_KEY, lsValue);
        // Cập nhật timestamp khi set auth
        localStorage?.setItem(AUTH_TIMESTAMP_KEY, Date.now().toString());
    } catch { /* empty */ }
};

const removeAuth = () => {
    try {
        // ✅ Cookie-only authentication: Chỉ clear user data
        // ❌ Không clear token vì không còn lưu trong localStorage/sessionStorage
        localStorage.removeItem(AUTH_KEY);
        localStorage.removeItem(AUTH_TIMESTAMP_KEY);
        sessionStorage.removeItem(AUTH_KEY);
    } catch { /* empty */ }
};

export { getAuth, setAuth, removeAuth };
