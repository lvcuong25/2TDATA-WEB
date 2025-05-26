import { ToastContainer } from "react-toastify"
import Router from "./router"

function App() {


  return (
    <>
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

    </>
  )
}

export default App
