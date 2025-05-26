const AUTH_KEY = 'user';

const getAuth = () => {
    const lsValue = localStorage?.getItem(AUTH_KEY);
    if (!lsValue) return;

    try {
        const auth = JSON.parse(lsValue);
      
        return auth || undefined;
    } catch (error) {
    }
};

const setAuth = (auth) => {
    try {
        const lsValue = JSON.stringify(auth);
        localStorage?.setItem(AUTH_KEY, lsValue);
    } catch (error) {
    }
};

const removeAuth = () => {
    try {
        localStorage?.removeItem('accessToken');
        localStorage?.removeItem(AUTH_KEY);
    } catch (error) {
    }
};

export { getAuth, setAuth, removeAuth };