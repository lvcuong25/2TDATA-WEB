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
        // Clear localStorage
        localStorage.clear();
        
        // Clear sessionStorage (including accessToken)
        sessionStorage.removeItem('accessToken');
        sessionStorage.removeItem('user');
        sessionStorage.clear();
    } catch { /* empty */ }
};

export { getAuth, setAuth, removeAuth };
