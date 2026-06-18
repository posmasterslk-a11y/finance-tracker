export const useExchangeRate = () => {
  const usdToLkr = useState('usdToLkr', () => null)
  const isFetching = useState('isFetchingExchange', () => false)

  const fetchRate = async () => {
    if (usdToLkr.value || isFetching.value) return
    isFetching.value = true
    try {
      // Using a free public API for exchange rates
      const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD')
      const data = await response.json()
      if (data && data.rates && data.rates.LKR) {
        usdToLkr.value = data.rates.LKR
      }
    } catch (error) {
      console.error('Failed to fetch exchange rate:', error)
      // Fallback to a reasonable default if API fails
      usdToLkr.value = 300
    }
    isFetching.value = false
  }

  return {
    usdToLkr,
    fetchRate
  }
}
