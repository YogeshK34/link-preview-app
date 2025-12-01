import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Counter from './Counter'

export default async function CounterPage() {
  const supabase = await createClient()
  
  // Check if user is authenticated
  const { data: { user } } = await supabase.auth.getUser()
  
  // Redirect to login if not authenticated
  if (!user) {
    redirect('/')
  }

  return (
    <div>
      <h1>Welcome {user.email}</h1>
      <Counter />
    </div>
  )
}
