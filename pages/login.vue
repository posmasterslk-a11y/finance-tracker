<template>
  <div class="login-container">
    <div class="login-card glass-panel">
      <h1 class="page-title text-center" style="margin-bottom: 2rem;">Welcome to Expensify</h1>
      <form @submit.prevent="handleLogin" style="display: flex; flex-direction: column; gap: 1.5rem;">
        <div>
          <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Email</label>
          <input type="email" v-model="email" required placeholder="Enter your email" />
        </div>
        <div>
          <label style="display: block; margin-bottom: 0.5rem; color: var(--text-secondary);">Password</label>
          <input type="password" v-model="password" required placeholder="Enter your password" />
        </div>
        <button type="submit" class="btn-primary" :disabled="loading" style="margin-top: 1rem;">
          {{ loading ? 'Loading...' : 'Sign In / Register' }}
        </button>
        <p v-if="errorMsg" class="text-danger text-center" style="margin-top: 1rem; font-size: 0.875rem;">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
definePageMeta({
  layout: 'default'
})

const supabase = useSupabaseClient()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  loading.value = true
  errorMsg.value = ''
  
  // Try login first
  const { error } = await supabase.auth.signInWithPassword({
    email: email.value,
    password: password.value,
  })

  if (error) {
    if (error.message.includes('Invalid login credentials')) {
      // If not found, try register
      const { error: signUpError } = await supabase.auth.signUp({
        email: email.value,
        password: password.value,
      })
      if (signUpError) {
         errorMsg.value = signUpError.message
      } else {
         navigateTo('/')
      }
    } else {
      errorMsg.value = error.message
    }
  } else {
    navigateTo('/')
  }
  
  loading.value = false
}
</script>

<style scoped>
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: calc(100vh - 4rem);
}
.login-card {
  width: 100%;
  max-width: 400px;
  padding: 3rem 2rem;
}
.text-center {
  text-align: center;
}
</style>
