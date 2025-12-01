useEffect(() => {
  // Part A: Initial check
  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    setAuthLoading(false);
  };
  checkUser();

  // Part B: Listen to auth changes
  const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
    setUser(session?.user ?? null);
  });

  // Part C: Cleanup
  return () => subscription.unsubscribe();
}, [supabase]);
```

### **Part A - Initial Check:**
- When component mounts, it asks Supabase: "Is there a user logged in?"
- Supabase checks the cookies (remember the session tokens we discussed?)
- If cookies exist and are valid → returns user object
- If no cookies or expired → returns null

### **Part B - Real-time Listener:**
This is the magic part! `onAuthStateChange` is a **listener/subscription** that watches for auth events:

**When does it trigger?**
- User signs in → fires with `event: "SIGNED_IN"`
- User signs out → fires with `event: "SIGNED_OUT"`
- Token refreshes → fires with `event: "TOKEN_REFRESHED"`
- Session expires → fires with `event: "SIGNED_OUT"`

**Why do we need this?**
Without this listener, your app wouldn't know if:
- User logged in from another tab
- User logged out from another tab
- Session expired while app is open

Example scenario:
```
Tab 1: User is on your app
Tab 2: User opens your app and clicks "Sign Out"
→ onAuthStateChange fires in Tab 1
→ Tab 1 instantly updates user state to null
→ Submit button gets disabled in Tab 1