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

      <!-- Content Analytics (New) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
        <h2 style="font-size: 1.25rem; margin: 0;">Content Revenue Analytics (Year to Date)</h2>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="contentTrendYear" style="font-size: 0.85rem; color: var(--text-secondary);">Start Year:</label>
          <select 
            id="contentTrendYear"
            v-model="contentTrendStartYear" 
            @change="fetchTrendData"
            style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;"
          >
            <option v-for="year in availableYears" :key="year" :value="year" style="color: black;">
              {{ year }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="dashboard-charts" style="margin-bottom: 2rem;">
        <!-- Content Trend -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 0.5rem;">Content Revenue Trend</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Monthly income starting from January</p>
          <Line v-if="chartDataLoaded" :data="contentTrendChartData" :options="lineChartOptions" style="max-height: 300px;" />
        </div>
        <!-- Content MoM Comparison -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 0.5rem;">This Month vs Last Month</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Comparing total content revenue</p>
          <Bar v-if="chartDataLoaded" :data="contentMomChartData" :options="chartOptions" style="max-height: 300px;" />
          <div v-if="chartDataLoaded" style="text-align: center; margin-top: 1rem;">
            <span :class="contentMomPercentage >= 0 ? 'text-success' : 'text-danger'" style="font-size: 1.25rem; font-weight: 600;">
              {{ contentMomPercentage >= 0 ? '+' : '' }}{{ contentMomPercentage }}%
            </span>
            <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">vs last month</span>
          </div>
        </div>
      </div>

      <!-- Content Revenue Variance (Progress Bars) -->
      <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="margin-bottom: 0.5rem;">Content Revenue Change (Last Month vs Previous Month)</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Revenue drop or growth by individual content type</p>
        
        <div v-if="!chartDataLoaded" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading data...</div>
        <div v-else-if="contentVariances.length === 0" style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No variance data available.</div>
        
        <div v-else style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div v-for="item in contentVariances" :key="item.type" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span style="font-weight: 500;">{{ item.type }}</span>
              <div :class="item.isDrop ? 'text-danger' : 'text-success'" style="text-align: right;">
                <div style="font-weight: 600;">
                  {{ item.isDrop ? 'Drop: -Rs' : 'Growth: +Rs' }} {{ Math.abs(item.variance).toLocaleString() }}
                </div>
                <div style="font-size: 0.8rem; opacity: 0.8; font-weight: 500;">
                  {{ item.isDrop ? '-' : '+' }}${{ Math.abs(item.usdVariance).toFixed(2) }}
                </div>
              </div>
            </div>
            <div style="height: 10px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; display: flex;">
              <div :style="{ width: item.barWidth + '%', background: item.isDrop ? '#ef4444' : '#10b981', borderRadius: '5px', transition: 'width 0.5s ease' }"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
              <div>
                <span>{{ lastMonthStr }}: Rs {{ item.lastMonth.toLocaleString() }}</span>
                <span style="margin-left: 0.25rem; opacity: 0.8;">(${{ item.lastMonthUsd.toFixed(2) }})</span>
              </div>
              <div>
                <span>{{ thisMonthStr }}: Rs {{ item.thisMonth.toLocaleString() }}</span>
                <span style="margin-left: 0.25rem; opacity: 0.8;">(${{ item.thisMonthUsd.toFixed(2) }})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Software Analytics (New) -->
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; margin-top: 3rem;">
        <h2 style="font-size: 1.25rem; margin: 0;">Software Revenue Analytics (Year to Date)</h2>
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <label for="softwareTrendYear" style="font-size: 0.85rem; color: var(--text-secondary);">Start Year:</label>
          <select 
            id="softwareTrendYear"
            v-model="softwareTrendStartYear" 
            @change="fetchTrendData"
            style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; cursor: pointer; font-size: 0.85rem;"
          >
            <option v-for="year in availableYears" :key="year" :value="year" style="color: black;">
              {{ year }}
            </option>
          </select>
        </div>
      </div>
      
      <div class="dashboard-charts" style="margin-bottom: 2rem;">
        <!-- Software Trend -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 0.5rem;">Software Revenue Trend</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Monthly income starting from January</p>
          <Line v-if="chartDataLoaded" :data="softwareTrendChartData" :options="lineChartOptions" style="max-height: 300px;" />
        </div>
        <!-- Software MoM Comparison -->
        <div class="glass-panel" style="padding: 1.5rem;">
          <h3 style="margin-bottom: 0.5rem;">This Month vs Last Month</h3>
          <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Comparing total software revenue</p>
          <Bar v-if="chartDataLoaded" :data="softwareMomChartData" :options="chartOptions" style="max-height: 300px;" />
          <div v-if="chartDataLoaded" style="text-align: center; margin-top: 1rem;">
            <span :class="softwareMomPercentage >= 0 ? 'text-success' : 'text-danger'" style="font-size: 1.25rem; font-weight: 600;">
              {{ softwareMomPercentage >= 0 ? '+' : '' }}{{ softwareMomPercentage }}%
            </span>
            <span style="font-size: 0.85rem; color: var(--text-secondary); margin-left: 0.5rem;">vs last month</span>
          </div>
        </div>
      </div>

      <!-- Software Revenue Variance (Progress Bars) -->
      <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
        <h3 style="margin-bottom: 0.5rem;">Software Revenue Change (Last Month vs Previous Month)</h3>
        <p style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 1.5rem;">Revenue drop or growth by individual software type</p>
        
        <div v-if="!chartDataLoaded" style="text-align: center; padding: 2rem; color: var(--text-secondary);">Loading data...</div>
        <div v-else-if="softwareVariances.length === 0" style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">No variance data available.</div>
        
        <div v-else style="display: flex; flex-direction: column; gap: 1.5rem;">
          <div v-for="item in softwareVariances" :key="item.type" style="display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; font-size: 0.95rem;">
              <span style="font-weight: 500;">{{ item.type }}</span>
              <span :class="item.isDrop ? 'text-danger' : 'text-success'" style="font-weight: 600;">
                {{ item.isDrop ? 'Drop: -Rs' : 'Growth: +Rs' }} {{ Math.abs(item.variance).toLocaleString() }}
              </span>
            </div>
            <div style="height: 10px; width: 100%; background: rgba(255,255,255,0.05); border-radius: 5px; overflow: hidden; display: flex;">
              <div :style="{ width: item.barWidth + '%', background: item.isDrop ? '#ef4444' : '#10b981', borderRadius: '5px', transition: 'width 0.5s ease' }"></div>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-secondary);">
              <span>{{ lastMonthStr }}: Rs {{ item.lastMonth.toLocaleString() }}</span>
              <span>{{ thisMonthStr }}: Rs {{ item.thisMonth.toLocaleString() }}</span>
            </div>
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

const contentTrendStartYear = ref(now.getFullYear())
const softwareTrendStartYear = ref(now.getFullYear())
const availableYears = computed(() => {
  const years = []
  for (let y = now.getFullYear(); y >= 2020; y--) {
    years.push(y)
  }
  return years
})

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
const contentTrendChartData = ref({ labels: [], datasets: [] })
const softwareTrendChartData = ref({ labels: [], datasets: [] })
const contentMomChartData = ref({ labels: [], datasets: [] })
const contentMomPercentage = ref(0)
const softwareMomChartData = ref({ labels: [], datasets: [] })
const softwareMomPercentage = ref(0)
const softwareVariances = ref([])
const contentVariances = ref([])
const lastMonthStr = ref('Last Month')
const thisMonthStr = ref('This Month')

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
  if (!user.value) return
  
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

  // Fetch YTD Income data (from earliest selected year)
  const earliestYear = Math.min(contentTrendStartYear.value, softwareTrendStartYear.value)
  const firstJan = new Date(earliestYear, 0, 1).toISOString().split('T')[0]
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

// Quietly fetch only the YTD Income data and refresh the charts smoothly without showing a loading spinner
const fetchTrendData = async () => {
  if (!user.value) return
  
  const earliestYear = Math.min(contentTrendStartYear.value, softwareTrendStartYear.value)
  const firstJan = new Date(earliestYear, 0, 1).toISOString().split('T')[0]
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
  
  updateCharts()
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

  // Trend Line Chart Data (Broken down by Main Type -> Types)
  const endYear = now.getFullYear()
  const currentMonthIndex = now.getMonth()
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  
  // Build Content Labels
  const contentMonthLabels = []
  for (let y = contentTrendStartYear.value; y <= endYear; y++) {
    const limit = (y === endYear) ? currentMonthIndex : 11
    for (let m = 0; m <= limit; m++) {
      contentMonthLabels.push(`${monthNames[m]} ${y}`)
    }
  }
  const contentNumMonths = contentMonthLabels.length
  
  // Build Software Labels
  const softwareMonthLabels = []
  for (let y = softwareTrendStartYear.value; y <= endYear; y++) {
    const limit = (y === endYear) ? currentMonthIndex : 11
    for (let m = 0; m <= limit; m++) {
      softwareMonthLabels.push(`${monthNames[m]} ${y}`)
    }
  }
  const softwareNumMonths = softwareMonthLabels.length

  if (contentNumMonths > 0) {
    const currentBucketStr = contentMonthLabels[contentNumMonths - 1] // e.g. "Jun 2026"
    const parts = currentBucketStr.split(' ')
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const monthIdx = monthNames.indexOf(parts[0])
    
    // Shift labels back by 1 month because current bucket holds previous month's revenue
    const revenueMonth1 = monthNames[(monthIdx - 1 + 12) % 12]
    const revenueMonth2 = monthNames[(monthIdx - 2 + 12) % 12]
    
    thisMonthStr.value = `${revenueMonth1} Revenue`
    lastMonthStr.value = `${revenueMonth2} Revenue`
  }

  const contentMonthlyTotals = {}
  const contentMonthlyUsdTotals = {}
  const softwareMonthlyTotals = {}

  // Aggregate Data over Time
  const contentOverallMonthlyTotals = new Array(contentNumMonths).fill(0)
  const softwareOverallMonthlyTotals = Array(softwareNumMonths).fill(0)

  ytdIncome.value.forEach(t => {
    const dateObj = new Date(t.date)
    const tYear = dateObj.getFullYear()
    const tMonth = dateObj.getMonth()
    
    const label = getBaseLabel(t.description)
    
    if (t.main_type === 'Content Revenue' || (!t.main_type && t.type === 'income')) {
      const index = (tYear - contentTrendStartYear.value) * 12 + tMonth
      if (index >= 0 && index < contentNumMonths) {
        contentOverallMonthlyTotals[index] += t.amount
        if (!contentMonthlyTotals[label]) {
          contentMonthlyTotals[label] = Array(contentNumMonths).fill(0)
          contentMonthlyUsdTotals[label] = Array(contentNumMonths).fill(0)
        }
        contentMonthlyTotals[label][index] += t.amount
        contentMonthlyUsdTotals[label][index] += t.currency === 'USD' ? (t.original_amount || 0) : (t.amount / (usdToLkr.value || 300))
      }
    } else if (t.main_type === 'Software Revenue') {
      const index = (tYear - softwareTrendStartYear.value) * 12 + tMonth
      if (index >= 0 && index < softwareNumMonths) {
        softwareOverallMonthlyTotals[index] += t.amount
        if (!softwareMonthlyTotals[label]) softwareMonthlyTotals[label] = Array(softwareNumMonths).fill(0)
        softwareMonthlyTotals[label][index] += t.amount
      }
    }
  })
  
  const lineColors = ['#10b981', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4', '#eab308', '#ef4444', '#14b8a6', '#f43f5e']
  
  const buildLineDatasets = (monthlyTotalsObj) => {
    return Object.keys(monthlyTotalsObj).map((label, index) => {
      const color = lineColors[index % lineColors.length]
      return {
        label: label,
        borderColor: color,
        backgroundColor: color,
        fill: false,
        data: monthlyTotalsObj[label],
        tension: 0.4
      }
    })
  }
  
  contentTrendChartData.value = {
    labels: contentMonthLabels,
    datasets: buildLineDatasets(contentMonthlyTotals)
  }

  softwareTrendChartData.value = {
    labels: softwareMonthLabels,
    datasets: buildLineDatasets(softwareMonthlyTotals)
  }

  // Month over Month Chart Data Logic
  const calculateMom = (overallTotalsArray, numMonths) => {
    const thisMonth = overallTotalsArray[numMonths - 1] || 0
    const lastMonth = numMonths > 1 ? overallTotalsArray[numMonths - 2] : 0
    let percentage = 0
    if (lastMonth > 0) percentage = (((thisMonth - lastMonth) / lastMonth) * 100).toFixed(1)
    else percentage = thisMonth > 0 ? 100 : 0

    return {
      chartData: {
        labels: ['Last Month', 'This Month'],
        datasets: [{ backgroundColor: ['#94a3b8', '#10b981'], data: [lastMonth, thisMonth] }]
      },
      percentage
    }
  }

  const contentMom = calculateMom(contentOverallMonthlyTotals, contentNumMonths)
  contentMomChartData.value = contentMom.chartData
  contentMomPercentage.value = contentMom.percentage
  
  // Calculate Content Variances for Progress Bars
  const contentVars = []
  let contentMaxAbsVariance = 0

  Object.keys(contentMonthlyTotals).forEach(type => {
    const dataArray = contentMonthlyTotals[type]
    const usdArray = contentMonthlyUsdTotals[type]
    
    const thisMonth = contentNumMonths > 0 ? dataArray[contentNumMonths - 1] : 0
    const lastMonth = contentNumMonths > 1 ? dataArray[contentNumMonths - 2] : 0
    
    const thisMonthUsd = contentNumMonths > 0 ? usdArray[contentNumMonths - 1] : 0
    const lastMonthUsd = contentNumMonths > 1 ? usdArray[contentNumMonths - 2] : 0
    
    const variance = thisMonth - lastMonth
    const usdVariance = thisMonthUsd - lastMonthUsd
    
    if (variance !== 0 || thisMonth > 0 || lastMonth > 0) {
      if (Math.abs(variance) > contentMaxAbsVariance) contentMaxAbsVariance = Math.abs(variance)
      contentVars.push({
        type,
        thisMonth,
        lastMonth,
        thisMonthUsd,
        lastMonthUsd,
        variance,
        usdVariance,
        isDrop: variance < 0
      })
    }
  })

  contentVars.forEach(v => {
    v.barWidth = contentMaxAbsVariance > 0 ? (Math.abs(v.variance) / contentMaxAbsVariance) * 100 : 0
  })

  contentVariances.value = contentVars.sort((a, b) => a.variance - b.variance)

  const softwareMom = calculateMom(softwareOverallMonthlyTotals, softwareNumMonths)
  softwareMomChartData.value = softwareMom.chartData
  softwareMomPercentage.value = softwareMom.percentage
  
  // Calculate Software Variances for Progress Bars
  const variances = []
  let maxAbsVariance = 0

  Object.keys(softwareMonthlyTotals).forEach(type => {
    const dataArray = softwareMonthlyTotals[type]
    const thisMonth = softwareNumMonths > 0 ? dataArray[softwareNumMonths - 1] : 0
    const lastMonth = softwareNumMonths > 1 ? dataArray[softwareNumMonths - 2] : 0
    
    const variance = thisMonth - lastMonth
    if (variance !== 0 || thisMonth > 0 || lastMonth > 0) {
      if (Math.abs(variance) > maxAbsVariance) maxAbsVariance = Math.abs(variance)
      variances.push({
        type,
        thisMonth,
        lastMonth,
        variance,
        isDrop: variance < 0
      })
    }
  })

  // Calculate percentage width for visual bars relative to the biggest variance
  variances.forEach(v => {
    v.barWidth = maxAbsVariance > 0 ? (Math.abs(v.variance) / maxAbsVariance) * 100 : 0
  })

  // Sort by biggest drop first, then biggest growth
  softwareVariances.value = variances.sort((a, b) => a.variance - b.variance)

  chartDataLoaded.value = true
}

onMounted(() => {
  fetchRate()
})

watch(user, (newUser) => {
  if (newUser) {
    fetchData()
  }
}, { immediate: true })
</script>
