<template>
  <div>
    <div class="page-header">
      <h1 class="page-title">Subscriptions & Rentals</h1>
      <button @click="isModalOpen = true" class="btn-primary">+ Add Subscription</button>
    </div>

    <div v-if="loading" style="text-align: center; color: var(--text-secondary); padding: 2rem;">Loading data...</div>
    
    <div v-else class="glass-panel" style="padding: 1.5rem;">
      <div v-if="subscriptions.length === 0" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
        No subscriptions found.
      </div>
      <div v-else class="table-responsive">
        <table style="width: 100%; border-collapse: collapse; text-align: left;">
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Due Day</th>
              <th style="text-align: right;">Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="sub in subscriptions" :key="sub.id" style="border-bottom: 1px solid rgba(255,255,255,0.05);">
              <td>{{ sub.name }}</td>
              <td style="text-transform: capitalize;">{{ sub.category }}</td>
              <td>Day {{ sub.due_day }}</td>
              <td style="text-align: right; font-weight: 500;">
                <span v-if="sub.currency === 'USD'">
                  ${{ sub.amount.toFixed(2) }}
                  <span style="font-size: 0.75rem; color: var(--text-secondary); display: block;">
                    ≈ Rs. {{ (sub.amount * (usdToLkr || 300)).toFixed(2) }}
                  </span>
                </span>
                <span v-else>Rs. {{ sub.amount.toFixed(2) }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <SubscriptionModal :isOpen="isModalOpen" @close="isModalOpen = false" @saved="fetchData" />
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()
const { usdToLkr, fetchRate } = useExchangeRate()

const isModalOpen = ref(false)
const loading = ref(true)
const subscriptions = ref([])

const fetchData = async () => {
  loading.value = true
  const { data } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', user.value.id)
    .order('due_day', { ascending: true })

  if (data) subscriptions.value = data
  loading.value = false
}

onMounted(() => {
  fetchRate()
  fetchData()
})
</script>
