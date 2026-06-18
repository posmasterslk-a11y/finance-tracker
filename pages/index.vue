<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <button @click="isModalOpen = true" class="btn-primary">+ Add Transaction</button>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading data...</div>
    
    <div v-else>
      <!-- Summary Cards -->
      <div class="dashboard-cards">
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Total Income</h3>
          <p class="text-success" style="font-size: 2rem; font-weight: 700;">Rs. {{ formatCurrency(totalIncome) }}</p>
          <p v-if="totalIncomeUSD > 0" style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">Includes ${{ formatCurrency(totalIncomeUSD) }}</p>
        </div>
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Total Expenses</h3>
          <p class="text-danger" style="font-size: 2rem; font-weight: 700;">Rs. {{ formatCurrency(totalExpense) }}</p>
          <p v-if="totalExpenseUSD > 0" style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">Includes ${{ formatCurrency(totalExpenseUSD) }}</p>
        </div>
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="color: var(--text-secondary); font-size: 0.875rem; margin-bottom: 0.5rem;">Net Profit / Loss</h3>
          <p :class="netProfit >= 0 ? 'text-success' : 'text-danger'" style="font-size: 2rem; font-weight: 700;">
            Rs. {{ formatCurrency(Math.abs(netProfit)) }}
            <span style="font-size: 1rem; font-weight: 500;">{{ netProfit >= 0 ? '(Profit)' : '(Loss)' }}</span>
          </p>
          <p v-if="Math.abs(netProfitUSD) > 0" style="font-size: 0.875rem; color: var(--text-secondary); margin-top: 0.25rem;">Net USD portion: ${{ formatCurrency(Math.abs(netProfitUSD)) }}</p>
        </div>
      </div>

      <!-- Charts -->
      <div class="dashboard-charts" style="margin-bottom: 2rem;">
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1.5rem;">Income vs Expenses</h3>
          <Bar v-if="chartDataLoaded" :data="barChartData" :options="chartOptions" style="max-height: 300px;" />
        </div>
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1.5rem;">Expenses by Category</h3>
          <Pie v-if="chartDataLoaded" :data="pieChartData" :options="pieChartOptions" style="max-height: 300px; display: flex; justify-content: center;" />
        </div>
      </div>

      <!-- Upcoming Subscriptions -->
      <div class="glass-panel" style="padding: 1.5rem;">
        <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Upcoming Payments (Next 7 Days)
          </div>
          <span v-if="upcomingSubscriptions.length > 0" class="text-danger" style="font-size: 1rem; font-weight: 600;">
            Total Due: Rs. {{ formatCurrency(totalUpcomingLKR) }}
          </span>
        </h3>
        <div v-if="upcomingSubscriptions.length === 0" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
          No upcoming payments in the next 7 days.
        </div>
        <div v-else class="table-responsive">
          <table style="width: 100%; border-collapse: collapse; text-align: left;">
            <tbody>
              <tr v-for="sub in upcomingSubscriptions" :key="sub.id" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                <td style="padding: 1rem 0;">
                  <div style="font-weight: 500;">{{ sub.name }}</div>
                  <div style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize;">{{ sub.category }}</div>
                </td>
                <td style="padding: 1rem 0;">Day {{ sub.due_day }}</td>
                <td style="padding: 1rem 0; text-align: right; font-weight: 500;">
                  <span v-if="sub.currency === 'USD'" class="text-danger">
                    ${{ formatCurrency(sub.amount) }}
                    <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">
                      ≈ Rs. {{ formatCurrency(sub.amount * (usdToLkr || 300)) }}
                    </span>
                  </span>
                  <span v-else class="text-danger">Rs. {{ formatCurrency(sub.amount) }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <TransactionModal :isOpen="isModalOpen" @close="isModalOpen = false" @saved="fetchData" />
  </div>
</template>

<script setup>
import { Bar, Pie } from 'vue-chartjs'
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { usdToLkr, fetchRate } = useExchangeRate()

const isModalOpen = ref(false)
const loading = ref(true)
const transactions = ref([])
const upcomingSubscriptions = ref([])

const formatCurrency = (val) => {
  if (val == null) return '0.00'
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0))
const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0))
const netProfit = computed(() => totalIncome.value - totalExpense.value)

const totalIncomeUSD = computed(() => transactions.value.filter(t => t.type === 'income' && t.currency === 'USD').reduce((acc, t) => acc + (t.original_amount || 0), 0))
const totalExpenseUSD = computed(() => transactions.value.filter(t => t.type === 'expense' && t.currency === 'USD').reduce((acc, t) => acc + (t.original_amount || 0), 0))
const netProfitUSD = computed(() => totalIncomeUSD.value - totalExpenseUSD.value)

const totalUpcomingLKR = computed(() => {
  return upcomingSubscriptions.value.reduce((acc, sub) => {
    if (sub.currency === 'USD') {
      return acc + (sub.amount * (usdToLkr.value || 300))
    }
    return acc + sub.amount
  }, 0)
})

// Chart Data
const chartDataLoaded = ref(false)
const barChartData = ref({ labels: [], datasets: [] })
const pieChartData = ref({ labels: [], datasets: [] })

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { display: false } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  }
}

const pieChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { position: 'bottom', labels: { color: '#f8fafc' } }
  }
}

const fetchData = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.value.id)
    .order('date', { ascending: false })

  if (data) {
    transactions.value = data
    updateCharts()
  }

  // Fetch subscriptions for upcoming
  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.value.id)

  if (subsData) {
    const today = new Date().getDate()
    
    upcomingSubscriptions.value = subsData.filter(sub => {
      let diff = sub.due_day - today
      if (diff < 0) diff += 30
      return diff >= 0 && diff <= 7
    }).sort((a, b) => {
      let diffA = a.due_day - today
      if (diffA < 0) diffA += 30
      let diffB = b.due_day - today
      if (diffB < 0) diffB += 30
      return diffA - diffB
    })
  }

  loading.value = false
}

const updateCharts = () => {
  // Bar Chart (Income vs Expense)
  barChartData.value = {
    labels: ['Income', 'Expense'],
    datasets: [{
      backgroundColor: ['#10b981', '#ef4444'],
      data: [totalIncome.value, totalExpense.value]
    }]
  }

  // Pie Chart (Personal vs Office Expenses)
  const personalExpense = transactions.value.filter(t => t.type === 'expense' && t.category === 'personal').reduce((a, t) => a + t.amount, 0)
  const officeExpense = transactions.value.filter(t => t.type === 'expense' && t.category === 'office').reduce((a, t) => a + t.amount, 0)
  
  pieChartData.value = {
    labels: ['Personal', 'Office'],
    datasets: [{
      backgroundColor: ['#3b82f6', '#8b5cf6'],
      data: [personalExpense, officeExpense],
      borderWidth: 0
    }]
  }
  
  chartDataLoaded.value = true
}

onMounted(() => {
  fetchRate()
  fetchData()
})
</script>
