<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Personal Finances</h1>
      <button @click="isModalOpen = true" class="btn-primary">+ Add Personal Transaction</button>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading data...</div>
    
    <div v-else>
      <!-- My Debts Section -->
      <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h2 style="font-size: 1.25rem;">My Debts</h2>
          <button @click="openAddDebtModal" class="btn-primary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">+ Add Debt</button>
        </div>

        <div v-if="debts.length === 0" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
          No active debts found.
        </div>
        <div v-else style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
          <div v-for="debt in debts" :key="debt.id" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
              <strong style="font-size: 1.1rem;">{{ debt.name }}</strong>
              <span :class="debt.status === 'completed' ? 'text-success' : 'text-danger'" style="text-transform: capitalize; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1);">{{ debt.status === 'completed' ? 'Paid Off' : 'Active' }}</span>
            </div>
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
              Total: <strong>Rs. {{ debt.total_amount.toLocaleString() }}</strong> <br>
              Paid: <strong class="text-success">Rs. {{ debt.paid_amount.toLocaleString() }}</strong>
            </div>
            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-bottom: 1rem; overflow: hidden;">
              <div :style="`width: ${Math.min((debt.paid_amount / debt.total_amount) * 100, 100)}%; background: var(--success); height: 100%;`"></div>
            </div>
            <button v-if="debt.status !== 'completed'" @click="openPayDebtModal(debt)" class="btn-primary" style="width: 100%; padding: 0.5rem; font-size: 0.9rem;">Make Payment</button>
          </div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="glass-panel" style="padding: 1.5rem;">
      <div v-if="transactions.length === 0" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No personal transactions found.
      </div>
      <div v-else class="table-responsive">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr style="border-bottom: 1px solid var(--border);">
              <th style="padding: 1rem 0; color: var(--text-secondary); font-weight: 500;">Date</th>
              <th style="padding: 1rem 0; color: var(--text-secondary); font-weight: 500;">Description</th>
              <th style="padding: 1rem 0; color: var(--text-secondary); font-weight: 500;">Type</th>
              <th style="padding: 1rem 0; color: var(--text-secondary); font-weight: 500; text-align: right;">Amount</th>
              <th style="padding: 1rem 0; color: var(--text-secondary); font-weight: 500; text-align: right;">Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="t in transactions" :key="t.id" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td style="padding: 1rem 0;">{{ new Date(t.date).toLocaleDateString() }}</td>
              <td style="padding: 1rem 0;">{{ t.description }}</td>
              <td style="padding: 1rem 0;">
                <span :class="t.type === 'income' ? 'text-success' : 'text-danger'" style="text-transform: capitalize; font-weight: 500;">
                  {{ t.type }}
                </span>
              </td>
              <td style="text-align: right; font-weight: 500;" :class="t.type === 'income' ? 'text-success' : 'text-danger'">
                <div v-if="t.currency === 'USD'" style="display: flex; flex-direction: column; align-items: flex-end;">
                  <span>{{ t.type === 'income' ? '+' : '-' }}Rs. {{ t.amount.toFixed(2) }}</span>
                  <span style="font-size: 0.75rem; color: var(--text-secondary);">
                    ${{ t.original_amount.toFixed(2) }} @ {{ t.exchange_rate }}
                  </span>
                </div>
                <span v-else>
                  {{ t.type === 'income' ? '+' : '-' }}Rs. {{ t.amount.toFixed(2) }}
                </span>
              </td>
              <td style="text-align: right; padding: 1rem 0;">
                <div style="display: flex; gap: 0.5rem; justify-content: flex-end;">
                  <button @click="openEditModal(t)" class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Edit</button>
                  <button @click="deleteTransaction(t.id)" class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>

    <TransactionModal :isOpen="isModalOpen" :editData="editingTransaction" forcedCategory="personal" @close="closeModal" @saved="fetchData" />
    <DebtModal :isOpen="isDebtModalOpen" :paymentDebt="paymentDebtData" @close="closeDebtModal" @saved="fetchData" />
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isModalOpen = ref(false)
const editingTransaction = ref(null)

const isDebtModalOpen = ref(false)
const paymentDebtData = ref(null)

const loading = ref(true)
const transactions = ref([])
const debts = ref([])

const openAddDebtModal = () => {
  paymentDebtData.value = null
  isDebtModalOpen.value = true
}

const openPayDebtModal = (debt) => {
  paymentDebtData.value = debt
  isDebtModalOpen.value = true
}

const closeDebtModal = () => {
  isDebtModalOpen.value = false
  paymentDebtData.value = null
}

const openEditModal = (t) => {
  editingTransaction.value = t
  isModalOpen.value = true
}

const closeModal = () => {
  isModalOpen.value = false
  editingTransaction.value = null
}

const deleteTransaction = async (id) => {
  if (!confirm('Are you sure you want to delete this transaction?')) return
  
  loading.value = true
  const { error } = await supabase.from('transactions').delete().eq('id', id)
  if (!error) {
    fetchData()
  } else {
    loading.value = false
    alert('Failed to delete: ' + error.message)
  }
}

const fetchData = async () => {
  loading.value = true
  const { data: txData, error: txError } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.value.id)
    .eq('category', 'personal')
    .order('date', { ascending: false })

  if (txData) transactions.value = txData

  const { data: debtData } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.value.id)
    .order('status', { ascending: true }) // active first
    .order('created_at', { ascending: false })

  if (debtData) debts.value = debtData

  loading.value = false
}

onMounted(() => {
  fetchData()
})
</script>
