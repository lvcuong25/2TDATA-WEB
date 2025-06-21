const AUTH_KEY = 'user';

const getAuth = () => {
    const lsValue = sessionStorage?.getItem(AUTH_KEY);
    if (!lsValue) return;

    try {
        const auth = JSON.parse(lsValue);
      
        return auth || undefined;
    } catch { /* empty */ }
};

const setAuth = (auth) => {
    try {
        const lsValue = JSON.stringify(auth);
        sessionStorage?.setItem(AUTH_KEY, lsValue);
    } catch { /* empty */ }
};

const removeAuth = () => {
    try {
        localStorage.clear();
        sessionStorage.clear();
    } catch { /* empty */ }
};

export { getAuth, setAuth, removeAuth };