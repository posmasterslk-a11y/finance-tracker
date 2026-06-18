<template>
  <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
    <div class="modal-content glass-panel">
      <h3 style="margin-bottom: 1.5rem; font-size: 1.25rem;">
        {{ isPaymentMode ? 'Pay Debt' : 'Add New Debt' }}
      </h3>
      
      <form @submit.prevent="submitForm" style="display: flex; flex-direction: column; gap: 1.25rem;">
        
        <div v-if="!isPaymentMode">
          <label>Debt Name (e.g., Car Loan, Friend)</label>
          <input type="text" v-model="form.name" required placeholder="Enter debt name" />
        </div>

        <div v-if="!isPaymentMode">
          <label>Total Amount Owed (Rs.)</label>
          <input type="number" v-model="form.total_amount" step="0.01" min="0" required placeholder="0.00" />
        </div>

        <!-- Payment Mode specific fields -->
        <div v-if="isPaymentMode">
          <div style="margin-bottom: 1rem; color: var(--text-secondary); font-size: 0.9rem;">
            Paying towards: <strong style="color: var(--text);">{{ paymentDebt?.name }}</strong><br />
            Remaining Balance: <strong class="text-danger">Rs. {{ (paymentDebt?.total_amount - paymentDebt?.paid_amount).toFixed(2) }}</strong>
          </div>
          
          <label>Payment Amount (Rs.)</label>
          <input type="number" v-model="form.payment_amount" step="0.01" min="0" :max="paymentDebt?.total_amount - paymentDebt?.paid_amount" required placeholder="0.00" />
        </div>

        <div>
          <label>Date</label>
          <input type="date" v-model="form.date" required />
        </div>

        <div style="display: flex; gap: 1rem; margin-top: 1rem;">
          <button type="button" @click="closeModal" class="btn-danger" style="flex: 1;">Cancel</button>
          <button type="submit" class="btn-primary" :disabled="loading" style="flex: 1;">
            {{ loading ? 'Saving...' : (isPaymentMode ? 'Make Payment' : 'Save Debt') }}
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
  paymentDebt: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['close', 'saved'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const form = ref({
  name: '',
  total_amount: '',
  payment_amount: '',
  date: new Date().toISOString().split('T')[0]
})

const loading = ref(false)
const errorMsg = ref('')

const isPaymentMode = computed(() => !!props.paymentDebt)

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMsg.value = ''
    form.value.name = ''
    form.value.total_amount = ''
    form.value.payment_amount = ''
    form.value.date = new Date().toISOString().split('T')[0]
  }
})

const closeModal = () => {
  emit('close')
}

const submitForm = async () => {
  loading.value = true
  errorMsg.value = ''

  if (isPaymentMode.value) {
    // 1. Log Transaction
    const { error: txError } = await supabase.from('transactions').insert({
      user_id: user.value.id,
      type: 'expense',
      category: 'personal',
      amount: parseFloat(form.value.payment_amount),
      description: `Debt Payment - ${props.paymentDebt.name}`,
      date: form.value.date
    })

    if (txError) {
      errorMsg.value = txError.message
      loading.value = false
      return
    }

    // 2. Update Debt
    const newPaidAmount = props.paymentDebt.paid_amount + parseFloat(form.value.payment_amount)
    const newStatus = newPaidAmount >= props.paymentDebt.total_amount ? 'completed' : 'active'

    const { error: debtError } = await supabase.from('debts').update({
      paid_amount: newPaidAmount,
      status: newStatus
    }).eq('id', props.paymentDebt.id)

    if (debtError) {
      errorMsg.value = debtError.message
    } else {
      emit('saved')
      closeModal()
    }
  } else {
    // Add New Debt
    const { error } = await supabase.from('debts').insert({
      user_id: user.value.id,
      name: form.value.name,
      total_amount: parseFloat(form.value.total_amount),
      paid_amount: 0,
      status: 'active'
    })

    if (error) {
      errorMsg.value = error.message
    } else {
      emit('saved')
      closeModal()
    }
  }
  
  loading.value = false
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
