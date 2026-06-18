<template>
  <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
    <div class="modal-content glass-panel">
      <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">
        {{ editData ? 'Edit Transaction' : 'Add New Transaction' }}
      </h3>
      
      <form @submit.prevent="submitForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
        <div>
          <label>Type</label>
          <select v-model="form.type" required>
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
        </div>

        <div v-if="!forcedCategory">
          <label>Category</label>
          <select v-model="form.category" required :disabled="form.type === 'income'" :style="form.type === 'income' ? 'opacity: 0.7' : ''">
            <option value="personal">Personal</option>
            <option value="office">Office</option>
          </select>
          <small v-if="form.type === 'income'" style="color: var(--success); font-size: 0.75rem;">Income always goes to Office</small>
        </div>

        <div v-if="form.type === 'income'">
          <label>Main Revenue Type</label>
          <select v-model="form.main_type" required>
            <option value="Content Revenue">Content Revenue</option>
            <option value="Software Revenue">Software Revenue</option>
          </select>
        </div>

        <div>
          <label>Label / Source</label>
          <div v-if="loadingTypes" style="font-size: 0.9rem; color: var(--text-secondary);">Loading custom types...</div>
          <select v-else-if="availableTypes.length > 0" v-model="form.transactionLabel" required>
            <option value="" disabled>Select {{ form.type }} source...</option>
            <option v-for="t in availableTypes" :key="t.id" :value="t.name">{{ t.name }}</option>
            <option value="Other">Other (Custom)</option>
          </select>
          <input v-if="availableTypes.length === 0 || form.transactionLabel === 'Other'" type="text" v-model="customLabel" required placeholder="Enter custom label..." style="margin-top: 0.5rem;" />
        </div>

        <div>
          <label>Description (Optional Note)</label>
          <input type="text" v-model="form.notes" placeholder="e.g., May 2026 Payment, Invoice #102" />
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
          <div>
            <label>Currency</label>
            <select v-model="form.currency" required>
              <option value="LKR">LKR (Rs.)</option>
              <option value="USD">USD ($)</option>
            </select>
          </div>
          <div>
            <label>Amount ({{ form.currency }})</label>
            <input type="number" v-model="form.amount" step="0.01" min="0" required placeholder="0.00" />
          </div>
        </div>

        <div v-if="form.currency === 'USD'" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; align-items: end;">
          <div>
            <label>Bank Exchange Rate</label>
            <input type="number" v-model="form.exchange_rate" step="0.01" min="0.01" required placeholder="e.g., 305.50" />
          </div>
          <div style="padding-bottom: 0.5rem;">
            <span style="font-size: 0.875rem; color: var(--text-secondary);">Final:</span>
            <span style="font-weight: 600; color: var(--text); margin-left: 0.5rem;">
              Rs. {{ calculatedLkrAmount.toFixed(2) }}
            </span>
          </div>
        </div>

        <div>
          <label>Date</label>
          <input type="date" v-model="form.date" required />
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
  isOpen: Boolean,
  forcedCategory: {
    type: String,
    default: null
  },
  editData: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const form = ref({
  type: 'expense',
  category: props.forcedCategory || 'personal',
  currency: 'LKR',
  amount: '',
  exchange_rate: '',
  main_type: 'Content Revenue',
  transactionLabel: '',
  notes: '',
  date: new Date().toISOString().split('T')[0]
})

const customLabel = ref('')
const loading = ref(false)
const errorMsg = ref('')

const calculatedLkrAmount = computed(() => {
  if (!form.value.amount) return 0
  if (form.value.currency === 'LKR') return parseFloat(form.value.amount)
  return parseFloat(form.value.amount) * (parseFloat(form.value.exchange_rate) || 0)
})

// Transaction Types Logic
const transactionTypes = ref([])
const loadingTypes = ref(false)

const availableTypes = computed(() => {
  return transactionTypes.value.filter(t => t.type === form.value.type)
})

const fetchTransactionTypes = async () => {
  loadingTypes.value = true
  const { data } = await supabase
    .from('transaction_types')
    .select('*')
    .eq('user_id', user.value.id)
  
  if (data) transactionTypes.value = data
  loadingTypes.value = false
}

watch(() => props.isOpen, async (newVal) => {
  if (newVal) {
    await fetchTransactionTypes()
    
    if (props.editData) {
      // Edit Mode Pre-fill
      form.value.type = props.editData.type
      // Wait a tick for types to filter
      await nextTick()
      
      form.value.category = props.editData.category
      form.value.currency = props.editData.currency || 'LKR'
      form.value.amount = props.editData.currency === 'USD' ? props.editData.original_amount : props.editData.amount
      form.value.exchange_rate = props.editData.exchange_rate || ''
      form.value.main_type = props.editData.main_type || 'Content Revenue'
      form.value.date = props.editData.date
      
      // Attempt to split description back into label and notes
      let labelPart = props.editData.description
      let notesPart = ''
      
      if (props.editData.description) {
        const parts = props.editData.description.split(' - ')
        if (parts.length > 1) {
          labelPart = parts[0]
          notesPart = parts.slice(1).join(' - ')
        }
      }
      
      const typeExists = transactionTypes.value.find(t => t.type === props.editData.type && t.name === labelPart)
      
      if (typeExists) {
        form.value.transactionLabel = labelPart
        customLabel.value = ''
      } else {
        form.value.transactionLabel = 'Other'
        customLabel.value = labelPart || ''
      }
      form.value.notes = notesPart
      
    } else {
      // Add Mode Clear
      form.value.transactionLabel = ''
      form.value.notes = ''
      form.value.amount = ''
      form.value.exchange_rate = ''
      customLabel.value = ''
      if (props.forcedCategory) {
        form.value.category = props.forcedCategory
      }
    }
  }
})

watch(() => props.forcedCategory, (newVal) => {
  if (newVal && !props.editData) {
    form.value.category = newVal
  }
}, { immediate: true })

watch(() => form.value.type, (newVal) => {
  if (props.isOpen && props.editData && props.editData.type === newVal) {
    return // Don't clear fields if we just loaded edit data
  }
  form.value.transactionLabel = ''
  form.value.notes = ''
  customLabel.value = ''
  if (newVal === 'income') {
    form.value.category = 'office'
  } else if (!props.forcedCategory) {
    form.value.category = 'personal'
  }
})

const closeModal = () => {
  emit('close')
  errorMsg.value = ''
  customLabel.value = ''
  form.value = {
    type: 'expense',
    category: props.forcedCategory || 'personal',
    currency: 'LKR',
    amount: '',
    exchange_rate: '',
    main_type: 'Content Revenue',
    transactionLabel: '',
    notes: '',
    date: new Date().toISOString().split('T')[0]
  }
}

const submitForm = async () => {
  loading.value = true
  errorMsg.value = ''

  const baseLabel = form.value.transactionLabel === 'Other' || !form.value.transactionLabel 
    ? customLabel.value 
    : form.value.transactionLabel

  const finalDescription = form.value.notes.trim() 
    ? `${baseLabel} - ${form.value.notes.trim()}`
    : baseLabel

  const finalAmount = form.value.currency === 'USD' 
    ? parseFloat(form.value.amount) * parseFloat(form.value.exchange_rate)
    : parseFloat(form.value.amount)

  const payload = {
    user_id: user.value.id,
    type: form.value.type,
    category: form.value.category,
    amount: finalAmount,
    currency: form.value.currency,
    original_amount: parseFloat(form.value.amount),
    exchange_rate: form.value.currency === 'USD' ? parseFloat(form.value.exchange_rate) : null,
    main_type: form.value.type === 'income' ? form.value.main_type : null,
    description: finalDescription,
    date: form.value.date
  }

  let dbError = null

  if (props.editData && props.editData.id) {
    const { error } = await supabase.from('transactions').update(payload).eq('id', props.editData.id)
    dbError = error
  } else {
    const { error } = await supabase.from('transactions').insert(payload)
    dbError = error
    
    // Save new custom type to transaction_types for future use
    if (!dbError && (form.value.transactionLabel === 'Other' || !form.value.transactionLabel) && customLabel.value) {
      await supabase.from('transaction_types').insert({
        user_id: user.value.id,
        type: form.value.type,
        name: customLabel.value
      })
    }
  }

  loading.value = false

  if (dbError) {
    errorMsg.value = dbError.message
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
}
label {
  display: block;
  margin-bottom: 0.5rem;
  color: var(--text-secondary);
  font-size: 0.875rem;
}
</style>
