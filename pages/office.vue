<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Office Finances</h1>
      <button @click="isModalOpen = true" class="btn-primary">+ Add Office Transaction</button>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading data...</div>
    
    <div v-else class="glass-panel" style="padding: 1.5rem;">
      <div v-if="transactions.length === 0" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No office transactions found.
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

    <TransactionModal :isOpen="isModalOpen" :editData="editingTransaction" forcedCategory="office" @close="closeModal" @saved="fetchData" />
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isModalOpen = ref(false)
const editingTransaction = ref(null)
const loading = ref(true)
const transactions = ref([])

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
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.value.id)
    .eq('category', 'office')
    .order('date', { ascending: false })

  if (data) transactions.value = data
  loading.value = false
}

onMounted(() => {
  fetchData()
})
</script>
