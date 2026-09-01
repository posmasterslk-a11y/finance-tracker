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
            <div v-if="borrowedDebts.length > 0" style="display: flex; gap: 1.5rem; font-size: 0.875rem;">
              <span style="color: var(--text-secondary);">Total Debt: <strong class="text-danger">Rs. {{ formatCurrency(totalBorrowedOwed) }}</strong></span>
              <span style="color: var(--text-secondary);">Total Paid: <strong class="text-success">Rs. {{ formatCurrency(totalBorrowedPaid) }}</strong></span>
              <span style="color: var(--text-secondary);">Remaining: <strong style="color: var(--text);">Rs. {{ formatCurrency(totalBorrowedOwed - totalBorrowedPaid) }}</strong></span>
            </div>
          </div>
          <button @click="openAddDebtModal('borrowed')" class="btn-primary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">+ Add Debt</button>
        </div>

        <div v-if="borrowedDebts.length === 0" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
          No active debts found.
        </div>
        <div v-else style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
          <div v-for="debt in borrowedDebts" :key="debt.id" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: flex-start;">
              <strong style="font-size: 1.1rem;">{{ debt.name }}</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span :class="debt.status === 'completed' ? 'text-success' : 'text-danger'" style="text-transform: capitalize; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1);">{{ debt.status === 'completed' ? 'Paid Off' : 'Active' }}</span>
                <button @click="deleteDebt(debt.id)" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0; display: flex;" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
              Date Borrowed: <strong>{{ new Date(debt.created_at).toLocaleDateString() }}</strong> <br>
              Total: <strong>Rs. {{ debt.total_amount.toLocaleString() }}</strong> <br>
              Paid: <strong class="text-success">Rs. {{ debt.paid_amount.toLocaleString() }}</strong> <br>
              Balance: <strong style="color: var(--text);">Rs. {{ (debt.total_amount - debt.paid_amount).toLocaleString() }}</strong> <br>
              <span v-if="debt.due_date" style="display: inline-block; margin-top: 0.5rem; color: #f59e0b;">
                Return Date: <strong>{{ new Date(debt.due_date).toLocaleDateString() }}</strong>
              </span>
            </div>
            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-bottom: 1rem; overflow: hidden;">
              <div :style="`width: ${Math.min((debt.paid_amount / debt.total_amount) * 100, 100)}%; background: var(--success); height: 100%;`"></div>
            </div>
            <button v-if="debt.status !== 'completed'" @click="openPayDebtModal(debt, 'borrowed')" class="btn-primary" style="width: 100%; padding: 0.5rem; font-size: 0.9rem; margin-bottom: 0.5rem;">Make Payment</button>
            
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

      <!-- Money Lent Section -->
      <div class="glass-panel" style="padding: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem;">
          <div>
            <h2 style="font-size: 1.25rem; margin-bottom: 0.5rem;">Money Lent (Owed to Me)</h2>
            <div v-if="lentDebts.length > 0" style="display: flex; gap: 1.5rem; font-size: 0.875rem;">
              <span style="color: var(--text-secondary);">Total Lent: <strong class="text-danger">Rs. {{ formatCurrency(totalLentOwed) }}</strong></span>
              <span style="color: var(--text-secondary);">Total Received: <strong class="text-success">Rs. {{ formatCurrency(totalLentPaid) }}</strong></span>
              <span style="color: var(--text-secondary);">Remaining: <strong style="color: var(--text);">Rs. {{ formatCurrency(totalLentOwed - totalLentPaid) }}</strong></span>
            </div>
          </div>
          <button @click="openAddDebtModal('lent')" class="btn-primary" style="font-size: 0.875rem; padding: 0.5rem 1rem;">+ Add Loan Given</button>
        </div>

        <div v-if="lentDebts.length === 0" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
          No active loans found.
        </div>
        <div v-else style="display: grid; gap: 1rem; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));">
          <div v-for="debt in lentDebts" :key="debt.id" style="background: rgba(255,255,255,0.05); padding: 1rem; border-radius: 8px;">
            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem; align-items: flex-start;">
              <strong style="font-size: 1.1rem;">{{ debt.name }}</strong>
              <div style="display: flex; gap: 0.5rem; align-items: center;">
                <span :class="debt.status === 'completed' ? 'text-success' : 'text-danger'" style="text-transform: capitalize; font-size: 0.8rem; padding: 2px 6px; border-radius: 4px; background: rgba(255,255,255,0.1);">{{ debt.status === 'completed' ? 'Paid Off' : 'Active' }}</span>
                <button @click="deleteDebt(debt.id)" style="background: none; border: none; color: var(--danger); cursor: pointer; padding: 0; display: flex;" title="Delete">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                </button>
              </div>
            </div>
            <div style="margin-bottom: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
              Date Lent: <strong>{{ new Date(debt.created_at).toLocaleDateString() }}</strong> <br>
              Total Lent: <strong>Rs. {{ debt.total_amount.toLocaleString() }}</strong> <br>
              Received: <strong class="text-success">Rs. {{ debt.paid_amount.toLocaleString() }}</strong> <br>
              Balance: <strong style="color: var(--text);">Rs. {{ (debt.total_amount - debt.paid_amount).toLocaleString() }}</strong> <br>
              <span v-if="debt.due_date" style="display: inline-block; margin-top: 0.5rem; color: #f59e0b;">
                Return Date: <strong>{{ new Date(debt.due_date).toLocaleDateString() }}</strong>
              </span>
            </div>
            <div style="width: 100%; background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; margin-bottom: 1rem; overflow: hidden;">
              <div :style="`width: ${Math.min((debt.paid_amount / debt.total_amount) * 100, 100)}%; background: var(--success); height: 100%;`"></div>
            </div>
            <button v-if="debt.status !== 'completed'" @click="openPayDebtModal(debt, 'lent')" class="btn-primary" style="width: 100%; padding: 0.5rem; font-size: 0.9rem; margin-bottom: 0.5rem;">Receive Payment</button>
            
            <!-- History Toggle -->
            <button @click="toggleHistory(debt.id)" style="width: 100%; background: transparent; border: 1px solid rgba(255,255,255,0.1); color: var(--text-secondary); padding: 0.5rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">
              {{ expandedHistory === debt.id ? 'Hide History' : 'View History' }}
            </button>

            <!-- History Dropdown -->
            <div v-if="expandedHistory === debt.id" style="margin-top: 1rem; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 1rem;">
              <h4 style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Payment History</h4>
              <div v-if="getDebtPayments(debt.id).length === 0" style="font-size: 0.8rem; color: var(--text-secondary); font-style: italic;">
                No payments received yet.
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
        <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <input type="month" v-model="selectedMonth" style="padding: 0.4rem 0.75rem; font-size: 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text); outline: none;" title="Filter by month" />
            <button v-if="selectedMonth" @click="selectedMonth = ''" style="background: rgba(255,255,255,0.1); border: none; color: var(--text); cursor: pointer; border-radius: 50%; width: 24px; height: 24px; display: flex; align-items: center; justify-content: center; font-size: 12px;" title="Clear Month">✕</button>
          </div>
          <input type="text" v-model="searchQuery" placeholder="Search description..." style="padding: 0.4rem 0.75rem; font-size: 0.85rem; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: var(--text); outline: none; width: 200px;" />
          <div style="display: flex; gap: 0.5rem; background: rgba(0,0,0,0.2); padding: 0.25rem; border-radius: 8px;">
          <button @click="typeFilter = 'all'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'all' ? 'background: var(--primary);' : 'background: transparent;'">All</button>
          <button @click="typeFilter = 'income'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'income' ? 'background: var(--success);' : 'background: transparent;'">Income</button>
            <button @click="typeFilter = 'expense'" style="padding: 0.25rem 0.75rem; border-radius: 6px; font-size: 0.85rem; border: none; color: var(--text); cursor: pointer;" :style="typeFilter === 'expense' ? 'background: var(--danger);' : 'background: transparent;'">Expense</button>
          </div>
        </div>
      </div>

      <div v-if="selectedMonth && allExpensesSorted.length > 0" style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.2); border-radius: 12px; padding: 1.5rem; margin-bottom: 2rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; flex-wrap: wrap; gap: 1rem;">
          <h3 style="margin: 0; font-size: 1.1rem; color: var(--danger); display: flex; align-items: center; gap: 0.5rem;">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20"></path><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
            {{ showAllExpenses ? 'All Expenses' : 'Highest Expenses' }} for {{ new Date(selectedMonth + '-01').toLocaleString('default', { month: 'long', year: 'numeric' }) }}
          </h3>
          <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button @click="isChartModalOpen = true" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--danger); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s;">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.21 15.89A10 10 0 1 1 8 2.83"></path><path d="M22 12A10 10 0 0 0 12 2v10z"></path></svg>
              View Chart
            </button>
            <button @click="showAllExpenses = !showAllExpenses" style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3); color: var(--danger); padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: flex; align-items: center; gap: 0.5rem; transition: background 0.2s;">
              <svg v-if="!showAllExpenses" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"></polyline></svg>
              {{ showAllExpenses ? 'Show Top 30 Only' : 'View All Expenses' }}
            </button>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem;" :style="showAllExpenses ? 'max-height: 400px; overflow-y: auto; padding-right: 0.5rem;' : ''">
          <div v-for="(expense, index) in displayedExpenses" :key="expense.id" style="background: rgba(0,0,0,0.2); padding: 0.75rem 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border-left: 4px solid var(--danger);">
            <div style="display: flex; align-items: center; gap: 1rem;">
              <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 600; min-width: 30px;">#{{ index + 1 }}</span>
              <div>
                <strong style="display: flex; align-items: center; font-size: 1rem; color: var(--text);">
                  {{ expense.description }}
                  <span v-if="expense.count > 1" style="font-size: 0.7rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 12px; margin-left: 0.5rem; color: var(--text-secondary); white-space: nowrap;">
                    {{ expense.count }} payments
                  </span>
                </strong>
                <span style="font-size: 0.8rem; color: var(--text-secondary);">{{ expense.count > 1 ? 'Last payment: ' : '' }}{{ new Date(expense.date).toLocaleDateString() }}</span>
              </div>
            </div>
            <strong class="text-danger" style="font-size: 1.1rem;">Rs. {{ formatCurrency(expense.amount) }}</strong>
          </div>
        </div>
        
        <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(239, 68, 68, 0.2); display: flex; justify-content: flex-end; align-items: center; gap: 1rem;">
          <span style="font-size: 1rem; color: var(--text-secondary);">Total {{ showAllExpenses ? 'Expenses' : 'Top 30 Expenses' }} :</span>
          <strong class="text-danger" style="font-size: 1.25rem;">Rs. {{ formatCurrency(displayedExpenses.reduce((sum, exp) => sum + exp.amount, 0)) }}</strong>
        </div>
        <div v-if="!showAllExpenses" style="display: flex; justify-content: flex-end; align-items: center; gap: 1rem; margin-top: 0.5rem;">
          <span style="font-size: 0.9rem; color: var(--text-secondary);">Total Monthly Expenses :</span>
          <strong class="text-danger" style="font-size: 1.1rem;">Rs. {{ formatCurrency(totalMonthExpenses) }}</strong>
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
    <DebtModal :isOpen="isDebtModalOpen" :paymentDebt="paymentDebtData" :debtType="currentDebtType" @close="closeDebtModal" @saved="fetchData" />
    
    <!-- Chart Modal -->
    <div v-if="isChartModalOpen" style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.6); backdrop-filter: blur(4px); display: flex; justify-content: center; align-items: center; z-index: 1000; padding: 1rem;" @click.self="isChartModalOpen = false">
      <div class="glass-panel" style="background: var(--bg-card); width: 100%; max-width: 900px; max-height: 90vh; display: flex; flex-direction: column; padding: 2rem; border-radius: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.5);">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
          <h3 style="margin: 0; font-size: 1.25rem;">Expenses Breakdown</h3>
          <button @click="isChartModalOpen = false" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; line-height: 1; padding: 0;">&times;</button>
        </div>
        
        <div style="display: flex; gap: 2rem; flex: 1; min-height: 0; flex-wrap: wrap; overflow-y: auto;">
          <div style="flex: 1; min-width: 300px; display: flex; justify-content: center; align-items: center; min-height: 350px;">
            <Pie v-if="expensePieChartData.labels.length > 0" :data="expensePieChartData" :options="pieChartOptions" style="max-height: 350px; width: 100%;" />
            <div v-else style="color: var(--text-secondary);">No expense data available for this month.</div>
          </div>
          
          <div style="flex: 1; min-width: 300px; max-height: 400px; overflow-y: auto; padding-right: 0.5rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <div style="display: flex; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 0.5rem; margin-bottom: 0.5rem;">
              <span style="font-weight: 600; color: var(--text-secondary); font-size: 0.9rem;">Narration</span>
              <span style="font-weight: 600; color: var(--text-secondary); font-size: 0.9rem;">Amount</span>
            </div>
            <div v-for="expense in allExpensesSorted" :key="expense.id" style="display: flex; justify-content: space-between; padding: 0.6rem 0.8rem; background: rgba(0,0,0,0.2); border-radius: 6px;">
              <div style="display: flex; align-items: center; gap: 0.5rem;">
                <span style="font-size: 0.9rem;">{{ expense.description }}</span>
                <span v-if="expense.count > 1" style="font-size: 0.7rem; background: rgba(255,255,255,0.1); padding: 2px 6px; border-radius: 12px; color: var(--text-secondary);">x{{ expense.count }}</span>
              </div>
              <strong class="text-danger" style="font-size: 0.95rem;">Rs. {{ formatCurrency(expense.amount) }}</strong>
            </div>
            <div v-if="allExpensesSorted.length === 0" style="text-align: center; color: var(--text-secondary); padding: 1rem;">
              No expenses to show.
            </div>
            <div style="display: flex; justify-content: space-between; padding-top: 1rem; margin-top: 0.5rem; border-top: 1px solid rgba(255,255,255,0.1);">
              <strong style="color: var(--text);">Total</strong>
              <strong class="text-danger" style="font-size: 1.15rem;">Rs. {{ formatCurrency(totalMonthExpenses) }}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Bar, Pie } from 'vue-chartjs'

definePageMeta({ middleware: 'auth' })

const supabase = useSupabaseClient()
const user = useSupabaseUser()

const isModalOpen = ref(false)
const isChartModalOpen = ref(false)
const editingTransaction = ref(null)

const isDebtModalOpen = ref(false)
const paymentDebtData = ref(null)
const currentDebtType = ref('borrowed')

const loading = ref(true)
const transactions = ref([])
const debts = ref([])
const debtPayments = ref([])
const expandedHistory = ref(null)

// Filters and Pagination
const searchQuery = ref('')
const typeFilter = ref('all')
const selectedMonth = ref('')
const currentPage = ref(1)
const itemsPerPage = 50

const filteredTransactions = computed(() => {
  let result = transactions.value
  
  if (selectedMonth.value) {
    const [year, month] = selectedMonth.value.split('-')
    result = result.filter(t => {
      const tDate = new Date(t.date)
      return tDate.getFullYear() === parseInt(year) && tDate.getMonth() + 1 === parseInt(month)
    })
  }
  
  if (searchQuery.value) {
    const q = searchQuery.value.toLowerCase()
    result = result.filter(t => t.description && t.description.toLowerCase().includes(q))
  }
  
  if (typeFilter.value !== 'all') {
    result = result.filter(t => t.type === typeFilter.value)
  }
  
  return result
})

const showAllExpenses = ref(false)

const allExpensesSorted = computed(() => {
  const expenses = filteredTransactions.value.filter(t => t.type === 'expense')
  
  const grouped = expenses.reduce((acc, t) => {
    const descFull = (t.description || 'Unknown').trim()
    const descGroup = descFull.split(' - ')[0].trim()
    
    if (!acc[descGroup]) {
      acc[descGroup] = {
        id: descGroup, // use group name as unique key
        description: descGroup,
        amount: 0,
        date: t.date,
        count: 0
      }
    }
    acc[descGroup].amount += t.amount
    acc[descGroup].count += 1
    
    if (new Date(t.date) > new Date(acc[descGroup].date)) {
      acc[descGroup].date = t.date
    }
    return acc
  }, {})

  return Object.values(grouped).sort((a, b) => b.amount - a.amount)
})

const totalMonthExpenses = computed(() => {
  return allExpensesSorted.value.reduce((sum, exp) => sum + exp.amount, 0)
})

const topExpenses = computed(() => {
  return allExpensesSorted.value.slice(0, 30)
})

const displayedExpenses = computed(() => {
  return showAllExpenses.value ? allExpensesSorted.value : topExpenses.value
})

const totalPages = computed(() => Math.ceil(filteredTransactions.value.length / itemsPerPage) || 1)

const paginatedTransactions = computed(() => {
  const start = (currentPage.value - 1) * itemsPerPage
  return filteredTransactions.value.slice(start, start + itemsPerPage)
})

watch([searchQuery, typeFilter, selectedMonth], () => {
  currentPage.value = 1
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

const toggleHistory = (debtId) => {
  expandedHistory.value = expandedHistory.value === debtId ? null : debtId
}

const getDebtPayments = (debtId) => {
  return debtPayments.value.filter(p => p.debt_id === debtId)
}

const openAddDebtModal = (type = 'borrowed') => {
  paymentDebtData.value = null
  currentDebtType.value = type
  isDebtModalOpen.value = true
}

const openPayDebtModal = (debt, type = 'borrowed') => {
  paymentDebtData.value = debt
  currentDebtType.value = type
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

const borrowedDebts = computed(() => debts.value.filter(d => d.type !== 'lent'))
const lentDebts = computed(() => debts.value.filter(d => d.type === 'lent'))

const totalBorrowedOwed = computed(() => borrowedDebts.value.reduce((acc, d) => acc + Number(d.total_amount), 0))
const totalBorrowedPaid = computed(() => borrowedDebts.value.reduce((acc, d) => acc + Number(d.paid_amount), 0))

const totalLentOwed = computed(() => lentDebts.value.reduce((acc, d) => acc + Number(d.total_amount), 0))
const totalLentPaid = computed(() => lentDebts.value.reduce((acc, d) => acc + Number(d.paid_amount), 0))

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

const deleteDebt = async (id) => {
  if (!confirm('Are you sure you want to delete this? This will also remove its payment history.')) return
  
  loading.value = true
  const { error } = await supabase.from('debts').delete().eq('id', id)
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
