import { ToastContainer, toast } from "react-toastify"
import Router from "./router"
import { useEffect } from "react"
import { AuthProvider } from "./components/core/Auth"

function App() {
  useEffect(() => {
    // Make toast available globally for axios interceptors
    window.toast = toast;
    
    return () => {
      // Cleanup
      delete window.toast;
    };
  }, []);

  return (
    <AuthProvider>
      <Router/>
      <ToastContainer
        className="w-full max-w-full break-words"
        toastClassName="max-h-24 overflow-y-auto whitespace-normal break-words"
        newestOnTop={true}
        position="top-center"
        autoClose={3000}
        hideProgressBar={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  )
}

export default App
