import { AuthCheck } from '@/components/AuthCheck'
import Home from '@/components/Home' 

export default function Page() {
  return (
    <AuthCheck>
      <Home />
    </AuthCheck>
  )
}