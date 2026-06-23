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
        <div class="modern-filter-bar">
          <input type="text" v-model="searchQuery" placeholder="Search description..." class="modern-date-input" style="width: 200px;" />
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <select v-model="dateFilter" class="modern-select">
              <option value="all">All Dates</option>
              <option value="current_month">Current Month</option>
              <option value="last_month">Last Month</option>
              <option value="custom">Custom Range</option>
            </select>
            <div v-if="dateFilter === 'custom'" style="display: flex; gap: 0.5rem; align-items: center;">
              <input type="date" v-model="customStartDate" class="modern-date-input" />
              <span style="color: var(--text-secondary);">-</span>
              <input type="date" v-model="customEndDate" class="modern-date-input" />
            </div>
          </div>
          <select v-model="labelFilter" class="modern-select">
            <option value="all">All Sub-Types</option>
            <option v-for="label in uniqueTransactionLabels" :key="label" :value="label">{{ label }}</option>
          </select>
          <div class="modern-toggle-group">
            <button @click="typeFilter = 'all'" class="modern-toggle-btn" :class="{ 'active-all': typeFilter === 'all' }">All</button>
            <button @click="typeFilter = 'income'" class="modern-toggle-btn" :class="{ 'active-income': typeFilter === 'income' }">Income</button>
            <button @click="typeFilter = 'expense'" class="modern-toggle-btn" :class="{ 'active-expense': typeFilter === 'expense' }">Expense</button>
          </div>
        </div>
      </div>

      <div v-if="chartDataLoaded" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 1.5rem; margin-bottom: 2rem;">
        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
          <h3 style="margin-bottom: 1.5rem; font-size: 1rem; color: var(--text-secondary); text-align: center;">Income vs Expenses</h3>
          <Bar :data="incomeVsExpenseData" :options="barChartOptions" style="max-height: 250px;" />
        </div>
        <div style="background: rgba(0,0,0,0.2); border-radius: 12px; padding: 1.5rem; border: 1px solid rgba(255,255,255,0.05);">
          <h3 style="margin-bottom: 1.5rem; font-size: 1rem; color: var(--text-secondary); text-align: center;">Expenses by Description</h3>
          <Pie v-if="expensePieChartData.labels.length > 0" :data="expensePieChartData" :options="pieChartOptions" style="max-height: 250px; display: flex; justify-content: center;" />
          <div v-else style="text-align: center; color: var(--text-secondary); padding: 2rem 0;">No expense data found.</div>
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
import { Bar, Pie } from 'vue-chartjs'

definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isModalOpen = ref(false)
const editingTransaction = ref(null)
const loading = ref(true)
const transactions = ref([])

// Filters and Pagination
const searchQuery = ref('')
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

watch([searchQuery, labelFilter, dateFilter, customStartDate, customEndDate], () => {
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
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t => t.description && t.description.toLowerCase().includes(q))
  }
  
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

const chartDataLoaded = computed(() => transactions.value.length > 0 && !loading.value)

const expensePieChartData = computed(() => {
  const grouped = {}
  filteredTransactions.value.filter(t => t.type === 'expense').forEach(t => {
    const label = t.description ? t.description.split(' - ')[0] : 'Other'
    grouped[label] = (grouped[label] || 0) + t.amount
  })
  
  const labels = Object.keys(grouped)
  const data = Object.values(grouped)
  const colors = ['#f43f5e', '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899']

  return {
    labels,
    datasets: [{
      backgroundColor: labels.map((_, i) => colors[i % colors.length]),
      data,
      borderWidth: 0
    }]
  }
})

const incomeVsExpenseData = computed(() => {
  const totalIncome = filteredTransactions.value.filter(t => t.type === 'income').reduce((a, t) => a + t.amount, 0)
  const totalExpense = filteredTransactions.value.filter(t => t.type === 'expense').reduce((a, t) => a + t.amount, 0)

  return {
    labels: ['Income', 'Expense'],
    datasets: [{
      backgroundColor: ['#10b981', '#ef4444'],
      data: [totalIncome, totalExpense]
    }]
  }
})

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } }
}

const barChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
}

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

<style scoped>
.modern-filter-bar {
  display: flex;
  gap: 0.75rem;
  align-items: center;
  flex-wrap: wrap;
  background: rgba(255, 255, 255, 0.03);
  padding: 0.5rem 0.75rem;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.05);
}

.modern-select {
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  color: var(--text);
  font-size: 0.85rem;
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2394a3b8%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.4-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat;
  background-position: right 0.7rem top 50%;
  background-size: 0.65rem auto;
  padding-right: 2rem;
}

.modern-select:hover {
  background-color: rgba(0,0,0,0.5);
  border-color: rgba(255,255,255,0.2);
}

.modern-select:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.modern-select option {
  background-color: #0f172a; /* Solid dark background */
  color: white;
  padding: 0.5rem;
}

.modern-date-input {
  padding: 0.35rem 0.5rem;
  font-size: 0.85rem;
  background: rgba(0,0,0,0.3);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  color: var(--text);
  outline: none;
  transition: all 0.2s ease;
}

.modern-date-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
}

.modern-toggle-group {
  display: flex;
  gap: 0.25rem;
  background: rgba(0,0,0,0.3);
  padding: 0.25rem;
  border-radius: 8px;
}

.modern-toggle-btn {
  padding: 0.35rem 0.85rem;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  background: transparent;
  transition: all 0.2s ease;
}

.modern-toggle-btn.active-all {
  background: var(--primary);
  color: white;
}

.modern-toggle-btn.active-income {
  background: var(--success);
  color: white;
}

.modern-toggle-btn.active-expense {
  background: var(--danger);
  color: white;
}

.modern-toggle-btn:hover:not(.active-all):not(.active-income):not(.active-expense) {
  background: rgba(255,255,255,0.1);
  color: var(--text);
}
</style>
