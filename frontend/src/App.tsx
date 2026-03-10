import { Toaster } from 'react-hot-toast'
import Calculator from './pages/Calculator'

function App() {
  return (
    <div className="min-h-screen bg-gray-950">
      <Toaster position="top-right" />
      <Calculator />
    </div>
  )
}

export default App
