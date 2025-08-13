const AUTH_KEY = 'user';

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
    } catch { /* empty */ }
};

const removeAuth = () => {
    try {
        // ✅ Cookie-only authentication: Chỉ clear user data
        // ❌ Không clear token vì không còn lưu trong localStorage/sessionStorage
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
    } catch { /* empty */ }
};

export { getAuth, setAuth, removeAuth };
