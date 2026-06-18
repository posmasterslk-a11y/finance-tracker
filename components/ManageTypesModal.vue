<template>
  <div class="modal-overlay" v-if="isOpen" @click.self="closeModal">
    <div class="modal-content glass-panel" style="max-width: 500px; max-height: 80vh; overflow-y: auto;">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
        <h3 style="font-size: 1.25rem; margin: 0;">Manage Transaction Types</h3>
        <button @click="closeModal" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.25rem;">&times;</button>
      </div>

      <div v-if="loading" style="text-align: center; color: var(--text-secondary); padding: 1rem;">Loading types...</div>
      
      <div v-else>
        <div v-if="types.length === 0" style="text-align: center; color: var(--text-secondary);">No custom types found.</div>
        
        <div v-for="t in types" :key="t.id" style="display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 0; border-bottom: 1px solid rgba(255,255,255,0.05);">
          
          <div v-if="editingId === t.id" style="display: flex; gap: 0.5rem; flex: 1;">
            <input type="text" v-model="editName" style="flex: 1; padding: 0.25rem 0.5rem; border-radius: 4px; background: rgba(0,0,0,0.2); border: 1px solid rgba(255,255,255,0.1); color: white;" />
            <button @click="saveEdit(t)" class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Save</button>
            <button @click="editingId = null" style="padding: 0.25rem 0.5rem; font-size: 0.75rem; background: transparent; color: var(--text); border: 1px solid rgba(255,255,255,0.2); border-radius: 4px; cursor: pointer;">Cancel</button>
          </div>
          
          <div v-else style="display: flex; align-items: center; justify-content: space-between; width: 100%;">
            <div style="display: flex; flex-direction: column;">
              <span>{{ t.name }}</span>
              <span style="font-size: 0.75rem; color: var(--text-secondary); text-transform: capitalize;">{{ t.type }}</span>
            </div>
            <div style="display: flex; gap: 0.5rem;">
              <button @click="startEdit(t)" class="btn-primary" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Edit</button>
              <button @click="deleteType(t.id)" class="btn-danger" style="padding: 0.25rem 0.5rem; font-size: 0.75rem;">Delete</button>
            </div>
          </div>

        </div>
      </div>
      
      <div v-if="errorMsg" style="color: var(--danger); font-size: 0.85rem; margin-top: 1rem;">{{ errorMsg }}</div>
      <div v-if="successMsg" style="color: var(--success); font-size: 0.85rem; margin-top: 1rem;">{{ successMsg }}</div>

    </div>
  </div>
</template>

<script setup>
const props = defineProps(['isOpen'])
const emit = defineEmits(['close', 'updated'])

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const loading = ref(false)
const types = ref([])
const errorMsg = ref('')
const successMsg = ref('')

const editingId = ref(null)
const editName = ref('')

const fetchTypes = async () => {
  loading.value = true
  const { data } = await supabase.from('transaction_types').select('*').eq('user_id', user.value.id).order('type').order('name')
  if (data) types.value = data
  loading.value = false
}

watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    errorMsg.value = ''
    successMsg.value = ''
    editingId.value = null
    fetchTypes()
  }
})

const closeModal = () => emit('close')

const startEdit = (t) => {
  editingId.value = t.id
  editName.value = t.name
  errorMsg.value = ''
  successMsg.value = ''
}

const deleteType = async (id) => {
  if (!confirm('Are you sure you want to delete this type? It will not delete past transactions, but will remove it from the dropdown.')) return
  
  const { error } = await supabase.from('transaction_types').delete().eq('id', id)
  if (error) {
    errorMsg.value = error.message
  } else {
    fetchTypes()
    emit('updated')
  }
}

const saveEdit = async (t) => {
  const newName = editName.value.trim()
  if (!newName) return
  if (newName === t.name) {
    editingId.value = null
    return
  }

  loading.value = true
  
  // 1. Update the type in transaction_types
  const { error: typeError } = await supabase.from('transaction_types').update({ name: newName }).eq('id', t.id)
  if (typeError) {
    errorMsg.value = typeError.message
    loading.value = false
    return
  }

  // 2. Update all old transactions that used this name
  const { data: txs } = await supabase.from('transactions').select('id, description').eq('user_id', user.value.id).like('description', `${t.name}%`)
  
  if (txs && txs.length > 0) {
    for (const tx of txs) {
      let newDesc = tx.description
      if (newDesc === t.name) {
        newDesc = newName
      } else if (newDesc.startsWith(`${t.name} - `)) {
        newDesc = newDesc.replace(`${t.name} - `, `${newName} - `)
      }
      
      if (newDesc !== tx.description) {
        await supabase.from('transactions').update({ description: newDesc }).eq('id', tx.id)
      }
    }
  }

  successMsg.value = `Updated "${t.name}" to "${newName}" and automatically migrated ${txs ? txs.length : 0} past transactions to the new name.`
  editingId.value = null
  fetchTypes()
  emit('updated')
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0; left: 0; right: 0; bottom: 0;
  background: rgba(0,0,0,0.6);
  backdrop-filter: blur(4px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 200;
}
.modal-content {
  width: 100%;
  padding: 2rem;
  background: var(--bg-card);
  border-radius: 16px;
}
</style>
