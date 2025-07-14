import { useState, useEffect } from 'react'
import { supabase } from '../../utils/supabase'
import SignUpAuth from '../../components/SignUpAuth'
import Account from '../../components/Account'
import { View } from 'react-native'
import { Session } from '@supabase/supabase-js'

export default function SignUp() {
  // const [session, setSession] = useState<Session | null>(null)

  // useEffect(() => {
  //   supabase.auth.getSession().then(({ data: { session } }) => {
  //     setSession(session)
  //   })

  //   supabase.auth.onAuthStateChange((_event, session) => {
  //     setSession(session)
  //   })
  // }, [])

  return (
    <SignUpAuth />
  )
}