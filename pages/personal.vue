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
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">My Debts</h2>
            <div v-if="debts.length > 0" style="display: flex; gap: 1.5rem; font-size: 0.875rem;">
              <span style="color: var(--text-secondary);">Total Debt: <strong class="text-danger">Rs. {{ formatCurrency(totalDebtOwed) }}</strong></span>
              <span style="color: var(--text-secondary);">Total Paid: <strong class="text-success">Rs. {{ formatCurrency(totalDebtPaid) }}</strong></span>
              <span style="color: var(--text-secondary);">Remaining: <strong style="color: var(--text);">Rs. {{ formatCurrency(totalDebtOwed - totalDebtPaid) }}</strong></span>
            </div>
          </div>
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
            <button v-if="debt.status !== 'completed'" @click="openPayDebtModal(debt)" class="btn-primary" style="width: 100%; padding: 0.5rem; font-size: 0.9rem; margin-bottom: 0.5rem;">Make Payment</button>
            
            <!-- History Toggle -->
            <button @click="toggleHistory(debt.id)" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
              {{ expandedHistory === debt.id ? 'Hide History' : 'View History' }}
            </button>

            <!-- History Dropdown -->
            <div v-if="expandedHistory === debt.id" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
              <h4 style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Payment History</h4>
              <div v-if="getDebtPayments(debt.id).length === 0" style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">
                No payments made yet.
              </div>
              <ul v-else style="list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 0.5rem;">
                <li v-for="pay in getDebtPayments(debt.id)" :key="pay.id" style="display: flex; justify-content: space-between; font-size: 0.85rem; background: rgba(0,0,0,0.2); padding: 0.5rem; border-radius: 4px;">
                  <span style="color: var(--text-secondary);">{{ new Date(pay.date).toLocaleDateString() }}</span>
                  <strong class="text-success">Rs. {{ formatCurrency(pay.amount) }}</strong>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Section -->
      <div class="glass-panel" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <h3 style="margin: 0; font-size: 1.1rem;">Transaction History</h3>
        <div style="display: flex; gap: 1rem; align-items: center;">
          <input type="text" v-model="searchQuery" placeholder="Search description..." style="padding: 0.4rem 0.75rem; font-size: 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text); outline: none; width: 200px;" />
          <div style="display: flex; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.25rem; border-radius: 8px;">
          <button @click="typeFilter = 'all'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'all' ? 'background: var(--primary);' : 'background: transparent;'">All</button>
          <button @click="typeFilter = 'income'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'income' ? 'background: var(--success);' : 'background: transparent;'">Income</button>
            <button @click="typeFilter = 'expense'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'expense' ? 'background: var(--danger);' : 'background: transparent;'">Expense</button>
          </div>
        </div>
      </div>

      <div v-if="filteredTransactions.length === 0" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No personal transactions found for the selected filter.
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
            <tr v-for="t in paginatedTransactions" :key="t.id" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
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

      <!-- Pagination -->
      <div v-if="totalPages > 1" style="display: flex; justify-content: space-between; align-items: center; margin-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
        <button :disabled="currentPage === 1" @click="currentPage--" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: var(--text); cursor: pointer;" :style="currentPage === 1 ? 'opacity: 0.5; cursor: not-allowed;' : ''">Previous</button>
        <span style="font-size: 0.85rem; color: var(--text-secondary);">Page {{ currentPage }} of {{ totalPages }}</span>
        <button :disabled="currentPage === totalPages" @click="currentPage++" style="padding: 0.5rem 1rem; border-radius: 6px; border: 1px solid rgba(255,255,255,0.2); background: transparent; color: var(--text); cursor: pointer;" :style="currentPage === totalPages ? 'opacity: 0.5; cursor: not-allowed;' : ''">Next</button>
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
const debtPayments = ref([])
const expandedHistory = ref(null)

// Filters and Pagination
const searchQuery = ref('')
const typeFilter = ref('all')
const currentPage = ref(1)
const itemsPerPage = 50

const filteredTransactions = computed(() => {
  let result = transactions.value
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t => t.description && t.description.toLowerCase().includes(q))
  }
  
  if (typeFilter.value !== 'all') {
    result = result.filter(t => t.type === typeFilter.value)
  }
  
  return result
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1)

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTransactions.value.slice(start, start + itemsPerPage)
})

watch([searchQuery, typeFilter], () => {
  currentPage.value = 1
})

const toggleHistory = (debtId) => {
  expandedHistory.value = expandedHistory.value === debtId ? null : debtId
}

const getDebtPayments = (debtId) => {
  return debtPayments.value.filter(p => p.debt_id === debtId)
}

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

const formatCurrency = (val) => {
  if (val == null) return '0.00'
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalDebtOwed = computed(() => debts.value.reduce((acc, d) => acc + Number(d.total_amount), 0))
const totalDebtPaid = computed(() => debts.value.reduce((acc, d) => acc + Number(d.paid_amount), 0))

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
    .order('created_at', { ascending: false })

  if (txData) transactions.value = txData

  const { data: debtData } = await supabase
    .from('debts')
    .select('*')
    .eq('user_id', user.value.id)
    .order('status', { ascending: true }) // active first
    .order('created_at', { ascending: false })

  if (debtData) debts.value = debtData

  const { data: payData } = await supabase
    .from('debt_payments')
    .select('*')
    .eq('user_id', user.value.id)
    .order('date', { ascending: false })

  if (payData) debtPayments.value = payData

  loading.value = false
}

onMounted(() => {
  fetchData()
})
</script>
