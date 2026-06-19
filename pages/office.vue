<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Office Finances</h1>
      <button @click="isModalOpen = true" class="btn-primary">+ Add Office Transaction</button>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading data...</div>
    
    <div v-else class="glass-panel" style="padding: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <h3 style="margin: 0; font-size: 1.1rem;">Transaction History</h3>
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <select v-model="dateFilter" style="padding: 0.35rem 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: var(--text); font-size: 0.85rem; cursor: pointer;">
              <option value="all">All Dates</option>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <div v-if="dateFilter === 'custom'" style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="date" v-model="customStartDate" style="padding: 0.25rem; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: var(--text);" />
              <span style="color: var(--text-secondary);">-</span>
              <input type="date" v-model="customEndDate" style="padding: 0.25rem; font-size: 0.8rem; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); border-radius: 4px; color: var(--text);" />
            </div>
          </div>
          <select v-model="labelFilter" style="padding: 0.35rem 0.5rem; border-radius: 6px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: var(--text); font-size: 0.85rem; cursor: pointer;">
            <option value="all">All Sub-Types</option>
            <option v-for="label in uniqueTransactionLabels" :key="label" :value="label">{{ label }}</option>
          </select>
          <div style="display: flex; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.25rem; border-radius: 8px;">
            <button @click="typeFilter = 'all'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'all' ? 'background: var(--primary);' : 'background: transparent;'">All</button>
            <button @click="typeFilter = 'income'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'income' ? 'background: var(--success);' : 'background: transparent;'">Income</button>
            <button @click="typeFilter = 'expense'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'expense' ? 'background: var(--danger);' : 'background: transparent;'">Expense</button>
          </div>
        </div>
      </div>

      <div v-if="filteredTransactions.length === 0" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No office transactions found for the selected filter.
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

// Filters and Pagination
const typeFilter = ref('all')
const labelFilter = ref('all')
const dateFilter = ref('all')
const customStartDate = ref('')
const customEndDate = ref('')
const currentPage = ref(1)
const itemsPerPage = 50

watch(typeFilter, () => {
  labelFilter.value = 'all'
  currentPage.value = 1
})

watch([labelFilter, dateFilter, customStartDate, customEndDate], () => {
  currentPage.value = 1
})

const uniqueTransactionLabels = computed(() => {
  const labels = new Set()
  const list = typeFilter.value === 'all' ? transactions.value : transactions.value.filter(t => t.type === typeFilter.value)
  list.forEach(t => {
    const label = t.description ? t.description.split(' - ')[0] : ''
    if (label) labels.add(label)
  })
  return Array.from(labels).sort()
})

const filteredTransactions = computed(() => {
  let result = transactions.value
  
  if (dateFilter.value !== 'all') {
    const now = new Date()
    let startDate = null
    let endDate = null

    if (dateFilter.value === 'current_month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0)
    } else if (dateFilter.value === 'last_month') {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      endDate = new Date(now.getFullYear(), now.getMonth(), 0)
    } else if (dateFilter.value === 'custom') {
      if (customStartDate.value) startDate = new Date(customStartDate.value)
      if (customEndDate.value) endDate = new Date(customEndDate.value)
    }

    result = result.filter(t => {
      const tDate = new Date(t.date)
      if (startDate && tDate < startDate) return false
      if (endDate) {
        const endDay = new Date(endDate)
        endDay.setHours(23, 59, 59, 999)
        if (tDate > endDay) return false
      }
      return true
    })
  }

  if (typeFilter.value !== 'all') {
    result = result.filter(t => t.type === typeFilter.value)
  }
  
  if (labelFilter.value !== 'all') {
    result = result.filter(t => {
      const label = t.description ? t.description.split(' - ')[0] : ''
      return label === labelFilter.value
    })
  }
  
  return result
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1)

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTransactions.value.slice(start, start + itemsPerPage)
})

watch(typeFilter, () => {
  currentPage.value = 1
})

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
    .order('created_at', { ascending: false })

  if (data) transactions.value = data
  loading.value = false
}

onMounted(() => {
  fetchData()
})
</script>
