<template>
  <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
    <div class="modal-content glass-panel">
      <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">Add New Subscription</h3>
      
      <form @submit.prevent="submitForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <label>Name</label>
          <input type="text" v-model="form.name" required placeholder="e.g., Netflix, Office Rent" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label>Amount</label>
            <input type="number" v-model="form.amount" step="0.01" min="0" required placeholder="0.00" />
          </div>
          <div>
            <label>Currency</label>
            <select v-model="form.currency" required>
              <option value="LKR">LKR</option>
              <option value="USD">USD</option>
            </select>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label>Category</label>
            <select v-model="form.category" required>
              <option value="personal">Personal</option>
              <option value="office">Office</option>
            </select>
          </div>
          <div>
            <label>Due Day (1-31)</label>
            <input type="number" v-model="form.due_day" min="1" max="31" required placeholder="e.g., 5" />
          </div>
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="button" @click="closeModal" class="btn-danger" style="flex: 1;">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="loading" style="flex: 1;">
            {{ loading ? 'Saving...' : 'Save' }}
          </button>
        </div>
        <p v-if="errorMsg" class="text-danger">{{ errorMsg }}</p>
      </form>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close', 'saved'])
const supabase = useSupabaseClient()
const user = useSupabaseUser()

const form = ref({
  name: '',
  amount: '',
  currency: 'LKR',
  category: 'personal',
  due_day: 1
})

const loading = ref(false)
const errorMsg = ref('')

const closeModal = () => {
  emit('close')
  errorMsg.value = ''
  form.value = {
    name: '',
    amount: '',
    currency: 'LKR',
    category: 'personal',
    due_day: 1
  }
}

const submitForm = async () => {
  if (!user.value) return
  
  loading.value = true
  errorMsg.value = ''

  const { error } = await supabase.from('subscriptions').insert({
    user_id: user.value.id,
    name: form.value.name,
    amount: parseFloat(form.value.amount),
    currency: form.value.currency,
    category: form.value.category,
    due_day: parseInt(form.value.due_day)
  })

  loading.value = false

  if (error) {
    errorMsg.value = error.message
  } else {
    emit('saved')
    closeModal()
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.5);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}
.modal-content {
  width: 100%;
  max-width: 450px;
  padding: 2rem;
  background: var(--bg-card);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 12px;
}
label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
