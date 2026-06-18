<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Dashboard</h1>
      <div style="display: flex; gap: 1rem; align-items: center;">
        <div style="display: flex; gap: 0.5rem; align-items: center; background: var(--bg-card); padding: 0.25rem 0.5rem; border-radius: 8px; border: 1px solid var(--border);">
          <input type="date" v-model="startDate" @change="fetchData" style="border: none; background: transparent; color: var(--text); padding: 0.25rem; font-size: 0.875rem;" />
          <span style="color: var(--text-secondary);">to</span>
          <input type="date" v-model="endDate" @change="fetchData" style="border: none; background: transparent; color: var(--text); padding: 0.25rem; font-size: 0.875rem;" />
        </div>
        <button @click="isModalOpen = true" class="btn-primary">+ Add Transaction</button>
      </div>
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
          <div style="display: flex; gap: 1rem; margin-top: 0.5rem; font-size: 0.85rem; color: var(--text-secondary); border-top: 1px solid rgba(255,255,255,0.05); padding-top: 0.5rem;">
            <span>Office: <strong style="color: var(--text);">Rs. {{ formatCurrency(officeExpense) }}</strong></span>
            <span>Personal: <strong style="color: var(--text);">Rs. {{ formatCurrency(personalExpense) }}</strong></span>
          </div>
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

      <!-- Type Breakdown -->
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Category Breakdown (Selected Dates)</h2>
      <div class="dashboard-charts" style="margin-bottom: 2rem;">
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1.5rem;">Income by Type</h3>
          <div v-if="incomeTypeBreakdownData.datasets[0]?.data.length === 0" style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No income data for this period</div>
          <Pie v-else-if="chartDataLoaded" :data="incomeTypeBreakdownData" :options="pieChartOptions" style="max-height: 300px; display: flex; justify-content: center;" />
        </div>
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 1.5rem;">Expenses by Type</h3>
          <div v-if="expenseTypeBreakdownData.datasets[0]?.data.length === 0" style="text-align: center; color: var(--text-secondary); margin-top: 2rem;">No expense data for this period</div>
          <Pie v-else-if="chartDataLoaded" :data="expenseTypeBreakdownData" :options="pieChartOptions" style="max-height: 300px; display: flex; justify-content: center;" />
        </div>
      </div>

      <!-- Income Analytics (New) -->
      <h2 style="font-size: 1.25rem; margin-bottom: 1rem;">Income Analytics</h2>
      <div class="dashboard-charts" style="margin-bottom: 2rem;">
        <!-- Trend Line -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 0.5rem;">Income Trend (Year to Date)</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Monthly income starting from January</p>
          <Line v-if="chartDataLoaded" :data="incomeTrendChartData" :options="lineChartOptions" style="max-height: 300px;" />
        </div>
        <!-- MoM Comparison -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 0.5rem;">This Month vs Last Month</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Comparing total income</p>
          <Bar v-if="chartDataLoaded" :data="momChartData" :options="chartOptions" style="max-height: 300px;" />
          <div v-if="chartDataLoaded" style="text-align: center; margin-top: 1rem;">
            <span :class="momPercentage >= 0 ? 'text-success' : 'text-danger'" style="font-size: 1.25rem; font-weight: 600;">
              {{ momPercentage >= 0 ? '+' : '' }}{{ momPercentage }}%
            </span>
            <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">vs last month</span>
          </div>
        </div>
      </div>

      <!-- Upcoming Subscriptions -->
      <div class="glass-panel" style="padding: 1.5rem;">
        <h3 style="margin-bottom: 1.5rem; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 1rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--danger)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Upcoming Payments (Next 7 Days)
          </div>
          <div style="display: flex; gap: 1.5rem; align-items: center;">
            <span style="font-size: 0.875rem; color: var(--text-secondary);">
              Monthly Total: <strong style="color: var(--text);">Rs. {{ formatCurrency(totalSubscriptionsLKR) }}</strong>
            </span>
            <span v-if="upcomingSubscriptions.length > 0" class="text-danger" style="font-size: 1rem; font-weight: 600;">
              Total Due: Rs. {{ formatCurrency(totalUpcomingLKR) }}
            </span>
          </div>
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
import { Bar, Pie, Line } from 'vue-chartjs'
definePageMeta({
  middleware: 'auth'
})

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { usdToLkr, fetchRate } = useExchangeRate()

const isModalOpen = ref(false)
const loading = ref(true)
const transactions = ref([])
const ytdIncome = ref([])
const upcomingSubscriptions = ref([])
const allSubscriptions = ref([])

const now = new Date()
const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0)

const formatLocalDate = (date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

const startDate = ref(formatLocalDate(firstDay))
const endDate = ref(formatLocalDate(lastDay))

const formatCurrency = (val) => {
  if (val == null) return '0.00'
  return Number(val).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

const totalIncome = computed(() => transactions.value.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0))
const totalExpense = computed(() => transactions.value.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0))
const officeExpense = computed(() => transactions.value.filter(t => t.type === 'expense' && t.category === 'office').reduce((acc, t) => acc + t.amount, 0))
const personalExpense = computed(() => transactions.value.filter(t => t.type === 'expense' && t.category === 'personal').reduce((acc, t) => acc + t.amount, 0))
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

const totalSubscriptionsLKR = computed(() => {
  return allSubscriptions.value.reduce((acc, sub) => {
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
const incomeTypeBreakdownData = ref({ labels: [], datasets: [{ data: [] }] })
const expenseTypeBreakdownData = ref({ labels: [], datasets: [{ data: [] }] })
const incomeTrendChartData = ref({ labels: [], datasets: [] })
const momChartData = ref({ labels: [], datasets: [] })
const momPercentage = ref(0)

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

const lineChartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: { legend: { position: 'bottom', labels: { color: '#f8fafc' } } },
  scales: {
    y: { beginAtZero: true, grid: { color: 'rgba(255,255,255,0.1)' }, ticks: { color: '#94a3b8' } },
    x: { grid: { display: false }, ticks: { color: '#94a3b8' } }
  },
  elements: {
    line: { tension: 0.4 },
    point: { radius: 4, hoverRadius: 6 }
  }
}

const fetchData = async () => {
  loading.value = true
  chartDataLoaded.value = false

  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.value.id)
    .gte('date', startDate.value)
    .lte('date', endDate.value)
    .order('date', { ascending: false })

  if (data) {
    transactions.value = data
  }

  // Fetch YTD Income data
  const firstJan = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0]
  const { data: ytdData } = await supabase
    .from('transactions')
    .select('*')
    .eq('user_id', user.value.id)
    .eq('type', 'income')
    .gte('date', firstJan)
    .order('date', { ascending: true })

  if (ytdData) {
    ytdIncome.value = ytdData
  }

  // Now update charts based on all fetched data
  updateCharts()

  // Fetch subscriptions for upcoming
  const { data: subsData } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.value.id)

  if (subsData) {
    allSubscriptions.value = subsData
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

  // Type Breakdown Charts (Income & Expenses by Label)
  const getBaseLabel = (desc) => desc ? desc.split(' - ')[0].trim() : 'Other'

  const generatePieData = (txs, typeFilter) => {
    const grouped = {}
    txs.filter(t => t.type === typeFilter).forEach(t => {
      const label = typeFilter === 'income' ? (t.main_type || 'Other Income') : getBaseLabel(t.description)
      grouped[label] = (grouped[label] || 0) + t.amount
    })
    
    const labels = Object.keys(grouped)
    const data = Object.values(grouped)
    const colors = ['#3b82f6', '#8b5cf6', '#ec4899', '#f43f5e', '#f59e0b', '#10b981', '#14b8a6', '#6366f1', '#eab308', '#ef4444']
    
    return {
      labels,
      datasets: [{
        backgroundColor: labels.map((_, i) => colors[i % colors.length]),
        data,
        borderWidth: 0
      }]
    }
  }

  incomeTypeBreakdownData.value = generatePieData(transactions.value, 'income')
  expenseTypeBreakdownData.value = generatePieData(transactions.value, 'expense')

  // Trend Line Chart Data (Broken down by Type)
  const currentMonthIndex = now.getMonth()
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  const labelMonthlyTotals = {}
  const overallMonthlyTotals = Array(12).fill(0)

  ytdIncome.value.forEach(t => {
    const month = new Date(t.date).getMonth()
    overallMonthlyTotals[month] += t.amount

    const label = t.main_type || 'Other Income'
    if (!labelMonthlyTotals[label]) {
      labelMonthlyTotals[label] = Array(12).fill(0)
    }
    labelMonthlyTotals[label][month] += t.amount
  })
  
  const lineColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444']
  
  const lineDatasets = Object.keys(labelMonthlyTotals).map((label, index) => {
    const color = lineColors[index % lineColors.length]
    return {
      label: label,
      borderColor: color,
      backgroundColor: color,
      fill: false,
      data: labelMonthlyTotals[label].slice(0, currentMonthIndex + 1),
      tension: 0.4
    }
  })
  
  incomeTrendChartData.value = {
    labels: monthLabels.slice(0, currentMonthIndex + 1),
    datasets: lineDatasets.length > 0 ? lineDatasets : [{
      label: 'Income',
      borderColor: '#10b981',
      backgroundColor: 'rgba(16, 185, 129, 0.2)',
      fill: true,
      data: overallMonthlyTotals.slice(0, currentMonthIndex + 1)
    }]
  }

  // Month over Month Chart Data
  const thisMonthIncome = overallMonthlyTotals[currentMonthIndex]
  const lastMonthIncome = currentMonthIndex > 0 ? overallMonthlyTotals[currentMonthIndex - 1] : 0
  
  momChartData.value = {
    labels: ['Last Month', 'This Month'],
    datasets: [{
      backgroundColor: ['#94a3b8', '#10b981'],
      data: [lastMonthIncome, thisMonthIncome]
    }]
  }
  
  if (lastMonthIncome > 0) {
    momPercentage.value = (((thisMonthIncome - lastMonthIncome) / lastMonthIncome) * 100).toFixed(1)
  } else {
    momPercentage.value = thisMonthIncome > 0 ? 100 : 0
  }
  
  chartDataLoaded.value = true
}

onMounted(() => {
  fetchRate()
  fetchData()
})
</script>
