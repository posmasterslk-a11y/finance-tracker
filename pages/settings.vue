<template>
  <div class="page-container" style="max-width: 800px; margin: 0 auto;">
    <h2 style="margin-bottom: 2rem;">Settings</h2>

    <div class="glass-panel" style="padding: 2rem; margin-bottom: 2rem;">
      <h3 style="margin-bottom: 1.5rem;">Transaction Types</h3>
      <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 0.9rem;">
        Pre-define your income and expense types to quickly select them when adding new transactions.
      </p>

      <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
        <!-- Income Types -->
        <div>
          <h4 style="margin-bottom: 1rem; color: var(--success); display: flex; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 16 12 12 8 10"></polyline></svg>
            Income Types
          </h4>
          
          <form @submit.prevent="addType('income')" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <select v-model="newIncomeMainType" required style="width: 120px; flex-shrink: 0; padding: 0.5rem; border-radius: 8px; background: var(--bg-card); color: var(--text); border: 1px solid rgba(255,255,255,0.1);">
              <option value="Content Revenue">Content</option>
              <option value="Software Revenue">Software</option>
            </select>
            <input type="text" v-model="newIncomeType" placeholder="e.g., SLT Revenue" required style="flex: 1; min-width: 0;" />
            <button type="submit" class="btn btn-primary">+</button>
          </form>

          <div v-if="loading" style="text-align: center; padding: 1rem;">Loading...</div>
          <div v-else-if="incomeTypes.length === 0" style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 1rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
            No custom income types saved.
          </div>
          <ul v-else style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            <li v-for="type in incomeTypes" :key="type.id" class="type-item">
              <template v-if="editingId === type.id">
                <select v-model="editMainType" style="width: 100px; flex-shrink: 0; padding: 0.25rem; border-radius: 4px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; margin-right: 0.5rem;">
                  <option value="Content Revenue">Content</option>
                  <option value="Software Revenue">Software</option>
                </select>
                <input type="text" v-model="editName" style="flex: 1; min-width: 0; padding: 0.25rem 0.5rem; border-radius: 4px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; margin-right: 0.5rem;" />
                <div style="display: flex; gap: 0.25rem;">
                  <button @click="saveEdit(type)" style="background: var(--primary); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Save</button>
                  <button @click="editingId = null" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Cancel</button>
                </div>
              </template>
              <template v-else>
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                  <span>{{ type.name }}</span>
                  <span v-if="type.main_type" style="font-size: 0.65rem; background: rgba(255,255,255,0.1); padding: 0.1rem 0.4rem; border-radius: 12px; color: var(--text-secondary);">
                    {{ type.main_type === 'Content Revenue' ? 'Content' : 'Software' }}
                  </span>
                </div>
                <div style="display: flex; gap: 0.5rem;">
                  <button @click="startEdit(type)" class="btn-edit" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button @click="deleteType(type.id)" class="btn-delete" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>

        <!-- Expense Types -->
        <div>
          <h4 style="margin-bottom: 1rem; color: var(--danger); display: flex; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
            Expense Types
          </h4>
          
          <form @submit.prevent="addType('expense')" style="display: flex; gap: 0.5rem; margin-bottom: 1rem;">
            <input type="text" v-model="newExpenseType" placeholder="e.g., Internet Bill" required style="flex: 1;" />
            <button type="submit" class="btn btn-primary">+</button>
          </form>

          <div v-if="loading" style="text-align: center; padding: 1rem;">Loading...</div>
          <div v-else-if="expenseTypes.length === 0" style="color: var(--text-secondary); font-size: 0.9rem; text-align: center; padding: 1rem; border: 1px dashed rgba(255,255,255,0.1); border-radius: 8px;">
            No custom expense types saved.
          </div>
          <ul v-else style="list-style: none; padding: 0; display: flex; flex-direction: column; gap: 0.5rem;">
            <li v-for="type in expenseTypes" :key="type.id" class="type-item">
              <template v-if="editingId === type.id">
                <input type="text" v-model="editName" style="flex: 1; padding: 0.25rem 0.5rem; border-radius: 4px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white; margin-right: 0.5rem;" />
                <div style="display: flex; gap: 0.25rem;">
                  <button @click="saveEdit(type)" style="background: var(--primary); border: none; color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Save</button>
                  <button @click="editingId = null" style="background: transparent; border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.25rem 0.5rem; border-radius: 4px; font-size: 0.8rem; cursor: pointer;">Cancel</button>
                </div>
              </template>
              <template v-else>
                <span>{{ type.name }}</span>
                <div style="display: flex; gap: 0.5rem;">
                  <button @click="startEdit(type)" class="btn-edit" title="Edit">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  </button>
                  <button @click="deleteType(type.id)" class="btn-delete" title="Delete">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(true)
const types = ref([])

const newIncomeType = ref('')
const newIncomeMainType = ref('Content Revenue')
const newExpenseType = ref('')

const incomeTypes = computed(() => types.value.filter(t => t.type === 'income'))
const expenseTypes = computed(() => types.value.filter(t => t.type === 'expense'))

const fetchTypes = async () => {
  loading.value = true
  const { data, error } = await supabase
    .from('transaction_types')
    .select('*')
    .eq('user_id', user.value.id)
    .order('name')
  
  if (data) {
    console.log("fetchTypes returned:", data)
    types.value = data
  }
  loading.value = false
}

const addType = async (categoryType) => {
  const name = categoryType === 'income' ? newIncomeType.value : newExpenseType.value
  if (!name.trim()) return

  const payload = {
    user_id: user.value.id,
    type: categoryType,
    name: name.trim()
  }
  
  if (categoryType === 'income') {
    payload.main_type = newIncomeMainType.value
  }

  const { error } = await supabase.from('transaction_types').insert(payload)

  if (!error) {
    if (categoryType === 'income') newIncomeType.value = ''
    else newExpenseType.value = ''
    fetchTypes()
  }
}

const deleteType = async (id) => {
  if (!confirm('Are you sure you want to delete this type?')) return
  const { error } = await supabase.from('transaction_types').delete().eq('id', id)
  if (!error) fetchTypes()
}

const editingId = ref(null)
const editName = ref('')
const editMainType = ref('Content Revenue')

const startEdit = (t) => {
  editingId.value = t.id
  editName.value = t.name
  editMainType.value = t.main_type || 'Content Revenue'
}

const saveEdit = async (t) => {
  console.log("saveEdit called for:", t.name)
  const newName = editName.value.trim()
  if (!newName) return
  
  const mainTypeChanged = t.type === 'income' && editMainType.value !== t.main_type
  console.log("newName:", newName, "mainTypeChanged:", mainTypeChanged)
  
  if (newName === t.name && !mainTypeChanged) {
    console.log("No changes detected, returning early.")
    editingId.value = null
    return
  }

  loading.value = true
  
  console.log("Updating transaction_types...")
  // 1. Update the type in transaction_types
  const { data: updatedData, error: typeError } = await supabase.from('transaction_types').update({ 
    name: newName, 
    main_type: t.type === 'income' ? editMainType.value : null 
  }).eq('id', t.id).select()
  
  console.log("Returned data from update:", updatedData)
  
  if (typeError) {
    console.error("typeError:", typeError)
    alert("Error saving type: " + typeError.message)
    loading.value = false
    return
  }

  console.log("transaction_types updated! Closing edit box.")

  // Close the edit box and refresh the types list immediately
  editingId.value = null
  fetchTypes()

  // 2. Update all old transactions that used this name (in background concurrently)
  const { data: txs } = await supabase.from('transactions').select('id, description').eq('user_id', user.value.id).like('description', `${t.name}%`)
  
  if (txs && txs.length > 0) {
    const updatePromises = txs.map(tx => {
      let newDesc = tx.description
      if (newDesc === t.name) {
        newDesc = newName
      } else if (newDesc.startsWith(`${t.name} - `)) {
        newDesc = newDesc.replace(`${t.name} - `, `${newName} - `)
      }
      
      let updateObj = {}
      if (newDesc !== tx.description) {
        updateObj.description = newDesc
      }
      // Also update main_type on the transaction if it changed
      if (t.type === 'income' && editMainType.value !== t.main_type) {
        updateObj.main_type = editMainType.value
      }

      if (Object.keys(updateObj).length > 0) {
        return supabase.from('transactions').update(updateObj).eq('id', tx.id)
      }
      return null
    }).filter(p => p !== null)

    if (updatePromises.length > 0) {
      await Promise.all(updatePromises)
    }
  }
}

onMounted(() => {
  fetchTypes()
})
</script>

<style scoped>
.type-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  font-size: 0.9rem;
}

.btn-delete, .btn-edit {
  background: none;
  border: none;
  color: var(--text-secondary);
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-delete:hover, .btn-edit:hover {
  color: var(--danger);
  background: rgba(255, 99, 132, 0.1);
}
</style>
