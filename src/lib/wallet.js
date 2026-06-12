import { supabase } from './supabase'

/**
 * Add earnings to a user's wallet and insert a transaction record.
 *
 * @param {string} userId
 * @param {number} amount        - positive value to add
 * @param {string} type          - 'earning' | 'course_sale' | 'consulting_fee' | 'withdrawal' | etc.
 * @param {string} description
 * @param {string|null} referenceId
 */
export async function addToWallet(userId, amount, type = 'earning', description = '', referenceId = null) {
  if (!userId || !amount) return

  const isWithdrawal = type === 'withdrawal'

  const { data: existing } = await supabase
    .from('wallets')
    .select('id, balance, total_earned, total_withdrawn')
    .eq('user_id', userId)
    .maybeSingle()

  let walletId
  if (existing) {
    walletId = existing.id
    await supabase.from('wallets').update({
      balance:         isWithdrawal ? Math.max(0, existing.balance - amount) : existing.balance + amount,
      total_earned:    isWithdrawal ? existing.total_earned                  : existing.total_earned + amount,
      total_withdrawn: isWithdrawal ? existing.total_withdrawn + amount      : existing.total_withdrawn,
      updated_at:      new Date().toISOString(),
    }).eq('user_id', userId)
  } else {
    const { data: inserted } = await supabase.from('wallets').insert({
      user_id:         userId,
      balance:         isWithdrawal ? 0 : amount,
      total_earned:    isWithdrawal ? 0 : amount,
      total_withdrawn: 0,
      currency:        'USD',
    }).select('id').single()
    walletId = inserted?.id
  }

  if (walletId) {
    await supabase.from('wallet_transactions').insert({
      wallet_id:    walletId,
      amount:       isWithdrawal ? -Math.abs(amount) : Math.abs(amount),
      type,
      description,
      reference_id: referenceId || undefined,
    })
  }
}

export async function getWallet(userId) {
  const { data } = await supabase
    .from('wallets')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  return data || { balance: 0, total_earned: 0, total_withdrawn: 0, currency: 'USD' }
}
